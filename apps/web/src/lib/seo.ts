import type { Metadata } from 'next';

const BASE_URL = 'https://winthiscard.com';
const SITE_NAME = 'WinThisCard';
const DEFAULT_DESCRIPTION =
  'Enter to win rare Pokemon cards, One Piece TCG, sports memorabilia and more. UK-based prize competitions with free entry route available.';
const DEFAULT_IMAGE = `${BASE_URL}/images/og-default.jpg`;

/**
 * SEO configuration options for generating page metadata
 */
export interface SeoConfig {
  /** Page title (will be appended with site name) */
  title: string;
  /** Page description for meta tags */
  description?: string;
  /** Canonical URL path (without domain) */
  path?: string;
  /** Open Graph image URL */
  image?: string;
  /** Image alt text for accessibility */
  imageAlt?: string;
  /** Whether to prevent indexing */
  noIndex?: boolean;
  /** Additional keywords for the page */
  keywords?: string[];
  /** Article publication date (for blog posts, news) */
  publishedTime?: string;
  /** Article modification date */
  modifiedTime?: string;
  /** Content type for Open Graph (product is mapped to website for compatibility) */
  type?: 'website' | 'article' | 'product';
}

/**
 * Default keywords used across the site
 */
const DEFAULT_KEYWORDS = [
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
];

/**
 * Generate complete page metadata including Open Graph and Twitter cards
 * @param config - SEO configuration options
 * @returns Next.js Metadata object
 */
export function generateSeoMetadata(config: SeoConfig): Metadata {
  const {
    title,
    description = DEFAULT_DESCRIPTION,
    path = '',
    image = DEFAULT_IMAGE,
    imageAlt = title,
    noIndex = false,
    keywords = [],
    publishedTime,
    modifiedTime,
    type = 'website',
  } = config;

  const canonicalUrl = getCanonicalUrl(path);
  const allKeywords = [...DEFAULT_KEYWORDS, ...keywords];
  // Map 'product' to 'website' as Next.js OpenGraph doesn't support 'product' type
  const ogType = type === 'product' ? 'website' : type;

  const metadata: Metadata = {
    title,
    description,
    keywords: allKeywords,
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: ogType,
      locale: 'en_GB',
      url: canonicalUrl,
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
      ...(type === 'article' && {
        publishedTime,
        modifiedTime,
        authors: [SITE_NAME],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@winthiscard',
      site: '@winthiscard',
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
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
  };

  return metadata;
}

/**
 * Generate canonical URL from path
 * @param path - URL path without domain (e.g., '/competitions')
 * @returns Full canonical URL
 */
export function getCanonicalUrl(path: string = ''): string {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Remove trailing slash for consistency (except for root)
  const normalizedPath =
    cleanPath === '/' ? '' : cleanPath.replace(/\/$/, '');
  return `${BASE_URL}${normalizedPath}`;
}

/**
 * Generate metadata for competition pages
 * @param competition - Competition data
 * @returns Next.js Metadata object
 */
export function generateCompetitionMetadata(competition: {
  slug: string;
  title: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  descriptionShort: string;
  mainImageUrl: string;
  prizeValue: number | string;
  category: string;
}): Metadata {
  const title =
    competition.metaTitle ?? `Win ${competition.title} | ${SITE_NAME}`;
  const description =
    competition.metaDescription ??
    `Enter to win ${competition.title} worth £${competition.prizeValue}. ${competition.descriptionShort}`;

  return generateSeoMetadata({
    title,
    description,
    path: `/competitions/${competition.slug}`,
    image: competition.mainImageUrl,
    imageAlt: competition.title,
    type: 'product',
    keywords: [
      competition.category.toLowerCase().replace('_', ' '),
      competition.title.toLowerCase(),
    ],
  });
}

/**
 * Base URL for the site
 */
export const siteConfig = {
  name: SITE_NAME,
  description: DEFAULT_DESCRIPTION,
  url: BASE_URL,
  ogImage: DEFAULT_IMAGE,
  links: {
    twitter: 'https://twitter.com/winthiscard',
    instagram: 'https://instagram.com/winthiscard',
    facebook: 'https://facebook.com/winthiscard',
  },
  locale: 'en_GB',
  currency: 'GBP',
  country: 'United Kingdom',
} as const;

/**
 * Predefined metadata for common static pages
 */
export const staticPagesMeta: Record<string, SeoConfig> = {
  home: {
    title: 'Win Collectible Cards & Memorabilia',
    description:
      'Enter to win rare Pokemon cards, One Piece TCG, sports memorabilia and more. UK-based prize competitions with free entry route available.',
    path: '/',
  },
  competitions: {
    title: 'All Competitions',
    description:
      'Browse all active prize competitions. Win rare trading cards, signed memorabilia, and collectibles. New competitions added weekly.',
    path: '/competitions',
    keywords: ['live competitions', 'active competitions', 'enter now'],
  },
  howItWorks: {
    title: 'How It Works',
    description:
      'Learn how to enter WinThisCard competitions. Simple entry process, skill-based competitions, and free postal entry route available.',
    path: '/how-it-works',
    keywords: ['how to enter', 'competition rules', 'free entry'],
  },
  faq: {
    title: 'Frequently Asked Questions',
    description:
      'Find answers to common questions about WinThisCard competitions, payments, shipping, and more.',
    path: '/faq',
    keywords: ['faq', 'help', 'questions', 'support'],
  },
  about: {
    title: 'About Us',
    description:
      'Learn about WinThisCard, the UK-based prize competition platform for collectible cards and memorabilia enthusiasts.',
    path: '/about',
    keywords: ['about winthiscard', 'uk company'],
  },
  contact: {
    title: 'Contact Us',
    description:
      'Get in touch with the WinThisCard team. We are here to help with any questions about our competitions.',
    path: '/contact',
    keywords: ['contact', 'support', 'help', 'email'],
  },
  winners: {
    title: 'Recent Winners',
    description:
      'See our recent competition winners and their amazing prizes. Real winners, real prizes.',
    path: '/winners',
    keywords: ['winners', 'past winners', 'winner gallery'],
  },
  terms: {
    title: 'Terms and Conditions',
    description:
      'Read the terms and conditions for using WinThisCard and entering our prize competitions.',
    path: '/terms',
  },
  privacy: {
    title: 'Privacy Policy',
    description:
      'Learn how WinThisCard collects, uses, and protects your personal data.',
    path: '/privacy',
  },
  cookies: {
    title: 'Cookie Policy',
    description:
      'Information about how WinThisCard uses cookies and similar technologies.',
    path: '/cookies',
  },
  competitionRules: {
    title: 'Competition Rules',
    description:
      'Official rules for WinThisCard prize competitions. Skill-based entry requirements and free postal entry route.',
    path: '/competition-rules',
    keywords: ['competition rules', 'terms', 'eligibility', 'free entry'],
  },
};
