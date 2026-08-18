import { describe, it, expect } from 'vitest';
import { applyPercentDiscount } from '../../packages/shared/src/utils/wheel';

/**
 * These exist because of one specific failure: Stripe computes amount_total as
 * unit_amount x quantity, and fulfilment refuses the order if that does not
 * match the stored total exactly. A penny of rounding drift means the customer
 * pays and receives nothing.
 */
describe('applyPercentDiscount', () => {
  it('discounts the total, not each ticket', () => {
    // 10 x £2.99 = £29.90, less 10% = £26.91.
    const r = applyPercentDiscount(299, 10, 10);
    expect(r.subtotalPence).toBe(2990);
    expect(r.discountPence).toBe(299);
    expect(r.discountedPence).toBe(2691);
  });

  it('is a penny apart from the naive per-unit calculation', () => {
    // The bug this guards: rounding £2.691 to 269p and multiplying gives 2690.
    const perUnit = Math.round(299 * 0.9) * 10;
    const correct = applyPercentDiscount(299, 10, 10).discountedPence;
    expect(perUnit).toBe(2690);
    expect(correct).toBe(2691);
    expect(correct - perUnit).toBe(1);
  });

  it('never charges more than the advertised percentage', () => {
    // 5% of 3 x £4.99 = £0.74850 — rounded down, so the buyer gains the half penny.
    const r = applyPercentDiscount(499, 3, 5);
    expect(r.subtotalPence).toBe(1497);
    expect(r.discountPence).toBe(74);
    expect(r.discountedPence).toBe(1423);
  });

  it('keeps the arithmetic exact — no floating point residue', () => {
    for (const price of [299, 499, 999, 1250]) {
      for (const qty of [1, 3, 7, 10, 25, 50, 100]) {
        for (const pct of [5, 10]) {
          const r = applyPercentDiscount(price, qty, pct);
          expect(Number.isInteger(r.discountedPence)).toBe(true);
          expect(r.discountedPence + r.discountPence).toBe(r.subtotalPence);
          expect(r.discountedPence).toBeGreaterThan(0);
        }
      }
    }
  });

  it('handles a single ticket', () => {
    expect(applyPercentDiscount(299, 1, 10).discountedPence).toBe(270);
    expect(applyPercentDiscount(299, 1, 5).discountedPence).toBe(285);
  });
});
