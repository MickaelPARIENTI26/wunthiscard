import Link from 'next/link';
import { FixtureHeader, FixtureRow, type FixtureCompetition } from '@/components/competition/fixture-row';

interface HomeLiveCompsProps {
  competitions: FixtureCompetition[];
}

export function HomeLiveComps({ competitions }: HomeLiveCompsProps) {
  const prices = competitions.map((c) => c.ticketPrice).filter((p) => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : null;

  return (
    <section
      style={{
        borderTop: '1px solid var(--line)',
        padding: 'clamp(30px, 4.4vw, 66px) 0',
      }}
    >
      <div className="mx-auto" style={{ maxWidth: '1400px', padding: '0 clamp(14px, 3vw, 34px)' }}>
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-6" style={{ marginBottom: '26px' }}>
          <div>
            <p className="wup-eyebrow" style={{ margin: '0 0 10px' }}>Live right now</p>
            <h2 className="wup-h2" style={{ margin: 0 }}>Live Competitions.</h2>
          </div>
          <p className="wup-body-sm" style={{ maxWidth: '380px', margin: 0 }}>
            Pick your card, grab a ticket, see the result published.
            {minPrice !== null ? ` Tickets from £${minPrice.toFixed(2)}.` : ''}
          </p>
        </div>

        {/* Empty state — no live competitions yet */}
        {competitions.length === 0 ? (
          <div
            className="text-center"
            style={{ padding: '48px 24px', border: '1px solid var(--line-2)', background: 'var(--surface)' }}
          >
            <div style={{ fontSize: '44px', marginBottom: '12px' }}>🎴</div>
            <p className="wup-title" style={{ marginBottom: '6px' }}>No competitions live right now</p>
            <p className="wup-body-sm" style={{ margin: 0 }}>New drops land regularly — check back soon.</p>
          </div>
        ) : (
          /* Fixture table */
          <div>
            <FixtureHeader />
            {competitions.map((c, i) => (
              <FixtureRow key={c.id} competition={c} index={i + 1} />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="text-center" style={{ marginTop: '32px' }}>
          <Link href="/competitions" className="wup-btn wup-btn--primary">
            View all competitions →
          </Link>
        </div>
      </div>
    </section>
  );
}
