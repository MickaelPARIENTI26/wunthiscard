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
