import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

/**
 * POST /api/admin/draw/execute
 * Execute the draw for a competition
 * Uses cryptographically secure random number generation
 * Protected: DRAW_MASTER or SUPER_ADMIN only
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only DRAW_MASTER and SUPER_ADMIN can execute draws
    if (session.user.role !== 'DRAW_MASTER' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { competition_id } = body;

    if (!competition_id) {
      return NextResponse.json(
        { error: 'competition_id is required' },
        { status: 400 }
      );
    }

    // Get the competition
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
      },
    });

    if (!competition) {
      return NextResponse.json(
        { error: 'Competition not found' },
        { status: 404 }
      );
    }

    // Validate competition can be drawn
    if (competition.actualDrawDate) {
      return NextResponse.json(
        { error: 'Competition has already been drawn' },
        { status: 400 }
      );
    }

    const now = new Date();
    const canDraw =
      competition.status === 'SOLD_OUT' ||
      (competition.status === 'ACTIVE' && competition.drawDate <= now) ||
      competition.status === 'DRAWING';

    if (!canDraw) {
      return NextResponse.json(
        {
          error: 'Competition is not ready for draw',
          details: {
            status: competition.status,
            drawDate: competition.drawDate,
            isSoldOut: competition.status === 'SOLD_OUT',
            isDrawDatePassed: competition.drawDate <= now,
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
    // randomInt is cryptographically secure (uses crypto.getRandomValues internally)
    const winningIndex = randomInt(0, eligibleTickets.length);
    const winningTicket = eligibleTickets[winningIndex]!;
    const winner = winningTicket.user!;

    // Execute the draw in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update competition status and draw info
      const updatedCompetition = await tx.competition.update({
        where: { id: competition_id },
        data: {
          status: 'COMPLETED',
          actualDrawDate: now,
          winningTicketNumber: winningTicket.ticketNumber,
          drawnById: session.user.id,
          winnerNotified: false,
        },
      });

      // Create Win record
      const win = await tx.win.create({
        data: {
          competitionId: competition_id,
          userId: winner.id,
          ticketNumber: winningTicket.ticketNumber,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'DRAW_EXECUTED',
          entity: 'competition',
          entityId: competition_id,
          metadata: {
            winningTicketNumber: winningTicket.ticketNumber,
            winningTicketId: winningTicket.id,
            winnerId: winner.id,
            winnerEmail: winner.email,
            totalEligibleTickets: eligibleTickets.length,
            randomIndex: winningIndex,
          },
        },
      });

      return { updatedCompetition, win };
    });

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
        name: winner.displayName || `${winner.firstName} ${winner.lastName}`,
      },
      competition: {
        id: competition.id,
        slug: competition.slug,
        title: competition.title,
        prizeValue: Number(competition.prizeValue),
        mainImageUrl: competition.mainImageUrl,
      },
      draw: {
        executedAt: now,
        executedById: session.user.id,
        totalEligibleTickets: eligibleTickets.length,
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
