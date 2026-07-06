import { describe, it, expect } from 'vitest';
import {
  isRecoverableCartAge,
  cartRecoveryWindow,
  CART_RECOVERY_MIN_AGE_HOURS,
  CART_RECOVERY_MAX_AGE_DAYS,
} from '@/lib/cart-recovery';

/**
 * The abandoned-cart cron (apps/web/src/app/api/cron/cart-recovery) uses these pure
 * helpers to pick which PENDING/CANCELLED orders to nudge: old enough that the user
 * has clearly left, recent enough to still be worth recovering.
 */
describe('cart-recovery window', () => {
  const now = new Date('2026-07-06T12:00:00.000Z');
  const H = 3600 * 1000;
  const D = 24 * H;

  it('excludes a cart abandoned just now (still in grace period)', () => {
    expect(isRecoverableCartAge(new Date(now.getTime() - 30 * 60 * 1000), now)).toBe(false);
  });

  it('excludes a cart younger than the min age', () => {
    const tooFresh = new Date(now.getTime() - (CART_RECOVERY_MIN_AGE_HOURS - 1) * H);
    expect(isRecoverableCartAge(tooFresh, now)).toBe(false);
  });

  it('includes a cart just past the min age', () => {
    const justRight = new Date(now.getTime() - (CART_RECOVERY_MIN_AGE_HOURS + 1) * H);
    expect(isRecoverableCartAge(justRight, now)).toBe(true);
  });

  it('includes a cart a few days old', () => {
    expect(isRecoverableCartAge(new Date(now.getTime() - 3 * D), now)).toBe(true);
  });

  it('excludes a cart older than the max age', () => {
    const tooOld = new Date(now.getTime() - (CART_RECOVERY_MAX_AGE_DAYS + 1) * D);
    expect(isRecoverableCartAge(tooOld, now)).toBe(false);
  });

  it('window spans (now - max age) → (now - min age)', () => {
    const { from, to } = cartRecoveryWindow(now);
    expect(from.getTime()).toBe(now.getTime() - CART_RECOVERY_MAX_AGE_DAYS * D);
    expect(to.getTime()).toBe(now.getTime() - CART_RECOVERY_MIN_AGE_HOURS * H);
  });
});
