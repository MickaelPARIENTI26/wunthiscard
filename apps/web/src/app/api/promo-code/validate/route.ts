import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { rateLimits } from '@/lib/redis';
import { getClientIp } from '@/lib/get-client-ip';
import { lookupPromoCode, type PromoFailure } from '@/lib/promo-code';

const schema = z.object({ code: z.string().trim().min(1).max(32) });

const MESSAGES: Record<PromoFailure, string> = {
  NOT_FOUND: 'That promo code does not exist.',
  NOT_YOURS: 'That promo code belongs to another account.',
  ALREADY_USED: 'That promo code has already been used.',
  EXPIRED: 'That promo code has expired.',
};

/**
 * Read-only check so the checkout can show the discount before the customer
 * commits. It reserves nothing: the code is only claimed when the Stripe
 * session is created, which is also where it is re-validated — this endpoint is
 * a courtesy, never the gate.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
    }

    const { success } = await rateLimits.promoCheck.limit(
      `${session.user.id}:${getClientIp(request.headers)}`
    );
    if (!success) {
      return NextResponse.json({ error: 'Too many attempts. Please slow down.' }, { status: 429 });
    }

    const body = schema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: 'Enter a promo code.' }, { status: 400 });
    }

    const lookup = await lookupPromoCode(body.data.code, session.user.id);
    if (!lookup.ok) {
      return NextResponse.json(
        { error: MESSAGES[lookup.reason], code: lookup.reason },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      code: lookup.promo.code,
      percentOff: lookup.promo.percentOff,
    });
  } catch (error) {
    console.error('Promo code validation failed:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
