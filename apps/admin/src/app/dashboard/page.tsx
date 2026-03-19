import { Suspense } from 'react';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, ShoppingCart, Users, Trophy, UserPlus, Ticket } from 'lucide-react';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { RecentOrders } from '@/components/dashboard/recent-orders';
import { ActiveCompetitions } from '@/components/dashboard/active-competitions';
import { formatPrice } from '@winucard/shared';

async function getStats() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    activeCompetitions,
    totalOrdersData,
    todayOrders,
    weekOrders,
    monthOrders,
    totalTicketsSold,
    recentOrders,
    competitions,
    totalReferrals,
    freeTicketsData,
    topReferrers,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.competition.count({ where: { status: 'ACTIVE' } }),
    prisma.order.aggregate({
      where: { paymentStatus: 'SUCCEEDED' },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: {
        paymentStatus: 'SUCCEEDED',
        createdAt: { gte: startOfDay },
      },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: {
        paymentStatus: 'SUCCEEDED',
        createdAt: { gte: startOfWeek },
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: {
        paymentStatus: 'SUCCEEDED',
        createdAt: { gte: startOfMonth },
      },
      _sum: { totalAmount: true },
    }),
    prisma.ticket.count({ where: { status: 'SOLD' } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        competition: { select: { title: true } },
      },
    }),
    prisma.competition.findMany({
      where: { status: { in: ['ACTIVE', 'UPCOMING'] } },
      orderBy: { drawDate: 'asc' },
      take: 5,
      include: {
        _count: { select: { tickets: { where: { status: 'SOLD' } } } },
      },
    }),
    // Referral stats
    prisma.user.count({ where: { referredById: { not: null } } }),
    prisma.user.aggregate({ _sum: { referralFreeTicketsEarned: true } }),
    prisma.user.findMany({
      where: { referrals: { some: {} } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        referralFreeTicketsEarned: true,
        _count: { select: { referrals: true } },
      },
      orderBy: { referrals: { _count: 'desc' } },
      take: 5,
    }),
  ]);

  // Serialize Decimal fields for client components
  const serializedOrders = recentOrders.map((order) => ({
    ...order,
    totalAmount: Number(order.totalAmount),
  }));

  const serializedCompetitions = competitions.map((comp) => ({
    ...comp,
    prizeValue: Number(comp.prizeValue),
    ticketPrice: Number(comp.ticketPrice),
  }));

  return {
    totalUsers,
    activeCompetitions,
    totalOrders: totalOrdersData._count,
    totalRevenue: Number(totalOrdersData._sum.totalAmount ?? 0),
    todayRevenue: Number(todayOrders._sum.totalAmount ?? 0),
    todayOrders: todayOrders._count,
    weekRevenue: Number(weekOrders._sum.totalAmount ?? 0),
    monthRevenue: Number(monthOrders._sum.totalAmount ?? 0),
    totalTicketsSold,
    recentOrders: serializedOrders,
    competitions: serializedCompetitions,
    totalReferrals,
    totalFreeTicketsDistributed: freeTicketsData._sum.referralFreeTicketsEarned ?? 0,
    topReferrers: topReferrers.map((u) => ({
      id: u.id,
      name: [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Unknown',
      referralCount: u._count.referrals,
      freeTicketsEarned: u.referralFreeTicketsEarned,
    })),
  };
}

async function getRevenueData() {
  const days = 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: 'SUCCEEDED',
      createdAt: { gte: startDate },
    },
    select: {
      totalAmount: true,
      createdAt: true,
    },
  });

  // Group by date
  const revenueByDate = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    revenueByDate.set(dateStr!, 0);
  }

  for (const order of orders) {
    const dateStr = order.createdAt.toISOString().split('T')[0];
    if (dateStr) {
      const current = revenueByDate.get(dateStr) ?? 0;
      revenueByDate.set(dateStr, current + Number(order.totalAmount));
    }
  }

  return Array.from(revenueByDate.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {trend && (
            <span className={trend.positive ? 'text-green-600' : 'text-red-600'}>
              {trend.positive ? '+' : ''}{trend.value}%{' '}
            </span>
          )}
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-40" />
      </CardContent>
    </Card>
  );
}

async function DashboardStats() {
  const stats = await getStats();

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          description={`${stats.totalTicketsSold.toLocaleString()} tickets sold`}
          icon={Users}
        />
        <StatCard
          title="Active Competitions"
          value={stats.activeCompetitions.toLocaleString()}
          description="Currently live"
          icon={Trophy}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          description={`${stats.todayOrders} orders today`}
          icon={ShoppingCart}
        />
        <StatCard
          title="Total Revenue"
          value={formatPrice(stats.totalRevenue)}
          description={`${formatPrice(stats.weekRevenue)} this week`}
          icon={DollarSign}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Daily revenue for the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <RevenueChartWrapper />
            </Suspense>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest ticket purchases</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentOrders orders={stats.recentOrders} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Competitions</CardTitle>
            <CardDescription>Current and upcoming competitions</CardDescription>
          </CardHeader>
          <CardContent>
            <ActiveCompetitions competitions={stats.competitions} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 grid gap-4 md:grid-cols-2">
          <StatCard
            title="Total Referrals"
            value={stats.totalReferrals.toLocaleString()}
            description="Users who joined via referral"
            icon={UserPlus}
          />
          <StatCard
            title="Free Tickets Distributed"
            value={stats.totalFreeTicketsDistributed.toLocaleString()}
            description="Earned through referrals"
            icon={Ticket}
          />
        </div>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
            <CardDescription>Users with the most referrals</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topReferrers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No referrals yet</p>
            ) : (
              <div className="space-y-4">
                {stats.topReferrers.map((referrer, index) => (
                  <div key={referrer.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium leading-none">{referrer.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {referrer.freeTicketsEarned} free ticket{referrer.freeTicketsEarned !== 1 ? 's' : ''} earned
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">
                      {referrer.referralCount} referral{referrer.referralCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

async function RevenueChartWrapper() {
  const data = await getRevenueData();
  return <RevenueChart data={data} />;
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the WinUCard admin panel
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        }
      >
        <DashboardStats />
      </Suspense>
    </div>
  );
}
