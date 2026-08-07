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
      {/* Page header on the raised panel surface */}
      <header
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--line)',
          padding: 'clamp(30px, 4.4vw, 66px) clamp(14px, 3vw, 34px)',
        }}
      >
        <div className="mx-auto" style={{ maxWidth: '1200px' }}>
          <p className="wup-eyebrow" style={{ margin: '0 0 10px' }}>Legal</p>
          <h1 className="wup-h1" style={{ margin: '0 0 14px' }}>{title}</h1>
          <p
            style={{
              fontFamily: 'var(--display)', fontWeight: 600, fontSize: '13px',
              letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', margin: 0,
            }}
          >
            {lastUpdated}
          </p>
        </div>
      </header>

      {/* Content */}
      <section style={{ padding: 'clamp(24px, 3.4vw, 44px) clamp(14px, 3vw, 34px)' }}>
        <div className="mx-auto" style={{ maxWidth: '1200px' }}>
          <div className="legal-grid" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 'clamp(22px, 3.2vw, 44px)', alignItems: 'start' }}>
            {/* Sticky ToC */}
            <aside className="legal-toc legal-toc-desktop">
              <div className="legal-toc-label">On this page</div>
              <ul className="legal-toc-sections">
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
            <article className="legal-body" style={{ flex: '1 1 460px', minWidth: 0 }}>
              {children}

              {/* Footer */}
              <div
                className="flex flex-wrap justify-between gap-2.5"
                style={{
                  marginTop: '32px',
                  paddingTop: '22px',
                  borderTop: '1px solid var(--line)',
                  fontFamily: 'var(--display)',
                  fontWeight: 600,
                  fontSize: '13px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-faint)',
                }}
              >
                <span>{lastUpdated}</span>
                <span>Questions? contact@winuprize.com</span>
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
