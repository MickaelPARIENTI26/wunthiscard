'use server';

import { headers } from 'next/headers';
import { rateLimits, grantCredentialsSignIn } from '@/lib/redis';
import { prisma } from '@winucard/database';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { getClientIp } from '@/lib/get-client-ip';

interface RateLimitCheckResult {
  allowed: boolean;
  error?: string;
  minutesRemaining?: number;
}

interface TurnstileCheckResult {
  success: boolean;
  error?: string;
}

/**
 * Verify the Turnstile captcha token server-side and, on success, mint a one-time
 * sign-in grant for this email. The credentials endpoint accepts a captcha token OR a
 * grant, so the subsequent signIn() is authorised by the grant — meaning a captcha
 * result never has to ride through signIn() (which would throw on a rejection and
 * surface as a generic error). Call this BEFORE signIn() on the client.
 */
export async function verifyLoginCaptcha(
  token: string,
  email: string
): Promise<TurnstileCheckResult> {
  try {
    const headersList = await headers();
    const ip = getClientIp(headersList);

    const result = await verifyTurnstileToken(token, ip);
    if (result.success && email) {
      await grantCredentialsSignIn(email.toLowerCase());
    }
    return result;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    // Fail CLOSED in production: an unexpected error must not let a request
    // through unverified. In non-production we stay lenient so local dev/test
    // flows aren't blocked by Cloudflare connectivity issues.
    if (process.env.NODE_ENV === 'production') {
      return { success: false, error: 'Captcha verification failed. Please try again.' };
    }
    return { success: true };
  }
}

/**
 * Check rate limit for login attempts
 * Call this BEFORE calling signIn() on the client
 */
export async function checkLoginRateLimit(): Promise<RateLimitCheckResult> {
  try {
    const headersList = await headers();
    const ip = getClientIp(headersList);

    const { success, reset } = await rateLimits.login.limit(ip);

    if (!success) {
      const minutesRemaining = Math.ceil((reset - Date.now() / 1000) / 60);
      return {
        allowed: false,
        error: `Too many login attempts. Please try again in ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}.`,
        minutesRemaining,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Allow on error to not block legitimate users
    return { allowed: true };
  }
}

/**
 * Log a successful login attempt
 */
export async function logLoginSuccess(email: string): Promise<void> {
  try {
    const headersList = await headers();
    const ip = getClientIp(headersList);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    if (user) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_LOGIN',
          entity: 'user',
          entityId: user.id,
          metadata: {
            email: email.toLowerCase(),
            ip,
            method: 'credentials',
            success: true,
          },
        },
      });
    }
  } catch (error) {
    console.error('Failed to log login success:', error);
  }
}

/**
 * Log a failed login attempt
 */
export async function logLoginFailure(email: string, reason: string): Promise<void> {
  try {
    const headersList = await headers();
    const ip = getClientIp(headersList);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, failedLoginAttempts: true },
    });

    if (user) {
      const attemptNumber = (user.failedLoginAttempts || 0) + 1;
      const isBeingLocked = attemptNumber >= 5;

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_LOGIN_FAILED',
          entity: 'user',
          entityId: user.id,
          metadata: {
            email: email.toLowerCase(),
            ip,
            reason,
            attemptNumber,
          },
        },
      });

      // Log account lock event if this attempt triggers the lock
      if (isBeingLocked) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'USER_LOCKED',
            entity: 'user',
            entityId: user.id,
            metadata: {
              email: email.toLowerCase(),
              ip,
              reason: 'Too many failed login attempts',
              lockDuration: '30 minutes',
            },
          },
        });
      }
    }
  } catch (error) {
    console.error('Failed to log login failure:', error);
  }
}
