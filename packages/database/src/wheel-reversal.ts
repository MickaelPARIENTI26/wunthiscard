import type { Prisma } from '@prisma/client';

/**
 * Taking wheel rewards back when the money goes back.
 *
 * A spin is earned by a PAID ticket. If the payment is reversed the entitlement
 * has to go with it, or the cheapest attack in the product is: buy tickets, spin
 * until the graded card lands, charge back, keep the card.
 *
 * This lives in @winucard/database because the two callers are in different
 * apps (the Stripe webhook in apps/web, competition cancellation in apps/admin)
 * and cannot import each other. A second copy is exactly the failure this is
 * meant to prevent — one copy gets fixed, the other quietly does not.
 *
 * ANY code that writes Order.paymentStatus = 'REFUNDED' must call this.
 */

export const REVERSAL_REASONS = ['REFUND', 'DISPUTE_LOST', 'COMPETITION_CANCELLED'] as const;
export type ReversalReason = (typeof REVERSAL_REASONS)[number];

export interface ReverseWheelRewardsInput {
  orderId: string;
  orderNumber: string;
  userId: string | null;
  reason: ReversalReason;
}

export interface ReverseWheelRewardsResult {
  spinsReversed: number;
  unspunReversed: number;
  codesVoided: string[];
  /** Codes already spent on another order — the discount is out the door. */
  codesAlreadySpent: { code: string; percentOff: number; redeemedOrderId: string | null }[];
  /** Codes kept alive because WE cancelled the competition, not the customer. */
  codesKept: string[];
  jackpotsFrozen: { spinId: string; status: string; prizeValue: string | null }[];
}

/**
 * Reverse every wheel reward an order produced.
 *
 * MUST be called inside the same transaction that flips the order to REFUNDED,
 * after that flip's guarded claim has succeeded. It contains no email, no Stripe
 * call and no revalidate — the caller owns those, outside the transaction.
 */
export async function reverseWheelRewardsForOrder(
  tx: Prisma.TransactionClient,
  { orderId, orderNumber, userId, reason }: ReverseWheelRewardsInput
): Promise<ReverseWheelRewardsResult> {
  const now = new Date();

  // Step one is the lock, not just bookkeeping. Under READ COMMITTED this UPDATE
  // takes a row lock on every spin of the order and holds it for the rest of the
  // transaction. A spinWheel() transaction that claimed a spin microseconds ago
  // blocks us here and we re-evaluate — so by the time we read below, its commit
  // (including the PromoCode and JackpotWin it created in the same transaction)
  // is visible. Reading first would see the spin as unspun and miss both.
  const marked = await tx.wheelSpin.updateMany({
    where: { orderId, reversedAt: null },
    data: { reversedAt: now, reversalReason: reason },
  });

  const spins = await tx.wheelSpin.findMany({
    where: { orderId },
    select: {
      id: true,
      spunAt: true,
      promoCode: { select: { id: true, code: true, percentOff: true, redeemedAt: true, redeemedOrderId: true, voidedAt: true } },
      jackpotWin: { select: { id: true, status: true, prizeValue: true, paymentReversedAt: true } },
    },
  });

  const unspunReversed = spins.filter((s) => !s.spunAt).length;

  const result: ReverseWheelRewardsResult = {
    spinsReversed: marked.count,
    unspunReversed,
    codesVoided: [],
    codesAlreadySpent: [],
    codesKept: [],
    jackpotsFrozen: [],
  };

  // A cancelled competition is OUR doing, not the customer's. They keep any code
  // they won on it — killing it would punish them for our decision. A refund or a
  // chargeback is the opposite case: the ticket that earned the code was unpaid.
  const keepCodes = reason === 'COMPETITION_CANCELLED';

  for (const spin of spins) {
    const promo = spin.promoCode;
    if (promo) {
      if (promo.redeemedAt) {
        // Already spent on a different order that we are not unwinding. Void it
        // anyway so nothing can ever put it back in circulation, but never clear
        // redeemedAt — that order was really discounted, and this is the record
        // of leakage finance needs to see.
        result.codesAlreadySpent.push({
          code: promo.code,
          percentOff: promo.percentOff,
          redeemedOrderId: promo.redeemedOrderId,
        });
      } else if (keepCodes) {
        result.codesKept.push(promo.code);
      } else {
        result.codesVoided.push(promo.code);
      }
    }

    const jackpot = spin.jackpotWin;
    if (jackpot && !jackpot.paymentReversedAt) {
      result.jackpotsFrozen.push({
        spinId: spin.id,
        status: jackpot.status,
        prizeValue: jackpot.prizeValue ? jackpot.prizeValue.toString() : null,
      });
    }
  }

  if (!keepCodes) {
    // Guarded on voidedAt so a second reversal cannot restamp, and on the ids we
    // actually inspected above.
    const toVoid = spins
      .filter((s) => s.promoCode && !s.promoCode.voidedAt)
      .map((s) => s.promoCode!.id);
    if (toVoid.length > 0) {
      await tx.promoCode.updateMany({
        where: { id: { in: toVoid }, voidedAt: null },
        data: { voidedAt: now, voidReason: reason },
      });
    }
  }

  if (result.jackpotsFrozen.length > 0) {
    // FREEZE, never decide. `status` is untouched: a real graded card, possibly
    // already posted, is a recovery job for a human — not a database update.
    await tx.jackpotWin.updateMany({
      where: { spinId: { in: result.jackpotsFrozen.map((j) => j.spinId) }, paymentReversedAt: null },
      data: { paymentReversedAt: now, paymentReversedReason: reason },
    });
  }

  // Free the ticket link so a re-sold ticket can earn a spin for its next buyer.
  // WheelSpin.ticketId is @unique, and the reversal releases the tickets back to
  // AVAILABLE — without this the next purchase of ticket #42 silently mints no
  // spin, because skipDuplicates in grantSpinsForOrder swallows the collision.
  if (marked.count > 0) {
    await tx.wheelSpin.updateMany({ where: { orderId }, data: { ticketId: null } });
  }

  // The pool token is NOT given back. WheelSlot.quantityWon is monotonic on
  // purpose: JACKPOT is one physical card, and re-opening that slot while the
  // card is not back in the building means owing a second one that does not
  // exist. Restocking is an admin raising quantityConfigured, with the card in
  // hand. The admin wheel card surfaces the reversed count so they can.

  if (marked.count > 0) {
    await tx.auditLog.create({
      data: {
        userId,
        action: 'WHEEL_REWARDS_REVERSED',
        entity: 'order',
        entityId: orderId,
        metadata: {
          orderNumber,
          reason,
          spinsReversed: result.spinsReversed,
          unspunReversed: result.unspunReversed,
          codesVoided: result.codesVoided,
          codesKept: result.codesKept,
          codesAlreadySpent: result.codesAlreadySpent,
          jackpotsFrozen: result.jackpotsFrozen,
        },
      },
    });
  }

  return result;
}
