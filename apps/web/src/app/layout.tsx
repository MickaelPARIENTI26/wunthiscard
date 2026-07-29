import type { Metadata, Viewport } from 'next';
import { Barlow, Barlow_Condensed } from 'next/font/google';
import './globals.css';
import { StructuredData } from '@/components/common/structured-data';
import { generateHomePageSchema } from '@/lib/structured-data';
import { CookieConsentBanner } from '@/components/legal/cookie-consent-banner';
import { AgeGate } from '@/components/legal/age-gate';
import { AuthHeader } from '@/components/layout/auth-header';
import { TickerBar } from '@/components/layout/ticker-bar';
import { Footer } from '@/components/layout/footer';
import { SessionProvider } from '@/components/providers/session-provider';
import { Toaster } from '@/components/ui/toaster';
import { Suspense } from 'react';
import { ReferralTracker } from '@/components/common/referral-tracker';

const barlow = Barlow({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-barlow',
  weight: ['400', '500', '600', '700'],
});

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-barlow-condensed',
  weight: ['500', '600', '700'],
});

/**
 * Viewport configuration for mobile-first design
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-viewport
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0A0A0A',
  colorScheme: 'dark',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://winuprize.com'),
  title: {
    default: 'WinUPrize - Win Collectible Cards & Memorabilia',
    template: '%s | WinUPrize',
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
  authors: [{ name: 'WinUPrize' }],
  creator: 'WinUPrize',
  publisher: 'WinUPrize',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://winuprize.com',
    siteName: 'WinUPrize',
    title: 'WinUPrize - Win Collectible Cards & Memorabilia',
    description:
      'Enter to win rare Pokemon cards, One Piece TCG, sports memorabilia and more.',
    // No explicit `images` here: Next.js automatically serves the dynamic
    // opengraph-image.tsx route. Setting images would suppress that fallback.
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WinUPrize - Win Collectible Cards & Memorabilia',
    description:
      'Enter to win rare Pokemon cards, One Piece TCG, sports memorabilia and more.',
    site: '@winuprize',
    creator: '@winuprize',
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
        color: '#C9A227',
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
    'msapplication-TileColor': '#0A0A0A',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable}`} data-scroll-behavior="smooth">
      <head>
        {/* Default structured data for Organization and WebSite */}
        <StructuredData data={generateHomePageSchema()} />
      </head>
      <body className="min-h-screen antialiased flex flex-col" style={{ fontFamily: "var(--sans)" }}>
        <SessionProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold"
            style={{ background: 'var(--accent)', color: '#0A0A0A' }}
          >
            Skip to main content
          </a>
          <TickerBar />
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
