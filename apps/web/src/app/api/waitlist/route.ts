import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { rateLimits } from '@/lib/redis';
import { getClientIp } from '@/lib/get-client-ip';

const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address').max(254),
});

/**
 * Coming-soon waiting list signup. Email-only, deduped by a unique constraint
 * (re-joining is a silent no-op), rate-limited per IP. Always answers with the
 * same generic success so the endpoint can't be used to probe which emails are
 * already on the list.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const { success } = await rateLimits.waitlist.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body: unknown = await request.json();
    const parsed = waitlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    await prisma.waitlistSubscriber.upsert({
      where: { email: parsed.data.email },
      update: {},
      create: { email: parsed.data.email },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Waitlist signup error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
