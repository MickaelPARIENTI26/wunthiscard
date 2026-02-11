import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-compatible NextAuth configuration
 * This config excludes any Node.js-specific crypto operations
 * so it can be used in middleware (Edge runtime)
 */
export const authConfig = {
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.emailVerified = user.emailVerified ? user.emailVerified.toISOString() : null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.emailVerified = token.emailVerified ? new Date(token.emailVerified as string) : null;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAccount = nextUrl.pathname.startsWith('/account');
      const isOnProfile = nextUrl.pathname.startsWith('/profile');
      const isOnCheckout = nextUrl.pathname.startsWith('/checkout');
      const isOnLogin = nextUrl.pathname === '/login';
      const isOnRegister = nextUrl.pathname === '/register';

      // Protected routes: require authentication
      if (isOnAccount || isOnProfile || isOnCheckout) {
        if (!isLoggedIn) return false;
        return true;
      }

      // Redirect logged-in users away from auth pages
      if ((isOnLogin || isOnRegister) && isLoggedIn) {
        return Response.redirect(new URL('/', nextUrl));
      }

      return true;
    },
  },
  providers: [], // Providers added in auth.ts (server-side only, not edge-compatible)
} satisfies NextAuthConfig;
