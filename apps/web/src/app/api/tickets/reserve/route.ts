import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  rateLimits,
  reserveTicketsInRedis,
  releaseTicketsFromRedis,
  getLockedTickets,
  TICKET_RESERVATION_TTL,
} from '@/lib/redis';

const reserveSchema = z.object({
  competitionId: z.string().min(1),
  quantity: z.number().int().positive().min(1).max(50),
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

    // Check if user is verified
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true, isBanned: true },
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
        { error: 'Please verify your email before purchasing tickets' },
        { status: 403 }
      );
    }

    // Get competition and verify it's active
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: {
        id: true,
        status: true,
        totalTickets: true,
        maxTicketsPerUser: true,
        ticketPrice: true,
      },
    });

    if (!competition) {
      return NextResponse.json(
        { error: 'Competition not found' },
        { status: 404 }
      );
    }

    if (competition.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'This competition is not currently accepting entries' },
        { status: 400 }
      );
    }

    // Check user's existing tickets for this competition
    const existingTickets = await prisma.ticket.count({
      where: {
        competitionId,
        userId,
        status: 'SOLD',
      },
    });

    const totalAfterPurchase = existingTickets + quantity;
    const remainingAllowance = competition.maxTicketsPerUser - existingTickets;
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

    const now = new Date();

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
      // Some tickets couldn't be reserved - release the Redis locks
      await releaseTicketsFromRedis(competitionId, userId);

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
