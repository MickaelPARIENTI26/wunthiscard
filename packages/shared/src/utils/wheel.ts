/**
 * Wheel maths, shared by the admin config screen and the spin endpoint.
 *
 * The wheel draws WITHOUT replacement from a finite pool: a slot configured at
 * 1 can be won exactly once. Percentages are therefore a presentation of the
 * pool, never the mechanism — see tasks/wheel-plan.md §3.
 */

export type WheelSlotKind = 'NO_WIN' | 'PERCENT_OFF' | 'JACKPOT';

export interface WheelSlotCounts {
  type: WheelSlotKind;
  /** Percentage for PERCENT_OFF; 0 otherwise. */
  value: number;
  quantityConfigured: number;
  quantityWon: number;
}

export interface WheelSlotSummary extends WheelSlotCounts {
  remaining: number;
  /** Share of the configured pool, rounded to 2dp for display. */
  percentage: number;
  label: string;
}

export function wheelSlotLabel(type: WheelSlotKind, value: number): string {
  if (type === 'NO_WIN') return 'No Win';
  if (type === 'JACKPOT') return 'Graded Card';
  return `${value}% OFF`;
}

/**
 * Total tokens in the pool. This is what the percentages are computed against —
 * not the competition's ticket count, which differs (see expectedSpins).
 */
export function wheelPoolSize(slots: WheelSlotCounts[]): number {
  return slots.reduce((n, s) => n + s.quantityConfigured, 0);
}

export function summariseWheelSlots(slots: WheelSlotCounts[]): WheelSlotSummary[] {
  const pool = wheelPoolSize(slots);
  return slots.map((s) => ({
    ...s,
    remaining: s.quantityConfigured - s.quantityWon,
    percentage: pool > 0 ? Math.round((s.quantityConfigured / pool) * 10000) / 100 : 0,
    label: wheelSlotLabel(s.type, s.value),
  }));
}

/**
 * How many spins a competition will actually produce.
 *
 * One spin per PAID ticket. Bonus tickets (tier rewards) and the referral free
 * ticket grant none, yet still consume numbers from the competition's pool — so
 * this is always lower than totalTickets, and the admin needs to see the gap or
 * the displayed odds will not match what players experience.
 */
export function expectedSpins(totalTickets: number | null, bonusRatio = 0.09): number {
  if (!totalTickets || totalTickets <= 0) return 0;
  return Math.max(0, Math.round(totalTickets * (1 - bonusRatio)));
}

export interface WheelConfigProblem {
  slotLabel: string;
  message: string;
}

/**
 * Rejects an admin edit that would corrupt already-distributed rewards.
 *
 * The hard rule is stock can never go below what has been won — that would make
 * "Remaining" negative and, for the jackpot, imply a second card exists. The
 * pool-size mismatch is a warning, not an error: it is a judgement call the
 * admin is allowed to make.
 */
export function validateWheelConfig(
  next: WheelSlotCounts[],
  totalTickets: number | null
): { errors: WheelConfigProblem[]; warnings: WheelConfigProblem[] } {
  const errors: WheelConfigProblem[] = [];
  const warnings: WheelConfigProblem[] = [];

  for (const slot of next) {
    const label = wheelSlotLabel(slot.type, slot.value);
    if (slot.quantityConfigured < 0) {
      errors.push({ slotLabel: label, message: 'Quantity cannot be negative.' });
      continue;
    }
    if (slot.quantityConfigured < slot.quantityWon) {
      errors.push({
        slotLabel: label,
        message: `Already won ${slot.quantityWon} — cannot set the stock below that.`,
      });
    }
  }

  const pool = wheelPoolSize(next);
  if (pool === 0) {
    errors.push({ slotLabel: 'Pool', message: 'The wheel needs at least one slot.' });
  }

  const spins = expectedSpins(totalTickets);
  if (pool > 0 && spins > 0) {
    if (pool > spins) {
      warnings.push({
        slotLabel: 'Pool',
        message: `${pool} slots configured but only ~${spins} spins expected — about ${pool - spins} will never be drawn.`,
      });
    } else if (pool < spins) {
      warnings.push({
        slotLabel: 'Pool',
        message: `Only ${pool} slots for ~${spins} expected spins — the wheel will run out before the competition ends.`,
      });
    }
  }

  return { errors, warnings };
}
