import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard');
  const isOnLogin = req.nextUrl.pathname === '/login';
  const isOnRoot = req.nextUrl.pathname === '/';

  // Redirect root to dashboard or login
  if (isOnRoot) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // Protect dashboard routes
  if (isOnDashboard) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', req.nextUrl));
    }
    // Check if user has admin role
    const role = req.auth?.user?.role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/login?error=unauthorized', req.nextUrl));
    }
    return NextResponse.next();
  }

  // Redirect logged-in admins away from login page
  if (isOnLogin && isLoggedIn) {
    const role = req.auth?.user?.role;
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
