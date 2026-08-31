import { describe, it, expect } from 'vitest';
import {
  reverseWheelRewardsForOrder,
  REVERSAL_REASONS,
  type ReversalReason,
} from '../../packages/database/src/wheel-reversal';

/**
 * A recording stand-in for a Prisma transaction client. The point is not to
 * simulate Postgres — the real behaviour is checked against a live database —
 * but to pin the decision table: which rewards die, which survive, and what is
 * never touched.
 */
interface SpinRow {
  id: string;
  spunAt: Date | null;
  promoCode: {
    id: string; code: string; percentOff: number;
    redeemedAt: Date | null; redeemedOrderId: string | null; voidedAt: Date | null;
  } | null;
  jackpotWin: { id: string; status: string; prizeValue: unknown; paymentReversedAt: Date | null } | null;
}

function makeTx(spins: SpinRow[], markedCount = spins.length) {
  const calls: { model: string; op: string; args: Record<string, unknown> }[] = [];
  const record = (model: string, op: string) => (args: Record<string, unknown>) => {
    calls.push({ model, op, args });
    return Promise.resolve({ count: model === 'wheelSpin' && op === 'updateMany' && calls.filter((c) => c.model === 'wheelSpin' && c.op === 'updateMany').length === 1 ? markedCount : 1 });
  };
  const tx = {
    wheelSpin: {
      updateMany: record('wheelSpin', 'updateMany'),
      findMany: () => Promise.resolve(spins),
    },
    promoCode: { updateMany: record('promoCode', 'updateMany') },
    jackpotWin: { updateMany: record('jackpotWin', 'updateMany') },
    wheelSlot: { updateMany: record('wheelSlot', 'updateMany') },
    auditLog: { create: record('auditLog', 'create') },
  };
  return { tx, calls };
}

const spin = (id: string, over: Partial<SpinRow> = {}): SpinRow => ({
  id, spunAt: new Date(), promoCode: null, jackpotWin: null, ...over,
});

const code = (over: Partial<NonNullable<SpinRow['promoCode']>> = {}) => ({
  id: 'p1', code: 'W10-AAAAAAAAAA', percentOff: 10,
  redeemedAt: null, redeemedOrderId: null, voidedAt: null, ...over,
});

const INPUT = { orderId: 'o1', orderNumber: 'WUP-1', userId: 'u1' };

async function run(spins: SpinRow[], reason: ReversalReason, markedCount?: number) {
  const { tx, calls } = makeTx(spins, markedCount ?? spins.length);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await reverseWheelRewardsForOrder(tx as any, { ...INPUT, reason });
  return { result, calls };
}

describe('reverseWheelRewardsForOrder — what a chargeback takes back', () => {
  it('voids an unredeemed code and freezes a won card', async () => {
    const { result, calls } = await run(
      [
        spin('s1', { spunAt: null }),
        spin('s2', { promoCode: code() }),
        spin('s3', { jackpotWin: { id: 'j1', status: 'PENDING', prizeValue: null, paymentReversedAt: null } }),
      ],
      'DISPUTE_LOST'
    );

    expect(result.unspunReversed).toBe(1);
    expect(result.codesVoided).toEqual(['W10-AAAAAAAAAA']);
    expect(result.jackpotsFrozen).toHaveLength(1);
    expect(calls.some((c) => c.model === 'promoCode' && c.op === 'updateMany')).toBe(true);
    expect(calls.some((c) => c.model === 'jackpotWin' && c.op === 'updateMany')).toBe(true);
  });

  it('NEVER gives the pool token back', async () => {
    // quantityWon is monotonic: the jackpot slot holds ONE physical card, and
    // re-opening it while the card is not back in the building means owing a
    // second one that does not exist.
    const { calls } = await run(
      [spin('s1', { jackpotWin: { id: 'j1', status: 'SHIPPED', prizeValue: null, paymentReversedAt: null } })],
      'REFUND'
    );
    expect(calls.some((c) => c.model === 'wheelSlot')).toBe(false);
  });

  it('never touches the jackpot status — a real card is a human decision', async () => {
    const { calls } = await run(
      [spin('s1', { jackpotWin: { id: 'j1', status: 'SHIPPED', prizeValue: null, paymentReversedAt: null } })],
      'REFUND'
    );
    const jackpotCall = calls.find((c) => c.model === 'jackpotWin');
    expect(jackpotCall).toBeDefined();
    expect(JSON.stringify(jackpotCall!.args)).not.toContain('status');
  });

  it('records an already-spent code as leakage instead of clawing it back', async () => {
    // The discount is baked into a different, completed sale. Un-redeeming it
    // would corrupt that order's total; the honest move is to log the loss.
    const { result, calls } = await run(
      [spin('s1', { promoCode: code({ redeemedAt: new Date(), redeemedOrderId: 'o2' }) })],
      'REFUND'
    );
    expect(result.codesVoided).toEqual([]);
    expect(result.codesAlreadySpent).toEqual([
      { code: 'W10-AAAAAAAAAA', percentOff: 10, redeemedOrderId: 'o2' },
    ]);
    const audit = calls.find((c) => c.model === 'auditLog');
    expect(JSON.stringify(audit!.args)).toContain('o2');
  });

  it('keeps codes alive when the cancellation is ours, not the customer’s', async () => {
    const { result, calls } = await run([spin('s1', { promoCode: code() })], 'COMPETITION_CANCELLED');
    expect(result.codesKept).toEqual(['W10-AAAAAAAAAA']);
    expect(result.codesVoided).toEqual([]);
    expect(calls.some((c) => c.model === 'promoCode')).toBe(false);
  });

  it('still cancels the spins of a cancelled competition', async () => {
    // The wheel they belonged to is gone; only the code outlives it.
    const { result } = await run([spin('s1', { spunAt: null }), spin('s2', { promoCode: code() })], 'COMPETITION_CANCELLED');
    expect(result.spinsReversed).toBe(2);
  });

  it('does nothing at all when every spin was already reversed', async () => {
    const { result, calls } = await run([spin('s1', { promoCode: code({ voidedAt: new Date() }) })], 'REFUND', 0);
    expect(result.spinsReversed).toBe(0);
    // No audit entry, and the ticket links are left alone — a second reversal
    // must be a no-op, not a rewrite.
    expect(calls.some((c) => c.model === 'auditLog')).toBe(false);
    expect(calls.filter((c) => c.model === 'wheelSpin' && c.op === 'updateMany')).toHaveLength(1);
  });

  it('does not re-freeze a jackpot that is already frozen', async () => {
    const { result, calls } = await run(
      [spin('s1', { jackpotWin: { id: 'j1', status: 'PENDING', prizeValue: null, paymentReversedAt: new Date() } })],
      'DISPUTE_LOST'
    );
    expect(result.jackpotsFrozen).toEqual([]);
    expect(calls.some((c) => c.model === 'jackpotWin')).toBe(false);
  });

  it('exposes exactly the three reasons the callers use', () => {
    expect([...REVERSAL_REASONS]).toEqual(['REFUND', 'DISPUTE_LOST', 'COMPETITION_CANCELLED']);
  });
});
