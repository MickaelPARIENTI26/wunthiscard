'use server';

import { headers } from 'next/headers';
import { prisma } from '@winucard/database';
import { resetPasswordSchema, type ResetPasswordInput } from '@winucard/shared/validators';
import { hashPassword } from '@/lib/password';
import { rateLimits } from '@/lib/redis';
import { getClientIp } from '@/lib/get-client-ip';

interface ResetPasswordResult {
  success: boolean;
  error?: string;
}

interface ValidateTokenResult {
  valid: boolean;
}

export async function validateResetToken(token: string): Promise<ValidateTokenResult> {
  try {
    if (!token || token.length < 32) {
      return { valid: false };
    }

    // Throttle unauthenticated token lookups per IP so the endpoint can't be used to
    // brute-force/probe reset tokens or hammer the DB. Generous (30/min) so a legit
    // user reloading the reset page isn't blocked.
    try {
      const ip = getClientIp(await headers());
      const { success } = await rateLimits.globalUnauth.limit(`reset-check:${ip}`);
      if (!success) {
        return { valid: false };
      }
    } catch (rateErr) {
      console.error('reset-token validate rate-limit failed (allowing):', rateErr);
    }

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        type: 'PASSWORD_RESET',
        expires: {
          gt: new Date(),
        },
      },
    });

    return { valid: !!verificationToken };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false };
  }
}

export async function resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResult> {
  try {
    // Throttle per IP (generous) — the action requires a valid token anyway, but this
    // stops the endpoint being hammered.
    try {
      const ip = getClientIp(await headers());
      const { success } = await rateLimits.globalUnauth.limit(`reset-do:${ip}`);
      if (!success) {
        return { success: false, error: 'Too many attempts. Please try again later.' };
      }
    } catch (rateErr) {
      console.error('reset-password rate-limit failed (allowing):', rateErr);
    }

    // Validate input with Zod
    const validationResult = resetPasswordSchema.safeParse(input);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return {
        success: false,
        error: firstError?.message || 'Invalid input data.',
      };
    }

    const { token, password } = validationResult.data;

    // Find the token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        type: 'PASSWORD_RESET',
        expires: {
          gt: new Date(),
        },
      },
    });

    if (!verificationToken) {
      return {
        success: false,
        error: 'Invalid or expired reset link. Please request a new one.',
      };
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found.',
      };
    }

    // Check if account is banned
    if (user.isBanned) {
      return {
        success: false,
        error: 'This account has been suspended. Please contact support.',
      };
    }

    // Hash the new password
    const passwordHash = await hashPassword(password);

    // Update user and delete token in a transaction
    await prisma.$transaction(async (tx) => {
      // Update user password
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          // Reset login attempts if they were locked
          failedLoginAttempts: 0,
          lockedUntil: null,
          // Invalidate every existing JWT session: a reset is exactly how a victim
          // locks out an attacker who holds a stolen session, so those tokens must
          // stop working immediately (the jwt callback rejects mismatched versions).
          tokenVersion: { increment: 1 },
        },
      });

      // Delete the used token
      await tx.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
          },
        },
      });

      // Delete any other password reset tokens for this user
      await tx.verificationToken.deleteMany({
        where: {
          identifier: user.email,
          type: 'PASSWORD_RESET',
        },
      });

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_RESET_COMPLETED',
          entity: 'user',
          entityId: user.id,
          metadata: {
            email: user.email,
          },
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
