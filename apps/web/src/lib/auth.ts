import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import type { Provider } from 'next-auth/providers';
import { cookies } from 'next/headers';
import { prisma } from '@winucard/database';
import { MAX_REFERRALS_PER_USER } from '@winucard/shared';
import { authConfig } from './auth.config';
import { verifyPassword, hashPassword } from './password';

// Check if Google OAuth is configured (not just empty strings)
const isGoogleConfigured =
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_ID.length > 0 &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CLIENT_SECRET.length > 0;

// Build providers array with explicit type for mixed provider types
const providers: Provider[] = [
  // Credentials provider for email/password login
  Credentials({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const email = credentials.email as string;
      const password = credentials.password as string;

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        return null;
      }

      // Check if user has no password (OAuth-only account)
      if (!user.passwordHash) {
        throw new Error('OAuthAccountOnly');
      }

      // Public site: only allow regular users (not admin-only accounts)
      // Admins can still login to use the public site if they want
      if (!user.isActive) {
        return null;
      }

      // Check if user is banned
      if (user.isBanned) {
        throw new Error('AccountBanned');
      }

      // Check if account is locked (brute force protection)
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new Error('AccountLocked');
      }

      // Verify password using bcrypt (with scrypt fallback for migration)
      const { isValid, needsRehash } = await verifyPassword(password, user.passwordHash);

      if (!isValid) {
        // Increment failed login attempts
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: { increment: 1 },
            lockedUntil:
              user.failedLoginAttempts >= 4
                ? new Date(Date.now() + 30 * 60 * 1000) // Lock for 30 minutes after 5 failed attempts
                : null,
          },
        });
        return null;
      }

      // Reset failed login attempts on successful login
      // Also rehash password from scrypt to bcrypt if needed (transparent migration)
      const updateData: { failedLoginAttempts: number; lockedUntil: null; passwordHash?: string } = {
        failedLoginAttempts: 0,
        lockedUntil: null,
      };

      if (needsRehash) {
        updateData.passwordHash = await hashPassword(password);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      return {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
      };
    },
  }),
];

// Only add Google OAuth provider if credentials are configured
if (isGoogleConfigured) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          firstName: profile.given_name ?? '',
          lastName: profile.family_name ?? '',
          image: profile.picture,
          emailVerified: profile.email_verified ? new Date() : null,
          role: 'USER',
        };
      },
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // For OAuth providers, create or update user in database
      if (account?.provider === 'google') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email!.toLowerCase() },
        });

        if (existingUser) {
          // Mirror the credentials-login account-state guards so deactivation /
          // lockout can't be silently bypassed by signing in with Google.
          if (existingUser.isBanned) {
            return '/login?error=AccountBanned';
          }
          if (!existingUser.isActive) {
            return '/login?error=AccountInactive';
          }
          if (existingUser.lockedUntil && existingUser.lockedUntil > new Date()) {
            return '/login?error=AccountLocked';
          }
          // Update last login
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              emailVerified: existingUser.emailVerified ?? new Date(),
            },
          });
          // Use existing user's ID
          user.id = existingUser.id;
          user.firstName = existingUser.firstName;
          user.lastName = existingUser.lastName;
          user.role = existingUser.role;
        } else {
          // Resolve the referrer from the `ref_code` cookie (set by ReferralTracker),
          // mirroring the credentials registration flow so Google sign-ups are also
          // attributed. Wrapped so a referral hiccup can never block the sign-in.
          let referredById: string | null = null;
          let refCode: string | null = null;
          try {
            const cookieStore = await cookies();
            refCode = cookieStore.get('ref_code')?.value ?? null;
            if (refCode) {
              const referrer = await prisma.user.findUnique({
                where: { referralCode: refCode },
                select: { id: true, isActive: true, referrals: { select: { id: true } } },
              });
              if (referrer && referrer.isActive && referrer.referrals.length < MAX_REFERRALS_PER_USER) {
                referredById = referrer.id;
              }
            }
          } catch (refErr) {
            console.error('OAuth referral resolution failed (non-blocking):', refErr);
          }

          // Create new user from Google OAuth
          const newUser = await prisma.user.create({
            data: {
              email: user.email!.toLowerCase(),
              firstName: (user as { firstName?: string }).firstName ?? user.name?.split(' ')[0] ?? '',
              lastName: (user as { lastName?: string }).lastName ?? user.name?.split(' ').slice(1).join(' ') ?? '',
              emailVerified: new Date(),
              isActive: true,
              role: 'USER',
              referredById,
            },
          });
          user.id = newUser.id;
          user.firstName = newUser.firstName;
          user.lastName = newUser.lastName;
          user.role = newUser.role;

          // Record the referral link, same as the credentials path
          if (referredById) {
            await prisma.auditLog.create({
              data: {
                userId: newUser.id,
                action: 'REFERRAL_LINKED',
                entity: 'user',
                entityId: newUser.id,
                metadata: {
                  referrerId: referredById,
                  referralCode: refCode,
                  method: 'google',
                },
              },
            });
          }
        }
      }
      return true;
    },
  },
});

// Extend the types for NextAuth
declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
    firstName: string;
    lastName: string;
    emailVerified?: Date | null;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      firstName: string;
      lastName: string;
      image?: string | null;
      emailVerified?: Date | null;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    role: string;
    firstName: string;
    lastName: string;
    emailVerified?: string | null;
  }
}
