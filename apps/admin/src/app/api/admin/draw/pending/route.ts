import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

/**
 * GET /api/admin/draw/pending
 * Returns all competitions ready to be drawn (SOLD_OUT or past draw date, not yet drawn)
 * Protected: DRAW_MASTER or SUPER_ADMIN only
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only DRAW_MASTER and SUPER_ADMIN can access draw routes
    if (session.user.role !== 'DRAW_MASTER' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();

    // Find competitions that are ready to be drawn:
    // - Status is SOLD_OUT or ACTIVE with past drawDate
    // - Not yet drawn (actualDrawDate is null)
    const pendingCompetitions = await prisma.competition.findMany({
      where: {
        actualDrawDate: null, // Not yet drawn
        OR: [
          // Sold out
          { status: 'SOLD_OUT' },
          // Or active/drawing with past draw date
          {
            status: { in: ['ACTIVE', 'DRAWING'] },
            drawDate: { lte: now },
          },
        ],
      },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        mainImageUrl: true,
        prizeValue: true,
        ticketPrice: true,
        category: true,
        totalTickets: true,
        drawDate: true,
        status: true,
        _count: {
          select: {
            tickets: {
              where: {
                status: { in: ['SOLD', 'FREE_ENTRY'] },
              },
            },
          },
        },
        tickets: {
          where: {
            status: { in: ['SOLD', 'FREE_ENTRY'] },
            userId: { not: null },
          },
          select: {
            userId: true,
          },
          distinct: ['userId'],
        },
      },
      orderBy: {
        drawDate: 'asc',
      },
    });

    // Transform the data
    const competitions = pendingCompetitions.map((comp) => ({
      id: comp.id,
      slug: comp.slug,
      title: comp.title,
      subtitle: comp.subtitle,
      mainImageUrl: comp.mainImageUrl,
      prizeValue: Number(comp.prizeValue),
      ticketPrice: Number(comp.ticketPrice),
      category: comp.category,
      totalTickets: comp.totalTickets,
      ticketsSold: comp._count.tickets,
      participantsCount: comp.tickets.length,
      drawDate: comp.drawDate,
      status: comp.status,
      isOverdue: comp.drawDate < now,
    }));

    return NextResponse.json({
      competitions,
      count: competitions.length,
    });
  } catch (error) {
    console.error('Error fetching pending draws:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
