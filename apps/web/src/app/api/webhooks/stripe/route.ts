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
    // Flip the order to SUCCEEDED atomically AND claim idempotency in one statement.
    // updateMany (not update) is deliberate: update() throws P2025 when no row matches
    // its where clause, so a duplicate/retried webhook delivery (order already SUCCEEDED)
    // would throw → 500 → Stripe retries forever. updateMany returns { count } and never
    // throws on no-match, so count === 0 means "already processed" → return 200 quietly.
    const claim = await tx.order.updateMany({
      where: {
        id: orderId,
        paymentStatus: { not: 'SUCCEEDED' },
      },
      data: {
        paymentStatus: 'SUCCEEDED',
        stripePaymentIntentId: session.payment_intent as string,
      },
    });

    if (claim.count === 0) {
      return { alreadyProcessed: true };
    }

    // Defensive per-user cap (issue #B). maxTicketsPerUser is enforced at
    // reserve/create-session against the SOLD count, but two concurrent Checkout
    // sessions can each pass that check and then both convert to SOLD here, letting
    // one user exceed the competition cap. Re-check at the point of SOLD conversion:
    // count the user's tickets ALREADY SOLD for this competition (prior orders — this
    // order's tickets are still RESERVED), and cap the numbers we assign to what's left
    // of their allowance. The common case (within cap) leaves `ticketNumbers` untouched.
    let paidTicketsToAssign = ticketNumbers;
    if (order.userId) {
      const alreadySold = await tx.ticket.count({
        where: {
          competitionId: order.competitionId,
          userId: order.userId,
          status: 'SOLD',
        },
      });
      const remainingAllowance = Math.max(
        0,
        order.competition.maxTicketsPerUser - alreadySold
      );
      if (ticketNumbers.length > remainingAllowance) {
        paidTicketsToAssign = ticketNumbers.slice(0, remainingAllowance);
        // Don't fail the payment — flag the overage for a manual refund/review. This
        // should be rare and only happens under concurrent checkout for the same user.
        console.error(
          `PER-USER-CAP order=${order.id} user=${order.userId} comp=${order.competitionId}: ` +
            `paid for ${ticketNumbers.length} tickets but only ${remainingAllowance} within the ` +
            `per-user cap of ${order.competition.maxTicketsPerUser} (already sold ${alreadySold}); ` +
            `assigning ${paidTicketsToAssign.length}, ${ticketNumbers.length - paidTicketsToAssign.length} over-cap — ` +
            `manual refund of the difference required.`
        );
      }
    }

    // Assign paid tickets to user - only update RESERVED tickets belonging to this user
    const ticketUpdateResult = await tx.ticket.updateMany({
      where: {
        competitionId: order.competitionId,
        ticketNumber: { in: paidTicketsToAssign },
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
    if (assignedPaidCount < paidTicketsToAssign.length) {
      const shortfall = paidTicketsToAssign.length - assignedPaidCount;
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
      if (assignedPaidCount < paidTicketsToAssign.length) {
        // Still short → the competition is genuinely out of tickets. The payment
        // already succeeded, so we don't fail the webhook; flag loudly for a manual
        // refund of the difference. Should be near-impossible with the extended hold.
        console.error(
          `UNDER-DELIVERY order=${order.id}: paid for ${paidTicketsToAssign.length} tickets, only ${assignedPaidCount} assignable — manual refund of the difference required.`
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

  // NOTE: the buyer's free referral ticket is reserved ATOMICALLY at checkout-session
  // creation (create-session decrements referralFreeTicketsAvailable before opening the
  // Stripe session, so concurrent sessions can't all redeem the same free ticket). It is
  // therefore NOT decremented again here — doing so would double-charge the counter and
  // could push it negative on a partial purchase. Explicit cancellation re-credits it
  // (see /checkout/cancel). Record the redemption for audit, once per order.
  if (session.metadata?.referralTicketUsed === '1' && order.userId) {
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
