import { describe, it, expect } from 'vitest';
import { buildWheelSegments, type WheelSlotCounts } from '../../packages/shared/src/utils/wheel';

/** The default 700-ticket configuration from the brief. */
const DEFAULT_SLOTS: WheelSlotCounts[] = [
  { type: 'NO_WIN', value: 0, quantityConfigured: 420, quantityWon: 0 },
  { type: 'PERCENT_OFF', value: 5, quantityConfigured: 210, quantityWon: 0 },
  { type: 'PERCENT_OFF', value: 10, quantityConfigured: 69, quantityWon: 0 },
  { type: 'JACKPOT', value: 0, quantityConfigured: 1, quantityWon: 0 },
];

describe('buildWheelSegments — the wheel only ever shows what it can pay out', () => {
  it('lays the default pool out as No Win / 5% / No Win / 10% / No Win / Card', () => {
    expect(buildWheelSegments(DEFAULT_SLOTS).map((s) => s.label)).toEqual([
      'No Win',
      '5% OFF',
      'No Win',
      '10% OFF',
      'No Win',
      'Graded Card',
    ]);
  });

  it('drops a slot the moment its stock is gone', () => {
    // The single graded card has been won: it can never be landed on again, so
    // painting it would promise a prize the pool cannot deliver.
    const depleted = DEFAULT_SLOTS.map((s) =>
      s.type === 'JACKPOT' ? { ...s, quantityWon: 1 } : s
    );
    const labels = buildWheelSegments(depleted).map((s) => s.label);

    expect(labels).not.toContain('Graded Card');
    expect(labels).toContain('5% OFF');
  });

  it('repeats the cycle so a one-prize wheel still looks like a wheel', () => {
    const segments = buildWheelSegments([
      { type: 'NO_WIN', value: 0, quantityConfigured: 100, quantityWon: 0 },
      { type: 'PERCENT_OFF', value: 5, quantityConfigured: 20, quantityWon: 0 },
    ]);

    expect(segments).toHaveLength(6);
    expect(segments.filter((s) => s.type === 'PERCENT_OFF')).toHaveLength(3);
  });

  it('shows an all-No-Win wheel once every prize is gone', () => {
    const segments = buildWheelSegments([
      { type: 'NO_WIN', value: 0, quantityConfigured: 100, quantityWon: 0 },
      { type: 'PERCENT_OFF', value: 5, quantityConfigured: 20, quantityWon: 20 },
      { type: 'JACKPOT', value: 0, quantityConfigured: 1, quantityWon: 1 },
    ]);

    expect(segments).toHaveLength(6);
    expect(segments.every((s) => s.type === 'NO_WIN')).toBe(true);
  });

  it('returns nothing when the whole pool is spent', () => {
    expect(
      buildWheelSegments([
        { type: 'NO_WIN', value: 0, quantityConfigured: 5, quantityWon: 5 },
        { type: 'PERCENT_OFF', value: 5, quantityConfigured: 2, quantityWon: 2 },
      ])
    ).toEqual([]);
  });

  it('orders percentages low to high and keeps the jackpot last', () => {
    const labels = buildWheelSegments([
      { type: 'JACKPOT', value: 0, quantityConfigured: 1, quantityWon: 0 },
      { type: 'PERCENT_OFF', value: 20, quantityConfigured: 5, quantityWon: 0 },
      { type: 'PERCENT_OFF', value: 5, quantityConfigured: 5, quantityWon: 0 },
    ]).map((s) => s.label);

    expect(labels).toEqual(['5% OFF', '20% OFF', 'Graded Card', '5% OFF', '20% OFF', 'Graded Card']);
  });

  it('never draws a wheel a spin could not land on', () => {
    // Whatever the configuration, every segment must correspond to stock that
    // still exists — this is the invariant the animation depends on.
    const messy: WheelSlotCounts[] = [
      { type: 'NO_WIN', value: 0, quantityConfigured: 10, quantityWon: 3 },
      { type: 'PERCENT_OFF', value: 5, quantityConfigured: 4, quantityWon: 4 },
      { type: 'PERCENT_OFF', value: 10, quantityConfigured: 2, quantityWon: 1 },
    ];
    const winnable = new Set(
      messy
        .filter((s) => s.quantityConfigured > s.quantityWon)
        .map((s) => `${s.type}:${s.value}`)
    );

    for (const segment of buildWheelSegments(messy)) {
      expect(winnable.has(`${segment.type}:${segment.value}`)).toBe(true);
    }
  });
});
