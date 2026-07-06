// Abandoned-cart recovery window.
// Lower bound: leave a grace period after checkout starts before nudging — the user
// may still be on Stripe's payment page. Upper bound: don't chase stale carts.
export const CART_RECOVERY_MIN_AGE_HOURS = 2;
export const CART_RECOVERY_MAX_AGE_DAYS = 7;

export function cartRecoveryWindow(now: Date): { from: Date; to: Date } {
  return {
    // `from` is the OLDEST createdAt we still recover (now - max age).
    from: new Date(now.getTime() - CART_RECOVERY_MAX_AGE_DAYS * 24 * 3600 * 1000),
    // `to` is the NEWEST createdAt we recover (now - min age).
    to: new Date(now.getTime() - CART_RECOVERY_MIN_AGE_HOURS * 3600 * 1000),
  };
}

// An abandoned order is recoverable when it was created inside the window:
// old enough that the user has clearly left, recent enough to still be worth it.
export function isRecoverableCartAge(createdAt: Date, now: Date): boolean {
  const { from, to } = cartRecoveryWindow(now);
  const t = createdAt.getTime();
  return t >= from.getTime() && t <= to.getTime();
}
