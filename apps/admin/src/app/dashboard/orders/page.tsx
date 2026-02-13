import { Suspense } from 'react';
import { prisma } from '@/lib/db';
import { OrdersTable } from '@/components/orders/orders-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface OrdersPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    competition?: string;
    page?: string;
  }>;
}

async function OrdersData({ searchParams }: { searchParams: OrdersPageProps['searchParams'] }) {
  const params = await searchParams;
  const search = params.search || '';
  const status = params.status || 'all';
  const competitionId = params.competition || 'all';
  const page = parseInt(params.page || '1', 10);
  const pageSize = 20;

  const where = {
    ...(search && {
      OR: [
        { id: { contains: search, mode: 'insensitive' as const } },
        { user: { email: { contains: search, mode: 'insensitive' as const } } },
        { stripeSessionId: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(status !== 'all' && { paymentStatus: status as 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' }),
    ...(competitionId !== 'all' && { competitionId }),
  };

  const [orders, totalCount, competitions] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        competition: {
          select: { id: true, title: true },
        },
        _count: {
          select: { tickets: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
    prisma.competition.findMany({
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Serialize Decimal fields for client component
  const serializedOrders = orders.map((order) => ({
    ...order,
    totalAmount: Number(order.totalAmount),
  }));

  return (
    <OrdersTable
      orders={serializedOrders}
      competitions={competitions}
      currentPage={page}
      totalPages={totalPages}
      totalCount={totalCount}
    />
  );
}

function OrdersTableSkeleton() {
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

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          View and manage all ticket orders
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            Browse and filter orders by status or search by order ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<OrdersTableSkeleton />}>
            <OrdersData searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
