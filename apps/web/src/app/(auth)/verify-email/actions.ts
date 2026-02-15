'use server';

import { randomBytes } from 'crypto';
import { prisma } from '@winucard/database';

interface VerifyEmailResult {
  success: boolean;
  error?: string;
  code?: 'EXPIRED' | 'ALREADY_VERIFIED' | 'INVALID' | 'NOT_FOUND';
  email?: string;
}

interface ResendResult {
  success: boolean;
  error?: string;
}

async function generateVerificationToken(): Promise<string> {
  return randomBytes(32).toString('hex');
}

export async function verifyEmail(token: string): Promise<VerifyEmailResult> {
  try {
    if (!token || token.length < 32) {
      return {
        success: false,
        error: 'Invalid verification token.',
        code: 'INVALID',
      };
    }

    // Find the verification token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        type: 'EMAIL_VERIFICATION',
      },
    });

    if (!verificationToken) {
      return {
        success: false,
        error: 'Verification link is invalid or has already been used.',
        code: 'INVALID',
      };
    }

    // Check if token has expired
    if (verificationToken.expires < new Date()) {
      return {
        success: false,
        error: 'Verification link has expired.',
        code: 'EXPIRED',
        email: verificationToken.identifier,
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
        code: 'NOT_FOUND',
      };
    }

    // Check if already verified
    if (user.emailVerified) {
      // Delete the token since email is already verified
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
          },
        },
      });

      return {
        success: false,
        error: 'Email is already verified.',
        code: 'ALREADY_VERIFIED',
      };
    }

    // Verify email and delete token in a transaction
    await prisma.$transaction(async (tx) => {
      // Update user email verification
      await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
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

      // Delete any other email verification tokens for this user
      await tx.verificationToken.deleteMany({
        where: {
          identifier: user.email,
          type: 'EMAIL_VERIFICATION',
        },
      });

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'EMAIL_VERIFIED',
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
    console.error('Email verification error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred.',
    };
  }
}

export async function resendVerificationEmail(email: string): Promise<ResendResult> {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { success: true };
    }

    // Check if already verified
    if (user.emailVerified) {
      return {
        success: false,
        error: 'This email is already verified.',
      };
    }

    // Check if account is banned
    if (user.isBanned) {
      return { success: true };
    }

    // Delete any existing verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: normalizedEmail,
        type: 'EMAIL_VERIFICATION',
      },
    });

    // Generate new verification token
    const verificationToken = await generateVerificationToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Create verification token
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: verificationToken,
        expires: tokenExpiry,
        type: 'EMAIL_VERIFICATION',
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'VERIFICATION_EMAIL_RESENT',
        entity: 'user',
        entityId: user.id,
        metadata: {
          email: normalizedEmail,
        },
      },
    });

    // TODO: Send verification email using Resend
    // const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;
    // await sendVerificationEmail({
    //   to: normalizedEmail,
    //   firstName: user.firstName,
    //   verificationUrl,
    // });

    // Log verification token in development only
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Verification token for ${normalizedEmail}: ${verificationToken}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Resend verification email error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred.',
    };
  }
}
