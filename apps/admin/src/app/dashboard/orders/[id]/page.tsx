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
import { formatPrice, formatDateTime } from '@winthiscard/shared';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { PaymentStatus } from '@winthiscard/database';

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

const statusColors: Record<PaymentStatus, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'> = {
  PENDING: 'warning',
  PROCESSING: 'default',
  SUCCEEDED: 'success',
  FAILED: 'destructive',
  REFUNDED: 'outline',
  CANCELLED: 'secondary',
};

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      competition: {
        select: {
          id: true,
          title: true,
          ticketPrice: true,
        },
      },
      tickets: {
        orderBy: { ticketNumber: 'asc' },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
              <Badge variant={statusColors[order.paymentStatus]}>
                {order.paymentStatus}
              </Badge>
            </div>
            <p className="text-muted-foreground font-mono">{order.id}</p>
          </div>
        </div>
        {order.stripeSessionId && (
          <Button variant="outline" asChild>
            <a
              href={`https://dashboard.stripe.com/payments/${order.stripeSessionId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View in Stripe
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(Number(order.totalAmount))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tickets Purchased</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{order.ticketCount}</div>
            <p className="text-xs text-muted-foreground">
              @ {formatPrice(Number(order.competition.ticketPrice))} each
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Order Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDateTime(order.createdAt)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.user ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <Link
                    href={`/dashboard/users/${order.user.id}`}
                    className="font-medium hover:underline"
                  >
                    {order.user.firstName && order.user.lastName
                      ? `${order.user.firstName} ${order.user.lastName}`
                      : order.user.email}
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{order.user.email}</p>
                </div>
                {order.user.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{order.user.phone}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground italic">Account deleted</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Competition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Competition</p>
              <Link
                href={`/dashboard/competitions/${order.competition.id}`}
                className="font-medium hover:underline"
              >
                {order.competition.title}
              </Link>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ticket Price</p>
              <p className="font-medium">{formatPrice(Number(order.competition.ticketPrice))}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {order.bonusTicketCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bonus Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Bonus Tickets</p>
                <p className="font-medium text-green-600">+{order.bonusTicketCount} free tickets</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets Received</p>
                <p className="font-medium">{order.ticketCount + order.bonusTicketCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
          <CardDescription>
            {order.tickets.length} ticket{order.tickets.length !== 1 ? 's' : ''} assigned to this order
          </CardDescription>
        </CardHeader>
        <CardContent>
          {order.tickets.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono">{ticket.ticketNumber}</TableCell>
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
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No tickets have been assigned to this order yet.
            </p>
          )}
        </CardContent>
      </Card>

      {order.stripeSessionId && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Stripe Session ID</p>
              <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                {order.stripeSessionId}
              </code>
            </div>
            {order.paymentStatus === 'SUCCEEDED' && (
              <div>
                <p className="text-sm text-muted-foreground">Paid At</p>
                <p className="font-medium">{formatDateTime(order.createdAt)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
