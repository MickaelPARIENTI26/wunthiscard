import { randomInt } from 'node:crypto';
import { prisma } from '@/lib/db';
import type { WheelSlotType } from '@winucard/database';

/**
 * Wheel granting and drawing.
 *
 * The pool is finite and drawn WITHOUT replacement, so "a slot configured at 1
 * can be won exactly once" is the property everything here protects. It is
 * enforced with a guarded UPDATE (compare-and-set) rather than a Serializable
 * transaction: the guard lives in the WHERE clause, so two concurrent spins
 * physically cannot both take the last graded card — the second one matches
 * zero rows and re-draws.
 */

export interface DrawResult {
  slotId: string;
  type: WheelSlotType;
  value: number;
}

/** How many times a spin re-draws when another spin took the slot first. */
const MAX_DRAW_ATTEMPTS = 8;

/**
 * Grant one spin per PAID ticket on a fulfilled order.
 *
 * Bonus tickets (tier rewards), the referral free ticket and free postal
 * entries grant nothing — decision 1 and 3 in tasks/wheel-plan.md.
 *
 * Idempotent by construction: WheelSpin.ticketId is unique, so a webhook and
 * the success page both running fulfilment cannot mint two spins for a ticket.
 */
export async function grantSpinsForOrder(orderId: string): Promise<number> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      competitionId: true,
      competition: {
        select: { drawDate: true, wheelConfig: { select: { id: true, enabled: true } } },
      },
    },
  });

  const config = order?.competition.wheelConfig;
  if (!order || !config?.enabled) return 0;

  const paidTickets = await prisma.ticket.findMany({
    where: { orderId: order.id, isBonus: false, isFreeEntry: false, status: 'SOLD' },
    select: { id: true },
  });
  if (paidTickets.length === 0) return 0;

  const { count } = await prisma.wheelSpin.createMany({
    data: paidTickets.map((t) => ({
      wheelConfigId: config.id,
      competitionId: order.competitionId,
      userId: order.userId,
      orderId: order.id,
      ticketId: t.id,
      // A spin dies with the competition that issued it — decision 2.
      expiresAt: order.competition.drawDate,
    })),
    skipDuplicates: true,
  });

  return count;
}

export type SpinFailure =
  | 'NOT_FOUND'
  | 'ALREADY_SPUN'
  | 'EXPIRED'
  | 'WHEEL_DISABLED'
  | 'POOL_EMPTY';

export type SpinOutcome =
  | { ok: true; result: DrawResult }
  | { ok: false; reason: SpinFailure };

/**
 * Spend one spin and claim a slot.
 *
 * Ordering matters: the spin is claimed first so it can never be spent twice,
 * then a slot is claimed. Both run inside one transaction, so if the pool turns
 * out to be empty the spin claim rolls back with it and the user keeps their
 * spin rather than losing it to a misconfiguration.
 */
export async function spinWheel(spinId: string, userId: string): Promise<SpinOutcome> {
  const spin = await prisma.wheelSpin.findUnique({
    where: { id: spinId },
    select: {
      id: true,
      userId: true,
      spunAt: true,
      expiresAt: true,
      wheelConfigId: true,
      wheelConfig: { select: { enabled: true, jackpotEnabled: true } },
    },
  });

  if (!spin || spin.userId !== userId) return { ok: false, reason: 'NOT_FOUND' };
  if (spin.spunAt) return { ok: false, reason: 'ALREADY_SPUN' };
  if (spin.expiresAt.getTime() <= Date.now()) return { ok: false, reason: 'EXPIRED' };
  if (!spin.wheelConfig.enabled) return { ok: false, reason: 'WHEEL_DISABLED' };

  try {
    return await prisma.$transaction(async (tx) => {
      // Claim the spin. The spunAt IS NULL guard is what stops a double-click,
      // two tabs, or a replayed request from spending the same spin twice.
      const claimed = await tx.wheelSpin.updateMany({
        where: { id: spinId, userId, spunAt: null },
        data: { spunAt: new Date() },
      });
      if (claimed.count === 0) throw new SpinError('ALREADY_SPUN');

      const result = await claimSlot(tx, spin.wheelConfigId, spin.wheelConfig.jackpotEnabled);
      if (!result) throw new SpinError('POOL_EMPTY');

      await tx.wheelSpin.update({
        where: { id: spinId },
        data: { resultType: result.type, resultValue: result.value },
      });

      return { ok: true as const, result };
    });
  } catch (e) {
    if (e instanceof SpinError) return { ok: false, reason: e.reason };
    throw e;
  }
}

class SpinError extends Error {
  constructor(public reason: SpinFailure) {
    super(reason);
  }
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export interface PoolEntry {
  remaining: number;
}

/**
 * Which entry a token falls into, walking the pool as one contiguous range.
 *
 * Exported so the selection can be tested without a database: an off-by-one
 * here would skew every draw, and on a 1-in-700 card that is not something a
 * manual test would ever notice.
 */
export function pickFromPool<T extends PoolEntry>(available: T[], token: number): T | null {
  let t = token;
  for (const entry of available) {
    t -= entry.remaining;
    if (t < 0) return entry;
  }
  return null;
}

/**
 * Pick one token uniformly from what is left, and take it.
 *
 * Re-reads the pool on every attempt: under READ COMMITTED each statement sees
 * the latest committed rows, so a retry samples the pool as it actually is now
 * — which keeps the draw uniform rather than merely "eventually successful".
 */
async function claimSlot(
  tx: Tx,
  wheelConfigId: string,
  jackpotEnabled: boolean
): Promise<DrawResult | null> {
  for (let attempt = 0; attempt < MAX_DRAW_ATTEMPTS; attempt++) {
    const slots = await tx.wheelSlot.findMany({
      where: {
        wheelConfigId,
        ...(jackpotEnabled ? {} : { type: { not: 'JACKPOT' } }),
      },
      select: { id: true, type: true, value: true, quantityConfigured: true, quantityWon: true },
      orderBy: { id: 'asc' },
    });

    const available = slots
      .map((s) => ({ ...s, remaining: s.quantityConfigured - s.quantityWon }))
      .filter((s) => s.remaining > 0);

    const total = available.reduce((n, s) => n + s.remaining, 0);
    if (total <= 0) return null;

    // crypto.randomInt, not Math.random: this decides who gets a £200 card.
    const picked = pickFromPool(available, randomInt(total))!;

    // Compare-and-set. Matching zero rows means another spin took the last one
    // between the read above and here — re-draw against the new pool.
    const taken = await tx.wheelSlot.updateMany({
      where: { id: picked.id, quantityWon: { lt: picked.quantityConfigured } },
      data: { quantityWon: { increment: 1 } },
    });

    if (taken.count === 1) {
      return { slotId: picked.id, type: picked.type, value: picked.value };
    }
  }

  return null;
}
