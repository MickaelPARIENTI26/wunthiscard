import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { releaseTicketsFromRedis, getReservation } from '@/lib/redis';

const releaseSchema = z.object({
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

    // Parse and validate request body
    const body = await request.json();
    const validation = releaseSchema.safeParse(body);
    if (!validation.success) {
      // Log validation errors server-side only, don't expose to client
      console.error('Validation error:', validation.error.errors);
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { competitionId } = validation.data;

    // Get the reservation to know which tickets to release
    const reservation = await getReservation(competitionId, userId);

    if (reservation) {
      // Release from Redis
      await releaseTicketsFromRedis(competitionId, userId);

      // Update ticket status in database back to AVAILABLE
      await prisma.ticket.updateMany({
        where: {
          competitionId,
          ticketNumber: { in: reservation.ticketNumbers },
          userId,
          status: 'RESERVED',
        },
        data: {
          status: 'AVAILABLE',
          userId: null,
          reservedUntil: null,
        },
      });

      // Log the release
      const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'TICKET_RELEASED',
          entity: 'ticket',
          entityId: competitionId,
          metadata: {
            ticketNumbers: reservation.ticketNumbers,
            reason: 'user_cancelled',
          },
          ipAddress: ip,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error releasing tickets:', error);
    return NextResponse.json(
      { error: 'An error occurred while releasing tickets' },
      { status: 500 }
    );
  }
}
