import Link from 'next/link';

interface TocItem {
  id: string;
  title: string;
}

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  toc: TocItem[];
  otherDocs?: { href: string; label: string }[];
  children: React.ReactNode;
}

const defaultOtherDocs = [
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/cookies', label: 'Cookie Policy' },
  { href: '/competition-rules', label: 'Competition Rules' },
];

export function LegalPage({ title, lastUpdated, toc, otherDocs, children }: LegalPageProps) {
  const others = (otherDocs ?? defaultOtherDocs).filter((d) => d.label !== title);

  return (
    <main>
      {/* Page Header */}
      <header className="mx-auto px-5 sm:px-8 py-15 sm:py-20" style={{ maxWidth: '1440px' }}>
        <div
          className="inline-flex items-center gap-2.5 mb-4"
          style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}
        >
          Legal
        </div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(28px, 5.5vw, 72px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.96, marginBottom: '12px' }}>
          {title}
        </h1>
        <p style={{ color: 'var(--ink-dim)', fontSize: '14px' }}>
          {lastUpdated}
        </p>
      </header>

      {/* Content */}
      <section className="section-gray" style={{ borderTop: '1.5px solid var(--ink)', borderBottom: '1.5px solid var(--ink)' }}>
        <div className="mx-auto px-5 sm:px-8 py-10 sm:py-12" style={{ maxWidth: '860px' }}>
          <div className="legal-grid" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '40px', alignItems: 'start' }}>
            {/* Sticky ToC */}
            <aside className="legal-toc legal-toc-desktop">
              <div className="legal-toc-label">On this page</div>
              <ul>
                {toc.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`}>{item.title}</a>
                  </li>
                ))}
              </ul>

              <div className="legal-toc-label" style={{ marginTop: '20px' }}>Other legal</div>
              <ul>
                {others.map((doc) => (
                  <li key={doc.href}>
                    <Link href={doc.href}>{doc.label}</Link>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Body */}
            <article
              className="legal-body"
              style={{
                background: 'var(--surface)',
                border: '1.5px solid var(--ink)',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow)',
              }}
            >
              {children}

              {/* Footer */}
              <div
                className="flex flex-wrap justify-between gap-2.5"
                style={{
                  marginTop: '32px',
                  paddingTop: '22px',
                  borderTop: '1.5px dashed var(--line-2)',
                  fontFamily: 'var(--mono)',
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-dim)',
                }}
              >
                <span>{lastUpdated}</span>
                <span>Questions? privacy@winucard.com</span>
              </div>
            </article>
          </div>
        </div>

        <style>{`
          @media (max-width: 860px) {
            .legal-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </section>
    </main>
  );
}
