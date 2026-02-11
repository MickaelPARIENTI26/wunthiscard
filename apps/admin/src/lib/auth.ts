import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@winthiscard/database';
import { scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { authConfig } from './auth.config';

const scryptAsync = promisify(scrypt);

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(':');
  if (!salt || !key) return false;
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(keyBuffer, derivedKey);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
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

        if (!user || !user.passwordHash) {
          return null;
        }

        // Check if user is admin
        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
          return null;
        }

        // Check if user is banned or inactive
        if (user.isBanned || !user.isActive) {
          return null;
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          return null;
        }

        // Verify password
        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
          // Increment failed login attempts
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: { increment: 1 },
              lockedUntil:
                user.failedLoginAttempts >= 4
                  ? new Date(Date.now() + 30 * 60 * 1000) // Lock for 30 minutes
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
        };
      },
    }),
  ],
});

// Extend the types
declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
    firstName: string;
    lastName: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      firstName: string;
      lastName: string;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    role: string;
    firstName: string;
    lastName: string;
  }
}
