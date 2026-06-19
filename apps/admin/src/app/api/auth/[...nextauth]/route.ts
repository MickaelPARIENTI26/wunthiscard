import { handlers } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { rateLimits } from '@/lib/redis';

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

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               'anonymous';

    // Rate limit on BOTH the email AND the IP independently, and block if
    // EITHER is exceeded. The email key throttles brute-forcing a single
    // admin account; the IP key throttles password-spraying many accounts
    // from one source. Distinct prefixes keep the two budgets separate.
    const emailKey = email ? `login:email:${email}` : null;
    const ipKey = `login:ip:${ip}`;

    // FAIL-OPEN: the limiter is a network call to Upstash; if Redis is
    // down/slow it throws. This limiter is only a non-essential safety net —
    // the real brute-force protection is the DB failedLoginAttempts/lockedUntil
    // lockout in the credentials authorize() path, which still holds. So on a
    // limiter error we log and ALLOW the request rather than 500-ing every
    // admin login and locking everyone out during a Redis outage.
    let emailResult: Awaited<ReturnType<typeof rateLimits.login.limit>> | null = null;
    let ipResult: Awaited<ReturnType<typeof rateLimits.login.limit>> | null = null;
    try {
      [emailResult, ipResult] = await Promise.all([
        emailKey ? rateLimits.login.limit(emailKey) : Promise.resolve(null),
        rateLimits.login.limit(ipKey),
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
