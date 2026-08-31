import { prisma } from '@/lib/db';

/**
 * Promo-code validation and reservation.
 *
 * A code is reserved when the Stripe session is created, not when payment
 * succeeds — otherwise two tabs, or a retried checkout, both spend the same
 * code. This mirrors how the referral free ticket is already handled in
 * create-session, including putting it back when Stripe refuses the session.
 */

export type PromoFailure =
  | 'NOT_FOUND'
  | 'NOT_YOURS'
  | 'ALREADY_USED'
  | 'VOIDED'
  | 'EXPIRED';

export interface ValidPromo {
  id: string;
  code: string;
  percentOff: number;
}

export type PromoLookup =
  | { ok: true; promo: ValidPromo }
  | { ok: false; reason: PromoFailure };

/** Read-only check, for showing the discount before the customer commits. */
export async function lookupPromoCode(rawCode: string, userId: string): Promise<PromoLookup> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, reason: 'NOT_FOUND' };

  const promo = await prisma.promoCode.findUnique({
    where: { code },
    select: {
      id: true, code: true, userId: true, percentOff: true,
      redeemedAt: true, expiresAt: true, voidedAt: true,
    },
  });

  if (!promo) return { ok: false, reason: 'NOT_FOUND' };
  // Codes are won, not shared: someone else's code reads as "not yours" rather
  // than "doesn't exist", because it plainly does exist to them.
  if (promo.userId !== userId) return { ok: false, reason: 'NOT_YOURS' };
  if (promo.redeemedAt) return { ok: false, reason: 'ALREADY_USED' };
  // Checked before expiry: "cancelled" and "expired" are different things to be
  // told, and only one of them is our doing.
  if (promo.voidedAt) return { ok: false, reason: 'VOIDED' };
  if (promo.expiresAt.getTime() <= Date.now()) return { ok: false, reason: 'EXPIRED' };

  return { ok: true, promo: { id: promo.id, code: promo.code, percentOff: promo.percentOff } };
}

/**
 * Claim the code for an order. Guarded on redeemedAt IS NULL, so of two
 * concurrent checkouts exactly one wins and the other is told it is used.
 */
export async function reservePromoCode(
  promoId: string,
  userId: string,
  orderId: string
): Promise<boolean> {
  const { count } = await prisma.promoCode.updateMany({
    // voidedAt is the load-bearing guard here — lookupPromoCode is advisory UI,
    // this is the statement that actually spends the code.
    where: { id: promoId, userId, redeemedAt: null, voidedAt: null, expiresAt: { gt: new Date() } },
    data: { redeemedAt: new Date(), redeemedOrderId: orderId },
  });
  return count === 1;
}

/**
 * Hand the code back when the checkout never happened — a Stripe failure, or a
 * session the customer let expire. Deliberately NOT called on refunds: a
 * refunded order returns the money, it should not also return the discount.
 */
export async function releasePromoCode(promoId: string): Promise<void> {
  // Never resurrect a voided code: it was killed because the order that earned
  // it was refunded, and handing it back on an unrelated failed checkout would
  // put it straight back in the fraudster's hands.
  await prisma.promoCode.updateMany({
    where: { id: promoId, voidedAt: null },
    data: { redeemedAt: null, redeemedOrderId: null },
  });
}
