import { handlers } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
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

    // Also rate limit by IP as fallback
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'anonymous';

    // Rate limit key combines email and IP for better protection
    const rateLimitKey = email || ip;

    if (rateLimitKey) {
      const { success: rateLimitSuccess, remaining } = await rateLimits.login.limit(rateLimitKey);

      if (!rateLimitSuccess) {
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

      // Add remaining attempts to response headers (handled by NextAuth)
      const response = await handlers.POST(request);
      if (response) {
        response.headers.set('X-RateLimit-Remaining', String(remaining));
      }
      return response;
    }
  }

  // For all other POST requests, use the default handler
  return handlers.POST(request);
}
