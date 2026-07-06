import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendCartRecoveryEmails, type CartRecoveryItem } from '@/lib/email';
import { cartRecoveryWindow, CART_RECOVERY_MIN_AGE_HOURS, CART_RECOVERY_MAX_AGE_DAYS } from '@/lib/cart-recovery';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Daily cron (apps/web/vercel.json) that nudges users who started a checkout but
 * never paid — a PENDING/CANCELLED order for a still-ACTIVE competition, created
 * inside the recovery window, whose user opted in to marketing. One nudge per user
 * (their most recent abandoned cart); every qualifying order is stamped so nobody
 * is chased twice. Same CRON_SECRET auth as the closing-soon cron.
 */
function isAuthorized(request: Request): boolean {
  if (!CRON_SECRET) return !IS_PRODUCTION;
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
  const { from, to } = cartRecoveryWindow(now);

  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: { in: ['PENDING', 'CANCELLED'] },
      recoveryEmailSentAt: null,
      createdAt: { gte: from, lte: to },
      user: {
        emailMarketing: true,
        isActive: true,
        isBanned: false,
        emailVerified: { not: null },
      },
      competition: { status: 'ACTIVE' },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      userId: true,
      ticketCount: true,
      user: { select: { id: true, email: true, firstName: true, unsubscribeToken: true } },
      competition: {
        select: {
          title: true,
          slug: true,
          prizeValue: true,
          ticketPrice: true,
          isFree: true,
          mainImageUrl: true,
          drawDate: true,
        },
      },
    },
  });

  if (orders.length === 0) {
    return NextResponse.json({
      ok: true,
      minAgeHours: CART_RECOVERY_MIN_AGE_HOURS,
      maxAgeDays: CART_RECOVERY_MAX_AGE_DAYS,
      abandonedOrders: 0,
      recipients: 0,
      sent: 0,
    });
  }

  // Claim every qualifying order first (idempotency) so a second overlapping run
  // can't re-nudge — including older carts of a user we only email once below.
  await prisma.order.updateMany({
    where: { id: { in: orders.map((o) => o.id) } },
    data: { recoveryEmailSentAt: now },
  });

  // One item per user: their most recent abandoned cart (orders are createdAt desc).
  const seen = new Set<string>();
  const items: CartRecoveryItem[] = [];
  for (const o of orders) {
    if (!o.userId || !o.user || !o.competition) continue;
    if (seen.has(o.userId)) continue;
    seen.add(o.userId);

    let token = o.user.unsubscribeToken;
    if (!token) {
      token = randomUUID();
      await prisma.user.update({ where: { id: o.user.id }, data: { unsubscribeToken: token } });
    }

    items.push({
      email: o.user.email,
      firstName: o.user.firstName,
      unsubscribeToken: token,
      title: o.competition.title,
      slug: o.competition.slug,
      prizeValue: Number(o.competition.prizeValue),
      ticketPrice: Number(o.competition.ticketPrice),
      isFree: o.competition.isFree,
      mainImageUrl: o.competition.mainImageUrl,
      drawDate: o.competition.drawDate ?? new Date(),
      ticketCount: o.ticketCount,
    });
  }

  const { sent, total } = await sendCartRecoveryEmails(items);

  return NextResponse.json({
    ok: true,
    minAgeHours: CART_RECOVERY_MIN_AGE_HOURS,
    maxAgeDays: CART_RECOVERY_MAX_AGE_DAYS,
    abandonedOrders: orders.length,
    recipients: total,
    sent,
  });
}
