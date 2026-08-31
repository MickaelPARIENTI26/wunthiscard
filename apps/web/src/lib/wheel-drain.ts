import { prisma } from '@/lib/db';
import { jackpotAlertRecipient } from '@/lib/wheel';
import { sendWheelDrainAlertEmail } from '@/lib/email';

/**
 * Watching the pool being drained by reversals.
 *
 * WheelSlot.quantityWon is monotonic, so every reversed spin permanently removes
 * a token from a finite pool. Done repeatedly — buy, spin, charge back — that
 * concentrates the remaining odds on whoever is left, and on a pool containing
 * exactly one graded card it eventually makes that card a near-certainty.
 *
 * This DETECTS rather than blocks. Refusing to spin would punish honest buyers
 * for someone else's fraud, and the operator's answer is a judgement call: raise
 * the stock, pause the wheel, or ban an account. So: a daily check that says so,
 * loudly, once per week per competition.
 */

/** Share of the configured pool that may be lost to reversals before we shout. */
export const DRAIN_ALERT_FRACTION = 0.05;

/** How long before the same competition may raise the alarm again. */
const REALERT_DAYS = 7;

export interface WheelDrainResult {
  checked: number;
  alerted: string[];
}

export async function checkWheelDrain(now: Date = new Date()): Promise<WheelDrainResult> {
  const configs = await prisma.wheelConfig.findMany({
    where: { enabled: true, competition: { status: { in: ['ACTIVE', 'SOLD_OUT'] } } },
    select: {
      id: true,
      competitionId: true,
      competition: { select: { title: true } },
      lastDrainAlertAt: true,
      slots: { select: { quantityConfigured: true } },
    },
  });

  const alerted: string[] = [];

  for (const config of configs) {
    const pool = config.slots.reduce((n, s) => n + s.quantityConfigured, 0);
    if (pool === 0) continue;

    const reversed = await prisma.wheelSpin.count({
      where: { wheelConfigId: config.id, reversedAt: { not: null }, spunAt: { not: null } },
    });
    if (reversed / pool < DRAIN_ALERT_FRACTION) continue;

    // Don't nag: one alarm per competition per week is enough to act on. CLAIMED,
    // not checked-then-created — the daily schedule overlapping a manual ?secret=
    // run is exactly how the closing-soon blast once went out twice.
    const since = new Date(now.getTime() - REALERT_DAYS * 24 * 60 * 60 * 1000);
    const claimed = await prisma.wheelConfig.updateMany({
      where: {
        id: config.id,
        OR: [{ lastDrainAlertAt: null }, { lastDrainAlertAt: { lte: since } }],
      },
      data: { lastDrainAlertAt: now },
    });
    if (claimed.count !== 1) continue;

    await prisma.auditLog.create({
      data: {
        action: 'WHEEL_POOL_DRAIN_ALERT',
        entity: 'competition',
        entityId: config.competitionId,
        metadata: {
          competitionTitle: config.competition.title,
          pool,
          reversedSpins: reversed,
          fraction: Math.round((reversed / pool) * 10000) / 10000,
        },
      },
    });

    alerted.push(config.competitionId);

    try {
      await sendWheelDrainAlertEmail(await jackpotAlertRecipient(), {
        competitionTitle: config.competition.title,
        pool,
        reversedSpins: reversed,
      });
    } catch (error) {
      // The audit row is the record; the email is the nudge.
      console.error('Wheel drain alert email failed:', error);
    }
  }

  return { checked: configs.length, alerted };
}
