import { handlers } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
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
    // account; the IP key throttles credential-stuffing / password-spraying
    // many accounts from one source. Distinct prefixes keep the two budgets
    // separate so a single IP can't exhaust an account's budget and vice-versa.
    const emailKey = email ? `login:email:${email}` : null;
    const ipKey = `login:ip:${ip}`;

    // Per-account: 5 / 15 min. Per-IP: looser, to cover many accounts from one
    // source without locking out shared/NAT IPs on legitimate traffic.
    const [emailResult, ipResult] = await Promise.all([
      emailKey ? rateLimits.login.limit(emailKey) : Promise.resolve(null),
      rateLimits.loginIp.limit(ipKey),
    ]);

    if ((emailResult && !emailResult.success) || !ipResult.success) {
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
      ipResult.remaining
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
