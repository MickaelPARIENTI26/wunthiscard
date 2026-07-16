import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { StructuredData } from '@/components/common/structured-data';
import { generateHomePageSchema } from '@/lib/structured-data';
import { CookieConsentBanner } from '@/components/legal/cookie-consent-banner';
import { AgeGate } from '@/components/legal/age-gate';
import { AuthHeader } from '@/components/layout/auth-header';
import { Footer } from '@/components/layout/footer';
import { SessionProvider } from '@/components/providers/session-provider';
import { Toaster } from '@/components/ui/toaster';
import { Suspense } from 'react';
import { ReferralTracker } from '@/components/common/referral-tracker';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
  weight: ['400', '500', '600'],
});

/**
 * Viewport configuration for mobile-first design
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-viewport
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#f2f0ec',
  colorScheme: 'light',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://lucky-tcg.com'),
  title: {
    default: 'Lucky TCG - Win Collectible Cards & Memorabilia',
    template: '%s | Lucky TCG',
  },
  description:
    'Enter to win rare Pokemon cards, One Piece TCG, sports memorabilia and more. UK-based prize competitions with free entry route available.',
  keywords: [
    'pokemon cards',
    'one piece tcg',
    'sports memorabilia',
    'prize competition',
    'win cards',
    'collectibles',
    'uk competition',
    'trading cards',
    'signed memorabilia',
    'skill competition',
  ],
  authors: [{ name: 'Lucky TCG' }],
  creator: 'Lucky TCG',
  publisher: 'Lucky TCG',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://lucky-tcg.com',
    siteName: 'Lucky TCG',
    title: 'Lucky TCG - Win Collectible Cards & Memorabilia',
    description:
      'Enter to win rare Pokemon cards, One Piece TCG, sports memorabilia and more.',
    // No explicit `images` here: Next.js automatically serves the dynamic
    // opengraph-image.tsx route. Setting images would suppress that fallback.
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lucky TCG - Win Collectible Cards & Memorabilia',
    description:
      'Enter to win rare Pokemon cards, One Piece TCG, sports memorabilia and more.',
    site: '@luckytcg',
    creator: '@luckytcg',
    // No explicit `images` here: Next.js automatically serves the dynamic
    // twitter-image.tsx route. Setting images would suppress that fallback.
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/icons/safari-pinned-tab.svg',
        color: '#0d0d0d',
      },
    ],
  },
  manifest: '/manifest.webmanifest',
  // NOTE: no site-wide canonical here — a static canonical in the root layout is
  // inherited by EVERY page, telling Google all URLs are duplicates of the homepage.
  // Each page self-canonicalises to its own URL (metadataBase resolves relatives).
  category: 'entertainment',
  classification: 'Prize Competitions',
  referrer: 'origin-when-cross-origin',
  other: {
    // Windows tile colour (brand ink). browserconfig.xml was removed — it 404'd.
    'msapplication-TileColor': '#0d0d0d',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`} data-scroll-behavior="smooth">
      <head>
        {/* Default structured data for Organization and WebSite */}
        <StructuredData data={generateHomePageSchema()} />
      </head>
      <body className="min-h-screen antialiased flex flex-col" style={{ fontFamily: "var(--sans)" }}>
        <SessionProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold"
            style={{ background: 'var(--ink)', color: 'var(--accent)' }}
          >
            Skip to main content
          </a>
          <AuthHeader />
          <main id="main-content" className="flex-1">{children}</main>
          <Footer />
          <CookieConsentBanner />
          <Toaster />
          <AgeGate />
          <Suspense fallback={null}><ReferralTracker /></Suspense>
        </SessionProvider>
      </body>
    </html>
  );
}
