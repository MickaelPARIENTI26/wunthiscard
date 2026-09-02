import { randomInt } from 'node:crypto';
import { prisma } from '@/lib/db';
import {
  sendJackpotAlertEmail,
  sendJackpotFrozenAlertEmail,
  sendJackpotWinnerEmail,
} from '@/lib/email';
import { grantSpinForFreeEntryTicket, type WheelSlotType } from '@winucard/database';

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

/**
 * Code alphabet without 0/O/1/I: these get read aloud and typed by hand.
 */
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generatePromoCode(percentOff: number): string {
  let body = '';
  for (let i = 0; i < 10; i++) body += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return `W${percentOff}-${body}`;
}

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
 * Bonus tickets (tier rewards) and the referral free ticket grant nothing —
 * both are volume incentives on a purchase, not entries in their own right.
 *
 * The FREE POSTAL ENTRY route grants a spin too, via grantSpinForFreeEntry
 * below. That is not a generosity: under the Gambling Act 2005 a prize
 * allocated wholly by chance to people who paid, with no equal free route,
 * is a lottery. Giving the postal route the same spin is what keeps the
 * wheel inside the same protection the competition itself relies on.
 *
 * Idempotent by construction: WheelSpin.ticketId is unique, so a webhook and
 * the success page both running fulfilment cannot mint two spins for a ticket.
 */
export async function grantSpinsForOrder(
  orderId: string,
  /**
   * Run inside the caller's transaction. Fulfilment passes its own client so the
   * spins are minted atomically with the order flipping to SUCCEEDED: outside it,
   * a reversal committing in the gap finds no rows to mark and the insert then
   * lands live, playable spins on an order that has already been refunded.
   */
  client: PrismaClientOrTx = prisma,
  /**
   * Tickets on this order that were NOT paid for and therefore earn nothing.
   *
   * The referral free ticket is a price cut, not a flagged ticket: create-session
   * charges for ticketCount - 1 but mints them all as ordinary paid tickets, so
   * counting rows would hand out one spin more than was bought — against the rule
   * this whole feature is built on.
   */
  unpaidTickets = 0
): Promise<number> {
  const order = await client.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      paymentStatus: true,
      competitionId: true,
      competition: {
        select: { drawDate: true, wheelConfig: { select: { id: true, enabled: true } } },
      },
    },
  });

  const config = order?.competition.wheelConfig;
  if (!order || !config?.enabled) return 0;
  // Only a paid order earns spins. Belt and braces with the fulfilment claim:
  // a re-run against a refunded order must never mint a fresh set.
  if (order.paymentStatus !== 'SUCCEEDED') return 0;
  // Anonymised order (account deleted): spins would belong to nobody and could
  // never be played, so don't mint them.
  if (!order.userId) return 0;

  const paidTickets = await client.ticket.findMany({
    where: { orderId: order.id, isBonus: false, isFreeEntry: false, status: 'SOLD' },
    select: { id: true },
    orderBy: { ticketNumber: 'asc' },
  });
  // Deterministic: drop the highest-numbered tickets, so a re-run of fulfilment
  // trims the same ones and skipDuplicates stays meaningful.
  const eligible =
    unpaidTickets > 0 ? paidTickets.slice(0, Math.max(0, paidTickets.length - unpaidTickets)) : paidTickets;
  if (eligible.length === 0) return 0;

  const { count } = await client.wheelSpin.createMany({
    data: eligible.map((t) => ({
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

/**
 * The self-serve free route's spin. Delegates to the shared implementation in
 * @winucard/database, which the admin postal desk also calls — the two free
 * routes live in different apps and must not drift.
 */
export async function grantSpinForFreeEntry(
  ticketId: string,
  client: PrismaClientOrTx = prisma
): Promise<number> {
  return grantSpinForFreeEntryTicket(client, ticketId);
}

/**
 * Give a spin to any free entry that ended up without one.
 *
 * The mint is deliberately non-blocking at claim time — a wheel problem must
 * never void a free entry, because that is the route the law requires to work.
 * The cost of that choice is that a spin can be missed, so it is repaid here:
 * idempotent, cheap, and run daily. Without it a missed spin would be permanent
 * and invisible, and the free route would quietly become the lesser route —
 * which is the exact inequality the whole change exists to remove.
 */
export async function repairMissingFreeEntrySpins(limit = 500): Promise<number> {
  const orphans = await prisma.ticket.findMany({
    where: {
      status: 'FREE_ENTRY',
      userId: { not: null },
      wheelSpin: { is: null },
      competition: {
        // NOT filtered to ACTIVE/SOLD_OUT. recordWinner draws a sold-out
        // competition early and flips it to COMPLETED, and postal entries arrive
        // batched near the closing date — exactly the window a status filter
        // would drop. A spin on a drawn competition is dead anyway, but the row
        // must exist so the entrant's history is not silently short.
        wheelConfig: { enabled: true },
      },
    },
    select: { id: true },
    take: limit,
  });

  let granted = 0;
  for (const ticket of orphans) {
    try {
      granted += await grantSpinForFreeEntry(ticket.id);
    } catch (error) {
      console.error(`Could not repair the free-entry spin for ${ticket.id}:`, error);
    }
  }
  return granted;
}

export type SpinFailure =
  | 'NOT_FOUND'
  | 'ALREADY_SPUN'
  | 'EXPIRED'
  | 'REVERSED'
  | 'WHEEL_DISABLED'
  | 'POOL_EMPTY';

export type SpinOutcome =
  | { ok: true; result: DrawResult; code?: string; codeExpiresAt?: Date }
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
      reversedAt: true,
      expiresAt: true,
      wheelConfigId: true,
      competitionId: true,
      orderId: true,
      wheelConfig: {
        select: {
          enabled: true,
          jackpotEnabled: true,
          couponValidityDays: true,
          jackpotDescription: true,
          jackpotValue: true,
        },
      },
      // The competition's CURRENT draw date is the authority, not the copy
      // stored on the spin: an admin who pushes the date back would otherwise
      // kill spins that should still be live.
      competition: { select: { drawDate: true, status: true } },
      // Spins are banked, so the usual ordering is buy, charge back, spin weeks
      // later. By then the dispute webhook has been and gone with no win to
      // freeze — so the win must be born frozen instead.
      order: { select: { disputeOpenedAt: true } },
    },
  });

  if (!spin || spin.userId !== userId) return { ok: false, reason: 'NOT_FOUND' };
  if (spin.spunAt) return { ok: false, reason: 'ALREADY_SPUN' };
  // The money behind this spin went back. Checked here for the message, and
  // again in the claim below so a reversal landing mid-request still wins.
  if (spin.reversedAt) return { ok: false, reason: 'REVERSED' };
  if (spin.competition.drawDate.getTime() <= Date.now()) return { ok: false, reason: 'EXPIRED' };
  // The draw date alone is not enough: a cancelled competition can still have a
  // future date, and its spins must die with it — otherwise a spin could still
  // take the single graded card off a wheel that no longer exists.
  if (spin.competition.status === 'CANCELLED' || spin.competition.status === 'COMPLETED') {
    return { ok: false, reason: 'EXPIRED' };
  }
  if (!spin.wheelConfig.enabled) return { ok: false, reason: 'WHEEL_DISABLED' };

  let outcome: SpinOutcome;
  try {
    outcome = await prisma.$transaction(async (tx) => {
      // Claim the spin. The spunAt IS NULL guard is what stops a double-click,
      // two tabs, or a replayed request from spending the same spin twice.
      const claimed = await tx.wheelSpin.updateMany({
        where: { id: spinId, userId, spunAt: null, reversedAt: null },
        data: { spunAt: new Date() },
      });
      if (claimed.count === 0) {
        // Either spent already or reversed while we were reading. Distinguish so
        // the customer is told the truth rather than a plausible-sounding guess.
        const live = await tx.wheelSpin.findUnique({
          where: { id: spinId },
          select: { reversedAt: true },
        });
        throw new SpinError(live?.reversedAt ? 'REVERSED' : 'ALREADY_SPUN');
      }

      const result = await claimSlot(tx, spin.wheelConfigId, spin.wheelConfig.jackpotEnabled);
      if (!result) throw new SpinError('POOL_EMPTY');

      await tx.wheelSpin.update({
        where: { id: spinId },
        data: { resultType: result.type, resultValue: result.value },
      });

      if (result.type === 'JACKPOT') {
        // Created inside the same transaction as the stock decrement: the card
        // being gone and someone owning it must never disagree.
        const disputed = spin.order?.disputeOpenedAt ?? null;
        await tx.jackpotWin.create({
          data: {
            spinId,
            competitionId: spin.competitionId,
            userId,
            orderId: spin.orderId,
            prizeDescription: spin.wheelConfig.jackpotDescription ?? 'Graded card',
            prizeValue: spin.wheelConfig.jackpotValue,
            // The customer still WINS it — the freeze only stops it shipping
            // while the money behind it is contested.
            ...(disputed
              ? { paymentReversedAt: new Date(), paymentReversedReason: 'DISPUTE_OPENED' }
              : {}),
          },
        });
      }

      let code: string | undefined;
      let codeExpiresAt: Date | undefined;
      if (result.type === 'PERCENT_OFF') {
        // 32^10 combinations, so a collision is vanishingly unlikely — and if
        // one ever happened the unique index aborts this transaction, which
        // un-claims the spin. The customer re-spins; nothing is lost.
        code = generatePromoCode(result.value);
        codeExpiresAt = new Date(
          Date.now() + spin.wheelConfig.couponValidityDays * 24 * 60 * 60 * 1000
        );
        await tx.promoCode.create({
          data: {
            code,
            userId,
            spinId,
            competitionId: spin.competitionId,
            percentOff: result.value,
            expiresAt: codeExpiresAt,
          },
        });
      }

      return { ok: true as const, result, code, codeExpiresAt };
    });
  } catch (e) {
    if (e instanceof SpinError) return { ok: false, reason: e.reason };
    throw e;
  }

  // Outside the transaction, and swallowed: the win is committed and the card
  // is already out of the pool. A mail outage must not cost the winner their
  // prize, and the admin panel raises the same alert regardless.
  if (outcome.ok && outcome.result.type === 'JACKPOT') {
    void notifyJackpot(spinId).catch((e) =>
      console.error('Jackpot alert email failed (the win is still recorded):', e)
    );
    // And tell the winner. The reveal on the wheel is one div in the browser —
    // a refresh destroys it — so this is the copy of record for a prize worth
    // thousands. Swallowed like the team alert: the win is already committed.
    void notifyJackpotWinner(spinId).catch((e) =>
      console.error('Jackpot winner email failed (the win is still recorded):', e)
    );
  }

  return outcome;
}

/**
 * Where jackpot alerts go. Configurable, never hardcoded — falls back to the
 * public inbox so an alert still lands somewhere if nobody has set it.
 */
export async function jackpotAlertRecipient(): Promise<string> {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
  const data = (settings?.data ?? {}) as { jackpotNotificationEmail?: string };
  return data.jackpotNotificationEmail?.trim() || 'contact@winuprize.com';
}

/**
 * Tell the team a graded card's payment was reversed.
 *
 * The freeze itself is already committed; this is the human's cue. It never
 * throws upward — losing the email must not undo the freeze.
 */
export async function notifyJackpotFrozen(
  orderId: string,
  orderNumber: string,
  cause: string
): Promise<void> {
  const wins = await prisma.jackpotWin.findMany({
    where: { orderId, paymentReversedAt: { not: null } },
    select: { spinId: true, status: true, prizeValue: true },
  });
  if (wins.length === 0) return;

  await sendJackpotFrozenAlertEmail(await jackpotAlertRecipient(), {
    orderNumber,
    cause,
    wins: wins.map((w) => ({
      spinId: w.spinId,
      status: w.status,
      prizeValue: w.prizeValue ? w.prizeValue.toString() : null,
    })),
  });
}

/** Tell the person who won. Never throws upward — the win stands regardless. */
async function notifyJackpotWinner(spinId: string): Promise<void> {
  const win = await prisma.jackpotWin.findUnique({
    where: { spinId },
    select: {
      prizeDescription: true,
      prizeValue: true,
      competition: { select: { title: true, mainImageUrl: true } },
      user: { select: { firstName: true, email: true } },
    },
  });
  if (!win?.user) return;

  await sendJackpotWinnerEmail(win.user.email, win.user.firstName, {
    competitionTitle: win.competition.title,
    prizeDescription: win.prizeDescription,
    prizeValue: win.prizeValue ? Number(win.prizeValue) : null,
    mainImageUrl: win.competition.mainImageUrl,
  });
}

/** Look up everything the team needs and send the alert. Never throws upward. */
async function notifyJackpot(spinId: string): Promise<void> {
  const win = await prisma.jackpotWin.findUnique({
    where: { spinId },
    select: {
      spinId: true,
      orderId: true,
      prizeDescription: true,
      prizeValue: true,
      createdAt: true,
      competition: { select: { title: true } },
      user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
    },
  });
  if (!win?.user) return;

  const to = await jackpotAlertRecipient();

  await sendJackpotAlertEmail(to, {
    competitionTitle: win.competition.title,
    prizeDescription: win.prizeDescription,
    prizeValue: win.prizeValue ? Number(win.prizeValue) : null,
    firstName: win.user.firstName,
    lastName: win.user.lastName,
    email: win.user.email,
    phone: win.user.phone,
    userId: win.user.id,
    orderId: win.orderId,
    spinId: win.spinId,
    wonAt: win.createdAt,
  });
}

class SpinError extends Error {
  constructor(public reason: SpinFailure) {
    super(reason);
  }
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
/** Either the shared client or a transaction client — the queries used are identical. */
type PrismaClientOrTx = typeof prisma | Tx;

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
