import type { NextAuthConfig } from 'next-auth';

/**
 * Admin panel NextAuth configuration
 *
 * SECURITY NOTES:
 * - Uses separate cookie names from public site (wtc-admin.*)
 * - Only ADMIN and SUPER_ADMIN roles can access
 * - Session expires after 8 hours for security
 * - AUTH_SECRET must be a strong random string
 */
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
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');

      if (isOnDashboard) {
        if (!isLoggedIn) return false;
        const role = auth?.user?.role;
        if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') return false;
        return true;
      }

      return true;
    },
  },
  providers: [], // Providers added in auth.ts (server-side only)
} satisfies NextAuthConfig;
