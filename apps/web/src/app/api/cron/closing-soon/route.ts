import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMarketingRecipients } from '@/lib/marketing-recipients';
import { sendClosingSoonBlast, type CompetitionBlastData } from '@/lib/email';
import { closingSoonWindow, CLOSING_SOON_WINDOW_HOURS } from '@/lib/closing-soon';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Daily cron (see apps/web/vercel.json) that emails opted-in users about
 * competitions whose draw is within the next CLOSING_SOON_WINDOW_HOURS.
 * Idempotent: each competition is stamped with closingSoonEmailSentAt, so a
 * competition is only ever reminded once even if the cron runs repeatedly.
 *
 * Auth: Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` when
 * CRON_SECRET is configured. A `?secret=` query param is also accepted for
 * manual runs. If CRON_SECRET is unset the endpoint refuses in production
 * (never leave a mass-mail trigger open to the internet).
 */
function isAuthorized(request: Request): boolean {
  if (!CRON_SECRET) return !IS_PRODUCTION; // dev convenience only
  const header = request.headers.get('authorization');
  if (header === `Bearer ${CRON_SECRET}`) return true;
  const url = new URL(request.url);
  return url.searchParams.get('secret') === CRON_SECRET;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const { from, to } = closingSoonWindow(now);

  const competitions = await prisma.competition.findMany({
    where: {
      status: { in: ['ACTIVE', 'SOLD_OUT'] },
      closingSoonEmailSentAt: null,
      drawDate: { gt: from, lte: to },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      prizeValue: true,
      ticketPrice: true,
      isFree: true,
      mainImageUrl: true,
      drawDate: true,
    },
  });

  if (competitions.length === 0) {
    return NextResponse.json({ ok: true, windowHours: CLOSING_SOON_WINDOW_HOURS, competitions: 0, recipients: 0, sent: 0 });
  }

  const recipients = await getMarketingRecipients();
  const results: { competitionId: string; sent: number; total: number }[] = [];

  for (const c of competitions) {
    // Claim it first (idempotency) so a second overlapping run can't double-send.
    await prisma.competition.update({ where: { id: c.id }, data: { closingSoonEmailSentAt: new Date() } });

    const data: CompetitionBlastData = {
      title: c.title,
      slug: c.slug,
      prizeValue: Number(c.prizeValue),
      ticketPrice: Number(c.ticketPrice),
      isFree: c.isFree,
      mainImageUrl: c.mainImageUrl,
      drawDate: c.drawDate,
    };
    const { sent, total } = await sendClosingSoonBlast(recipients, data);
    results.push({ competitionId: c.id, sent, total });
  }

  return NextResponse.json({
    ok: true,
    windowHours: CLOSING_SOON_WINDOW_HOURS,
    competitions: competitions.length,
    recipients: recipients.length,
    sent: results.reduce((n, r) => n + r.sent, 0),
    results,
  });
}
