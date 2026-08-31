import { prisma } from '@/lib/db';
import { sendSpinReminderEmail } from '@/lib/email';
import { closingSoonWindow } from '@/lib/closing-soon';

export interface SpinReminderResult {
  competitions: number;
  recipients: number;
  sent: number;
}

/**
 * "Your spins expire when this competition closes."
 *
 * A spin dies with its competition, so the deadline is the draw date — which is
 * exactly the closing-soon window the daily cron already uses. Piggybacking on
 * that run keeps one schedule instead of two, but the pass is separate: the
 * recipients are people holding unplayed spins, not the marketing list.
 *
 * Idempotent per competition via WheelConfig.spinReminderSentAt, claimed before
 * the first send. As with the closing-soon blast, that trades "some reminders
 * lost if the run dies mid-way" for "nobody is ever emailed twice" — the right
 * way round for anything that lands in an inbox.
 */
export async function sendSpinReminders(now: Date = new Date()): Promise<SpinReminderResult> {
  const { from, to } = closingSoonWindow(now);

  const configs = await prisma.wheelConfig.findMany({
    where: {
      enabled: true,
      spinReminderSentAt: null,
      competition: {
        status: { in: ['ACTIVE', 'SOLD_OUT'] },
        drawDate: { gt: from, lte: to },
      },
    },
    select: {
      id: true,
      competition: { select: { title: true, mainImageUrl: true, drawDate: true } },
    },
  });

  let recipients = 0;
  let sent = 0;

  for (const config of configs) {
    const claimed = await prisma.wheelConfig.updateMany({
      where: { id: config.id, spinReminderSentAt: null },
      data: { spinReminderSentAt: new Date() },
    });
    if (claimed.count !== 1) continue; // another run got there first

    const holders = await prisma.wheelSpin.groupBy({
      by: ['userId'],
      where: { wheelConfigId: config.id, spunAt: null, reversedAt: null, userId: { not: null } },
      _count: { _all: true },
    });
    if (holders.length === 0) continue;

    const counts = new Map<string, number>();
    for (const h of holders) {
      if (h.userId) counts.set(h.userId, h._count._all);
    }

    const users = await prisma.user.findMany({
      where: {
        id: { in: [...counts.keys()] },
        isActive: true,
        isBanned: false,
        emailVerified: { not: null },
      },
      select: { id: true, email: true, firstName: true },
    });

    for (const user of users) {
      const spins = counts.get(user.id) ?? 0;
      if (spins <= 0) continue;
      recipients += 1;
      try {
        await sendSpinReminderEmail(user.email, user.firstName, {
          competitionTitle: config.competition.title,
          mainImageUrl: config.competition.mainImageUrl,
          spins,
          expiresAt: config.competition.drawDate,
        });
        sent += 1;
      } catch (error) {
        // One bad address must not stop the rest of the run.
        console.error(`Spin reminder failed for ${user.id}:`, error);
      }
    }
  }

  return { competitions: configs.length, recipients, sent };
}
