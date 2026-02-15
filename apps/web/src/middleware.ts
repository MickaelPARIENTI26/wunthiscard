import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

// Protected routes that require authentication
const protectedRoutes = [
  '/profile',
  '/my-tickets',
  '/my-wins',
  '/addresses',
  '/settings',
  '/checkout',
  '/account',
];

/**
 * Middleware for the public WinUCard site
 * - Protects account routes (requires authentication)
 * - Redirects logged-in users away from /login and /register
 */
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;
  const isOnLogin = pathname === '/login';
  const isOnRegister = pathname === '/register';

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Protect routes - require login
  if (isProtectedRoute) {
    if (!isLoggedIn) {
      const callbackUrl = encodeURIComponent(req.nextUrl.pathname);
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${callbackUrl}`, req.nextUrl)
      );
    }
    return NextResponse.next();
  }

  // Redirect logged-in users away from login/register pages
  if ((isOnLogin || isOnRegister) && isLoggedIn) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Match all routes except API routes, static files, and images
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|assets).*)'],
};
