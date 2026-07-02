import { siteConfig } from './seo';

const BASE_URL = 'https://winucards.com';

/**
 * Schema.org JSON-LD generators for structured data
 * @see https://schema.org/
 * @see https://developers.google.com/search/docs/appearance/structured-data
 */

/**
 * Organization schema for the site
 * Used on homepage and about page
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${BASE_URL}/#organization`,
    name: 'WinUCard',
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/logo.png`,
      width: 500,
      height: 500,
    },
    image: `${BASE_URL}/opengraph-image`,
    description: siteConfig.description,
    foundingDate: '2026',
    sameAs: [
      siteConfig.links.twitter,
      siteConfig.links.instagram,
      siteConfig.links.facebook,
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'GB',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@winucards.com',
      url: `${BASE_URL}/contact`,
      availableLanguage: 'English',
    },
    areaServed: {
      '@type': 'Country',
      name: 'United Kingdom',
    },
  };
}

/**
 * WebSite schema with search action
 * Enables sitelinks search box in Google
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    url: BASE_URL,
    name: 'WinUCard',
    description: siteConfig.description,
    publisher: {
      '@id': `${BASE_URL}/#organization`,
    },
    inLanguage: 'en-GB',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/competitions?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Aggregate schema for homepage (combines Organization + WebSite)
 */
export function generateHomePageSchema() {
  return [generateOrganizationSchema(), generateWebsiteSchema()];
}

/**
 * Product + Offer schema for a competition detail page (rich results / eligibility).
 * The "offer" is a competition ticket at the ticket price.
 */
export function generateCompetitionSchema(comp: {
  slug: string;
  title: string;
  descriptionShort?: string | null;
  mainImageUrl: string;
  ticketPrice: number;
  drawDate: Date | string;
  status: string;
}) {
  const url = `${BASE_URL}/competitions/${comp.slug}`;
  const drawIso =
    typeof comp.drawDate === 'string' ? comp.drawDate : comp.drawDate.toISOString();
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: comp.title,
    image: comp.mainImageUrl,
    description:
      comp.descriptionShort ??
      `Enter to win ${comp.title} — a UK skill-based prize competition with a free entry route.`,
    url,
    brand: { '@type': 'Brand', name: 'WinUCard' },
    offers: {
      '@type': 'Offer',
      url,
      price: comp.ticketPrice.toFixed(2),
      priceCurrency: 'GBP',
      priceValidUntil: drawIso.slice(0, 10),
      availability:
        comp.status === 'ACTIVE'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/SoldOut',
    },
  };
}

/**
 * FAQPage schema (rich FAQ results). Pass the visible question/answer pairs.
 */
export function generateFaqSchema(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}
