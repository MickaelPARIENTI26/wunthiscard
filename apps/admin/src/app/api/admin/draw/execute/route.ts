import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { rateLimits } from '@/lib/redis';

const drawSchema = z.object({
  competition_id: z.string().min(1, 'competition_id is required'),
});

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

    // Rate limiting via Redis (persists across serverless instances)
    const userId = session.user.id;
    const { success: rateLimitOk } = await rateLimits.api.limit(`draw:${userId}`);
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before executing another draw.' },
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
    const validation = drawSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message ?? 'Invalid request' },
        { status: 400 }
      );
    }
    const { competition_id } = validation.data;

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

    const ticketsSold = competition._count.tickets;
    const isMultiDraw = competition.drawType === 'multi';

    if (isMultiDraw) {
      // ===== MULTI-DRAW LOGIC =====
      interface PrizeDef {
        position: number;
        title: string;
        value: number;
        imageUrl?: string;
        certification?: string;
        grade?: string;
      }
      const prizesData = (competition.prizes as unknown as PrizeDef[]) || [];
      if (prizesData.length < 2) {
        return NextResponse.json(
          { error: 'Multi-draw competition must have at least 2 prizes' },
          { status: 400 }
        );
      }

      // Sort prizes by position
      const sortedPrizes = [...prizesData].sort((a, b) => a.position - b.position);

      // Track winners to enforce one-win-per-user
      const winnerUserIds = new Set<string>();
      const results: Array<{
        prize: PrizeDef;
        ticket: typeof eligibleTickets[0];
        winnerName: string;
      }> = [];

      // Build a mutable pool of remaining eligible tickets
      let remainingTickets = [...eligibleTickets];

      for (const prize of sortedPrizes) {
        if (remainingTickets.length === 0) {
          return NextResponse.json(
            { error: `Not enough eligible tickets to award all prizes. Ran out at position ${prize.position}` },
            { status: 400 }
          );
        }

        // Filter out tickets belonging to users who already won
        let candidateTickets = remainingTickets.filter(
          (t) => !winnerUserIds.has(t.userId!)
        );

        // If no candidates left (all remaining users already won), fall back to all remaining
        if (candidateTickets.length === 0) {
          candidateTickets = remainingTickets;
        }

        const winningIndex = randomInt(0, candidateTickets.length);
        const winningTicket = candidateTickets[winningIndex]!;
        const winner = winningTicket.user!;

        winnerUserIds.add(winner.id);

        // Remove this ticket from remaining pool
        remainingTickets = remainingTickets.filter((t) => t.id !== winningTicket.id);

        const winnerName = winner.displayName || `${winner.firstName} ${winner.lastName}`;
        results.push({ prize, ticket: winningTicket, winnerName });
      }

      // Execute all in a transaction
      await prisma.$transaction(async (tx) => {
        // Update competition status
        await tx.competition.update({
          where: { id: competition_id },
          data: {
            status: 'COMPLETED',
            actualDrawDate: currentTime,
            winningTicketNumber: results[0]!.ticket.ticketNumber, // 1st prize ticket
            drawnById: userId,
            winnerNotified: false,
          },
        });

        // Create Win records for each prize
        for (const result of results) {
          await tx.win.create({
            data: {
              competitionId: competition_id,
              userId: result.ticket.user!.id,
              ticketNumber: result.ticket.ticketNumber,
              prizePosition: result.prize.position,
              prizeTitle: result.prize.title,
              prizeValue: result.prize.value,
            },
          });

          // Create DrawLog for each winner
          await tx.drawLog.create({
            data: {
              competitionId: competition_id,
              competitionTitle: competition.title,
              totalTickets: competition.totalTickets ?? ticketsSold,
              ticketsSold,
              winningTicketNumber: result.ticket.ticketNumber,
              winnerUserId: result.ticket.user!.id,
              winnerName: result.winnerName,
              winnerEmail: result.ticket.user!.email,
              drawnById: userId,
              drawnByRole: userRole,
              drawMethod: 'crypto.randomInt',
              ipAddress,
              userAgent,
            },
          });
        }

        // Create audit log
        await tx.auditLog.create({
          data: {
            userId,
            action: 'DRAW_EXECUTED',
            entity: 'competition',
            entityId: competition_id,
            ipAddress,
            metadata: {
              drawType: 'multi',
              prizeCount: results.length,
              winners: results.map((r) => ({
                prizePosition: r.prize.position,
                prizeTitle: r.prize.title,
                prizeValue: r.prize.value,
                ticketNumber: r.ticket.ticketNumber,
                winnerId: r.ticket.user!.id,
                winnerEmail: r.ticket.user!.email,
              })),
              totalEligibleTickets: eligibleTickets.length,
              drawMethod: 'crypto.randomInt',
              userAgent,
            },
          },
        });
      });

      // Rate limiting is handled by Redis at the start of the request

      return NextResponse.json({
        success: true,
        drawType: 'multi',
        winners: results.map((r) => ({
          prizePosition: r.prize.position,
          prizeTitle: r.prize.title,
          prizeValue: r.prize.value,
          winning_ticket: {
            id: r.ticket.id,
            number: r.ticket.ticketNumber,
            isBonus: r.ticket.isBonus,
            isFreeEntry: r.ticket.isFreeEntry,
          },
          winner: {
            id: r.ticket.user!.id,
            firstName: r.ticket.user!.firstName,
            lastName: r.ticket.user!.lastName,
            displayName: r.ticket.user!.displayName,
            email: r.ticket.user!.email,
            name: r.winnerName,
          },
        })),
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
    }

    // ===== SINGLE DRAW LOGIC (existing) =====
    // Use cryptographically secure random number generation
    const winningIndex = randomInt(0, eligibleTickets.length);
    const winningTicket = eligibleTickets[winningIndex]!;
    const winner = winningTicket.user!;

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
          prizePosition: 1,
        },
      });

      // Create DrawLog (detailed audit trail)
      await tx.drawLog.create({
        data: {
          competitionId: competition_id,
          competitionTitle: competition.title,
          totalTickets: competition.totalTickets ?? ticketsSold,
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

    // Return the result (without sending email yet)
    return NextResponse.json({
      success: true,
      drawType: 'single',
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
