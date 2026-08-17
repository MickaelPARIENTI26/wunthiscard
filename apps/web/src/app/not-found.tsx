'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';

/**
 * Internal links offered on a dead URL. Deliberately hard-coded rather than
 * fetched: 404s are the one route bots hammer with random paths, and a DB
 * query here would put that traffic straight on the database.
 */
const DESTINATIONS: { href: string; label: string; hint: string }[] = [
  { href: '/competitions', label: 'Competitions', hint: 'Every live and upcoming drop' },
  { href: '/how-it-works', label: 'How It Works', hint: 'Pick, answer, enter, win' },
  { href: '/faq', label: 'FAQ', hint: 'Draws, tickets, payment, delivery' },
  { href: '/delivery', label: 'Delivery', hint: 'Free, tracked and insured' },
  { href: '/competition-rules', label: 'Competition Rules', hint: 'Including the free postal route' },
  { href: '/contact', label: 'Contact', hint: 'We reply in 1–2 working days' },
];

export default function NotFound() {
  return (
    <main
      className="wup-hero"
      style={{ minHeight: '70vh', padding: 'clamp(46px, 7vw, 96px) 20px' }}
    >
      <div className="wup-hero__rays" aria-hidden="true" />

      <div className="relative mx-auto" style={{ maxWidth: '760px' }}>
        <div className="text-center">
          <div
            className="wup-num"
            style={{ fontSize: 'clamp(90px, 18vw, 200px)', color: 'rgba(201, 162, 39, .5)', lineHeight: 0.9 }}
          >
            404
          </div>

          <h1 className="wup-h2" style={{ fontSize: 'clamp(26px, 4vw, 42px)', margin: '14px 0' }}>
            Page not found
          </h1>
          <p className="wup-body" style={{ margin: '0 auto 28px', maxWidth: '460px' }}>
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been
            moved, deleted, or the URL might be incorrect.
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
        </div>

        {/* Internal links — a dead end should still offer a way onward */}
        <p
          className="wup-eyebrow"
          style={{ textAlign: 'center', margin: 'clamp(34px, 5vw, 52px) 0 14px' }}
        >
          Or try one of these
        </p>

        <nav aria-label="Site sections">
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(228px, 1fr))',
              gap: '10px',
            }}
          >
            {DESTINATIONS.map((d) => (
              <li key={d.href}>
                <Link href={d.href} className="nf-link">
                  <span className="nf-link__label">{d.label}</span>
                  <span className="nf-link__hint">{d.hint}</span>
                  <span className="nf-link__arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div style={{ marginTop: '26px', textAlign: 'center' }}>
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
