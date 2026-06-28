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

    // Enforce the per-user cap AND claim the ticket ATOMICALLY.
    //
    // The cap is a count-then-write: read how many tickets the user already holds,
    // then create one if under the limit. Done naively (separate count + create)
    // it races — a user firing N free-entry requests in parallel passes the count
    // check N times before any insert lands, farming N free entries where one (or
    // maxTicketsPerUser) is allowed. There is no DB unique constraint on
    // (competitionId, userId) to catch it either, and maxTicketsPerUser can be > 1
    // so a partial unique index isn't an option.
    //
    // Fix: run the cap check + claim inside a Serializable transaction. Postgres SSI
    // detects the write-skew between two such transactions (both read the same count,
    // both insert) and aborts all but one (40001 → Prisma P2034); we retry on that.
    const cap = competition.maxTicketsPerUser;
    const isFinite = competition.totalTickets !== null;
    const totalTickets = competition.totalTickets ?? 0;
    const MAX_CLAIM_ATTEMPTS = 5;

    let ticketNumber = 0;
    let claimResult: 'ok' | 'cap' | 'full' | 'conflict' = 'conflict';

    for (let attempt = 0; attempt < MAX_CLAIM_ATTEMPTS; attempt++) {
      // For the unlimited path, allocate a monotonic ticket number from the atomic
      // Redis counter up front (seeded lazily from the current max in Postgres). If
      // the transaction aborts and we retry, a fresh number is allocated — small
      // gaps are harmless.
      let candidateNumber = 0;
      if (!isFinite) {
        candidateNumber = await nextFreeEntryTicketNumber(competitionId, async () => {
          const max = await prisma.ticket.aggregate({
            where: { competitionId },
            _max: { ticketNumber: true },
          });
          return max._max.ticketNumber ?? 0;
        });
      }

      try {
        const res = await prisma.$transaction(
          async (tx) => {
            const heldByUser = await tx.ticket.count({
              where: { competitionId, userId, status: { in: ['SOLD', 'FREE_ENTRY'] } },
            });
            if (heldByUser >= cap) return { status: 'cap' as const };

            if (isFinite) {
              const totalClaimed = await tx.ticket.count({
                where: { competitionId, status: { in: ['SOLD', 'FREE_ENTRY'] } },
              });
              if (totalClaimed >= totalTickets) return { status: 'full' as const };

              const available = await tx.ticket.findFirst({
                where: { competitionId, status: 'AVAILABLE' },
                orderBy: { ticketNumber: 'asc' },
                select: { id: true, ticketNumber: true },
              });
              if (!available) return { status: 'full' as const };

              const upd = await tx.ticket.updateMany({
                where: { id: available.id, status: 'AVAILABLE' },
                data: { status: 'FREE_ENTRY', userId, isFreeEntry: true },
              });
              if (upd.count === 0) return { status: 'conflict' as const };
              return { status: 'ok' as const, ticketNumber: available.ticketNumber };
            }

            // Unlimited path: create on demand. A P2002 (number collision) rolls the
            // tx back and propagates to the retry loop below.
            await tx.ticket.create({
              data: {
                competitionId,
                ticketNumber: candidateNumber,
                userId,
                status: 'FREE_ENTRY',
                isFreeEntry: true,
              },
            });
            return { status: 'ok' as const, ticketNumber: candidateNumber };
          },
          { isolationLevel: 'Serializable' }
        );

        if (res.status === 'ok') {
          ticketNumber = res.ticketNumber;
          claimResult = 'ok';
          break;
        }
        if (res.status === 'cap' || res.status === 'full') {
          claimResult = res.status;
          break;
        }
        // 'conflict' → retry
      } catch (e) {
        const code =
          e && typeof e === 'object' && 'code' in e
            ? (e as { code?: string }).code
            : undefined;
        // P2034 = serialization failure (another concurrent claim won);
        // P2002 = ticket-number collision on the unlimited path. Both → retry.
        if (code === 'P2034' || code === 'P2002') continue;
        throw e;
      }
    }

    if (claimResult === 'cap') {
      return NextResponse.json(
        { error: 'You have already entered this competition' },
        { status: 400 }
      );
    }
    if (claimResult === 'full') {
      return NextResponse.json(
        { error: 'This competition is full' },
        { status: 400 }
      );
    }
    if (claimResult !== 'ok') {
      return NextResponse.json(
        { error: 'Could not register your free entry. Please try again.' },
        { status: 409 }
      );
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
