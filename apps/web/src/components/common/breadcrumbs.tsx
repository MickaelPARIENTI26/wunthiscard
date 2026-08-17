import Link from 'next/link';

export interface Crumb {
  label: string;
  /** Omitted on the last crumb — the current page is not a link. */
  href?: string;
}

interface BreadcrumbsProps {
  items: Crumb[];
  /** Absolute site origin, needed for the JSON-LD (Google wants full URLs). */
  baseUrl: string;
}

/**
 * Breadcrumb trail plus its BreadcrumbList JSON-LD.
 *
 * The structured data is what makes Google print "winuprize.com › Competitions
 * › Charizard" in the result instead of the raw URL, so the two are emitted
 * together — they cannot drift apart.
 */
export function Breadcrumbs({ items, baseUrl }: BreadcrumbsProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      // The last crumb has no href; Google accepts a positioned item without
      // an `item` URL for the page you are already on.
      ...(item.href ? { item: `${baseUrl}${item.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="wup-crumbs">
        <ol>
          {items.map((item, i) => {
            const last = i === items.length - 1;
            return (
              <li key={`${item.label}-${i}`}>
                {item.href && !last ? (
                  <Link href={item.href}>{item.label}</Link>
                ) : (
                  <span aria-current="page">{item.label}</span>
                )}
                {!last && (
                  <span className="wup-crumbs__sep" aria-hidden="true">
                    /
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
