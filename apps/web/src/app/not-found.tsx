'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="wup-hero flex flex-col items-center justify-center px-4" style={{ minHeight: '70vh', padding: 'clamp(50px, 8vw, 110px) 20px' }}>
      <div className="wup-hero__rays" aria-hidden="true" />

      <div className="relative text-center" style={{ maxWidth: '620px' }}>
        <div className="wup-num" style={{ fontSize: 'clamp(90px, 18vw, 200px)', color: 'rgba(201, 162, 39, .5)', lineHeight: .9 }}>
          404
        </div>

        <h1 className="wup-h2" style={{ fontSize: 'clamp(26px, 4vw, 42px)', margin: '14px 0 14px' }}>
          Page not found
        </h1>
        <p className="wup-body" style={{ margin: '0 auto 28px', maxWidth: '460px' }}>
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been
          moved, deleted, or the URL might be incorrect.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/" className="wup-btn wup-btn--primary">
            <Home className="h-4 w-4" />
            Go Home
          </Link>
          <Link href="/competitions" className="wup-btn wup-btn--secondary">
            <Search className="h-4 w-4" />
            Browse Competitions
          </Link>
        </div>

        <div style={{ marginTop: '26px' }}>
          <button
            onClick={() => window.history.back()}
            className="wup-btn wup-btn--link inline-flex items-center"
            style={{ gap: '6px' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Go back to previous page
          </button>
        </div>
      </div>
    </main>
  );
}
