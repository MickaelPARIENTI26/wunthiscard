import { describe, it, expect } from 'vitest';
import {
  summariseWheelSlots,
  wheelPoolSize,
  expectedSpins,
  validateWheelConfig,
  wheelSlotLabel,
  type WheelSlotCounts,
} from '../../packages/shared/src/utils/wheel';

/** The default 700-ticket configuration from the brief. */
const DEFAULT_SLOTS: WheelSlotCounts[] = [
  { type: 'NO_WIN', value: 0, quantityConfigured: 420, quantityWon: 0 },
  { type: 'PERCENT_OFF', value: 5, quantityConfigured: 210, quantityWon: 0 },
  { type: 'PERCENT_OFF', value: 10, quantityConfigured: 69, quantityWon: 0 },
  { type: 'JACKPOT', value: 0, quantityConfigured: 1, quantityWon: 0 },
];

describe('wheel maths', () => {
  it('reproduces the percentages from the brief', () => {
    const s = summariseWheelSlots(DEFAULT_SLOTS);
    expect(wheelPoolSize(DEFAULT_SLOTS)).toBe(700);
    expect(s.map((x) => [x.label, x.percentage])).toEqual([
      ['No Win', 60],
      ['5% OFF', 30],
      ['10% OFF', 9.86],
      ['Graded Card', 0.14],
    ]);
  });

  it('reports Configured / Won / Remaining', () => {
    const s = summariseWheelSlots([
      { type: 'PERCENT_OFF', value: 5, quantityConfigured: 210, quantityWon: 34 },
    ]);
    expect(s[0]).toMatchObject({ quantityConfigured: 210, quantityWon: 34, remaining: 176 });
  });

  it('labels each slot kind', () => {
    expect(wheelSlotLabel('NO_WIN', 0)).toBe('No Win');
    expect(wheelSlotLabel('JACKPOT', 0)).toBe('Graded Card');
    expect(wheelSlotLabel('PERCENT_OFF', 10)).toBe('10% OFF');
  });

  it('never divides by zero on an empty pool', () => {
    expect(summariseWheelSlots([])).toEqual([]);
    expect(wheelPoolSize([])).toBe(0);
  });
});

describe('expectedSpins', () => {
  it('is lower than the ticket count, because bonus tickets grant no spin', () => {
    expect(expectedSpins(700)).toBe(637);
    expect(expectedSpins(700)).toBeLessThan(700);
  });

  it('handles uncapped and empty competitions', () => {
    expect(expectedSpins(null)).toBe(0);
    expect(expectedSpins(0)).toBe(0);
  });
});

describe('validateWheelConfig — the guard that protects distributed rewards', () => {
  it('accepts the default configuration', () => {
    const { errors } = validateWheelConfig(DEFAULT_SLOTS, 700);
    expect(errors).toEqual([]);
  });

  it('refuses to set stock below what has already been won', () => {
    const { errors } = validateWheelConfig(
      [{ type: 'PERCENT_OFF', value: 5, quantityConfigured: 20, quantityWon: 34 }],
      700
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toContain('Already won 34');
  });

  it('refuses to un-award a jackpot that is already gone', () => {
    // Paired with a filled slot so the empty-pool error can't mask this one.
    const { errors } = validateWheelConfig(
      [
        { type: 'NO_WIN', value: 0, quantityConfigured: 600, quantityWon: 0 },
        { type: 'JACKPOT', value: 0, quantityConfigured: 0, quantityWon: 1 },
      ],
      700
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]!.slotLabel).toBe('Graded Card');
    expect(errors[0]!.message).toContain('Already won 1');
  });

  it('allows raising stock mid-competition', () => {
    const { errors } = validateWheelConfig(
      [{ type: 'PERCENT_OFF', value: 5, quantityConfigured: 300, quantityWon: 34 }],
      700
    );
    expect(errors).toEqual([]);
  });

  it('rejects a negative quantity', () => {
    const { errors } = validateWheelConfig(
      [{ type: 'NO_WIN', value: 0, quantityConfigured: -5, quantityWon: 0 }],
      700
    );
    expect(errors[0]!.message).toContain('negative');
  });

  it('rejects an empty pool', () => {
    const { errors } = validateWheelConfig([], 700);
    expect(errors[0]!.message).toContain('at least one slot');
  });

  it('warns — but does not block — when the pool exceeds the spins on offer', () => {
    const { errors, warnings } = validateWheelConfig(DEFAULT_SLOTS, 700);
    expect(errors).toEqual([]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]!.message).toContain('never be drawn');
  });

  it('warns when the wheel would run dry before the competition ends', () => {
    const { warnings } = validateWheelConfig(
      [{ type: 'NO_WIN', value: 0, quantityConfigured: 100, quantityWon: 0 }],
      700
    );
    expect(warnings[0]!.message).toContain('run out');
  });
});
