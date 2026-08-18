import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { rateLimits } from '@/lib/redis';
import { getClientIp } from '@/lib/get-client-ip';
import { spinWheel, type SpinFailure } from '@/lib/wheel';

const schema = z.object({ spinId: z.string().min(1) });

/** What each failure means to the person holding the spin. */
const MESSAGES: Record<SpinFailure, { status: number; error: string }> = {
  NOT_FOUND: { status: 404, error: 'Spin not found.' },
  ALREADY_SPUN: { status: 409, error: 'This spin has already been used.' },
  EXPIRED: { status: 410, error: 'This spin expired when the competition closed.' },
  WHEEL_DISABLED: { status: 409, error: 'The wheel is not available for this competition.' },
  POOL_EMPTY: { status: 409, error: 'No rewards left on this wheel.' },
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be signed in to spin.' }, { status: 401 });
    }

    // Per user, not per IP: a spin is already single-use, so this only exists to
    // blunt a script hammering the endpoint with other people's spin ids.
    const { success } = await rateLimits.wheelSpin.limit(
      `${session.user.id}:${getClientIp(request.headers)}`
    );
    if (!success) {
      return NextResponse.json({ error: 'Too many spins. Please slow down.' }, { status: 429 });
    }

    const body = schema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const outcome = await spinWheel(body.data.spinId, session.user.id);
    if (!outcome.ok) {
      const m = MESSAGES[outcome.reason];
      return NextResponse.json({ error: m.error, code: outcome.reason }, { status: m.status });
    }

    return NextResponse.json({
      ok: true,
      result: { type: outcome.result.type, value: outcome.result.value },
    });
  } catch (error) {
    console.error('Wheel spin failed:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
