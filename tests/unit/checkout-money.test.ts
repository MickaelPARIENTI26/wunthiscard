import { describe, it, expect, beforeAll } from 'vitest';
import { calculateBonusTickets as sharedBonus } from '../../packages/shared/src/utils/index';

/**
 * Pure-logic coverage for the money path. The checkout route
 * (apps/web/src/app/api/checkout/create-session/route.ts) calls
 * calculateBonusTickets() from apps/web/src/lib/stripe.ts to decide how many
 * FREE bonus tickets are written into the Stripe session metadata. The webhook
 * then mints exactly that many tickets. So this function is directly on the
 * money/fairness path and must:
 *   1. match the published bonus tiers, and
 *   2. stay in lock-step with the shared implementation used by the UI, or the
 *      price the buyer sees diverges from the entries they receive.
 *
 * lib/stripe.ts throws at import time unless STRIPE_SECRET_KEY is set, and
 * constructs a Stripe client — but the constructor makes no network call, so a
 * dummy key lets us import the real module with NO mocking.
 *
 * NOTE (follow-up): the full Stripe webhook handler
 * (api/webhooks/stripe/route.ts) is intentionally NOT covered here — it needs
 * Prisma + Stripe signature verification mocks. That belongs in an integration
 * test against a test DB, not a faked unit test.
 */

let calculateBonusTickets: (quantity: number) => number;
let generateOrderNumber: () => string;

beforeAll(async () => {
  process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_for_unit';
  const mod = await import('../../apps/web/src/lib/stripe');
  calculateBonusTickets = mod.calculateBonusTickets;
  generateOrderNumber = mod.generateOrderNumber;
});

describe('Money path · lib/stripe calculateBonusTickets', () => {
  it('awards no bonus below the first tier', () => {
    expect(calculateBonusTickets(0)).toBe(0);
    expect(calculateBonusTickets(1)).toBe(0);
    expect(calculateBonusTickets(9)).toBe(0);
  });

  it('applies each tier at its threshold', () => {
    expect(calculateBonusTickets(10)).toBe(1);
    expect(calculateBonusTickets(15)).toBe(2);
    expect(calculateBonusTickets(20)).toBe(3);
    expect(calculateBonusTickets(25)).toBe(4);
    expect(calculateBonusTickets(50)).toBe(9);
    expect(calculateBonusTickets(100)).toBe(20);
  });

  it('does not promote between thresholds', () => {
    expect(calculateBonusTickets(14)).toBe(1);
    expect(calculateBonusTickets(19)).toBe(2);
    expect(calculateBonusTickets(24)).toBe(3);
    expect(calculateBonusTickets(49)).toBe(4);
    expect(calculateBonusTickets(99)).toBe(9);
  });

  it('caps at the top tier above 100', () => {
    expect(calculateBonusTickets(150)).toBe(20);
  });

  it('agrees with the shared (UI) implementation at every boundary', () => {
    for (const q of [0, 1, 9, 10, 14, 15, 19, 20, 24, 25, 49, 50, 99, 100, 150]) {
      expect(calculateBonusTickets(q)).toBe(sharedBonus(q));
    }
  });
});

describe('Money path · lib/stripe generateOrderNumber', () => {
  it('matches the WTC-YYYYMMDD-XXXXXXXX format', () => {
    expect(generateOrderNumber()).toMatch(/^WTC-\d{8}-[0-9A-F]{8}$/);
  });

  it('produces unique values across many calls', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      seen.add(generateOrderNumber());
    }
    // 8 hex chars from a CSPRNG => collisions across 1k draws are astronomically
    // unlikely; any repeat would signal a broken randomness source.
    expect(seen.size).toBe(1000);
  });
});
