'use server';

import { randomBytes } from 'crypto';
import { headers } from 'next/headers';
import { prisma } from '@winucard/database';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@winucard/shared/validators';
import { rateLimits } from '@/lib/redis';

interface ForgotPasswordResult {
  success: boolean;
  error?: string;
}

async function generateResetToken(): Promise<string> {
  return randomBytes(32).toString('hex');
}

export async function requestPasswordReset(
  input: ForgotPasswordInput
): Promise<ForgotPasswordResult> {
  try {
    // Rate limiting
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
               headersList.get('x-real-ip') ??
               'unknown';
    const { success: rateLimitSuccess } = await rateLimits.passwordReset.limit(ip);
    if (!rateLimitSuccess) {
      // Don't reveal rate limiting to prevent enumeration
      return { success: true };
    }

    // Validate input with Zod
    const validationResult = forgotPasswordSchema.safeParse(input);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return {
        success: false,
        error: firstError?.message || 'Invalid email address.',
      };
    }

    const { email } = validationResult.data;
    const normalizedEmail = email.toLowerCase();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to prevent email enumeration attacks
    // But only actually send email if user exists
    if (!user) {
      return { success: true };
    }

    // Check if account is banned
    if (user.isBanned) {
      return { success: true };
    }

    // Delete any existing password reset tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: normalizedEmail,
        type: 'PASSWORD_RESET',
      },
    });

    // Generate new reset token
    const resetToken = await generateResetToken();
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Create password reset token
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: resetToken,
        expires: tokenExpiry,
        type: 'PASSWORD_RESET',
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        entity: 'user',
        entityId: user.id,
        metadata: {
          email: normalizedEmail,
        },
      },
    });

    // TODO: Send password reset email using Resend
    // const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    // await sendPasswordResetEmail({
    //   to: normalizedEmail,
    //   firstName: user.firstName,
    //   resetUrl,
    // });

    // Log reset token in development only
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Password reset token for ${normalizedEmail}: ${resetToken}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Password reset request error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
