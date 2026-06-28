import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { releaseTicketsFromRedis } from '@/lib/redis';
import { fulfillCheckoutSession } from '@/lib/fulfill-checkout';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// The handler does DB + Redis + email work; don't let it be capped at a low plan
// default and time out (a 500 makes Stripe retry the whole delivery).
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret');
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await fulfillCheckoutSession(event.data.object as Stripe.Checkout.Session);
        break;

      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        await handleDisputeCreated(dispute);
        break;
      }

      case 'charge.dispute.closed': {
        const dispute = event.data.object as Stripe.Dispute;
        await handleDisputeClosed(dispute);
        break;
      }

      default:
        // Unhandled event types are safely ignored
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;

  if (!orderId) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) return;

  // Flip PENDING → CANCELLED ATOMICALLY (mirrors /checkout/cancel). updateMany with a
  // paymentStatus: 'PENDING' guard returns count 1 only for the request that actually
  // performs the transition, so a racing cancel page, a webhook retry, or a successful
  // payment can never trip the cleanup below — and, critically, can never re-credit the
  // referral free ticket twice. Everything after this runs ONLY on the winning flip.
  const cancelled = await prisma.order.updateMany({
    where: { id: orderId, paymentStatus: 'PENDING' },
    data: { paymentStatus: 'CANCELLED' },
  });

  if (cancelled.count !== 1) {
    // Already SUCCEEDED, CANCELLED, or otherwise handled (cancel page / retry). Do
    // nothing: tickets and the referral counter were settled by whoever won the flip.
    return;
  }

  // Release reserved tickets back to available
  const ticketNumbers = JSON.parse(session.metadata?.ticketNumbers || '[]') as number[];

  if (ticketNumbers.length > 0) {
    await prisma.ticket.updateMany({
      where: {
        competitionId: order.competitionId,
        ticketNumber: { in: ticketNumbers },
        status: 'RESERVED',
      },
      data: {
        status: 'AVAILABLE',
        userId: null,
        reservedUntil: null,
      },
    });
  }

  // Release Redis reservation
  if (order.userId) {
    await releaseTicketsFromRedis(order.competitionId, order.userId);
  }

  // Re-credit the buyer's free referral ticket if one was reserved for this order at
  // checkout (decremented atomically in create-session, NOT here). The /checkout/cancel
  // page does the same when the user lands there — but on a SILENT expiry the buyer never
  // visits that page, so without this the free ticket would be lost. Safe against
  // double-credit because the atomic PENDING → CANCELLED flip above guarantees exactly
  // one of {this handler, the cancel page} ever runs this branch for a given order.
  const referralTicketUsed = session.metadata?.referralTicketUsed === '1';
  if (referralTicketUsed && order.userId) {
    await prisma.user.update({
      where: { id: order.userId },
      data: { referralFreeTicketsAvailable: { increment: 1 } },
    });

    await prisma.auditLog.create({
      data: {
        userId: order.userId,
        action: 'REFERRAL_FREE_TICKET_RESTORED',
        entity: 'order',
        entityId: order.id,
        metadata: {
          orderNumber: order.orderNumber,
          reason: 'checkout_expired',
        },
      },
    });
  }

  // Log expiration
  await prisma.auditLog.create({
    data: {
      userId: order.userId,
      action: 'CHECKOUT_EXPIRED',
      entity: 'order',
      entityId: order.id,
      metadata: {
        orderNumber: order.orderNumber,
        stripeSessionId: session.id,
        referralTicketRestored: referralTicketUsed,
      },
    },
  });
}

type ReversalOrder = NonNullable<
  Awaited<ReturnType<typeof prisma.order.findFirst>>
>;

async function findOrderForPaymentIntent(
  paymentIntent: string | Stripe.PaymentIntent | null,
  context: string
): Promise<ReversalOrder | null> {
  const paymentIntentId =
    typeof paymentIntent === 'string' ? paymentIntent : paymentIntent?.id;
  if (!paymentIntentId) return null;

  const order = await prisma.order.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
  });

  if (!order) {
    console.warn(`${context}: no order found for payment_intent ${paymentIntentId}`);
    return null;
  }

  return order;
}

// Full void: flip the order to REFUNDED and pull ALL its tickets out of the draw,
// freeing them back to AVAILABLE so they can be re-sold. Only ever called for a FULL
// money reversal — a full refund or a LOST dispute. Idempotent via the REFUNDED guard.
async function voidOrderAndReleaseTickets(
  order: ReversalOrder,
  action: 'PAYMENT_REFUNDED' | 'PAYMENT_DISPUTE_LOST',
  metadata: Record<string, unknown>
) {
  // Idempotent: a refund followed by a lost dispute (or a webhook retry) must not
  // double-process the release.
  if (order.paymentStatus === 'REFUNDED') return;

  await prisma.$transaction(async (tx) => {
    // Re-assert the guard inside the transaction so two concurrent reversals can't
    // both release tickets.
    const claim = await tx.order.updateMany({
      where: { id: order.id, paymentStatus: { not: 'REFUNDED' } },
      data: { paymentStatus: 'REFUNDED' },
    });
    if (claim.count === 0) return;

    await tx.ticket.updateMany({
      where: { orderId: order.id },
      data: {
        status: 'AVAILABLE',
        userId: null,
        orderId: null,
        isBonus: false,
        reservedUntil: null,
      },
    });

    // If the competition had flipped to SOLD_OUT, reopen it (no-op otherwise).
    const remaining = await tx.ticket.count({
      where: { competitionId: order.competitionId, status: 'AVAILABLE' },
    });
    if (remaining > 0) {
      await tx.competition.updateMany({
        where: { id: order.competitionId, status: 'SOLD_OUT' },
        data: { status: 'ACTIVE' },
      });
    }

    // Claw back the referral reward this order granted, if any. The referee's
    // "first successful purchase" gifted the referrer a free ticket; a full refund /
    // lost dispute means that purchase didn't stick, so reverse it and let the referee
    // re-qualify on a genuine future purchase. Clamp at >= 0 (the referrer may have
    // already spent the free ticket) and clear the marker so it can't reverse twice.
    // Runs inside the same idempotent claim (count===0 returned above), so once only.
    if (order.grantedReferralReward && order.userId) {
      const referee = await tx.user.findUnique({
        where: { id: order.userId },
        select: { referredById: true },
      });
      if (referee?.referredById) {
        await tx.user.updateMany({
          where: { id: referee.referredById, referralFreeTicketsEarned: { gt: 0 } },
          data: { referralFreeTicketsEarned: { decrement: 1 } },
        });
        await tx.user.updateMany({
          where: { id: referee.referredById, referralFreeTicketsAvailable: { gt: 0 } },
          data: { referralFreeTicketsAvailable: { decrement: 1 } },
        });
        await tx.user.update({
          where: { id: order.userId },
          data: { referralRewardGranted: false },
        });
        await tx.auditLog.create({
          data: {
            userId: referee.referredById,
            action: 'REFERRAL_REWARD_REVERSED',
            entity: 'order',
            entityId: order.id,
            metadata: {
              orderNumber: order.orderNumber,
              refereeUserId: order.userId,
              reason: action === 'PAYMENT_DISPUTE_LOST' ? 'dispute_lost' : 'refund',
            },
          },
        });
      }
      await tx.order.update({
        where: { id: order.id },
        data: { grantedReferralReward: false },
      });
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: order.userId,
      action,
      entity: 'order',
      entityId: order.id,
      metadata: { orderNumber: order.orderNumber, ...metadata },
    },
  });
}

// charge.refunded — fires for BOTH full and partial refunds. A FULL refund voids the
// order and releases every ticket. A PARTIAL refund (the webhook itself recommends
// these for per-user-cap overage and under-delivery) must NOT void the order or release
// tickets: the buyer keeps the paid-for entries they still hold, so we only audit-log
// the partial refund for manual review and leave the order/tickets untouched.
async function handleChargeRefunded(charge: Stripe.Charge) {
  const order = await findOrderForPaymentIntent(charge.payment_intent, 'refund');
  if (!order) return;

  const amount = charge.amount;
  const amountRefunded = charge.amount_refunded;
  const isFullRefund = amountRefunded >= amount;

  if (!isFullRefund) {
    // Partial refund: keep the paid entries in the draw. Just record it. Skip if the
    // order is already fully voided (a partial refund after a full reversal is moot).
    if (order.paymentStatus === 'REFUNDED') return;
    await prisma.auditLog.create({
      data: {
        userId: order.userId,
        action: 'PARTIAL_REFUND_RECEIVED',
        entity: 'order',
        entityId: order.id,
        metadata: {
          orderNumber: order.orderNumber,
          paymentIntentId:
            typeof charge.payment_intent === 'string'
              ? charge.payment_intent
              : charge.payment_intent?.id,
          chargeId: charge.id,
          amount,
          amountRefunded,
          currency: charge.currency,
        },
      },
    });
    return;
  }

  await voidOrderAndReleaseTickets(order, 'PAYMENT_REFUNDED', {
    paymentIntentId:
      typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent?.id,
    chargeId: charge.id,
    amount,
    amountRefunded,
    reason: 'refund',
  });
}

// charge.dispute.created — a dispute has just OPENED. Do NOT release tickets or mark the
// order REFUNDED: arbitration hasn't happened yet and we could still win. Just freeze /
// flag the order (audit log) so it can be excluded from the draw / reviewed manually,
// and act for real only on charge.dispute.closed.
async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const order = await findOrderForPaymentIntent(dispute.payment_intent, 'dispute');
  if (!order) return;

  // If the order was already fully voided (e.g. refunded then disputed), nothing to do.
  if (order.paymentStatus === 'REFUNDED') return;

  await prisma.auditLog.create({
    data: {
      userId: order.userId,
      action: 'PAYMENT_DISPUTE_OPENED',
      entity: 'order',
      entityId: order.id,
      metadata: {
        orderNumber: order.orderNumber,
        paymentIntentId:
          typeof dispute.payment_intent === 'string'
            ? dispute.payment_intent
            : dispute.payment_intent?.id,
        disputeId: dispute.id,
        disputeStatus: dispute.status,
        amount: dispute.amount,
        currency: dispute.currency,
        reason: dispute.reason,
      },
    },
  });
}

// charge.dispute.closed — arbitration is over. Only a LOST dispute is a real money
// reversal: void the order and release its tickets. A WON (or warning_closed) dispute
// means we keep the money and the entries stay valid — just clear the freeze via a log.
async function handleDisputeClosed(dispute: Stripe.Dispute) {
  const order = await findOrderForPaymentIntent(dispute.payment_intent, 'dispute');
  if (!order) return;

  const disputeMetadata = {
    paymentIntentId:
      typeof dispute.payment_intent === 'string'
        ? dispute.payment_intent
        : dispute.payment_intent?.id,
    disputeId: dispute.id,
    disputeStatus: dispute.status,
    amount: dispute.amount,
    currency: dispute.currency,
    reason: dispute.reason,
  };

  if (dispute.status === 'lost') {
    await voidOrderAndReleaseTickets(order, 'PAYMENT_DISPUTE_LOST', disputeMetadata);
    return;
  }

  // Won (or otherwise closed without a chargeback): keep the entries in the draw and
  // simply record the resolution so the earlier freeze is cleared on review.
  await prisma.auditLog.create({
    data: {
      userId: order.userId,
      action: 'PAYMENT_DISPUTE_CLOSED',
      entity: 'order',
      entityId: order.id,
      metadata: { orderNumber: order.orderNumber, ...disputeMetadata },
    },
  });
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.orderId;

  if (!orderId) {
    return;
  }

  // Update order with payment intent ID if not already set
  await prisma.order.updateMany({
    where: {
      id: orderId,
      stripePaymentIntentId: null,
    },
    data: {
      stripePaymentIntentId: paymentIntent.id,
    },
  });
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.orderId;

  if (!orderId) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) return;

  // Update order status
  await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: 'FAILED' },
  });

  // Log failure
  await prisma.auditLog.create({
    data: {
      userId: order.userId,
      action: 'PAYMENT_FAILED',
      entity: 'order',
      entityId: order.id,
      metadata: {
        orderNumber: order.orderNumber,
        stripePaymentIntentId: paymentIntent.id,
        error: paymentIntent.last_payment_error?.message,
      },
    },
  });
}
