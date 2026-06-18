import type { NextAuthConfig } from 'next-auth';

/**
 * Admin panel NextAuth configuration
 *
 * SECURITY NOTES:
 * - Uses separate cookie names from public site (wtc-admin.*)
 * - SUPER_ADMIN: Full access to all admin features
 * - ADMIN: Full access to all admin features
 * - The prize draw is run by an external company; admins record the winning
 *   ticket number manually from the competition detail page.
 * - Session expires after 8 hours for admins
 * - AUTH_SECRET must be a strong random string
 */

// Session duration in seconds
const SESSION_DURATION_DEFAULT = 8 * 60 * 60; // 8 hours for ADMIN/SUPER_ADMIN
export const authConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true, // Required for NextAuth v5 behind the Vercel proxy (avoids UntrustedHost)
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours - shorter for admin security
  },
  cookies: {
    sessionToken: {
      name: 'wtc-admin.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: 'wtc-admin.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: 'wtc-admin.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;

        token.expiresAt = Date.now() + SESSION_DURATION_DEFAULT * 1000;
      }

      // Check if custom expiry has passed (for role-based expiry)
      if (token.expiresAt && Date.now() > (token.expiresAt as number)) {
        // Token has expired - return empty token to force re-login
        return { ...token, expired: true };
      }

      return token;
    },
    async session({ session, token }) {
      // If token is expired, return null session to force logout
      if (token.expired) {
        // @ts-expect-error - marking session as expired
        session.expired = true;
        return session;
      }

      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      // Check if token has expired (role-based expiry)
      // @ts-expect-error - custom expired flag on session
      if (auth?.expired) {
        return Response.redirect(
          new URL('/login?error=SessionExpired', nextUrl)
        );
      }

      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const isOnDashboard = pathname.startsWith('/dashboard');

      if (isOnDashboard) {
        if (!isLoggedIn) return false;

        const role = auth?.user?.role;

        // ADMIN and SUPER_ADMIN have full access to the admin dashboard
        if (role === 'SUPER_ADMIN' || role === 'ADMIN') return true;

        return false;
      }

      return true;
    },
  },
  providers: [], // Providers added in auth.ts (server-side only)
} satisfies NextAuthConfig;
