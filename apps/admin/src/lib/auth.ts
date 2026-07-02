import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@winucard/database';
import { authConfig } from './auth.config';
import { verifyPassword, hashPassword } from './password';

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

        // Check if user has admin access (ADMIN, SUPER_ADMIN, or DRAW_MASTER)
        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'DRAW_MASTER') {
          throw new Error('AccessDenied');
        }

        // Check if user is banned or inactive
        if (user.isBanned || !user.isActive) {
          throw new Error('AccountDisabled');
        }

        // Check if account is locked
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
                  ? new Date(Date.now() + 30 * 60 * 1000) // Lock for 30 minutes
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
          tokenVersion: user.tokenVersion,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Node-only jwt callback (overrides the edge one in auth.config.ts) that ADDS a
    // DB revocation check. Without it, a banned / demoted / deactivated admin — or one
    // whose password was reset after credential theft — kept full admin access until
    // the 8h token expired. Re-validate against the DB at most once a minute.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.tokenVersion = (user as { tokenVersion?: number }).tokenVersion ?? 0;
        token.expiresAt = Date.now() + 8 * 60 * 60 * 1000; // 8h hard expiry
        token.checkedAt = Date.now();
        return token;
      }

      // Hard 8h expiry (mirrors the edge config).
      if (token.expiresAt && Date.now() > (token.expiresAt as number)) {
        return { ...token, expired: true };
      }

      // Throttled revocation check: drop the session if the account is gone, banned,
      // deactivated, no longer an admin role, or its password was reset/changed.
      const REVALIDATE_EVERY_MS = 60_000;
      const lastCheck = typeof token.checkedAt === 'number' ? token.checkedAt : 0;
      if (token.id && Date.now() - lastCheck > REVALIDATE_EVERY_MS) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { tokenVersion: true, isBanned: true, isActive: true, role: true },
          });
          if (!dbUser || dbUser.isBanned || !dbUser.isActive) return null;
          if (dbUser.role !== 'ADMIN' && dbUser.role !== 'SUPER_ADMIN' && dbUser.role !== 'DRAW_MASTER') {
            return null;
          }
          if ((token.tokenVersion ?? 0) !== dbUser.tokenVersion) return null;
          token.role = dbUser.role;
          token.checkedAt = Date.now();
        } catch (revocationError) {
          console.error('admin jwt revocation check failed (keeping session):', revocationError);
        }
      }
      return token;
    },
  },
});

// Extend the types
declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
    firstName: string;
    lastName: string;
    tokenVersion?: number;
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
    tokenVersion?: number;
    checkedAt?: number;
    expiresAt?: number;
    expired?: boolean;
  }
}
