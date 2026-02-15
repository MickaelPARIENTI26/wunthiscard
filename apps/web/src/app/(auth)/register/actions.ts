'use server';

import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { headers } from 'next/headers';
import { prisma } from '@winucard/database';
import { registerSchema, type RegisterInput } from '@winucard/shared/validators';
import { rateLimits } from '@/lib/redis';
import { verifyTurnstileToken } from '@/lib/turnstile';

const scryptAsync = promisify(scrypt);

interface RegisterResult {
  success: boolean;
  error?: string;
}

interface RegisterInputWithCaptcha extends RegisterInput {
  turnstileToken?: string;
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function generateVerificationToken(): Promise<string> {
  return randomBytes(32).toString('hex');
}

export async function registerUser(input: RegisterInputWithCaptcha): Promise<RegisterResult> {
  try {
    // Rate limiting
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
               headersList.get('x-real-ip') ??
               'unknown';
    const { success: rateLimitSuccess } = await rateLimits.signup.limit(ip);
    if (!rateLimitSuccess) {
      return {
        success: false,
        error: 'Too many registration attempts. Please try again in an hour.',
      };
    }

    // Verify Turnstile captcha if token provided
    if (input.turnstileToken) {
      const captchaResult = await verifyTurnstileToken(input.turnstileToken, ip);
      if (!captchaResult.success) {
        return {
          success: false,
          error: captchaResult.error || 'Captcha verification failed. Please try again.',
        };
      }
    }

    // Validate input with Zod
    const validationResult = registerSchema.safeParse(input);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return {
        success: false,
        error: firstError?.message || 'Invalid input data.',
      };
    }

    const { email, password, firstName, lastName, dateOfBirth } = validationResult.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'An account with this email already exists.',
      };
    }

    // Hash the password using scrypt
    const passwordHash = await hashPassword(password);

    // Generate email verification token
    const verificationToken = await generateVerificationToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // TODO: Remove auto-verify in production — email verification should be required
    const isProduction = process.env.NODE_ENV === 'production';

    // Create the user in a transaction
    await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          firstName,
          lastName,
          dateOfBirth,
          // In development: auto-verify emails to skip verification flow
          // In production: require email verification (set to null)
          emailVerified: isProduction ? null : new Date(),
        },
      });

      // Create verification token
      await tx.verificationToken.create({
        data: {
          identifier: user.email,
          token: verificationToken,
          expires: tokenExpiry,
          type: 'EMAIL_VERIFICATION',
        },
      });

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_REGISTERED',
          entity: 'user',
          entityId: user.id,
          metadata: {
            method: 'credentials',
            email: user.email,
          },
        },
      });

      return user;
    });

    // TODO: Send verification email using Resend
    // await sendVerificationEmail({
    //   to: email,
    //   firstName,
    //   verificationToken,
    // });

    // Log verification token in development only
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Verification token for ${email}: ${verificationToken}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
