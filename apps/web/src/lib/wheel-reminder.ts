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
 * The reminder is tracked PER SPIN (WheelSpin.reminderSentAt), not per
 * competition. A competition-level flag meant the first run inside the window
 * consumed the reminder for everyone, so every buyer in the final 48 hours — the
 * heaviest selling period — was never warned at all, and a first run with nobody
 * to email burned it outright.
 *
 * Not gated on emailVerified either: this is transactional mail about something
 * the recipient has already paid for, and unverified accounts can buy.
 */
export async function sendSpinReminders(now: Date = new Date()): Promise<SpinReminderResult> {
  const { from, to } = closingSoonWindow(now);

  // Everyone holding a live, unplayed, un-reminded spin on a competition whose
  // draw falls inside the window.
  const holders = await prisma.wheelSpin.groupBy({
    by: ['userId', 'competitionId'],
    where: {
      spunAt: null,
      reversedAt: null,
      reminderSentAt: null,
      userId: { not: null },
      wheelConfig: { enabled: true },
      competition: {
        status: { in: ['ACTIVE', 'SOLD_OUT'] },
        drawDate: { gt: from, lte: to },
      },
    },
    _count: { _all: true },
  });

  if (holders.length === 0) {
    return { competitions: 0, recipients: 0, sent: 0 };
  }

  const competitionIds = [...new Set(holders.map((h) => h.competitionId))];
  const userIds = [...new Set(holders.map((h) => h.userId).filter((id): id is string => id !== null))];

  const [competitions, users] = await Promise.all([
    prisma.competition.findMany({
      where: { id: { in: competitionIds } },
      select: { id: true, title: true, mainImageUrl: true, drawDate: true },
    }),
    prisma.user.findMany({
      where: { id: { in: userIds }, isActive: true, isBanned: false },
      select: { id: true, email: true, firstName: true },
    }),
  ]);

  const competitionById = new Map(competitions.map((c) => [c.id, c]));
  const userById = new Map(users.map((u) => [u.id, u]));

  let recipients = 0;
  let sent = 0;

  for (const holder of holders) {
    const competition = competitionById.get(holder.competitionId);
    const user = holder.userId ? userById.get(holder.userId) : undefined;
    if (!competition || !user) continue;

    // Claim these exact spins BEFORE sending. Guarded, so two overlapping runs
    // cannot both email the same person — and because the claim names the spins
    // it counted, nobody else's reminder is consumed by this one.
    const claimed = await prisma.wheelSpin.updateMany({
      where: {
        userId: user.id,
        competitionId: competition.id,
        spunAt: null,
        reversedAt: null,
        reminderSentAt: null,
      },
      data: { reminderSentAt: new Date() },
    });
    if (claimed.count === 0) continue;

    recipients += 1;
    try {
      await sendSpinReminderEmail(user.email, user.firstName, {
        competitionTitle: competition.title,
        mainImageUrl: competition.mainImageUrl,
        spins: claimed.count,
        expiresAt: competition.drawDate,
      });
      sent += 1;
    } catch (error) {
      // One bad address must not stop the rest of the run.
      console.error(`Spin reminder failed for ${user.id}:`, error);
    }
  }

  return { competitions: competitionIds.length, recipients, sent };
}
