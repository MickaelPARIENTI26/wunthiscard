import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { redis } from '@/lib/redis';

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
  // Postgres is the critical dependency (and the keep-warm target) — a DB failure is
  // a real outage → 503. Redis is a best-effort signal: it degrades gracefully in the
  // app, so a Redis blip is reported but does NOT flip the endpoint to unhealthy
  // (otherwise uptime monitors would false-alarm on a non-critical dependency).
  let dbOk = false;
  let redisOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }
  try {
    await redis.set('health-check', String(Date.now()), { ex: 30 });
    redisOk = true;
  } catch {
    redisOk = false;
  }
  return NextResponse.json(
    { ok: dbOk, db: dbOk, redis: redisOk, ts: Date.now() },
    { status: dbOk ? 200 : 503 }
  );
}
