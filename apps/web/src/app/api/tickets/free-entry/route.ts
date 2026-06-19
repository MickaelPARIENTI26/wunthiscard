import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { rateLimits, nextFreeEntryTicketNumber } from '@/lib/redis';
import { sendFreeEntryConfirmationEmail } from '@/lib/email';

const freeEntrySchema = z.object({
  competitionId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Rate limiting (reuse ticket reserve limiter)
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const { success: rateLimitSuccess } = await rateLimits.ticketReserve.limit(
      `${userId}:${ip}`
    );
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = freeEntrySchema.safeParse(body);
    if (!validation.success) {
      console.error('Validation error:', validation.error.errors);
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { competitionId } = validation.data;

    // Check if user is verified and not banned
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true, isBanned: true, email: true, firstName: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.isBanned) {
      return NextResponse.json(
        { error: 'Your account has been suspended' },
        { status: 403 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email before entering competitions' },
        { status: 403 }
      );
    }

    // Age (18+) is confirmed by the arrival AgeGate prompt + the 18+ acceptance at
    // signup (product decision) — no server-side date-of-birth gate here.

    // Get competition and verify it's active and free
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: {
        id: true,
        title: true,
        drawDate: true,
        status: true,
        isFree: true,
        totalTickets: true,
        maxTicketsPerUser: true,
      },
    });

    if (!competition) {
      return NextResponse.json(
        { error: 'Competition not found' },
        { status: 400 }
      );
    }

    if (competition.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'This competition is not currently accepting entries' },
        { status: 400 }
      );
    }

    if (!competition.isFree) {
      return NextResponse.json(
        { error: 'This competition is not a free competition' },
        { status: 400 }
      );
    }

    // Check if user has already claimed a free entry
    const existingTickets = await prisma.ticket.count({
      where: {
        competitionId,
        userId,
        status: { in: ['SOLD', 'FREE_ENTRY'] },
      },
    });

    if (existingTickets >= competition.maxTicketsPerUser) {
      return NextResponse.json(
        { error: 'You have already entered this competition' },
        { status: 400 }
      );
    }

    let ticketNumber = 0;

    if (competition.totalTickets !== null) {
      // Finite tickets: find and claim an available pre-created ticket
      const totalClaimed = await prisma.ticket.count({
        where: {
          competitionId,
          status: { in: ['SOLD', 'FREE_ENTRY'] },
        },
      });

      if (totalClaimed >= competition.totalTickets) {
        return NextResponse.json(
          { error: 'This competition is full' },
          { status: 400 }
        );
      }

      // Atomically find and claim the next available ticket
      // Using updateMany with a limit-like approach to avoid race conditions
      const availableTicket = await prisma.ticket.findFirst({
        where: {
          competitionId,
          status: 'AVAILABLE',
        },
        orderBy: { ticketNumber: 'asc' },
        select: { id: true, ticketNumber: true },
      });

      if (!availableTicket) {
        return NextResponse.json(
          { error: 'No tickets available' },
          { status: 400 }
        );
      }

      // Atomic update: only succeeds if ticket is still AVAILABLE (prevents race condition)
      const updated = await prisma.ticket.updateMany({
        where: {
          id: availableTicket.id,
          status: 'AVAILABLE', // Guard: another request may have claimed it
        },
        data: {
          status: 'FREE_ENTRY',
          userId,
          isFreeEntry: true,
        },
      });

      if (updated.count === 0) {
        // Ticket was claimed by another request — retry or fail
        return NextResponse.json(
          { error: 'Ticket was claimed by another user. Please try again.' },
          { status: 409 }
        );
      }

      ticketNumber = availableTicket.ticketNumber;
    } else {
      // Unlimited tickets: create a ticket on demand. ticketNumber is allocated
      // from an atomic, monotonic Redis INCR counter (seeded lazily from the
      // current max in Postgres) instead of COUNT(*) + 1, so concurrent entries
      // can't serialise on the same read or collide on the unique
      // [competitionId, ticketNumber] index under viral load.
      let created = false;
      for (let attempt = 0; attempt < 6; attempt++) {
        ticketNumber = await nextFreeEntryTicketNumber(competitionId, async () => {
          const max = await prisma.ticket.aggregate({
            where: { competitionId },
            _max: { ticketNumber: true },
          });
          return max._max.ticketNumber ?? 0;
        });
        try {
          await prisma.ticket.create({
            data: {
              competitionId,
              ticketNumber,
              userId,
              status: 'FREE_ENTRY',
              isFreeEntry: true,
            },
          });
          created = true;
          break;
        } catch (e) {
          const code =
            e && typeof e === 'object' && 'code' in e
              ? (e as { code?: string }).code
              : undefined;
          // A collision should be near-impossible with the atomic counter, but
          // if a pre-existing row ever overlaps a freshly-seeded value, the next
          // INCR advances past it — so just retry.
          if (code === 'P2002') continue;
          throw e;
        }
      }
      if (!created) {
        return NextResponse.json(
          { error: 'Could not register your free entry. Please try again.' },
          { status: 409 }
        );
      }
    }

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'FREE_ENTRY_CLAIMED',
        entity: 'ticket',
        entityId: competitionId,
        metadata: {
          ticketNumber,
          competitionId,
        },
        ipAddress: ip,
      },
    });

    // Send free-entry confirmation email — same treatment as the paid route,
    // required for UK compliance (free route must be handled identically).
    // Non-blocking: a send failure must not void a valid entry.
    try {
      await sendFreeEntryConfirmationEmail(user.email, user.firstName, {
        competitionTitle: competition.title,
        ticketNumber,
        drawDate: competition.drawDate,
        entryMethod: 'email',
      });
    } catch (emailError) {
      console.error('Failed to send free-entry confirmation email:', emailError);
    }

    return NextResponse.json({
      success: true,
      ticketNumber,
    });
  } catch (error) {
    console.error('Error claiming free entry:', error);
    return NextResponse.json(
      { error: 'An error occurred while claiming your free entry' },
      { status: 500 }
    );
  }
}
