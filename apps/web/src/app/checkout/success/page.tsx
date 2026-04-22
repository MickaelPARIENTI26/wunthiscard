import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type Stripe from 'stripe';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { releaseTicketsFromRedis } from '@/lib/redis';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@winucard/shared/utils';

export const metadata: Metadata = {
  title: 'Purchase Successful - WinUCard',
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
      <main>
        <section className="drop-section" style={{ textAlign: 'center', maxWidth: '700px', paddingTop: '80px' }}>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: '36px', fontWeight: 700, marginBottom: '12px' }}>Order Not Found</h1>
          <p style={{ color: 'var(--ink-dim)', marginBottom: '24px' }}>
            We could not find your order. Please check your email for confirmation.
          </p>
          <Button variant="primary" size="lg" asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </section>
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
    <main>
      <section className="drop-section" style={{ textAlign: 'center', maxWidth: '700px', paddingTop: '80px' }}>
        {/* Celebration */}
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>🎉</div>
        <div
          className="inline-flex items-center gap-2.5 justify-center"
          style={{
            padding: '7px 14px', background: 'var(--ink)', color: 'var(--accent)',
            borderRadius: '999px', fontFamily: 'var(--mono)', fontSize: '11px',
            letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '20px',
          }}
        >
          <span className="live-dot" style={{ boxShadow: '0 0 10px var(--accent)' }} />
          ENTRY CONFIRMED
        </div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(28px, 6vw, 64px)', fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 0.95, margin: '20px 0' }}>
          You&apos;re <span className="inline-block bg-[var(--ink)] text-[var(--accent)] px-[0.18em] pb-[2px] rounded-[12px] rotate-[-2deg] font-bold">in</span>.
        </h1>
        <p style={{ color: 'var(--ink-dim)', fontSize: '17px', lineHeight: 1.6, marginBottom: '32px' }}>
          We&apos;ve emailed your confirmation with your ticket numbers. The draw is live — watch on our socials or right here when the countdown hits zero.
        </p>

        {/* Order summary card */}
        <div className="drop-card" style={{ textAlign: 'left', marginBottom: '32px' }}>
          {/* Competition info */}
          <div className="flex gap-4 mb-4 pb-4" style={{ borderBottom: '1px dashed var(--line-2)' }}>
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden" style={{ borderRadius: '8px', border: '1.5px solid var(--ink)' }}>
              <Image src={order.competition.mainImageUrl} alt={order.competition.title} fill className="object-cover" sizes="80px" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm">{order.competition.title}</h3>
              <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--ink-faint)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Draw: {formatDate(order.competition.drawDate)}
              </p>
            </div>
          </div>

          {/* Order details */}
          <div className="flex justify-between py-3" style={{ borderBottom: '1px dashed var(--line-2)' }}>
            <span style={{ color: 'var(--ink-dim)' }}>Order ID</span>
            <b>#{order.orderNumber}</b>
          </div>
          <div className="flex justify-between py-3" style={{ borderBottom: '1px dashed var(--line-2)' }}>
            <span style={{ color: 'var(--ink-dim)' }}>Tickets</span>
            <b>{paidTickets.length}{bonusTickets.length > 0 ? ` + ${bonusTickets.length} bonus` : ''}</b>
          </div>
          <div className="flex justify-between py-3" style={{ borderBottom: '1px dashed var(--line-2)' }}>
            <span style={{ color: 'var(--ink-dim)' }}>Ticket numbers</span>
            <b style={{ fontFamily: 'var(--mono)', fontSize: '12px' }}>
              {paidTickets.map(t => `#${t.ticketNumber}`).join(', ')}
              {bonusTickets.length > 0 && (
                <span style={{ color: 'var(--accent)' }}>
                  {', '}{bonusTickets.map(t => `#${t.ticketNumber}`).join(', ')}
                </span>
              )}
            </b>
          </div>
          <div className="flex justify-between py-3">
            <span style={{ color: 'var(--ink-dim)' }}>Total paid</span>
            <b>{formatPrice(totalAmount)}</b>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2.5 justify-center">
          <Button variant="hot" size="xl" asChild>
            <Link href="/my-tickets">View my tickets →</Link>
          </Button>
          <Button variant="ghost" size="xl" asChild>
            <Link href="/competitions">Browse more</Link>
          </Button>
        </div>

        {/* Email note */}
        <p style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--ink-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '24px' }}>
          Confirmation sent to {session.user.email}
        </p>
      </section>
    </main>
  );
}
