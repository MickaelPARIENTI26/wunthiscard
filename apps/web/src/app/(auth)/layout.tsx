import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandWordmark } from '@/components/layout/header';

// Auth pages (login/register/forgot/reset) must never be indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // Centred 440px panel over an orbiting-ray backdrop (spec screen 11).
    <section className="wup-hero" style={{ padding: 'clamp(26px, 4vw, 56px) 20px clamp(40px, 5vw, 64px)', minHeight: 'calc(100vh - 200px)' }}>
      <div className="wup-hero__rays" aria-hidden="true" />

      <div className="relative" style={{ maxWidth: '440px', margin: '0 auto' }}>
        {/* Brand mark */}
        <div className="flex justify-center" style={{ marginBottom: '18px' }}>
          <Link href="/" aria-label="WinUPrize home" className="inline-flex items-center">
            <BrandWordmark size="24px" />
          </Link>
        </div>

        {/* Panel */}
        <div
          className="wup-panel wup-panel--accent-top wup-in-slam"
          style={{ padding: 'clamp(22px, 3vw, 30px)', animationDuration: '.6s' }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
