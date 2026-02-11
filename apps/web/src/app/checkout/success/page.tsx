import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type Stripe from 'stripe';
import { CheckCircle, Gift, Ticket, ArrowRight, Share2, Home } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { releaseTicketsFromRedis } from '@/lib/redis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Purchase Successful - WinThisCard',
  description: 'Your ticket purchase was successful',
};

interface PageProps {
  searchParams: Promise<{ session_id?: string }>;
}

async function processPaymentIfNeeded(orderId: string, stripeSession: { payment_status: string | null; metadata: { ticketNumbers?: string; bonusTickets?: string } | null; payment_intent: string | Stripe.PaymentIntent | null }) {
  // Check if payment was successful and order hasn't been processed yet
  if (stripeSession.payment_status !== 'paid') {
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { competition: true },
  });

  if (!order || order.paymentStatus === 'SUCCEEDED') {
    return; // Already processed or not found
  }

  const ticketNumbers = JSON.parse(stripeSession.metadata?.ticketNumbers || '[]') as number[];
  const bonusTickets = parseInt(stripeSession.metadata?.bonusTickets || '0', 10);

  // Process the payment (same logic as webhook)
  const transactionResult = await prisma.$transaction(async (tx) => {
    // Check again inside transaction to prevent duplicate processing
    const currentOrder = await tx.order.findUnique({
      where: { id: orderId },
      select: { paymentStatus: true },
    });

    if (currentOrder?.paymentStatus === 'SUCCEEDED') {
      return { alreadyProcessed: true };
    }

    // Update order status atomically
    await tx.order.update({
      where: {
        id: orderId,
        paymentStatus: { not: 'SUCCEEDED' },
      },
      data: {
        paymentStatus: 'SUCCEEDED',
        stripePaymentIntentId: typeof stripeSession.payment_intent === 'string'
          ? stripeSession.payment_intent
          : stripeSession.payment_intent?.id,
      },
    });

    // Assign paid tickets to user - only update RESERVED tickets belonging to this user
    await tx.ticket.updateMany({
      where: {
        competitionId: order.competitionId,
        ticketNumber: { in: ticketNumbers },
        status: 'RESERVED',
        userId: order.userId,
      },
      data: {
        orderId: order.id,
        status: 'SOLD',
        reservedUntil: null,
      },
    });

    // Assign bonus tickets if any
    if (bonusTickets > 0) {
      const availableTickets = await tx.ticket.findMany({
        where: {
          competitionId: order.competitionId,
          status: 'AVAILABLE',
          ticketNumber: { notIn: ticketNumbers },
        },
        take: bonusTickets,
        orderBy: { ticketNumber: 'asc' },
      });

      if (availableTickets.length > 0) {
        const bonusTicketNumbers = availableTickets.map((t) => t.ticketNumber);
        await tx.ticket.updateMany({
          where: {
            competitionId: order.competitionId,
            ticketNumber: { in: bonusTicketNumbers },
            status: 'AVAILABLE', // Only update if still available
          },
          data: {
            userId: order.userId,
            orderId: order.id,
            status: 'SOLD',
            isBonus: true,
          },
        });
      }
    }

    // Check if competition is now sold out
    const remainingTickets = await tx.ticket.count({
      where: {
        competitionId: order.competitionId,
        status: 'AVAILABLE',
      },
    });

    if (remainingTickets === 0 && order.competition.status === 'ACTIVE') {
      await tx.competition.update({
        where: { id: order.competitionId },
        data: { status: 'SOLD_OUT' },
      });
    }

    return { alreadyProcessed: false };
  });

  if (transactionResult.alreadyProcessed) {
    return;
  }

  // Release Redis reservation
  if (order.userId) {
    await releaseTicketsFromRedis(order.competitionId, order.userId);
  }

  // Log success
  await prisma.auditLog.create({
    data: {
      userId: order.userId,
      action: 'PAYMENT_SUCCEEDED',
      entity: 'order',
      entityId: order.id,
      metadata: {
        orderNumber: order.orderNumber,
        ticketNumbers,
        bonusTickets,
        processedBy: 'success_page_fallback',
      },
    },
  });

  console.log('Payment processed via success page fallback:', order.orderNumber);
}

async function getOrderDetails(sessionId: string) {
  try {
    // Get session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });

    if (!session || !session.metadata?.orderId) {
      return null;
    }

    // Process payment if webhook hasn't run yet (fallback for local dev without webhooks)
    await processPaymentIfNeeded(session.metadata.orderId, session);

    // Get order from database
    const order = await prisma.order.findUnique({
      where: { id: session.metadata.orderId },
      include: {
        competition: {
          select: {
            id: true,
            slug: true,
            title: true,
            mainImageUrl: true,
            drawDate: true,
          },
        },
        tickets: {
          select: {
            ticketNumber: true,
            isBonus: true,
          },
          orderBy: {
            ticketNumber: 'asc',
          },
        },
      },
    });

    return order;
  } catch (error) {
    console.error('Error fetching order details:', error);
    return null;
  }
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(date));
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const session = await auth();
  const { session_id: sessionId } = await searchParams;

  if (!session?.user) {
    redirect('/login');
  }

  if (!sessionId) {
    redirect('/');
  }

  const order = await getOrderDetails(sessionId);

  if (!order) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-lg text-center">
            <h1 className="text-2xl font-bold">Order Not Found</h1>
            <p className="mt-2 text-muted-foreground">
              We could not find your order. Please check your email for confirmation.
            </p>
            <Button asChild className="mt-6">
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const paidTickets = order.tickets.filter((t) => !t.isBonus);
  const bonusTickets = order.tickets.filter((t) => t.isBonus);
  const totalAmount =
    typeof order.totalAmount === 'object' && 'toNumber' in order.totalAmount
      ? (order.totalAmount as { toNumber: () => number }).toNumber()
      : Number(order.totalAmount);

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-2xl">
          {/* Success Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-600">Purchase Successful!</h1>
            <p className="mt-2 text-muted-foreground">
              Thank you for your purchase. Good luck!
            </p>
          </div>

          {/* Order Details Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Order Confirmation</CardTitle>
                  <CardDescription>Order #{order.orderNumber}</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Confirmed
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Competition Info */}
              <div className="flex gap-4">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={order.competition.mainImageUrl}
                    alt={order.competition.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{order.competition.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Draw: {formatDate(order.competition.drawDate)}
                  </p>
                </div>
              </div>

              {/* Tickets */}
              <div className="space-y-4">
                {/* Paid Tickets */}
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Ticket className="h-4 w-4 text-primary" />
                    <span className="font-medium">Your Tickets ({paidTickets.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {paidTickets.map((ticket) => (
                      <Badge key={ticket.ticketNumber} variant="outline">
                        #{ticket.ticketNumber}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Bonus Tickets */}
                {bonusTickets.length > 0 && (
                  <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4 border border-green-200 dark:border-green-900">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-700 dark:text-green-400">
                        Bonus Tickets ({bonusTickets.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {bonusTickets.map((ticket) => (
                        <Badge
                          key={ticket.ticketNumber}
                          variant="outline"
                          className="border-green-500 text-green-700"
                        >
                          #{ticket.ticketNumber}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid tickets</span>
                  <span>{paidTickets.length}</span>
                </div>
                {bonusTickets.length > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Bonus tickets</span>
                    <span>+{bonusTickets.length} FREE</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total entries</span>
                  <span className="font-bold">{order.tickets.length}</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t">
                  <span className="font-medium">Amount Paid</span>
                  <span className="text-lg font-bold">{formatPrice(totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button asChild size="lg" className="w-full">
              <Link href="/my-tickets">
                <Ticket className="mr-2 h-5 w-5" />
                View My Tickets
              </Link>
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline">
                <Link href={`/competitions/${order.competition.slug}`}>
                  View Competition
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
            </div>
          </div>

          {/* Share */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Share your entry with friends!
            </p>
            <Button variant="ghost" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>

          {/* Email Note */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            A confirmation email has been sent to {session.user.email}
          </p>
        </div>
      </div>
    </main>
  );
}
