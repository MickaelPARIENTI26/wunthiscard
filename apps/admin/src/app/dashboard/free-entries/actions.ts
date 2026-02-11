'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
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

  const remainingAllowed = competition.maxTicketsPerUser - existingTickets;
  if (remainingAllowed <= 0) {
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

  for (let i = 1; i <= competition.totalTickets && availableNumbers.length < ticketsToAssign; i++) {
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
      const ticket = await tx.ticket.upsert({
        where: {
          competitionId_ticketNumber: {
            competitionId,
            ticketNumber,
          },
        },
        create: {
          competitionId,
          ticketNumber,
          userId: user.id,
          status: 'FREE_ENTRY',
          isFreeEntry: true,
        },
        update: {
          userId: user.id,
          status: 'FREE_ENTRY',
          isFreeEntry: true,
        },
      });
      ticketIds.push(ticket.id);
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

  revalidatePath('/dashboard/free-entries');

  return {
    success: true,
    ticketNumbers: availableNumbers,
    competitionTitle: competition.title,
  };
}
