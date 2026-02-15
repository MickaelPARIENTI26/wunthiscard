import { Suspense } from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatPrice, formatDate } from '@winucard/shared';
import { Trophy, Package, Truck, CheckCircle2, Clock, ChevronRight } from 'lucide-react';

type DeliveryStatus = 'PENDING' | 'CLAIMED' | 'SHIPPED' | 'DELIVERED';

function getDeliveryStatus(win: {
  claimedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
}): DeliveryStatus {
  if (win.deliveredAt) return 'DELIVERED';
  if (win.shippedAt) return 'SHIPPED';
  if (win.claimedAt) return 'CLAIMED';
  return 'PENDING';
}

function getStatusBadge(status: DeliveryStatus) {
  switch (status) {
    case 'PENDING':
      return <Badge variant="warning"><Clock className="mr-1 h-3 w-3" /> Pending Claim</Badge>;
    case 'CLAIMED':
      return <Badge variant="default"><Package className="mr-1 h-3 w-3" /> Claimed</Badge>;
    case 'SHIPPED':
      return <Badge variant="secondary"><Truck className="mr-1 h-3 w-3" /> Shipped</Badge>;
    case 'DELIVERED':
      return <Badge variant="success"><CheckCircle2 className="mr-1 h-3 w-3" /> Delivered</Badge>;
  }
}

async function getWins() {
  const wins = await prisma.win.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      competition: {
        select: {
          id: true,
          slug: true,
          title: true,
          prizeValue: true,
        },
      },
    },
  });

  return wins;
}

async function WinsList() {
  const wins = await getWins();

  if (wins.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Trophy className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No Winners Yet</h3>
          <p className="mt-2 text-muted-foreground">
            Winners will appear here after draws are executed.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by status for summary
  const statusCounts = {
    PENDING: 0,
    CLAIMED: 0,
    SHIPPED: 0,
    DELIVERED: 0,
  };

  wins.forEach((win) => {
    statusCounts[getDeliveryStatus(win)]++;
  });

  return (
    <div className="space-y-6">
      {/* Status Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Claim</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.PENDING}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Claimed</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.CLAIMED}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipped</CardTitle>
            <Truck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.SHIPPED}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.DELIVERED}</div>
          </CardContent>
        </Card>
      </div>

      {/* Wins Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Winners</CardTitle>
          <CardDescription>Manage prize delivery for all competition winners</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competition</TableHead>
                <TableHead>Winner</TableHead>
                <TableHead>Ticket #</TableHead>
                <TableHead>Prize Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Won Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wins.map((win) => {
                const status = getDeliveryStatus(win);
                return (
                  <TableRow key={win.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/competitions/${win.competition.id}`}
                        className="font-medium hover:underline"
                      >
                        {win.competition.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {win.user ? (
                        <div>
                          <p className="font-medium">
                            {win.user.firstName} {win.user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{win.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Deleted User</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-bold">#{win.ticketNumber}</span>
                    </TableCell>
                    <TableCell>{formatPrice(Number(win.competition.prizeValue))}</TableCell>
                    <TableCell>{getStatusBadge(status)}</TableCell>
                    <TableCell>{formatDate(win.createdAt)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/wins/${win.id}`}>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function WinsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Winners & Deliveries</h1>
        <p className="text-muted-foreground">Manage prize delivery for competition winners</p>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <WinsList />
      </Suspense>
    </div>
  );
}
