import Link from 'next/link';
import { Reveal } from '@/components/common/reveal';

const steps = [
  {
    n: '01',
    t: 'Browse',
    lead: 'Pick the card you want to win.',
    body: 'Curated drops across Pokémon, One Piece TCG, sports cards and signed memorabilia. Each comp shows the prize value, ticket price, and tickets left — no surprises.',
    bullets: ['Prize value shown up front', 'Live tickets-left counter', 'Graded & authenticated lots'],
  },
  {
    n: '02',
    t: 'Answer',
    lead: 'One fair skill question per entry.',
    body: "UK law requires a skill test — we ask a fair trivia question about the card you're entering. Correct answer = valid entry. Simple.",
    bullets: ['Multiple choice', 'Up to 3 attempts', 'Free postal route available'],
  },
  {
    n: '03',
    t: 'Enter',
    lead: 'Stack your odds.',
    body: 'Ticket numbers are assigned automatically at checkout. Buy bundles and unlock bonus tickets — the more tickets, the better your shot.',
    bullets: ['Bonus tickets on bundles', 'Secure card payment', 'Instant confirmation email'],
  },
  {
    n: '04',
    t: 'Win',
    lead: 'Independent draw. Tracked delivery.',
    body: 'When the comp closes, an independent third party draws the winner. We publish the result on the competition page and notify the winner within 24h. Insured tracked shipping, free in the UK.',
    bullets: ['Drawn by RandomDraws.com', 'Winner notified within 24h', 'Free insured UK delivery'],
  },
];

export function HomeHowItWorks() {
  return (
    <section
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--line)',
        padding: 'clamp(30px, 4.4vw, 66px) 0',
      }}
    >
      <div className="mx-auto" style={{ maxWidth: '1400px', padding: '0 clamp(14px, 3vw, 34px)' }}>
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-6" style={{ marginBottom: '30px' }}>
          <div>
            <p className="wup-eyebrow" style={{ margin: '0 0 10px' }}>The process</p>
            <h2 className="wup-h2" style={{ margin: 0 }}>How it works.</h2>
          </div>
          <p className="wup-body-sm" style={{ maxWidth: '380px', margin: 0 }}>
            Win your dream card in four simple steps.
          </p>
        </div>

        {/* Four cards, gold top edge */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
            gap: 'clamp(14px, 1.8vw, 22px)',
          }}
        >
          {steps.map((s, i) => (
            <Reveal
              key={s.n}
              as="article"
              index={i}
              className="wup-panel wup-panel--accent-top wup-panel--hover"
              style={{ background: 'var(--bg)', padding: 'clamp(18px, 2vw, 26px)' }}
            >
              <div className="wup-num" style={{ fontSize: '52px', color: 'var(--accent)', marginBottom: '10px' }}>
                {s.n}
              </div>
              <div className="wup-meta" style={{ marginBottom: '8px' }}>
                Step {s.n} · {s.t}
              </div>
              <h3 className="wup-title" style={{ margin: '0 0 10px' }}>{s.lead}</h3>
              <p className="wup-body-sm" style={{ margin: '0 0 14px' }}>{s.body}</p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-start" style={{ gap: '8px', fontSize: '14px', color: 'var(--ink-dim)' }}>
                    <span aria-hidden="true" style={{ color: 'var(--accent)', fontWeight: 700 }}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center" style={{ marginTop: '30px' }}>
          <Link href="/how-it-works" className="wup-btn wup-btn--link">
            Learn more about the process →
          </Link>
        </div>
      </div>
    </section>
  );
}
