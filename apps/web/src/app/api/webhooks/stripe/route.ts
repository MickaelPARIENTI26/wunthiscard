import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { releaseTicketsFromRedis, clearQcmPassed } from '@/lib/redis';
import { sendPurchaseConfirmationEmail, sendReferralRewardEmail } from '@/lib/email';

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
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
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
        await handleChargeReversed(charge.payment_intent, 'refund');
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        await handleChargeReversed(dispute.payment_intent, 'dispute');
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

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    console.error('No orderId in session metadata');
    return;
  }

  // Get order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      competition: true,
    },
  });

  if (!order) {
    console.error('Order not found:', orderId);
    return;
  }

  // Verify Stripe actually charged what this order should cost. amount_total is in
  // pence; order.totalAmount is GBP. A mismatch means tampering or an amount/line-item
  // divergence — fail closed (don't hand out tickets) and record it for review.
  const expectedPence = Math.round(
    (typeof order.totalAmount === 'object' && 'toNumber' in order.totalAmount
      ? (order.totalAmount as { toNumber: () => number }).toNumber()
      : Number(order.totalAmount)) * 100
  );
  if (
    typeof session.amount_total === 'number' &&
    (session.amount_total !== expectedPence || (session.currency ?? 'gbp').toLowerCase() !== 'gbp')
  ) {
    console.error('Payment amount mismatch — refusing to fulfil order', {
      orderId,
      expectedPence,
      chargedPence: session.amount_total,
      currency: session.currency,
    });
    await prisma.auditLog.create({
      data: {
        userId: order.userId,
        action: 'PAYMENT_AMOUNT_MISMATCH',
        entity: 'order',
        entityId: order.id,
        metadata: {
          expectedPence,
          chargedPence: session.amount_total,
          currency: session.currency,
        },
      },
    });
    return;
  }

  const ticketNumbers = JSON.parse(session.metadata?.ticketNumbers || '[]') as number[];
  const bonusTickets = parseInt(session.metadata?.bonusTickets || '0', 10);

  // Start a transaction to update order and assign tickets
  // Using a transaction with the idempotency check INSIDE to prevent race conditions
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
    const updatedOrder = await tx.order.update({
      where: {
        id: orderId,
        paymentStatus: { not: 'SUCCEEDED' }, // Extra safety
      },
      data: {
        paymentStatus: 'SUCCEEDED',
        stripePaymentIntentId: session.payment_intent as string,
      },
    });

    if (!updatedOrder) {
      return { alreadyProcessed: true };
    }

    // Assign paid tickets to user - only update RESERVED tickets belonging to this user
    const ticketUpdateResult = await tx.ticket.updateMany({
      where: {
        competitionId: order.competitionId,
        ticketNumber: { in: ticketNumbers },
        status: 'RESERVED',
        userId: order.userId, // Only update tickets reserved by this user
      },
      data: {
        orderId: order.id,
        status: 'SOLD',
        reservedUntil: null,
      },
    });

    // Make the buyer whole if any of their reserved numbers were lost (e.g. the
    // hold lapsed and another buyer took them): assign the shortfall from genuinely
    // AVAILABLE tickets, inside this transaction. They paid for N tickets and must
    // receive N. The extended checkout-window hold makes this path rare, but we must
    // never silently under-deliver a paid order.
    let assignedPaidCount = ticketUpdateResult.count;
    if (assignedPaidCount < ticketNumbers.length) {
      const shortfall = ticketNumbers.length - assignedPaidCount;
      const replacements = await tx.ticket.findMany({
        where: {
          competitionId: order.competitionId,
          status: 'AVAILABLE',
          ticketNumber: { notIn: ticketNumbers },
        },
        take: shortfall,
        orderBy: { ticketNumber: 'asc' },
        select: { ticketNumber: true },
      });
      if (replacements.length > 0) {
        const replacementNumbers = replacements.map((t) => t.ticketNumber);
        const repResult = await tx.ticket.updateMany({
          where: {
            competitionId: order.competitionId,
            ticketNumber: { in: replacementNumbers },
            status: 'AVAILABLE', // re-check inside the tx to avoid a race
          },
          data: {
            orderId: order.id,
            userId: order.userId,
            status: 'SOLD',
            reservedUntil: null,
          },
        });
        assignedPaidCount += repResult.count;
      }
      if (assignedPaidCount < ticketNumbers.length) {
        // Still short → the competition is genuinely out of tickets. The payment
        // already succeeded, so we don't fail the webhook; flag loudly for a manual
        // refund of the difference. Should be near-impossible with the extended hold.
        console.error(
          `UNDER-DELIVERY order=${order.id}: paid for ${ticketNumbers.length} tickets, only ${assignedPaidCount} assignable — manual refund of the difference required.`
        );
      }
    }

    // Assign bonus tickets if any
    if (bonusTickets > 0) {
      // Find available tickets for bonus
      const availableTickets = await tx.ticket.findMany({
        where: {
          competitionId: order.competitionId,
          status: 'AVAILABLE',
          ticketNumber: { notIn: ticketNumbers },
        },
        take: bonusTickets,
        orderBy: {
          ticketNumber: 'asc', // Give lowest available numbers as bonus
        },
      });

      if (availableTickets.length > 0) {
        const bonusTicketNumbers = availableTickets.map((t) => t.ticketNumber);

        // Use status check to prevent race conditions with concurrent bonus assignments
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

  // Check if order was already processed
  if (transactionResult.alreadyProcessed) {
    return;
  }

  // Release Redis reservation (cleanup only). This must NEVER throw out of the
  // handler: a Redis hiccup here used to abort the whole function, and Stripe's
  // retry would then early-return on 'alreadyProcessed' — permanently losing the
  // purchase-confirmation email and the success audit log below.
  if (order.userId) {
    try {
      await releaseTicketsFromRedis(order.competitionId, order.userId);
      // Consume the skill-question pass so the next purchase requires answering
      // again (per-purchase entry, not reusable for the whole 1h window).
      await clearQcmPassed(order.competitionId, order.userId);
    } catch (releaseError) {
      console.error('Redis cleanup failed after payment (non-blocking):', releaseError);
    }
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
        stripeSessionId: session.id,
        amount: session.amount_total,
      },
    },
  });

  // Get the final ticket numbers including bonuses
  const finalTickets = await prisma.ticket.findMany({
    where: {
      orderId: order.id,
    },
    select: {
      ticketNumber: true,
      isBonus: true,
    },
    orderBy: {
      ticketNumber: 'asc',
    },
  });

  const paidTicketNumbers = finalTickets
    .filter((t) => !t.isBonus)
    .map((t) => t.ticketNumber);
  const bonusTicketNumbers = finalTickets
    .filter((t) => t.isBonus)
    .map((t) => t.ticketNumber);

  const totalAmount =
    typeof order.totalAmount === 'object' && 'toNumber' in order.totalAmount
      ? (order.totalAmount as { toNumber: () => number }).toNumber()
      : Number(order.totalAmount);

  // Send confirmation email (only if user exists)
  if (order.user) {
    await sendPurchaseConfirmationEmail(order.user.email, order.user.firstName, {
      orderNumber: order.orderNumber,
      competitionTitle: order.competition.title,
      ticketNumbers: paidTicketNumbers,
      bonusTicketNumbers,
      totalAmount,
      drawDate: order.competition.drawDate,
    });
  }

  // Redeem the buyer's free referral ticket, if one was applied at checkout.
  // Runs once per order (the transaction above returns early on webhook retries),
  // and is guarded so the counter can never go negative. Non-blocking.
  if (session.metadata?.referralTicketUsed === '1' && order.userId) {
    try {
      const redeemed = await prisma.user.updateMany({
        where: { id: order.userId, referralFreeTicketsAvailable: { gt: 0 } },
        data: { referralFreeTicketsAvailable: { decrement: 1 } },
      });

      if (redeemed.count > 0) {
        await prisma.auditLog.create({
          data: {
            userId: order.userId,
            action: 'REFERRAL_FREE_TICKET_REDEEMED',
            entity: 'order',
            entityId: order.id,
            metadata: {
              orderNumber: order.orderNumber,
              competitionId: order.competitionId,
            },
          },
        });
      } else {
        console.warn(
          `Referral ticket flagged used for order ${order.id} but buyer had none available`
        );
      }
    } catch (redeemError) {
      console.error('Referral ticket redemption failed (non-blocking):', redeemError);
    }
  }

  // Referral reward — each referred user grants their referrer ONE free ticket,
  // exactly once, on that referee's FIRST successful purchase. After that, this
  // referee can never increment the referrer again, no matter how much they buy.
  // Runs after payment is confirmed, outside the main transaction; a failure here
  // must never block payment confirmation.
  if (order.userId) {
    try {
      const buyer = await prisma.user.findUnique({
        where: { id: order.userId },
        select: { referredById: true },
      });

      if (buyer?.referredById) {
        // Atomically claim this referee's one-time reward. updateMany returns
        // count 0 if the flag was already set (a prior purchase, or a webhook
        // retry), guaranteeing the referrer is rewarded exactly once per referee.
        const claimed = await prisma.user.updateMany({
          where: { id: order.userId, referralRewardGranted: false },
          data: { referralRewardGranted: true },
        });

        if (claimed.count > 0) {
          const referrer = await prisma.user.update({
            where: { id: buyer.referredById },
            data: {
              referralFreeTicketsEarned: { increment: 1 },
              referralFreeTicketsAvailable: { increment: 1 },
            },
            select: { email: true, firstName: true, referralFreeTicketsAvailable: true },
          });

          await prisma.auditLog.create({
            data: {
              userId: buyer.referredById,
              action: 'REFERRAL_BONUS_EARNED',
              entity: 'user',
              entityId: buyer.referredById,
              metadata: {
                freeTicketsAwarded: 1,
                refereeUserId: order.userId,
                trigger: 'referee_first_purchase',
              },
            },
          });

          // Notify the referrer about their earned free ticket (best-effort —
          // an email failure must never break the reward or the webhook).
          try {
            await sendReferralRewardEmail(
              referrer.email,
              referrer.firstName,
              referrer.referralFreeTicketsAvailable
            );
          } catch (emailError) {
            console.error('Referral reward email failed (non-blocking):', emailError);
          }
        }
      }
    } catch (referralError) {
      console.error('Referral reward failed (non-blocking):', referralError);
    }
  }
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;

  if (!orderId) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) return;

  // Update order status to cancelled
  await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: 'CANCELLED' },
  });

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
      },
    },
  });
}

async function handleChargeReversed(
  paymentIntent: string | Stripe.PaymentIntent | null,
  reason: 'refund' | 'dispute'
) {
  const paymentIntentId =
    typeof paymentIntent === 'string' ? paymentIntent : paymentIntent?.id;
  if (!paymentIntentId) return;

  const order = await prisma.order.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
  });

  if (!order) {
    console.warn(`${reason}: no order found for payment_intent ${paymentIntentId}`);
    return;
  }

  // Idempotent: a refund followed by a dispute (or a webhook retry) must not
  // double-process.
  if (order.paymentStatus === 'REFUNDED') return;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'REFUNDED' },
    });

    // Pull the order's tickets out of the draw — a refunded/disputed entry must no
    // longer be a valid entry. Freed back to AVAILABLE so they can be re-sold.
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
  });

  await prisma.auditLog.create({
    data: {
      userId: order.userId,
      action: reason === 'dispute' ? 'PAYMENT_DISPUTED' : 'PAYMENT_REFUNDED',
      entity: 'order',
      entityId: order.id,
      metadata: { orderNumber: order.orderNumber, paymentIntentId, reason },
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
