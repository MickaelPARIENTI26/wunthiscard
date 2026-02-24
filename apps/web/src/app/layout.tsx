import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';
import { StructuredData } from '@/components/common/structured-data';
import { generateHomePageSchema } from '@/lib/structured-data';
import { CookieConsentBanner } from '@/components/legal/cookie-consent-banner';
import { AgeGate } from '@/components/legal/age-gate';
import { AuthHeader } from '@/components/layout/auth-header';
import { Footer } from '@/components/layout/footer';
import { SessionProvider } from '@/components/providers/session-provider';
import { Toaster } from '@/components/ui/toaster';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700', '800'],
});

/**
 * Viewport configuration for mobile-first design
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-viewport
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#ffffff',
  colorScheme: 'light',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://winucard.com'),
  title: {
    default: 'WinUCard - Win Collectible Cards & Memorabilia',
    template: '%s | WinUCard',
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
  authors: [{ name: 'WinUCard' }],
  creator: 'WinUCard',
  publisher: 'WinUCard',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://winucard.com',
    siteName: 'WinUCard',
    title: 'WinUCard - Win Collectible Cards & Memorabilia',
    description:
      'Enter to win rare Pokemon cards, One Piece TCG, sports memorabilia and more.',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'WinUCard - Win Collectible Cards & Memorabilia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WinUCard - Win Collectible Cards & Memorabilia',
    description:
      'Enter to win rare Pokemon cards, One Piece TCG, sports memorabilia and more.',
    site: '@winucard',
    creator: '@winucard',
    images: ['/images/og-default.jpg'],
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
        color: '#1e40af',
      },
    ],
  },
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: 'https://winucard.com',
  },
  category: 'entertainment',
  classification: 'Prize Competitions',
  referrer: 'origin-when-cross-origin',
  other: {
    'msapplication-TileColor': '#1e40af',
    'msapplication-config': '/browserconfig.xml',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${GeistSans.variable} ${outfit.variable}`}>
      <head>
        {/* Default structured data for Organization and WebSite */}
        <StructuredData data={generateHomePageSchema()} />
      </head>
      <body className="min-h-screen antialiased flex flex-col" style={{ fontFamily: "var(--font-geist-sans), 'Inter', -apple-system, sans-serif", paddingTop: '66px' }}>
        <NextIntlClientProvider messages={messages}>
          <SessionProvider>
            <AuthHeader />
            <main className="flex-1">{children}</main>
            <Footer />
            <CookieConsentBanner />
            <Toaster />
            <AgeGate />
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
