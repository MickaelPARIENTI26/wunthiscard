import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateCSV } from '@/lib/export';
import { formatDateTime } from '@winucard/shared';
import type { UserRole } from '@winucard/database';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where = {
      ...(status === 'banned' && { isBanned: true }),
      ...(status === 'verified' && { emailVerified: { not: null } }),
      ...(status === 'admin' && { role: { in: ['ADMIN', 'SUPER_ADMIN'] as UserRole[] } }),
    };

    const users = await prisma.user.findMany({
      where,
      include: {
        _count: {
          select: {
            orders: { where: { paymentStatus: 'SUCCEEDED' } },
            tickets: true,
            wins: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10000, // Limit to prevent memory issues
    });

    const csv = generateCSV(users, [
      { key: 'id', header: 'User ID' },
      { key: 'email', header: 'Email' },
      { key: 'firstName', header: 'First Name' },
      { key: 'lastName', header: 'Last Name' },
      { key: 'role', header: 'Role' },
      {
        key: 'emailVerified',
        header: 'Email Verified',
        accessor: (row) => (row.emailVerified ? 'Yes' : 'No'),
      },
      {
        key: 'isBanned',
        header: 'Banned',
        accessor: (row) => (row.isBanned ? 'Yes' : 'No'),
      },
      {
        key: 'orders',
        header: 'Total Orders',
        accessor: (row) => row._count.orders,
      },
      {
        key: 'tickets',
        header: 'Total Tickets',
        accessor: (row) => row._count.tickets,
      },
      {
        key: 'wins',
        header: 'Total Wins',
        accessor: (row) => row._count.wins,
      },
      {
        key: 'createdAt',
        header: 'Registration Date',
        accessor: (row) => formatDateTime(row.createdAt),
      },
    ]);

    const filename = `users-export-${new Date().toISOString().split('T')[0]}.csv`;

    // Log the data export to audit trail
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DATA_EXPORT_USERS',
        entity: 'user',
        entityId: 'bulk',
        metadata: {
          exportedCount: users.length,
          filters: { status: status || 'all' },
          filename,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting users:', error);
    return NextResponse.json(
      { error: 'Failed to export users' },
      { status: 500 }
    );
  }
}
