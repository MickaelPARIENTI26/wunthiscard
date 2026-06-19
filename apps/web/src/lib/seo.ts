const BASE_URL = 'https://winucards.com';
const SITE_NAME = 'WinUCard';
const DEFAULT_DESCRIPTION =
  'Enter to win rare Pokemon cards, One Piece TCG, sports memorabilia and more. UK-based prize competitions with free entry route available.';
// Served by the dynamic Next.js route apps/web/src/app/opengraph-image.tsx
// (1200x630). Avoids a hardcoded static file that does not exist.
const DEFAULT_IMAGE = `${BASE_URL}/opengraph-image`;

/**
 * Site-wide configuration consumed by the JSON-LD structured-data generators
 * (see ./structured-data.ts).
 */
export const siteConfig = {
  name: SITE_NAME,
  description: DEFAULT_DESCRIPTION,
  url: BASE_URL,
  ogImage: DEFAULT_IMAGE,
  links: {
    twitter: 'https://twitter.com/winucard',
    instagram: 'https://instagram.com/winucard',
    facebook: 'https://facebook.com/winucard',
  },
  locale: 'en_GB',
  currency: 'GBP',
  country: 'United Kingdom',
} as const;
