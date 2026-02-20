import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// Simple in-memory rate limiting (for production, use Redis)
const lastDrawTime = new Map<string, number>();
const RATE_LIMIT_MS = 60 * 1000; // 1 minute

/**
 * POST /api/admin/draw/execute
 * Execute the draw for a competition
 * Uses cryptographically secure random number generation
 * Protected: DRAW_MASTER or SUPER_ADMIN only
 * Rate limited: 1 draw per minute per user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;

    // Only DRAW_MASTER and SUPER_ADMIN can execute draws
    if (userRole !== 'DRAW_MASTER' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Rate limiting: 1 draw per minute
    const userId = session.user.id;
    const now = Date.now();
    const lastDraw = lastDrawTime.get(userId);

    if (lastDraw && now - lastDraw < RATE_LIMIT_MS) {
      const waitSeconds = Math.ceil((RATE_LIMIT_MS - (now - lastDraw)) / 1000);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          details: `Please wait ${waitSeconds} seconds before executing another draw`,
        },
        { status: 429 }
      );
    }

    // Get IP and User-Agent for audit
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const body = await request.json();
    const { competition_id } = body;

    if (!competition_id) {
      return NextResponse.json(
        { error: 'competition_id is required' },
        { status: 400 }
      );
    }

    // Get the competition with ticket count
    const competition = await prisma.competition.findUnique({
      where: { id: competition_id },
      include: {
        tickets: {
          where: {
            status: { in: ['SOLD', 'FREE_ENTRY'] },
            userId: { not: null },
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            tickets: {
              where: { status: { in: ['SOLD', 'FREE_ENTRY'] } },
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

    // CRITICAL: Validate competition has not been drawn
    if (competition.actualDrawDate) {
      return NextResponse.json(
        { error: 'Competition has already been drawn' },
        { status: 400 }
      );
    }

    const currentTime = new Date();
    const canDraw =
      competition.status === 'SOLD_OUT' ||
      (competition.status === 'ACTIVE' && competition.drawDate <= currentTime) ||
      competition.status === 'DRAWING';

    if (!canDraw) {
      return NextResponse.json(
        {
          error: 'Competition is not ready for draw',
          details: {
            status: competition.status,
            drawDate: competition.drawDate,
            isSoldOut: competition.status === 'SOLD_OUT',
            isDrawDatePassed: competition.drawDate <= currentTime,
          },
        },
        { status: 400 }
      );
    }

    // Get eligible tickets (sold or free entry with a user)
    const eligibleTickets = competition.tickets.filter(
      (t) => t.userId && t.user
    );

    if (eligibleTickets.length === 0) {
      return NextResponse.json(
        { error: 'No eligible tickets for this competition' },
        { status: 400 }
      );
    }

    // Use cryptographically secure random number generation
    // crypto.randomInt is cryptographically secure
    const winningIndex = randomInt(0, eligibleTickets.length);
    const winningTicket = eligibleTickets[winningIndex]!;
    const winner = winningTicket.user!;

    const ticketsSold = competition._count.tickets;
    const winnerName = winner.displayName || `${winner.firstName} ${winner.lastName}`;

    // Execute the draw in a transaction
    await prisma.$transaction(async (tx) => {
      // Update competition status and draw info
      await tx.competition.update({
        where: { id: competition_id },
        data: {
          status: 'COMPLETED',
          actualDrawDate: currentTime,
          winningTicketNumber: winningTicket.ticketNumber,
          drawnById: userId,
          winnerNotified: false,
        },
      });

      // Create Win record
      await tx.win.create({
        data: {
          competitionId: competition_id,
          userId: winner.id,
          ticketNumber: winningTicket.ticketNumber,
        },
      });

      // Create DrawLog (detailed audit trail)
      await tx.drawLog.create({
        data: {
          competitionId: competition_id,
          competitionTitle: competition.title,
          totalTickets: competition.totalTickets,
          ticketsSold,
          winningTicketNumber: winningTicket.ticketNumber,
          winnerUserId: winner.id,
          winnerName,
          winnerEmail: winner.email,
          drawnById: userId,
          drawnByRole: userRole,
          drawMethod: 'crypto.randomInt',
          ipAddress,
          userAgent,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'DRAW_EXECUTED',
          entity: 'competition',
          entityId: competition_id,
          ipAddress,
          metadata: {
            winningTicketNumber: winningTicket.ticketNumber,
            winningTicketId: winningTicket.id,
            winnerId: winner.id,
            winnerEmail: winner.email,
            totalEligibleTickets: eligibleTickets.length,
            randomIndex: winningIndex,
            drawMethod: 'crypto.randomInt',
            userAgent,
          },
        },
      });
    });

    // Update rate limit tracker
    lastDrawTime.set(userId, Date.now());

    // Return the result (without sending email yet)
    return NextResponse.json({
      success: true,
      winning_ticket: {
        id: winningTicket.id,
        number: winningTicket.ticketNumber,
        isBonus: winningTicket.isBonus,
        isFreeEntry: winningTicket.isFreeEntry,
      },
      winner: {
        id: winner.id,
        firstName: winner.firstName,
        lastName: winner.lastName,
        displayName: winner.displayName,
        email: winner.email,
        name: winnerName,
      },
      competition: {
        id: competition.id,
        slug: competition.slug,
        title: competition.title,
        prizeValue: Number(competition.prizeValue),
        mainImageUrl: competition.mainImageUrl,
      },
      draw: {
        executedAt: currentTime,
        executedById: userId,
        executedByRole: userRole,
        totalEligibleTickets: eligibleTickets.length,
        method: 'crypto.randomInt',
      },
    });
  } catch (error) {
    console.error('Error executing draw:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
