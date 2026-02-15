import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import type { Provider } from 'next-auth/providers';
import { prisma } from '@winucard/database';
import { scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { authConfig } from './auth.config';

const scryptAsync = promisify(scrypt);

/**
 * Verify a password against a stored hash using scrypt
 * Hash format: salt:derivedKey (both hex encoded)
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(':');
  if (!salt || !key) return false;
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(keyBuffer, derivedKey);
}

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

      // Verify password using scrypt
      const isValid = await verifyPassword(password, user.passwordHash);

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
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
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
          // Check if user is banned
          if (existingUser.isBanned) {
            return '/login?error=AccountBanned';
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
          // Create new user from Google OAuth
          const newUser = await prisma.user.create({
            data: {
              email: user.email!.toLowerCase(),
              firstName: (user as { firstName?: string }).firstName ?? user.name?.split(' ')[0] ?? '',
              lastName: (user as { lastName?: string }).lastName ?? user.name?.split(' ').slice(1).join(' ') ?? '',
              emailVerified: new Date(),
              isActive: true,
              role: 'USER',
            },
          });
          user.id = newUser.id;
          user.firstName = newUser.firstName;
          user.lastName = newUser.lastName;
          user.role = newUser.role;
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
