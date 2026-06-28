import { NextRequest, NextResponse } from 'next/server';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { z } from 'zod';
import { prisma } from '@winucard/database';
import { passwordSchema } from '@winucard/shared/validators';
import * as Sentry from '@sentry/nextjs';
import { rateLimits, grantCredentialsSignIn } from '@/lib/redis';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { sendVerificationEmail } from '@/lib/email';

const scryptAsync = promisify(scrypt);

// Validation schema for guest checkout registration
const guestCheckoutSchema = z.object({
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: passwordSchema,
  confirmPassword: z.string().min(1),
  dateOfBirth: z.coerce.date({
    required_error: 'Date of birth is required',
    invalid_type_error: 'Invalid date',
  }),
  country: z.string().min(1).max(10),
  postcode: z.string().min(1).max(20).trim(),
  address: z.string().min(1).max(200).trim(),
  city: z.string().min(1).max(100).trim(),
  phone: z.string().min(6).max(20).trim(),
  acceptTerms: z.literal(true),
  acceptMarketing: z.boolean().optional(),
  turnstileToken: process.env.NODE_ENV === 'production' ? z.string().min(1, 'CAPTCHA verification required') : z.string().optional(),
  competitionId: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine((data) => {
  const today = new Date();
  const birthDate = new Date(data.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 18;
}, {
  message: 'You must be at least 18 years old to register',
  path: ['dateOfBirth'],
});

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function generateVerificationToken(): Promise<string> {
  return randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
               request.headers.get('x-real-ip') ??
               'unknown';

    // Rate limiting — FAIL-OPEN. The limiter is a network call to Upstash; if
    // Redis is down/slow it throws. It's only a non-essential safety net here:
    // signup is also protected by the Turnstile CAPTCHA (required in prod) and
    // the unique-email check below. So on a limiter error we log and ALLOW the
    // request rather than 500-ing every registration during a Redis outage.
    try {
      const { success: rateLimitSuccess } = await rateLimits.signup.limit(ip);
      if (!rateLimitSuccess) {
        return NextResponse.json(
          { error: 'Too many registration attempts. Please try again in an hour.' },
          { status: 429 }
        );
      }
    } catch (rateErr) {
      console.error('Signup rate-limit check failed (allowing request):', rateErr);
      Sentry.captureException(rateErr);
    }

    const body = await request.json();

    // Validate input
    const validationResult = guestCheckoutSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return NextResponse.json(
        { error: firstError?.message || 'Invalid input data.' },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Verify Turnstile captcha (required in production)
    if (data.turnstileToken) {
      const captchaResult = await verifyTurnstileToken(data.turnstileToken, ip);
      if (!captchaResult.success) {
        return NextResponse.json(
          { error: captchaResult.error || 'Captcha verification failed. Please try again.' },
          { status: 400 }
        );
      }
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Unable to create account. Please try logging in or use a different email.' },
        { status: 400 }
      );
    }

    // Hash the password
    const passwordHash = await hashPassword(data.password);

    // Generate email verification token
    const verificationToken = await generateVerificationToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Auto-verify in development
    const isProduction = process.env.NODE_ENV === 'production';

    // Create the user with billing address
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          // Email verification (auto in dev, required in prod)
          emailVerified: isProduction ? null : new Date(),
        },
      });

      // Create billing address
      await tx.address.create({
        data: {
          userId: newUser.id,
          label: 'Billing',
          line1: data.address,
          city: data.city,
          postcode: data.postcode,
          country: data.country,
          isDefault: true,
        },
      });

      // Create verification token
      await tx.verificationToken.create({
        data: {
          identifier: newUser.email,
          token: verificationToken,
          expires: tokenExpiry,
          type: 'EMAIL_VERIFICATION',
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: newUser.id,
          action: 'USER_REGISTERED',
          entity: 'user',
          entityId: newUser.id,
          metadata: {
            method: 'guest_checkout',
            email: newUser.email,
            competitionId: data.competitionId,
            marketingOptIn: data.acceptMarketing ?? false,
          },
        },
      });

      return newUser;
    });

    // Send the verification email so guest-checkout registrants can actually
    // activate their account. This was previously omitted here (only the token
    // was created), which left every guest-checkout user permanently unverified
    // and unable to purchase. A send failure must not fail the request — the
    // account exists and the user can request a resend.
    if (isProduction) {
      try {
        await sendVerificationEmail(data.email, verificationToken, data.firstName);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
      }
    } else {
      console.log(`[DEV] Verification token for ${data.email}: ${verificationToken}`);
    }

    // Mint a one-time sign-in grant so the client's immediate auto-login
    // (signIn('credentials')) passes the login captcha gate without a second captcha
    // (Turnstile was already verified above for this guest-checkout registration).
    await grantCredentialsSignIn(data.email.toLowerCase());

    return NextResponse.json({
      success: true,
      userId: user.id,
    });
  } catch (error) {
    console.error('Guest checkout registration error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
