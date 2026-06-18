import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Lightweight health / keep-warm endpoint.
 *
 * Pinging this every ~4 minutes keeps the Neon serverless compute from
 * auto-suspending. Neon scales the database compute to zero after a few minutes
 * of inactivity; the first request after that has to wake it, which stalls the
 * whole checkout chain (page render → reserve → create-session) and was the
 * cause of the 1–2 minute wait before the Stripe page on a low-traffic
 * (pre-launch) site. A trivial `SELECT 1` resets Neon's idle timer.
 *
 * Point an uptime monitor (UptimeRobot, cron-job.org, etc.) at
 * https://www.winucards.com/api/health on a 5-minute interval.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, ts: Date.now() });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
