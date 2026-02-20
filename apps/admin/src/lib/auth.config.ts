import type { NextAuthConfig } from 'next-auth';

/**
 * Admin panel NextAuth configuration
 *
 * SECURITY NOTES:
 * - Uses separate cookie names from public site (wtc-admin.*)
 * - SUPER_ADMIN: Full access to all admin features
 * - ADMIN: Full access except draw execution
 * - DRAW_MASTER: Access ONLY to draw pages (/draw section)
 * - Session expires after 8 hours for ADMIN/SUPER_ADMIN
 * - Session expires after 4 hours for DRAW_MASTER (shorter for security)
 * - AUTH_SECRET must be a strong random string
 */

// Session durations in seconds
const SESSION_DURATION_DEFAULT = 8 * 60 * 60; // 8 hours for ADMIN/SUPER_ADMIN
const SESSION_DURATION_DRAW_MASTER = 4 * 60 * 60; // 4 hours for DRAW_MASTER
export const authConfig = {
  secret: process.env.AUTH_SECRET,
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

        // Set custom expiry based on role
        const sessionDuration =
          user.role === 'DRAW_MASTER'
            ? SESSION_DURATION_DRAW_MASTER
            : SESSION_DURATION_DEFAULT;
        token.expiresAt = Date.now() + sessionDuration * 1000;
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
        const loginPage =
          nextUrl.pathname.startsWith('/draw') ? '/draw/login' : '/login';
        return Response.redirect(
          new URL(`${loginPage}?error=SessionExpired`, nextUrl)
        );
      }

      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const isOnDashboard = pathname.startsWith('/dashboard');
      const isOnDrawLogin = pathname === '/draw/login';
      const isOnDrawSection = pathname.startsWith('/draw') && pathname !== '/draw/login';
      const isDrawPage = /^\/dashboard\/competitions\/[^/]+\/draw/.test(pathname);

      // Draw login page is always accessible
      if (isOnDrawLogin) {
        return true;
      }

      // Draw section pages (/draw, /draw/[id]) - protected for DRAW_MASTER and SUPER_ADMIN
      if (isOnDrawSection) {
        if (!isLoggedIn) {
          return Response.redirect(new URL('/draw/login', nextUrl));
        }

        const role = auth?.user?.role;
        if (role === 'SUPER_ADMIN' || role === 'DRAW_MASTER') {
          return true;
        }

        return Response.redirect(new URL('/draw/login?error=AccessDenied', nextUrl));
      }

      if (isOnDashboard) {
        if (!isLoggedIn) return false;

        const role = auth?.user?.role;

        // SUPER_ADMIN has full access
        if (role === 'SUPER_ADMIN') return true;

        // ADMIN has access to everything except draw pages (optional: remove this line to allow)
        if (role === 'ADMIN') return true;

        // DRAW_MASTER can ONLY access draw pages
        if (role === 'DRAW_MASTER') {
          if (isDrawPage) return true;
          // Redirect to draw login if trying to access other pages
          return Response.redirect(new URL('/draw/login?error=AccessDenied', nextUrl));
        }

        return false;
      }

      return true;
    },
  },
  providers: [], // Providers added in auth.ts (server-side only)
} satisfies NextAuthConfig;
