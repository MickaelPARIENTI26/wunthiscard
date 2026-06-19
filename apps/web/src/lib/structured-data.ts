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
    alternateName: 'WTC',
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/images/logo.png`,
      width: 512,
      height: 512,
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
