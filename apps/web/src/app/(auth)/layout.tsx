import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <section style={{ padding: '48px 20px 80px', background: 'var(--bg)', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        {/* Brand mark */}
        <div className="flex justify-center mb-7">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5"
            style={{ fontFamily: 'var(--display)', fontSize: '22px', fontWeight: 700 }}
          >
            <span
              className="grid place-items-center"
              style={{
                width: 36, height: 36,
                background: 'var(--accent)',
                border: '1.5px solid var(--ink)',
                borderRadius: '8px',
                boxShadow: '2px 2px 0 var(--ink)',
                fontWeight: 700, fontSize: '18px', color: 'var(--ink)',
              }}
            >
              ★
            </span>
            WinUCard
          </Link>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1.5px solid var(--ink)',
            borderRadius: 'var(--radius)',
            padding: '36px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
