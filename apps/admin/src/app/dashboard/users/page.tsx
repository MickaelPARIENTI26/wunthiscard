import { Suspense } from 'react';
import { prisma } from '@/lib/db';
import { UsersTable } from '@/components/users/users-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface UsersPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

async function UsersData({ searchParams }: { searchParams: UsersPageProps['searchParams'] }) {
  const params = await searchParams;
  const search = params.search || '';
  const status = params.status || 'all';
  const page = parseInt(params.page || '1', 10);
  const pageSize = 20;

  const where = {
    ...(search && {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(status === 'banned' && { isBanned: true }),
    ...(status === 'verified' && { emailVerified: { not: null } }),
    ...(status === 'admin' && { role: 'ADMIN' as const }),
  };

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
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
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <UsersTable
      users={users}
      currentPage={page}
      totalPages={totalPages}
      totalCount={totalCount}
    />
  );
}

function UsersTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-10 w-[150px]" />
      </div>
      <div className="rounded-md border">
        <div className="h-[400px]" />
      </div>
    </div>
  );
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Manage user accounts and permissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            View and manage all registered users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<UsersTableSkeleton />}>
            <UsersData searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
