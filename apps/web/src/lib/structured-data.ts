import { siteConfig } from './seo';

const BASE_URL = 'https://winucard.com';

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
    image: `${BASE_URL}/images/og-default.jpg`,
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
      email: 'support@winucard.com',
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
 * Product schema for competition pages
 * Represents the prize as a product
 */
export interface ProductSchemaProps {
  name: string;
  description: string;
  image: string;
  url: string;
  price: number | string;
  sku?: string;
  category: string;
  condition?: string;
  availability: 'InStock' | 'SoldOut' | 'PreOrder';
  validUntil?: string;
}

export function generateProductSchema(props: ProductSchemaProps) {
  const {
    name,
    description,
    image,
    url,
    price,
    sku,
    category,
    condition = 'NewCondition',
    availability,
    validUntil,
  } = props;

  const availabilityMap = {
    InStock: 'https://schema.org/InStock',
    SoldOut: 'https://schema.org/SoldOut',
    PreOrder: 'https://schema.org/PreOrder',
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    url,
    sku,
    category,
    itemCondition: `https://schema.org/${condition}`,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'GBP',
      price: typeof price === 'string' ? parseFloat(price) : price,
      availability: availabilityMap[availability],
      ...(validUntil && { priceValidUntil: validUntil }),
      seller: {
        '@id': `${BASE_URL}/#organization`,
      },
    },
    brand: {
      '@type': 'Brand',
      name: 'WinUCard',
    },
  };
}

/**
 * Competition/Event schema for competition pages
 * Alternative to Product schema, better represents the competition aspect
 */
export interface CompetitionSchemaProps {
  name: string;
  description: string;
  image: string;
  url: string;
  startDate: string;
  endDate: string;
  ticketPrice: number | string;
  prizeValue: number | string;
  organizer?: string;
}

export function generateCompetitionSchema(props: CompetitionSchemaProps) {
  const {
    name,
    description,
    image,
    url,
    startDate,
    endDate,
    ticketPrice,
    prizeValue: _prizeValue,
    organizer = 'WinUCard',
  } = props;

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    description,
    image,
    url,
    startDate,
    endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      url,
    },
    organizer: {
      '@type': 'Organization',
      name: organizer,
      url: BASE_URL,
    },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'GBP',
      price: typeof ticketPrice === 'string' ? parseFloat(ticketPrice) : ticketPrice,
      availability: 'https://schema.org/InStock',
      validFrom: startDate,
    },
    performer: {
      '@type': 'Organization',
      name: organizer,
    },
    // Custom extension for prize value (not standard Schema.org but useful for context)
  };
}

/**
 * BreadcrumbList schema for navigation
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
    })),
  };
}

/**
 * FAQPage schema for FAQ pages
 */
export interface FaqItem {
  question: string;
  answer: string;
}

export function generateFaqSchema(faqs: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * LocalBusiness schema (optional, if there's a physical presence)
 */
export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${BASE_URL}/#localbusiness`,
    name: 'WinUCard',
    image: `${BASE_URL}/images/logo.png`,
    url: BASE_URL,
    priceRange: '££',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'GB',
    },
    sameAs: [
      siteConfig.links.twitter,
      siteConfig.links.instagram,
      siteConfig.links.facebook,
    ],
  };
}

/**
 * WebPage schema for individual pages
 */
export interface WebPageSchemaProps {
  name: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
}

export function generateWebPageSchema(props: WebPageSchemaProps) {
  const { name, description, url, datePublished, dateModified } = props;

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url: url.startsWith('http') ? url : `${BASE_URL}${url}`,
    isPartOf: {
      '@id': `${BASE_URL}/#website`,
    },
    about: {
      '@id': `${BASE_URL}/#organization`,
    },
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    inLanguage: 'en-GB',
  };
}

/**
 * Aggregate schema for homepage (combines Organization + WebSite)
 */
export function generateHomePageSchema() {
  return [generateOrganizationSchema(), generateWebsiteSchema()];
}

/**
 * ItemList schema for competition listings
 */
export interface CompetitionListItem {
  name: string;
  url: string;
  image: string;
  price: number | string;
}

export function generateCompetitionListSchema(
  competitions: CompetitionListItem[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: competitions.map((comp, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: comp.name,
        url: comp.url.startsWith('http') ? comp.url : `${BASE_URL}${comp.url}`,
        image: comp.image,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'GBP',
          price: typeof comp.price === 'string' ? parseFloat(comp.price) : comp.price,
        },
      },
    })),
  };
}
