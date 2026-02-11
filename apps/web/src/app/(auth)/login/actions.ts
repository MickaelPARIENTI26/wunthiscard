'use server';

import { headers } from 'next/headers';
import { rateLimits } from '@/lib/redis';
import { prisma } from '@winthiscard/database';
import { verifyTurnstileToken } from '@/lib/turnstile';

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
 * Verify Turnstile captcha token
 * Call this BEFORE calling signIn() on the client
 */
export async function verifyLoginCaptcha(token: string): Promise<TurnstileCheckResult> {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') ||
               'unknown';

    const result = await verifyTurnstileToken(token, ip);
    return result;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    // Allow on error to not block legitimate users in case of Cloudflare issues
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
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') ||
               'unknown';

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
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') ||
               'unknown';

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
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') ||
               'unknown';

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
