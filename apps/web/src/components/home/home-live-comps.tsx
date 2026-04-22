import Link from 'next/link';
import { CompCard } from './comp-card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Button } from '@/components/ui/button';

interface Competition {
  id: string;
  slug: string;
  title: string;
  mainImageUrl: string;
  category: string;
  prizeValue: number;
  ticketPrice: number;
  totalTickets: number | null;
  soldTickets: number;
  status: string;
}

interface HomeLiveCompsProps {
  competitions: Competition[];
}

export function HomeLiveComps({ competitions }: HomeLiveCompsProps) {
  return (
    <section
      className="section-gray"
      style={{ borderTop: '1.5px solid var(--ink)', borderBottom: '1.5px solid var(--ink)' }}
    >
      <div className="mx-auto px-5 sm:px-8 py-15 sm:py-20" style={{ maxWidth: '1440px' }}>
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-8 mb-10">
          <div>
            <Eyebrow>Live Right Now</Eyebrow>
            <h2
              style={{
                fontFamily: 'var(--display)',
                fontSize: 'clamp(28px, 5.5vw, 72px)',
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 0.96,
                marginTop: '12px',
              }}
            >
              Live{' '}
              <span style={{ textDecoration: 'underline', textDecorationColor: 'var(--accent)', textDecorationThickness: '5px', textUnderlineOffset: '6px' }}>
                Competitions
              </span>.
            </h2>
          </div>
          <p style={{ color: 'var(--ink-dim)', fontSize: '15px', maxWidth: '360px', lineHeight: 1.5 }}>
            Pick your card, grab a ticket, watch the draw live. Tickets from £2.99.
          </p>
        </div>

        {/* Grid */}
        <div className="comp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {competitions.map((c) => (
            <CompCard
              key={c.id}
              slug={c.slug}
              title={c.title}
              mainImageUrl={c.mainImageUrl}
              category={c.category}
              prizeValue={c.prizeValue}
              ticketPrice={c.ticketPrice}
              totalTickets={c.totalTickets}
              soldTickets={c.soldTickets}
              status={c.status}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Button variant="primary" size="lg" asChild>
            <Link href="/competitions">View all competitions →</Link>
          </Button>
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 960px) {
          .comp-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .comp-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
