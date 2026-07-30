import Link from 'next/link';
import { Home, Search, ChevronLeft } from 'lucide-react';

export default function CompetitionNotFound() {
  return (
    <main
      className="wup-hero flex flex-col items-center justify-center px-4"
      style={{ minHeight: '70vh', padding: 'clamp(50px, 8vw, 110px) 20px' }}
    >
      <div className="wup-hero__rays" aria-hidden="true" />

      <div className="relative text-center" style={{ maxWidth: '620px' }}>
        <div
          className="wup-num"
          style={{ fontSize: 'clamp(90px, 18vw, 200px)', color: 'rgba(201, 162, 39, .5)', lineHeight: 0.9 }}
        >
          404
        </div>

        <h1 className="wup-h2" style={{ fontSize: 'clamp(26px, 4vw, 42px)', margin: '14px 0 14px' }}>
          Competition not found
        </h1>
        <p className="wup-body" style={{ margin: '0 auto 28px', maxWidth: '460px' }}>
          Sorry, we couldn&apos;t find this competition. It may have ended, been removed,
          or the URL might be incorrect.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/competitions" className="wup-btn wup-btn--primary">
            <Search className="h-4 w-4" />
            Browse Competitions
          </Link>
          <Link href="/" className="wup-btn wup-btn--secondary">
            <Home className="h-4 w-4" />
            Go Home
          </Link>
        </div>

        <div style={{ marginTop: '26px' }}>
          <Link
            href="/competitions"
            className="wup-btn wup-btn--link inline-flex items-center"
            style={{ gap: '6px' }}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to all competitions
          </Link>
        </div>
      </div>
    </main>
  );
}
