import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getReservation } from '@/lib/redis';

const statusSchema = z.object({
  competitionId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    // Parse and validate request body
    const body = await request.json();
    const validation = statusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
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
    const availableCount = competition.totalTickets - unavailableCount;

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
