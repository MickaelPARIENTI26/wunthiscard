/**
 * Component to inject JSON-LD structured data into page head
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/metadata#json-ld
 */

interface StructuredDataProps {
  /** JSON-LD data object or array of objects */
  data: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * StructuredData component
 * Renders JSON-LD structured data in a script tag for SEO
 *
 * @example
 * // Single schema
 * <StructuredData data={generateOrganizationSchema()} />
 *
 * @example
 * // Multiple schemas
 * <StructuredData data={[
 *   generateOrganizationSchema(),
 *   generateWebsiteSchema()
 * ]} />
 */
export function StructuredData({ data }: StructuredDataProps) {
  // If data is an array, we need to output multiple script tags
  // or a single script with a graph structure
  const jsonLd = Array.isArray(data)
    ? {
        '@context': 'https://schema.org',
        '@graph': data.map((item) => {
          // Remove @context from individual items since we have it at the top level
          const { '@context': _context, ...rest } = item as Record<string, unknown>;
          return rest;
        }),
      }
    : data;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/**
 * BreadcrumbStructuredData component
 * Convenience wrapper for breadcrumb schemas
 */
interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbStructuredDataProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
  const BASE_URL = 'https://winthiscard.com';

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
    />
  );
}

/**
 * FaqStructuredData component
 * Convenience wrapper for FAQ schemas
 */
interface FaqItem {
  question: string;
  answer: string;
}

interface FaqStructuredDataProps {
  faqs: FaqItem[];
}

export function FaqStructuredData({ faqs }: FaqStructuredDataProps) {
  const faqSchema = {
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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  );
}

/**
 * ProductStructuredData component
 * Convenience wrapper for product/competition schemas
 */
interface ProductStructuredDataProps {
  name: string;
  description: string;
  image: string;
  url: string;
  price: number;
  priceCurrency?: string;
  availability?: 'InStock' | 'SoldOut' | 'PreOrder';
  sku?: string;
  category?: string;
}

export function ProductStructuredData({
  name,
  description,
  image,
  url,
  price,
  priceCurrency = 'GBP',
  availability = 'InStock',
  sku,
  category,
}: ProductStructuredDataProps) {
  const BASE_URL = 'https://winthiscard.com';

  const availabilityMap = {
    InStock: 'https://schema.org/InStock',
    SoldOut: 'https://schema.org/SoldOut',
    PreOrder: 'https://schema.org/PreOrder',
  };

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    url: url.startsWith('http') ? url : `${BASE_URL}${url}`,
    ...(sku && { sku }),
    ...(category && { category }),
    offers: {
      '@type': 'Offer',
      priceCurrency,
      price,
      availability: availabilityMap[availability],
      seller: {
        '@type': 'Organization',
        name: 'WinThisCard',
      },
    },
    brand: {
      '@type': 'Brand',
      name: 'WinThisCard',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
    />
  );
}
