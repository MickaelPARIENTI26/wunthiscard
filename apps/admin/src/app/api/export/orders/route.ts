import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateCSV } from '@/lib/export';
import { formatDateTime, formatPrice } from '@winucard/shared';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const competitionId = searchParams.get('competitionId');

    const where = {
      ...(status && status !== 'all' && {
        paymentStatus: status as 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED',
      }),
      ...(competitionId && { competitionId }),
    };

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        competition: {
          select: {
            title: true,
          },
        },
        tickets: {
          select: {
            ticketNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10000, // Limit to prevent memory issues
    });

    const csv = generateCSV(orders, [
      { key: 'id', header: 'Order ID' },
      {
        key: 'customer',
        header: 'Customer Name',
        accessor: (row) =>
          row.user
            ? `${row.user.firstName || ''} ${row.user.lastName || ''}`.trim() || 'N/A'
            : 'Deleted User',
      },
      {
        key: 'email',
        header: 'Customer Email',
        accessor: (row) => row.user?.email || 'N/A',
      },
      {
        key: 'competition',
        header: 'Competition',
        accessor: (row) => row.competition.title,
      },
      { key: 'ticketCount', header: 'Ticket Count' },
      {
        key: 'ticketNumbers',
        header: 'Ticket Numbers',
        accessor: (row) => row.tickets.map((t) => t.ticketNumber).join('; '),
      },
      {
        key: 'totalAmount',
        header: 'Total Amount',
        accessor: (row) => formatPrice(Number(row.totalAmount)),
      },
      { key: 'paymentStatus', header: 'Payment Status' },
      { key: 'stripeSessionId', header: 'Stripe Session ID' },
      {
        key: 'createdAt',
        header: 'Order Date',
        accessor: (row) => formatDateTime(row.createdAt),
      },
    ]);

    const filename = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting orders:', error);
    return NextResponse.json(
      { error: 'Failed to export orders' },
      { status: 500 }
    );
  }
}
