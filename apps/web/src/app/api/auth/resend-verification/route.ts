import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';
import { rateLimits } from '@/lib/redis';
import { getClientIp } from '@/lib/get-client-ip';
import { randomBytes } from 'crypto';

const resendSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = resendSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const email = validation.data.email;

    // Rate limit by BOTH email AND IP (block if either trips). Per-email stops
    // bombing one inbox; per-IP stops one source spraying many addresses. FAIL-OPEN:
    // the limiter is a network call to Upstash; on an outage we log and allow rather
    // than 500-ing every resend (this is only an anti-spam safety net).
    const emailLower = email.toLowerCase();
    const ip = getClientIp(request.headers);
    try {
      const [emailLimit, ipLimit] = await Promise.all([
        rateLimits.passwordReset.limit(`resend-email:${emailLower}`),
        rateLimits.passwordReset.limit(`resend-ip:${ip}`),
      ]);
      if (!emailLimit.success || !ipLimit.success) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
    } catch (rateErr) {
      console.error('resend-verification rate-limit check failed (allowing request):', rateErr);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({ success: true });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Generate new verification token
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete only existing EMAIL_VERIFICATION tokens — must NOT touch the
    // user's PASSWORD_RESET tokens, which share this table.
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email, type: 'EMAIL_VERIFICATION' },
    });

    // Create new token
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires,
        type: 'EMAIL_VERIFICATION',
      },
    });

    // Send verification email. A send failure must not change the response — the
    // endpoint returns success regardless to preserve the anti-enumeration contract
    // (it must not reveal whether an address exists or whether delivery worked).
    try {
      await sendVerificationEmail(user.email, token, user.firstName);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}
