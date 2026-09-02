'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { grantSpinForFreeEntryTicket } from '@winucard/database';
import { auth } from '@/lib/auth';

export async function assignFreeEntry(formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized');
  }

  const email = (formData.get('email') as string)?.toLowerCase().trim();
  const competitionId = formData.get('competitionId') as string;
  const quantity = Math.min(Math.max(parseInt(formData.get('quantity') as string) || 1, 1), 10);
  const notes = formData.get('notes') as string | null;

  if (!email || !competitionId) {
    throw new Error('Email and competition are required');
  }

  // Find or validate the user
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new Error('User not found. They must register first.');
  }

  // Get competition details
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    select: {
      id: true,
      title: true,
      status: true,
      totalTickets: true,
      maxTicketsPerUser: true,
    },
  });

  if (!competition) {
    throw new Error('Competition not found');
  }

  if (!['ACTIVE', 'SOLD_OUT'].includes(competition.status)) {
    throw new Error('Competition is not active');
  }

  // Check user's existing ticket count
  const existingTickets = await prisma.ticket.count({
    where: {
      competitionId,
      userId: user.id,
      status: { in: ['SOLD', 'FREE_ENTRY'] },
    },
  });

  // maxTicketsPerUser <= 0 means "no per-user limit".
  const remainingAllowed = competition.maxTicketsPerUser - existingTickets;
  if (competition.maxTicketsPerUser > 0 && remainingAllowed <= 0) {
    throw new Error(`User already has ${existingTickets} tickets (max ${competition.maxTicketsPerUser})`);
  }

  const ticketsToAssign = Math.min(quantity, remainingAllowed);

  // Find available ticket numbers
  const takenTickets = await prisma.ticket.findMany({
    where: {
      competitionId,
      status: { in: ['SOLD', 'FREE_ENTRY', 'RESERVED'] },
    },
    select: { ticketNumber: true },
  });

  const takenNumbers = new Set(takenTickets.map((t) => t.ticketNumber));
  const availableNumbers: number[] = [];

  const maxTickets = competition.totalTickets ?? 0;
  for (let i = 1; i <= maxTickets && availableNumbers.length < ticketsToAssign; i++) {
    if (!takenNumbers.has(i)) {
      availableNumbers.push(i);
    }
  }

  if (availableNumbers.length === 0) {
    throw new Error('No tickets available');
  }

  if (availableNumbers.length < ticketsToAssign) {
    throw new Error(`Only ${availableNumbers.length} tickets available (requested ${ticketsToAssign})`);
  }

  // Create tickets in a transaction
  const ticketIds: string[] = [];
  await prisma.$transaction(async (tx) => {
    for (const ticketNumber of availableNumbers) {
      // TOCTOU guard: the availableNumbers set was computed from an earlier read,
      // so a ticket may have flipped to RESERVED/SOLD/FREE_ENTRY in the meantime.
      // Claim it with an atomic updateMany guarded on status: 'AVAILABLE' (mirrors
      // the public free-entry route) rather than a blind upsert that would
      // overwrite an already-taken ticket.
      const claimed = await tx.ticket.updateMany({
        where: {
          competitionId,
          ticketNumber,
          status: 'AVAILABLE', // Guard: refuse to reassign a taken ticket
        },
        data: {
          userId: user.id,
          status: 'FREE_ENTRY',
          isFreeEntry: true,
        },
      });

      if (claimed.count === 1) {
        const ticket = await tx.ticket.findUniqueOrThrow({
          where: { competitionId_ticketNumber: { competitionId, ticketNumber } },
          select: { id: true },
        });
        ticketIds.push(ticket.id);
        continue;
      }

      // No AVAILABLE row was updated. Either the row doesn't exist yet (unlimited
      // competition — create it on demand) or it exists but is already taken.
      // A guarded create distinguishes the two: P2002 on the unique
      // [competitionId, ticketNumber] index means the row exists and was taken.
      try {
        const ticket = await tx.ticket.create({
          data: {
            competitionId,
            ticketNumber,
            userId: user.id,
            status: 'FREE_ENTRY',
            isFreeEntry: true,
          },
          select: { id: true },
        });
        ticketIds.push(ticket.id);
      } catch (e) {
        const code =
          e && typeof e === 'object' && 'code' in e
            ? (e as { code?: string }).code
            : undefined;
        if (code === 'P2002') {
          // Row exists but wasn't AVAILABLE — it was claimed between our read and
          // this write. Abort the whole assignment instead of overwriting it.
          throw new Error(
            `Ticket ${ticketNumber} was just taken by another entry. Please try again.`
          );
        }
        throw e;
      }
    }

    // Log the action
    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'FREE_ENTRY_ASSIGNED',
        entity: 'ticket',
        entityId: ticketIds[0]!,
        metadata: {
          recipientEmail: email,
          recipientUserId: user.id,
          competitionId,
          competitionTitle: competition.title,
          ticketNumbers: availableNumbers,
          quantity: availableNumbers.length,
          notes,
        },
      },
    });
  });

  // THE POSTAL ENTRY EARNS ITS WHEEL SPIN.
  //
  // This is the statutory free route, and it runs on PAID competitions — the only
  // ones the wheel and its single graded card exist on. Without this the wheel is
  // a paid-only allocation of chances at a real prize, which is the whole reason
  // the free-entry spin exists. The self-serve route in apps/web only ever serves
  // competitions that are free in their entirety, so wiring that one alone left
  // this gap open on everything that matters.
  //
  // AFTER the transaction and best-effort, exactly like the self-serve route: a
  // wheel problem must never void a legally required entry. Missed spins are
  // repaired by repairMissingFreeEntrySpins on the daily cron.
  let wheelSpins = 0;
  for (const ticketId of ticketIds) {
    try {
      wheelSpins += await grantSpinForFreeEntryTicket(prisma, ticketId);
    } catch (wheelError) {
      console.error(`Failed to grant the postal entry's wheel spin (${ticketId}):`, wheelError);
    }
  }

  if (wheelSpins > 0) {
    await prisma.auditLog
      .create({
        data: {
          userId: session.user.id,
          action: 'FREE_ENTRY_SPINS_GRANTED',
          entity: 'competition',
          entityId: competitionId,
          metadata: { recipientUserId: user.id, spins: wheelSpins, route: 'postal' },
        },
      })
      .catch(() => {});
  }

  revalidatePath('/dashboard/free-entries');

  return {
    success: true,
    ticketNumbers: availableNumbers,
    competitionTitle: competition.title,
  };
}
