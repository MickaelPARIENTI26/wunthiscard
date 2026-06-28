import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getClientIp } from '@/lib/get-client-ip';
import {
  rateLimits,
  reserveTicketsInRedis,
  releaseTicketsFromRedis,
  getLockedTickets,
  TICKET_RESERVATION_TTL,
} from '@/lib/redis';

const reserveSchema = z.object({
  competitionId: z.string().min(1),
  quantity: z.number().int().positive().min(1).max(100),
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

    // Rate limiting
    const ip = getClientIp(request.headers);
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
    const validation = reserveSchema.safeParse(body);
    if (!validation.success) {
      // Log validation errors server-side only, don't expose to client
      console.error('Validation error:', validation.error.errors);
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { competitionId, quantity } = validation.data;

    // Load the buyer's account status. NOTE: paid purchases intentionally do NOT
    // require a verified email — the Stripe payment is the legitimacy signal, and
    // blocking checkout to verify kills conversion. Free entries DO require a
    // verified email (anti-abuse) — see /api/tickets/free-entry.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isBanned: true },
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

    // Age (18+) is confirmed by the arrival AgeGate prompt + the 18+ acceptance at
    // signup/checkout (product decision) — no server-side date-of-birth gate here.

    // Get competition and verify it's active
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: {
        id: true,
        status: true,
        totalTickets: true,
        maxTicketsPerUser: true,
        ticketPrice: true,
        isFree: true,
        drawDate: true,
      },
    });

    if (!competition) {
      return NextResponse.json(
        { error: 'Competition not found' },
        { status: 404 }
      );
    }

    // Free competitions use the /api/tickets/free-entry endpoint
    if (competition.isFree) {
      return NextResponse.json(
        { error: 'Free competitions cannot use ticket reservation. Use the free entry endpoint.' },
        { status: 400 }
      );
    }

    // Paid competitions must have totalTickets defined
    if (competition.totalTickets === null) {
      return NextResponse.json(
        { error: 'Competition configuration error: totalTickets is not set' },
        { status: 500 }
      );
    }

    if (competition.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'This competition is not currently accepting entries' },
        { status: 400 }
      );
    }

    // Stop accepting entries once the advertised draw time has passed, even if a
    // status-flip cron hasn't run yet (no selling past the published draw date).
    if (competition.drawDate && new Date(competition.drawDate) <= new Date()) {
      return NextResponse.json(
        { error: 'This competition has closed and is no longer accepting entries.' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Prevent reservation accumulation (DoS / cap bypass). A new reservation request
    // REPLACES this user's existing holds for this competition rather than stacking on
    // top of them. Without this, the per-user cap never bounds how many tickets a user
    // can hold in RESERVED state: the original check counted only SOLD, so a user could
    // reserve up to the cap, abandon the hold, and reserve again — locking large
    // swathes of stock (up to ~quantity × rate-limit per minute) and starving real
    // buyers until the 5-minute TTLs expire. Release the user's own active reservations
    // (DB + Redis) first; the cap check below then bounds their concurrent holds.
    await prisma.ticket.updateMany({
      where: { competitionId, userId, status: 'RESERVED' },
      data: { status: 'AVAILABLE', userId: null, reservedUntil: null },
    });
    try {
      await releaseTicketsFromRedis(competitionId, userId);
    } catch (releaseError) {
      console.error('Redis release failed during pre-reservation cleanup:', releaseError);
    }

    // Cap on the user's CURRENTLY HELD tickets — SOLD plus any still-active RESERVED.
    // After the release above the user holds no RESERVED of their own, so the RESERVED
    // term here catches a concurrent sibling request that reserved in the small window
    // between our release and this count. Counting only SOLD was the original bug.
    const heldTickets = await prisma.ticket.count({
      where: {
        competitionId,
        userId,
        OR: [
          { status: 'SOLD' },
          { status: 'RESERVED', reservedUntil: { gt: now } },
        ],
      },
    });

    const totalAfterPurchase = heldTickets + quantity;
    const remainingAllowance = competition.maxTicketsPerUser - heldTickets;
    if (totalAfterPurchase > competition.maxTicketsPerUser) {
      return NextResponse.json(
        {
          error: remainingAllowance > 0
            ? `You can only buy ${remainingAllowance} more ticket${remainingAllowance === 1 ? '' : 's'} for this competition.`
            : `You have reached the maximum of ${competition.maxTicketsPerUser} tickets for this competition.`,
        },
        { status: 400 }
      );
    }

    // Get unavailable ticket numbers (SOLD, FREE_ENTRY, or RESERVED by others)
    const unavailableTickets = await prisma.ticket.findMany({
      where: {
        competitionId,
        OR: [
          { status: { in: ['SOLD', 'FREE_ENTRY'] } },
          {
            status: 'RESERVED',
            reservedUntil: { gt: now },
            userId: { not: userId }, // Not the current user's reservation
          },
        ],
      },
      select: { ticketNumber: true },
    });

    const unavailableSet = new Set(unavailableTickets.map((t) => t.ticketNumber));

    // Also get Redis-locked tickets (for real-time reservation protection)
    const lockedInRedis = await getLockedTickets(competitionId);
    for (const num of lockedInRedis) {
      unavailableSet.add(num);
    }

    // Get user's own existing reservations (they can reuse those)
    const userReservedTickets = await prisma.ticket.findMany({
      where: {
        competitionId,
        userId,
        status: 'RESERVED',
        reservedUntil: { gt: now },
      },
      select: { ticketNumber: true },
    });

    // User's own reserved tickets are available to them
    for (const t of userReservedTickets) {
      unavailableSet.delete(t.ticketNumber);
    }

    // Build list of available ticket numbers
    const availableNumbers: number[] = [];
    for (let i = 1; i <= competition.totalTickets; i++) {
      if (!unavailableSet.has(i)) {
        availableNumbers.push(i);
      }
    }

    if (availableNumbers.length < quantity) {
      return NextResponse.json(
        {
          error: `Only ${availableNumbers.length} tickets available. Please select fewer tickets.`,
        },
        { status: 400 }
      );
    }

    // Randomly select tickets using Fisher-Yates shuffle (partial)
    const selectedNumbers: number[] = [];
    const availableCopy = [...availableNumbers];

    for (let i = 0; i < quantity; i++) {
      const randomIndex = Math.floor(Math.random() * availableCopy.length);
      const selected = availableCopy[randomIndex];
      if (selected !== undefined) {
        selectedNumbers.push(selected);
        // Swap with last element and pop (O(1) removal)
        const lastElement = availableCopy[availableCopy.length - 1];
        if (lastElement !== undefined) {
          availableCopy[randomIndex] = lastElement;
        }
        availableCopy.pop();
      }
    }

    // Sort for display purposes
    selectedNumbers.sort((a, b) => a - b);

    // Reserve tickets in Redis (with lock)
    const { success, expiresAt, error } = await reserveTicketsInRedis(
      competitionId,
      userId,
      selectedNumbers
    );

    if (!success) {
      // Some tickets were grabbed by another user during our selection
      // This is a race condition - retry with a fresh selection
      return NextResponse.json(
        { error: error || 'Failed to reserve tickets. Please try again.' },
        { status: 409 }
      );
    }

    // Update ticket status in database to RESERVED
    // Handle both AVAILABLE tickets and expired RESERVED tickets
    const updateResult = await prisma.ticket.updateMany({
      where: {
        competitionId,
        ticketNumber: { in: selectedNumbers },
        OR: [
          { status: 'AVAILABLE' },
          {
            status: 'RESERVED',
            reservedUntil: { lte: now }, // Expired reservation
          },
          {
            status: 'RESERVED',
            userId, // User's own existing reservation
          },
        ],
      },
      data: {
        status: 'RESERVED',
        userId,
        reservedUntil: new Date(expiresAt),
      },
    });

    // Verify all tickets were successfully reserved
    if (updateResult.count !== selectedNumbers.length) {
      // Some tickets couldn't be reserved - release the Redis locks. A cleanup
      // failure here must not mask the real 409 with a generic 500 (orphaned locks
      // self-heal on the 300s TTL anyway).
      try {
        await releaseTicketsFromRedis(competitionId, userId);
      } catch (releaseError) {
        console.error('Redis release failed during reservation rollback:', releaseError);
      }

      return NextResponse.json(
        { error: 'Some tickets are no longer available. Please try again.' },
        { status: 409 }
      );
    }

    // Log the reservation
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'TICKET_RESERVED',
        entity: 'ticket',
        entityId: competitionId,
        metadata: {
          ticketNumbers: selectedNumbers,
          quantity,
          expiresAt,
        },
        ipAddress: ip,
      },
    });

    return NextResponse.json({
      success: true,
      ticketNumbers: selectedNumbers,
      expiresAt,
      ttl: TICKET_RESERVATION_TTL,
    });
  } catch (error) {
    console.error('Error reserving tickets:', error);
    return NextResponse.json(
      { error: 'An error occurred while reserving tickets' },
      { status: 500 }
    );
  }
}
