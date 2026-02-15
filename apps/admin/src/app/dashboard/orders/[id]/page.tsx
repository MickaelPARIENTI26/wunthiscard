import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, User, Mail, CreditCard, Ticket, Calendar, FileText } from 'lucide-react';
import { prisma } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice, formatDateTime } from '@winucard/shared';
import type { PaymentStatus } from '@winucard/database';

interface PageParams {
  id: string;
}

const statusColors: Record<PaymentStatus, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'> = {
  PENDING: 'warning',
  PROCESSING: 'default',
  SUCCEEDED: 'success',
  FAILED: 'destructive',
  REFUNDED: 'outline',
  CANCELLED: 'secondary',
};

async function getOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      competition: {
        select: {
          id: true,
          title: true,
          slug: true,
          ticketPrice: true,
        },
      },
      tickets: {
        select: {
          id: true,
          ticketNumber: true,
          status: true,
          isBonus: true,
          isFreeEntry: true,
        },
        orderBy: { ticketNumber: 'asc' },
      },
    },
  });

  return order;
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) {
    notFound();
  }

  const totalAmount =
    typeof order.totalAmount === 'object' && 'toNumber' in order.totalAmount
      ? (order.totalAmount as { toNumber: () => number }).toNumber()
      : Number(order.totalAmount);

  const ticketPrice =
    typeof order.competition.ticketPrice === 'object' && 'toNumber' in order.competition.ticketPrice
      ? (order.competition.ticketPrice as { toNumber: () => number }).toNumber()
      : Number(order.competition.ticketPrice);

  const paidTickets = order.tickets.filter((t) => !t.isBonus && !t.isFreeEntry);
  const bonusTickets = order.tickets.filter((t) => t.isBonus);

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/orders">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
          <p className="text-sm text-muted-foreground font-mono">{order.id}</p>
        </div>
        <Badge variant={statusColors[order.paymentStatus]} className="w-fit text-sm">
          {order.paymentStatus}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Order Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="font-medium">{order.orderNumber || order.id.slice(0, 8)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDateTime(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="font-medium text-lg">{formatPrice(totalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ticket Count</p>
                <p className="font-medium">{order.ticketCount}</p>
              </div>
            </div>

            {order.stripeSessionId && (
              <div>
                <p className="text-sm text-muted-foreground">Stripe Session</p>
                <p className="font-mono text-xs break-all">{order.stripeSessionId}</p>
              </div>
            )}

            {order.stripePaymentIntentId && (
              <div>
                <p className="text-sm text-muted-foreground">Payment Intent</p>
                <p className="font-mono text-xs break-all">{order.stripePaymentIntentId}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.user ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Link
                      href={`/dashboard/users/${order.user.id}`}
                      className="font-medium hover:underline"
                    >
                      {order.user.firstName && order.user.lastName
                        ? `${order.user.firstName} ${order.user.lastName}`
                        : 'No name'}
                    </Link>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {order.user.email}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/users/${order.user.id}`}>View Customer Profile</Link>
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground italic">User deleted</p>
            )}
          </CardContent>
        </Card>

        {/* Competition Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Competition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Link
                href={`/dashboard/competitions/${order.competition.id}`}
                className="font-medium text-lg hover:underline"
              >
                {order.competition.title}
              </Link>
              <p className="text-sm text-muted-foreground">
                Ticket Price: {formatPrice(ticketPrice)}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/competitions/${order.competition.id}`}>
                View Competition
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Tickets Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Tickets ({order.tickets.length})
            </CardTitle>
            <CardDescription>
              {paidTickets.length} paid
              {bonusTickets.length > 0 && `, ${bonusTickets.length} bonus`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Paid Tickets */}
              {paidTickets.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Paid Tickets</p>
                  <div className="flex flex-wrap gap-2">
                    {paidTickets.map((ticket) => (
                      <Badge
                        key={ticket.id}
                        variant={ticket.status === 'SOLD' ? 'success' : 'secondary'}
                        className="font-mono"
                      >
                        #{ticket.ticketNumber}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Bonus Tickets */}
              {bonusTickets.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Bonus Tickets</p>
                  <div className="flex flex-wrap gap-2">
                    {bonusTickets.map((ticket) => (
                      <Badge
                        key={ticket.id}
                        variant="outline"
                        className="font-mono border-green-500 text-green-600"
                      >
                        #{ticket.ticketNumber} (bonus)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <div className="h-2 w-2 rounded-full bg-green-600" />
              </div>
              <div>
                <p className="font-medium">Order Created</p>
                <p className="text-sm text-muted-foreground">{formatDateTime(order.createdAt)}</p>
              </div>
            </div>
            {order.paymentStatus === 'SUCCEEDED' && order.updatedAt && (
              <div className="flex gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <div className="h-2 w-2 rounded-full bg-green-600" />
                </div>
                <div>
                  <p className="font-medium">Payment Succeeded</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(order.updatedAt)}</p>
                </div>
              </div>
            )}
            {order.paymentStatus === 'FAILED' && (
              <div className="flex gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <div className="h-2 w-2 rounded-full bg-red-600" />
                </div>
                <div>
                  <p className="font-medium">Payment Failed</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(order.updatedAt)}</p>
                </div>
              </div>
            )}
            {order.paymentStatus === 'REFUNDED' && (
              <div className="flex gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                  <div className="h-2 w-2 rounded-full bg-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Order Refunded</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(order.updatedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
