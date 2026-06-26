import type Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { releaseTicketsFromRedis, clearQcmPassed } from '@/lib/redis';
import { sendPurchaseConfirmationEmail, sendReferralRewardEmail } from '@/lib/email';

/**
 * Fulfil a completed Stripe Checkout session: flip the order to SUCCEEDED, assign
 * paid + bonus tickets, flip the competition to SOLD_OUT if needed, clean up Redis,
 * send the confirmation email and grant the referral reward.
 *
 * This is the SINGLE source of fulfilment, shared by the Stripe webhook AND the
 * checkout success page. It is fully idempotent: the in-transaction updateMany claim
 * (guarded on paymentStatus != 'SUCCEEDED') makes a webhook+success-page race safe —
 * whoever loses the claim returns early and does nothing.
 */
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
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

  // PROOF OF PAYMENT — fail closed unless Stripe says the session is actually paid.
  // This MUST come before fulfilment: an 'open'/'unpaid' Checkout Session already
  // carries amount_total + currency, so the amount guard below is NOT sufficient on
  // its own. The success page fulfils any not-yet-SUCCEEDED order the viewer owns, so
  // without this a user could create a session, skip paying, hit /checkout/success,
  // and receive tickets for free. payment_status is Stripe's documented signal for
  // "safe to fulfil"; 'no_payment_required' covers genuinely zero-cost sessions.
  if (
    session.payment_status !== 'paid' &&
    session.payment_status !== 'no_payment_required'
  ) {
    console.error('Refusing to fulfil order — payment not completed', {
      orderId,
      paymentStatus: session.payment_status,
      sessionStatus: session.status,
    });
    await prisma.auditLog.create({
      data: {
        userId: order.userId,
        action: 'FULFILMENT_BLOCKED_UNPAID',
        entity: 'order',
        entityId: order.id,
        metadata: {
          paymentStatus: session.payment_status ?? null,
          sessionStatus: session.status ?? null,
        },
      },
    });
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
