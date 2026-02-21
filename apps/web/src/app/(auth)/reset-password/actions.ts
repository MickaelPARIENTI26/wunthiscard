'use server';

import { prisma } from '@winucard/database';
import { resetPasswordSchema, type ResetPasswordInput } from '@winucard/shared/validators';
import { hashPassword } from '@/lib/password';

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

    // TODO: Send confirmation email
    // await sendPasswordChangedEmail({
    //   to: user.email,
    //   firstName: user.firstName,
    // });

    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
