import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

// Auth pages (login/register/forgot/reset) must never be indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <section style={{ padding: '24px 20px 40px', background: 'var(--bg)', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        {/* Brand mark */}
        <div className="flex justify-center mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5"
            style={{ fontFamily: 'var(--display)', fontSize: '22px', fontWeight: 700 }}
          >
            <Image src="/logo.png" alt="Lucky TCG logo" width={36} height={36} priority />
            Lucky TCG
          </Link>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1.5px solid var(--ink)',
            borderRadius: 'var(--radius)',
            padding: '24px 28px 28px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
