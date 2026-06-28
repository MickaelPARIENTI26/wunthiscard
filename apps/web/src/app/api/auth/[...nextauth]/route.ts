import { handlers } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { rateLimits, consumeCredentialsSignIn } from '@/lib/redis';
import { verifyTurnstileRequired } from '@/lib/turnstile';
import { getClientIp } from '@/lib/get-client-ip';

export const { GET } = handlers;

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Apply rate limiting for credentials login
  if (pathname.includes('/callback/credentials')) {
    // Clone the request to read the body
    const clonedRequest = request.clone();
    const formData = await clonedRequest.formData();
    const email = formData.get('email')?.toString()?.toLowerCase() || '';

    const ip = getClientIp(request.headers);

    // Rate limit on BOTH the email AND the IP independently, and block if
    // EITHER is exceeded. The email key throttles brute-forcing a single
    // account; the IP key throttles credential-stuffing / password-spraying
    // many accounts from one source. Distinct prefixes keep the two budgets
    // separate so a single IP can't exhaust an account's budget and vice-versa.
    const emailKey = email ? `login:email:${email}` : null;
    const ipKey = `login:ip:${ip}`;

    // Per-account: 5 / 15 min. Per-IP: looser, to cover many accounts from one
    // source without locking out shared/NAT IPs on legitimate traffic.
    //
    // FAIL-OPEN: the limiter is a network call to Upstash; if Redis is
    // down/slow it throws. This limiter is only a non-essential safety net —
    // the real brute-force protection is the DB failedLoginAttempts/lockedUntil
    // lockout in the credentials authorize() path, which still holds. So on a
    // limiter error we log and ALLOW the request rather than 500-ing every
    // login and taking down sign-in during a Redis outage.
    let emailResult: Awaited<ReturnType<typeof rateLimits.login.limit>> | null = null;
    let ipResult: Awaited<ReturnType<typeof rateLimits.loginIp.limit>> | null = null;
    try {
      [emailResult, ipResult] = await Promise.all([
        emailKey ? rateLimits.login.limit(emailKey) : Promise.resolve(null),
        rateLimits.loginIp.limit(ipKey),
      ]);
    } catch (rateErr) {
      console.error('Login rate-limit check failed (allowing request):', rateErr);
      Sentry.captureException(rateErr);
    }

    // Only block when a limiter actually returned success:false. A null result
    // (limiter errored or no email key) is treated as "allowed".
    if ((emailResult && !emailResult.success) || (ipResult && !ipResult.success)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': '900', // 15 minutes in seconds
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // SERVER-SIDE CAPTCHA. The login form verifies Turnstile in the browser only;
    // the actual credentials endpoint had no captcha, so a bot could script logins
    // (credential stuffing / password spraying) and skip it entirely. Require a valid
    // Turnstile token here — fail closed in production via verifyTurnstileRequired.
    // EXCEPTION: a one-time sign-in grant minted by a just-completed, captcha-verified
    // registration lets the post-register auto-login through without a second captcha.
    const granted = email ? await consumeCredentialsSignIn(email) : false;
    if (!granted) {
      const turnstileToken =
        formData.get('turnstileToken')?.toString() ??
        formData.get('cf-turnstile-response')?.toString() ??
        null;
      const captcha = await verifyTurnstileRequired(
        turnstileToken,
        ip === 'unknown' ? undefined : ip
      );
      if (!captcha.success) {
        return NextResponse.json(
          { error: captcha.error ?? 'Captcha verification failed. Please try again.' },
          { status: 400 }
        );
      }
    }

    // Surface the tighter of the two remaining budgets.
    const remaining = Math.min(
      emailResult ? emailResult.remaining : Number.POSITIVE_INFINITY,
      ipResult ? ipResult.remaining : Number.POSITIVE_INFINITY
    );

    // Add remaining attempts to response headers (handled by NextAuth)
    const response = await handlers.POST(request);
    if (response) {
      response.headers.set('X-RateLimit-Remaining', String(remaining));
    }
    return response;
  }

  // For all other POST requests, use the default handler
  return handlers.POST(request);
}
