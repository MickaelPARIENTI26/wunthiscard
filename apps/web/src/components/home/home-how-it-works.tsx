import Link from 'next/link';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Chip } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';

const steps = [
  { n: '01', t: 'Browse', lead: 'Pick the card you want to win.', swatch: 'var(--accent)' },
  { n: '02', t: 'Answer', lead: 'One fair skill question per entry.', swatch: 'var(--warn)' },
  { n: '03', t: 'Enter', lead: 'Pick numbers. Stack your odds.', swatch: 'var(--pop)' },
  { n: '04', t: 'Win', lead: 'Live TikTok draw. Tracked delivery.', swatch: 'var(--hot)' },
];

const bodies = [
  'Curated drops across Pokémon, One Piece TCG, sports cards and signed memorabilia. Each comp shows the prize value, ticket price, and tickets left — no surprises.',
  'UK law requires a skill test — we ask a fair trivia question about the card you\'re entering. Correct answer = valid entry. Simple.',
  'Choose ticket numbers manually or let us auto-pick. Buy bundles and unlock bonus tickets. The more tickets, the better your shot.',
  'When the comp closes we run a certified RNG draw on TikTok Live. Winner notified within 24h. Insured tracked shipping, free in the UK.',
];

export function HomeHowItWorks() {
  return (
    <section className="mx-auto px-5 sm:px-8 py-15 sm:py-20" style={{ maxWidth: '1440px' }}>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-8 mb-10">
        <div>
          <Eyebrow>The Process</Eyebrow>
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
            How it <Chip color="accent" className="rounded-[10px]">works</Chip>.
          </h2>
        </div>
        <p style={{ color: 'var(--ink-dim)', fontSize: '15px', maxWidth: '360px', lineHeight: 1.5 }}>
          Win your dream card in four simple steps.
        </p>
      </div>

      {/* Steps */}
      <div className="hiw-steps">
        {steps.map((s, i) => (
          <article key={s.n} className="hiw-step">
            <aside className="hiw-step-num" style={{ background: s.swatch }}>
              <span
                style={{
                  fontFamily: 'var(--display)',
                  fontSize: '104px',
                  fontWeight: 700,
                  letterSpacing: '-0.06em',
                  color: 'var(--ink)',
                  position: 'relative',
                  lineHeight: 1,
                }}
              >
                {s.n}
              </span>
            </aside>
            <div
              className="hiw-step-body"
              style={{
                background: 'var(--surface)',
                border: '1.5px solid var(--ink)',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow)',
                padding: '28px 32px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-faint)', fontWeight: 700, marginBottom: '8px' }}>
                Step {s.n} · {s.t}
              </div>
              <h3 style={{ fontFamily: 'var(--display)', fontSize: '34px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05, margin: '0 0 12px' }}>
                {s.lead}
              </h3>
              <p style={{ color: 'var(--ink-dim)', fontSize: '15px', lineHeight: 1.6 }}>
                {bodies[i]}
              </p>
            </div>
          </article>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center mt-8">
        <Button variant="ghost" size="lg" asChild>
          <Link href="/how-it-works">Learn more about the process →</Link>
        </Button>
      </div>
    </section>
  );
}
