import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateCSV } from '@/lib/export';
import { formatDateTime, formatPrice } from '@winucard/shared';
import * as XLSX from 'xlsx';

function getTicketType(ticket: { isBonus: boolean; isFreeEntry: boolean }): string {
  if (ticket.isFreeEntry) return 'free';
  if (ticket.isBonus) return 'bonus';
  return 'paid';
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-').substring(0, 50);
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id;

    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get('competitionId');
    const format = searchParams.get('format') || 'csv'; // csv or xlsx
    const type = searchParams.get('type') || 'detailed'; // detailed or summary

    if (!competitionId) {
      return NextResponse.json({ error: 'competitionId is required' }, { status: 400 });
    }

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { id: true, title: true, slug: true },
    });

    if (!competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const safeName = sanitizeFilename(competition.title);

    if (type === 'summary') {
      return await exportSummary(request, currentUserId, competition, format, dateStr, safeName);
    }

    return await exportDetailed(request, currentUserId, competition, format, dateStr, safeName);
  } catch (error) {
    console.error('Error exporting participants:', error);
    return NextResponse.json(
      { error: 'Failed to export participants' },
      { status: 500 }
    );
  }
}

async function exportDetailed(
  request: NextRequest,
  userId: string,
  competition: { id: string; title: string; slug: string },
  format: string,
  dateStr: string,
  safeName: string,
) {
  const tickets = await prisma.ticket.findMany({
    where: {
      competitionId: competition.id,
      status: { in: ['SOLD', 'FREE_ENTRY'] },
      userId: { not: null },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      order: {
        select: {
          totalAmount: true,
          ticketCount: true,
          bonusTicketCount: true,
          createdAt: true,
        },
      },
    },
    orderBy: { ticketNumber: 'asc' },
    take: 50000,
  });

  // Count tickets per user for the tickets_count column
  const userTicketCounts = new Map<string, number>();
  for (const ticket of tickets) {
    if (ticket.userId) {
      userTicketCounts.set(ticket.userId, (userTicketCounts.get(ticket.userId) ?? 0) + 1);
    }
  }

  const columns = [
    { key: 'ticketNumber' as const, header: 'ticket_number', accessor: (row: typeof tickets[number]) => row.ticketNumber },
    { key: 'userId' as const, header: 'user_id', accessor: (row: typeof tickets[number]) => row.user?.id ?? 'N/A' },
    { key: 'firstName' as const, header: 'first_name', accessor: (row: typeof tickets[number]) => row.user?.firstName ?? '' },
    { key: 'lastName' as const, header: 'last_name', accessor: (row: typeof tickets[number]) => row.user?.lastName ?? '' },
    { key: 'email' as const, header: 'email', accessor: (row: typeof tickets[number]) => row.user?.email ?? '' },
    {
      key: 'ticketsCount' as const,
      header: 'tickets_count',
      accessor: (row: typeof tickets[number]) => row.userId ? (userTicketCounts.get(row.userId) ?? 0) : 0,
    },
    { key: 'ticketType' as const, header: 'ticket_type', accessor: (row: typeof tickets[number]) => getTicketType(row) },
    {
      key: 'purchaseDate' as const,
      header: 'purchase_date',
      accessor: (row: typeof tickets[number]) => row.order ? formatDateTime(row.order.createdAt) : '',
    },
    {
      key: 'amountPaid' as const,
      header: 'amount_paid',
      accessor: (row: typeof tickets[number]) => {
        if (row.isBonus || row.isFreeEntry) return 0;
        if (!row.order) return 0;
        const paidTickets = row.order.ticketCount;
        if (paidTickets === 0) return 0;
        return Number((Number(row.order.totalAmount) / paidTickets).toFixed(2));
      },
    },
  ];

  const filename = `WinUCard-${competition.id}-${safeName}-participants-${dateStr}`;

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'DATA_EXPORT_PARTICIPANTS',
      entity: 'competition',
      entityId: competition.id,
      metadata: {
        exportedCount: tickets.length,
        type: 'detailed',
        format,
        competitionTitle: competition.title,
        filename,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    },
  });

  if (format === 'xlsx') {
    const data = tickets.map((row) =>
      Object.fromEntries(columns.map((col) => [col.header, col.accessor(row)]))
    );
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Participants');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      },
    });
  }

  const csv = generateCSV(tickets as unknown as Record<string, unknown>[], columns as Parameters<typeof generateCSV>[1]);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    },
  });
}

async function exportSummary(
  request: NextRequest,
  userId: string,
  competition: { id: string; title: string; slug: string },
  format: string,
  dateStr: string,
  safeName: string,
) {
  const tickets = await prisma.ticket.findMany({
    where: {
      competitionId: competition.id,
      status: { in: ['SOLD', 'FREE_ENTRY'] },
      userId: { not: null },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      order: {
        select: {
          totalAmount: true,
        },
      },
    },
    orderBy: { ticketNumber: 'asc' },
    take: 50000,
  });

  // Aggregate per user
  const userMap = new Map<string, {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    totalTickets: number;
    paidTickets: number;
    freeTickets: number;
    bonusTickets: number;
    totalPaid: number;
    ticketNumbers: number[];
  }>();

  for (const ticket of tickets) {
    if (!ticket.userId || !ticket.user) continue;

    let entry = userMap.get(ticket.userId);
    if (!entry) {
      entry = {
        userId: ticket.userId,
        firstName: ticket.user.firstName ?? '',
        lastName: ticket.user.lastName ?? '',
        email: ticket.user.email,
        totalTickets: 0,
        paidTickets: 0,
        freeTickets: 0,
        bonusTickets: 0,
        totalPaid: 0,
        ticketNumbers: [],
      };
      userMap.set(ticket.userId, entry);
    }

    entry.totalTickets++;
    entry.ticketNumbers.push(ticket.ticketNumber);

    if (ticket.isFreeEntry) {
      entry.freeTickets++;
    } else if (ticket.isBonus) {
      entry.bonusTickets++;
    } else {
      entry.paidTickets++;
      if (ticket.order) {
        const perTicket = Number(ticket.order.totalAmount) / (tickets.filter(
          (t) => t.orderId === ticket.orderId && !t.isBonus && !t.isFreeEntry
        ).length || 1);
        entry.totalPaid += perTicket;
      }
    }
  }

  const summaryData = Array.from(userMap.values()).sort((a, b) => b.totalTickets - a.totalTickets);

  const columns = [
    { key: 'userId' as const, header: 'user_id', accessor: (row: typeof summaryData[number]) => row.userId },
    { key: 'firstName' as const, header: 'first_name', accessor: (row: typeof summaryData[number]) => row.firstName },
    { key: 'lastName' as const, header: 'last_name', accessor: (row: typeof summaryData[number]) => row.lastName },
    { key: 'email' as const, header: 'email', accessor: (row: typeof summaryData[number]) => row.email },
    { key: 'totalTickets' as const, header: 'total_tickets', accessor: (row: typeof summaryData[number]) => row.totalTickets },
    { key: 'paidTickets' as const, header: 'paid_tickets', accessor: (row: typeof summaryData[number]) => row.paidTickets },
    { key: 'freeTickets' as const, header: 'free_tickets', accessor: (row: typeof summaryData[number]) => row.freeTickets },
    { key: 'bonusTickets' as const, header: 'bonus_tickets', accessor: (row: typeof summaryData[number]) => row.bonusTickets },
    { key: 'totalPaid' as const, header: 'total_paid', accessor: (row: typeof summaryData[number]) => formatPrice(row.totalPaid) },
    {
      key: 'ticketNumbers' as const,
      header: 'ticket_numbers',
      accessor: (row: typeof summaryData[number]) => row.ticketNumbers.sort((a, b) => a - b).join(', '),
    },
  ];

  const filename = `WinUCard-${competition.id}-${safeName}-summary-${dateStr}`;

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'DATA_EXPORT_PARTICIPANTS_SUMMARY',
      entity: 'competition',
      entityId: competition.id,
      metadata: {
        exportedCount: summaryData.length,
        type: 'summary',
        format,
        competitionTitle: competition.title,
        filename,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    },
  });

  if (format === 'xlsx') {
    const data = summaryData.map((row) =>
      Object.fromEntries(columns.map((col) => [col.header, col.accessor(row)]))
    );
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      },
    });
  }

  const csv = generateCSV(summaryData as unknown as Record<string, unknown>[], columns as Parameters<typeof generateCSV>[1]);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    },
  });
}
