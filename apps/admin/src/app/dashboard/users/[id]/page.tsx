import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatPrice, formatDate, formatDateTime } from '@winucard/shared';
import { ArrowLeft, Calendar, Trophy, Ticket, ShoppingCart } from 'lucide-react';
import { UserActions } from '@/components/users/user-actions';

interface UserPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserPage({ params }: UserPageProps) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: {
        where: { paymentStatus: 'SUCCEEDED' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          competition: {
            select: { id: true, title: true },
          },
        },
      },
      tickets: {
        orderBy: { ticketNumber: 'desc' },
        take: 20,
        include: {
          competition: {
            select: { id: true, title: true },
          },
        },
      },
      wins: {
        orderBy: { createdAt: 'desc' },
        include: {
          competition: {
            select: { id: true, title: true, prizeValue: true },
          },
        },
      },
      _count: {
        select: {
          orders: { where: { paymentStatus: 'SUCCEEDED' } },
          tickets: true,
          wins: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const totalSpent = await prisma.order.aggregate({
    where: { userId: id, paymentStatus: 'SUCCEEDED' },
    _sum: { totalAmount: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.email}
              </h1>
              <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                {user.role}
              </Badge>
              {user.isBanned && <Badge variant="destructive">Banned</Badge>}
              {user.emailVerified && !user.isBanned && (
                <Badge variant="success">Verified</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <UserActions user={user} />
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(Number(totalSpent._sum.totalAmount ?? 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {user._count.orders} orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Tickets Purchased
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.tickets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Wins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.wins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Member Since
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDate(user.createdAt)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">First Name</p>
                <p className="font-medium">{user.firstName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Name</p>
                <p className="font-medium">{user.lastName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{user.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email Verified</p>
                <p className="font-medium">
                  {user.emailVerified ? formatDateTime(user.emailVerified) : 'Not verified'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {user.wins.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Competition Wins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user.wins.map((win) => (
                  <div key={win.id} className="flex items-center justify-between">
                    <div>
                      <Link
                        href={`/dashboard/competitions/${win.competition.id}`}
                        className="font-medium hover:underline"
                      >
                        {win.competition.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        Ticket #{win.ticketNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatPrice(Number(win.competition.prizeValue))}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(win.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Last 10 successful orders</CardDescription>
        </CardHeader>
        <CardContent>
          {user.orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Competition</TableHead>
                  <TableHead>Tickets</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="font-mono text-sm hover:underline"
                      >
                        {order.id.slice(0, 8)}...
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/competitions/${order.competition.id}`}
                        className="hover:underline"
                      >
                        {order.competition.title}
                      </Link>
                    </TableCell>
                    <TableCell>{order.ticketCount}</TableCell>
                    <TableCell>{formatPrice(Number(order.totalAmount))}</TableCell>
                    <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">No orders yet</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
          <CardDescription>Last 20 purchased tickets</CardDescription>
        </CardHeader>
        <CardContent>
          {user.tickets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Competition</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono">{ticket.ticketNumber}</TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/competitions/${ticket.competition.id}`}
                        className="hover:underline"
                      >
                        {ticket.competition.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          ticket.status === 'SOLD'
                            ? 'success'
                            : ticket.status === 'RESERVED'
                            ? 'warning'
                            : ticket.status === 'FREE_ENTRY'
                            ? 'outline'
                            : 'secondary'
                        }
                      >
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ticket.isBonus ? (
                        <Badge variant="outline">Bonus</Badge>
                      ) : ticket.isFreeEntry ? (
                        <Badge variant="outline">Free Entry</Badge>
                      ) : (
                        'Regular'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">No tickets yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
