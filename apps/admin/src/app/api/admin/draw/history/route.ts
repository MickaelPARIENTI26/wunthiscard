import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

/**
 * GET /api/admin/draw/history
 * Returns the 20 most recent draws
 * Protected: DRAW_MASTER or SUPER_ADMIN only
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only DRAW_MASTER and SUPER_ADMIN can access draw routes
    if (session.user.role !== 'DRAW_MASTER' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query params for pagination
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);
    const offset = Number(searchParams.get('offset')) || 0;

    // Get completed competitions with draw info
    const draws = await prisma.competition.findMany({
      where: {
        status: 'COMPLETED',
        actualDrawDate: { not: null },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        mainImageUrl: true,
        prizeValue: true,
        category: true,
        totalTickets: true,
        winningTicketNumber: true,
        actualDrawDate: true,
        winnerNotified: true,
        drawnBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
          },
        },
        wins: {
          select: {
            id: true,
            ticketNumber: true,
            claimedAt: true,
            shippedAt: true,
            deliveredAt: true,
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
              where: {
                status: { in: ['SOLD', 'FREE_ENTRY'] },
              },
            },
          },
        },
      },
      orderBy: {
        actualDrawDate: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.competition.count({
      where: {
        status: 'COMPLETED',
        actualDrawDate: { not: null },
      },
    });

    // Transform the data
    const history = draws.map((draw) => {
      const win = draw.wins[0];
      const winner = win?.user;

      return {
        id: draw.id,
        slug: draw.slug,
        competition: {
          title: draw.title,
          subtitle: draw.subtitle,
          mainImageUrl: draw.mainImageUrl,
          prizeValue: Number(draw.prizeValue),
          category: draw.category,
          totalTickets: draw.totalTickets,
          ticketsSold: draw._count.tickets,
        },
        draw: {
          date: draw.actualDrawDate,
          winningTicketNumber: draw.winningTicketNumber,
          winnerNotified: draw.winnerNotified,
          executedBy: draw.drawnBy
            ? {
                id: draw.drawnBy.id,
                name:
                  draw.drawnBy.displayName ||
                  `${draw.drawnBy.firstName} ${draw.drawnBy.lastName}`,
              }
            : null,
        },
        winner: winner
          ? {
              id: winner.id,
              name:
                winner.displayName ||
                `${winner.firstName} ${winner.lastName}`,
              email: winner.email,
              ticketNumber: win.ticketNumber,
            }
          : null,
        claim: win
          ? {
              claimedAt: win.claimedAt,
              shippedAt: win.shippedAt,
              deliveredAt: win.deliveredAt,
              status: getClaimStatus(win),
            }
          : null,
      };
    });

    return NextResponse.json({
      draws: history,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching draw history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getClaimStatus(win: {
  claimedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
}): string {
  if (win.deliveredAt) return 'delivered';
  if (win.shippedAt) return 'shipped';
  if (win.claimedAt) return 'claimed';
  return 'pending';
}
