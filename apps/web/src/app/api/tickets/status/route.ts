import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getReservation, rateLimits } from '@/lib/redis';
import { getClientIp } from '@/lib/get-client-ip';

const statusSchema = z.object({
  competitionId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP to prevent probing — FAIL-OPEN. The limiter is a network
    // call to Upstash; if Redis is down/slow it throws. This is only a
    // non-essential anti-probing safety net on a read-only status endpoint, so
    // on a limiter error we log and ALLOW the request rather than 500-ing and
    // breaking ticket-availability polling during a Redis outage.
    const ip = getClientIp(request.headers);
    try {
      const { success: rateLimitOk } = await rateLimits.globalUnauth.limit(ip);
      if (!rateLimitOk) {
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429 }
        );
      }
    } catch (rateErr) {
      console.error('Ticket-status rate-limit check failed (allowing request):', rateErr);
      Sentry.captureException(rateErr);
    }

    const session = await auth();
    const userId = session?.user?.id;

    // Parse and validate request body
    const body = await request.json();
    const validation = statusSchema.safeParse(body);
    if (!validation.success) {
      // Log validation errors server-side only, don't expose to client
      console.error('Validation error:', validation.error.errors);
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { competitionId } = validation.data;
    const now = new Date();

    // Get competition info with count of unavailable tickets
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: {
        id: true,
        status: true,
        totalTickets: true,
        _count: {
          select: {
            tickets: {
              where: {
                OR: [
                  { status: { in: ['SOLD', 'FREE_ENTRY'] } },
                  {
                    status: 'RESERVED',
                    reservedUntil: { gt: now },
                  },
                ],
              },
            },
          },
        },
      },
    });

    if (!competition) {
      return NextResponse.json(
        { error: 'Competition not found' },
        { status: 404 }
      );
    }

    const unavailableCount = competition._count.tickets;
    const availableCount = competition.totalTickets !== null
      ? competition.totalTickets - unavailableCount
      : null; // unlimited

    // If user is authenticated, check their reservation
    let userReservation = null;
    if (userId) {
      userReservation = await getReservation(competitionId, userId);
    }

    return NextResponse.json({
      totalTickets: competition.totalTickets,
      availableCount,
      unavailableCount,
      userReservation: userReservation
        ? {
            ticketNumbers: userReservation.ticketNumbers,
            expiresAt: userReservation.expiresAt,
          }
        : null,
    });
  } catch (error) {
    console.error('Error getting ticket status:', error);
    return NextResponse.json(
      { error: 'An error occurred while getting ticket status' },
      { status: 500 }
    );
  }
}
