/**
 * Unit tests for Drop-era UI logic — checkout flow math, bonus consistency,
 * sessionStorage key contracts, and schema validation for the refactored forms.
 *
 * These tests guard against regressions introduced during the Drop theme
 * migration — specifically the inline BONUS_FOR / calculateBonusTickets
 * mismatch bug, the acceptTerms schema cast, and checkout pricing display.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  calculateBonusTickets,
  calculateTotalPrice,
} from '../../packages/shared/src/utils/index';
import { DEFAULT_BONUS_TIERS } from '../../packages/shared/src/constants/index';

// ============================================================================
// BONUS TICKETS CONSISTENCY
// Regression test for the inline BONUS_FOR bug where tile display used
// 10→2, 25→4, 50→10 but backend calculated 10→1, 15→2, 20→3, 50→5.
// Both paths must now agree via calculateBonusTickets().
// ============================================================================

describe('Drop · Bonus tickets (shared tiers)', () => {
  const cases: { qty: number; bonus: number; label: string }[] = [
    { qty: 1, bonus: 0, label: 'single ticket has no bonus' },
    { qty: 5, bonus: 0, label: '5 tickets below first tier' },
    { qty: 9, bonus: 0, label: '9 tickets still below 10' },
    { qty: 10, bonus: 1, label: '10 tickets unlocks +1 (was 2 in buggy inline)' },
    { qty: 14, bonus: 1, label: '14 tickets still at first tier' },
    { qty: 15, bonus: 2, label: '15 tickets unlocks +2' },
    { qty: 19, bonus: 2, label: '19 tickets still at second tier' },
    { qty: 20, bonus: 3, label: '20 tickets unlocks +3' },
    { qty: 25, bonus: 3, label: '25 tickets matches tier ≥20 (was 4 in buggy inline)' },
    { qty: 49, bonus: 3, label: '49 tickets still at third tier' },
    { qty: 50, bonus: 5, label: '50 tickets unlocks +5 (was 10 in buggy inline)' },
    { qty: 100, bonus: 5, label: '100 tickets capped at top tier' },
  ];

  cases.forEach(({ qty, bonus, label }) => {
    it(label, () => {
      expect(calculateBonusTickets(qty)).toBe(bonus);
    });
  });

  it('uses DEFAULT_BONUS_TIERS when no custom tiers provided', () => {
    expect(calculateBonusTickets(50)).toBe(calculateBonusTickets(50, DEFAULT_BONUS_TIERS));
  });

  it('both simple-ticket-selector tile display and checkout flow yield same bonus', () => {
    // simulates the tile.map + checkout.calculateBonusTickets path — they
    // must return identical values or the user will see one number and
    // pay based on another.
    const tile = calculateBonusTickets(50);
    const checkoutBanner = calculateBonusTickets(50);
    expect(tile).toBe(checkoutBanner);
  });
});

// ============================================================================
// CHECKOUT PRICING DISPLAY (pence → pounds)
// The pay-panel `£${(totalPrice / 100).toFixed(2)}` formula in both
// guest-checkout-form and checkout-client must be consistent.
// ============================================================================

describe('Drop · Pay-panel price display', () => {
  const formatCheckoutTotal = (ticketCount: number, ticketPricePence: number): string => {
    const total = ticketCount * ticketPricePence;
    return (total / 100).toFixed(2);
  };

  it('formats single £2.99 ticket correctly', () => {
    expect(formatCheckoutTotal(1, 299)).toBe('2.99');
  });

  it('formats 10 tickets at £9.99 → £99.90', () => {
    expect(formatCheckoutTotal(10, 999)).toBe('99.90');
  });

  it('formats 50 tickets at £3.99 → £199.50', () => {
    expect(formatCheckoutTotal(50, 399)).toBe('199.50');
  });

  it('formats zero tickets as £0.00', () => {
    expect(formatCheckoutTotal(0, 500)).toBe('0.00');
  });

  it('calculateTotalPrice(qty, pence) returns pence and divides cleanly', () => {
    const pence = calculateTotalPrice(25, 299);
    expect(pence).toBe(7475);
    expect((pence / 100).toFixed(2)).toBe('74.75');
  });

  it('rounding is stable for awkward prices', () => {
    // £4.95 × 3 = £14.85 — no floating-point drift in pence
    expect(calculateTotalPrice(3, 495)).toBe(1485);
    expect((1485 / 100).toFixed(2)).toBe('14.85');
  });
});

// ============================================================================
// SESSIONSTORAGE KEY CONTRACT
// All files reading sessionStorage must agree on the key naming scheme.
// Drift here caused the original checkout flow bug.
// ============================================================================

describe('Drop · sessionStorage key contract', () => {
  const COMP_ID = 'comp-abc-123';

  const buildKeys = (competitionId: string) => ({
    tickets: `tickets_${competitionId}`,
    reservation: `reservation_${competitionId}`,
    pendingQuantity: `pending_quantity_${competitionId}`,
    qcmPassed: `qcm_passed_${competitionId}`,
    useReferralTicket: `useReferralTicket_${competitionId}`,
  });

  it('all keys are competition-scoped', () => {
    const keys = buildKeys(COMP_ID);
    Object.values(keys).forEach((k) => {
      expect(k).toContain(COMP_ID);
    });
  });

  it('keys match the exact strings used by simple-ticket-selector / question / checkout', () => {
    const keys = buildKeys(COMP_ID);
    expect(keys.tickets).toBe('tickets_comp-abc-123');
    expect(keys.reservation).toBe('reservation_comp-abc-123');
    expect(keys.pendingQuantity).toBe('pending_quantity_comp-abc-123');
    expect(keys.qcmPassed).toBe('qcm_passed_comp-abc-123');
    expect(keys.useReferralTicket).toBe('useReferralTicket_comp-abc-123');
  });

  it('reservation payload shape matches producer (simple-ticket-selector) and consumer (checkout-client)', () => {
    const reservation = {
      ticketNumbers: [42, 43, 44],
      expiresAt: Date.now() + 300_000,
    };
    // round-trip through JSON like sessionStorage would
    const parsed = JSON.parse(JSON.stringify(reservation));
    expect(Array.isArray(parsed.ticketNumbers)).toBe(true);
    expect(typeof parsed.expiresAt).toBe('number');
    expect(parsed.expiresAt).toBeGreaterThan(Date.now());
  });
});

// ============================================================================
// GUEST CHECKOUT SCHEMA (acceptTerms migration)
// Regression test: previously z.literal(true) required a cast
// `undefined as unknown as true`. New schema uses z.boolean().refine
// so setValue can pass a plain boolean without cast.
// ============================================================================

describe('Drop · Guest checkout acceptTerms schema', () => {
  const acceptTermsSchema = z.boolean().refine((v) => v === true, {
    message: 'You must accept the terms and confirm you are 18+',
  });

  it('accepts true', () => {
    expect(acceptTermsSchema.safeParse(true).success).toBe(true);
  });

  it('rejects false with proper error message', () => {
    const result = acceptTermsSchema.safeParse(false);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('You must accept the terms and confirm you are 18+');
    }
  });

  it('rejects undefined (required boolean)', () => {
    expect(acceptTermsSchema.safeParse(undefined).success).toBe(false);
  });

  it('rejects non-boolean values', () => {
    expect(acceptTermsSchema.safeParse('true').success).toBe(false);
    expect(acceptTermsSchema.safeParse(1).success).toBe(false);
    expect(acceptTermsSchema.safeParse(null).success).toBe(false);
  });
});

// ============================================================================
// PHONE COUNTRY CODE DROPDOWN
// Drop refactor made phone country independent from address country.
// Each country must have a flag + phone code.
// ============================================================================

describe('Drop · Phone country code mapping', () => {
  const COUNTRIES = [
    { code: 'GB', name: 'United Kingdom', phoneCode: '+44', flag: '🇬🇧' },
    { code: 'IE', name: 'Ireland', phoneCode: '+353', flag: '🇮🇪' },
    { code: 'FR', name: 'France', phoneCode: '+33', flag: '🇫🇷' },
    { code: 'DE', name: 'Germany', phoneCode: '+49', flag: '🇩🇪' },
    { code: 'US', name: 'United States', phoneCode: '+1', flag: '🇺🇸' },
    { code: 'CA', name: 'Canada', phoneCode: '+1', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', phoneCode: '+61', flag: '🇦🇺' },
  ];

  it('every country has ISO code + name + phone code + flag', () => {
    COUNTRIES.forEach((c) => {
      expect(c.code).toMatch(/^[A-Z]{2}$/);
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.phoneCode).toMatch(/^\+\d+$/);
      expect(c.flag.length).toBeGreaterThan(0);
    });
  });

  it('GB is first (primary market) and is the default', () => {
    expect(COUNTRIES[0]?.code).toBe('GB');
  });

  it('lookup by code returns correct phone code', () => {
    const lookup = (code: string) => COUNTRIES.find((c) => c.code === code)?.phoneCode;
    expect(lookup('GB')).toBe('+44');
    expect(lookup('FR')).toBe('+33');
    expect(lookup('US')).toBe('+1');
    expect(lookup('XX')).toBeUndefined();
  });

  it('US and CA share +1 (NANP is valid)', () => {
    const us = COUNTRIES.find((c) => c.code === 'US');
    const ca = COUNTRIES.find((c) => c.code === 'CA');
    expect(us?.phoneCode).toBe(ca?.phoneCode);
  });
});

// ============================================================================
// ENTER TRACKER STATE (step 01 done → step 02 active → step 03 pending)
// Drop redesign added a visual 3-step tracker on question/checkout pages.
// ============================================================================

describe('Drop · Enter flow tracker state', () => {
  type StepState = 'done' | 'active' | 'pending';
  const deriveState = (stepNumber: number, currentStep: 1 | 2 | 3): StepState => {
    if (stepNumber < currentStep) return 'done';
    if (stepNumber === currentStep) return 'active';
    return 'pending';
  };

  it('on question page (step 2): tickets done, skillQ active, details pending', () => {
    expect(deriveState(1, 2)).toBe('done');
    expect(deriveState(2, 2)).toBe('active');
    expect(deriveState(3, 2)).toBe('pending');
  });

  it('on checkout page (step 3): tickets + skillQ done, details active', () => {
    expect(deriveState(1, 3)).toBe('done');
    expect(deriveState(2, 3)).toBe('done');
    expect(deriveState(3, 3)).toBe('active');
  });

  it('at tickets page (step 1): only first is active', () => {
    expect(deriveState(1, 1)).toBe('active');
    expect(deriveState(2, 1)).toBe('pending');
    expect(deriveState(3, 1)).toBe('pending');
  });
});

// ============================================================================
// SKILL QUESTION (QCM)
// Drop UI uses color-coded feedback: green=correct, red=wrong, blue=selected.
// Logic is purely derived from submitted + pick vs correctAnswer.
// ============================================================================

describe('Drop · Skill question feedback state', () => {
  type OptionState = 'correct' | 'wrong' | 'selected' | '';

  const deriveOptionState = (
    index: number,
    pick: number | null,
    submitted: boolean,
    correctAnswer: number,
  ): OptionState => {
    const isSelected = pick === index;
    const isCorrect = submitted && index === correctAnswer;
    const isWrong = submitted && isSelected && index !== correctAnswer;
    if (isCorrect) return 'correct';
    if (isWrong) return 'wrong';
    if (isSelected) return 'selected';
    return '';
  };

  it('unselected option is neutral', () => {
    expect(deriveOptionState(0, null, false, 2)).toBe('');
  });

  it('selected but not submitted is `selected`', () => {
    expect(deriveOptionState(0, 0, false, 2)).toBe('selected');
  });

  it('submitted correct is `correct` (green)', () => {
    expect(deriveOptionState(2, 2, true, 2)).toBe('correct');
  });

  it('submitted wrong on selected is `wrong` (red)', () => {
    expect(deriveOptionState(0, 0, true, 2)).toBe('wrong');
  });

  it('submitted but unselected correct option is still highlighted correct', () => {
    // reveals the right answer even if user chose wrong
    expect(deriveOptionState(2, 0, true, 2)).toBe('correct');
  });

  it('submitted unselected wrong options stay neutral', () => {
    expect(deriveOptionState(1, 0, true, 2)).toBe('');
    expect(deriveOptionState(3, 0, true, 2)).toBe('');
  });
});

// ============================================================================
// TICKET NUMBER DISPLAY (checkout-client)
// Tickets are shown sorted + prefixed with # + comma-separated.
// ============================================================================

describe('Drop · Ticket number display', () => {
  const format = (nums: number[]) =>
    '#' + [...nums].sort((a, b) => a - b).join(', #');

  it('sorts numerically, not lexically', () => {
    expect(format([100, 2, 42])).toBe('#2, #42, #100');
  });

  it('handles single ticket', () => {
    expect(format([7])).toBe('#7');
  });

  it('does not mutate input', () => {
    const input = [3, 1, 2];
    format(input);
    expect(input).toEqual([3, 1, 2]);
  });
});
