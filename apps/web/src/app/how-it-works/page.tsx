import type { Metadata } from 'next';
import { TrustStrip } from '@/components/home/trust-strip';
import { HomeCTABand } from '@/components/home/home-cta-band';

export const metadata: Metadata = {
  title: 'How It Works',
  description:
    'Learn how WinUPrize prize competitions work. Browse competitions, select tickets, answer a skill question, and win amazing collectible cards and memorabilia.',
  openGraph: {
    title: 'How It Works | WinUPrize',
    description:
      'Learn how WinUPrize prize competitions work. Browse, answer, enter, win.',
  },
};

const steps = [
  {
    n: '01', t: 'Browse',
    lead: 'Pick the card you want to win.',
    b: "Curated drops across Pokémon, One Piece TCG, sports cards and signed memorabilia. Each comp shows the prize value, ticket price, tickets left and draw date — no surprises, no hidden cost.",
    bullets: ['Graded & authenticated', 'Live count of tickets left', 'Countdown to draw'],
  },
  {
    n: '02', t: 'Answer',
    lead: 'One skill question per entry.',
    b: "UK prize-competition law requires a skill test — we ask you a fair trivia question about the card you're entering for. Correct answer = valid entry. Simple.",
    bullets: ['Category-specific questions', 'Multiple choice, 4 options', 'You see the answer after the draw'],
  },
  {
    n: '03', t: 'Enter',
    lead: 'Stack your odds.',
    b: 'Ticket numbers are assigned automatically at checkout. Buy bundles and unlock bonus tickets — buy 10, get 1 free. The more tickets, the better your shot.',
    bullets: ['Bonus tickets on bundles', 'Secure card payment', 'Instant confirmation email'],
  },
  {
    n: '04', t: 'Win',
    lead: 'Independent draw. Tracked delivery.',
    b: "When the comp sells out (or hits its end date), the winner is drawn by an independent third party. The result is published and verifiable on the competition page, and the winner is notified within 24h. Insured tracked shipping, free in the UK.",
    bullets: ['Independent third-party draw', 'Winner published publicly', 'Free UK delivery'],
  },
];

/** Gold marquee strip: ★ Browse · Answer · Enter · Win ★ (18s per spec). */
function MarqueeSet({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="wup-marquee__set" aria-hidden={hidden || undefined}>
      {['Browse', 'Answer', 'Enter', 'Win'].map((w) => (
        <span key={w} className="flex items-center" style={{ gap: '26px', whiteSpace: 'nowrap' }}>
          <span aria-hidden="true">★</span>
          {w}
        </span>
      ))}
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <main>
      {/* Hero with orbiting rays */}
      <section className="wup-hero">
        <div className="wup-hero__rays" aria-hidden="true" />
        <div
          className="relative mx-auto text-center"
          style={{ maxWidth: '900px', padding: 'clamp(38px, 5.5vw, 78px) clamp(14px, 3vw, 34px)' }}
        >
          <p className="wup-eyebrow wup-in-skew" style={{ margin: '0 0 16px' }}>The process · 4 steps</p>

          <h1 className="wup-h1 wup-in-slam" style={{ animationDelay: '0.05s', margin: '0 0 20px' }}>
            Win in four
            <br />
            <span style={{ color: 'var(--accent)' }}>simple steps.</span>
          </h1>

          <p className="wup-body wup-in-wipe" style={{ animationDelay: '0.3s', maxWidth: '640px', margin: '0 auto' }}>
            No gambling. No loopholes. A skill-based UK prize competition where anyone
            with a good memory has a real shot at a grail card.
          </p>
        </div>
      </section>

      <div className="wup-marquee wup-marquee--gold">
        <div className="wup-marquee__track wup-marquee__track--fast">
          <MarqueeSet />
          <MarqueeSet hidden />
        </div>
      </div>

      {/* Full-width horizontal step blocks with a gold left edge */}
      <section style={{ padding: 'clamp(30px, 4.4vw, 66px) clamp(14px, 3vw, 34px)' }}>
        <div className="mx-auto flex flex-col" style={{ maxWidth: '1400px', gap: 'clamp(14px, 1.8vw, 22px)' }}>
          {steps.map((s) => (
            <article key={s.n} className="hiw-block">
              <div className="hiw-block__num wup-num" aria-hidden="true">{s.n}</div>
              <div style={{ minWidth: 0 }}>
                <div className="wup-meta" style={{ marginBottom: '8px' }}>
                  Step {s.n} · {s.t}
                </div>
                <h2 className="wup-title" style={{ fontSize: 'clamp(20px, 2.6vw, 28px)', margin: '0 0 12px' }}>
                  {s.lead}
                </h2>
                <p className="wup-body-sm" style={{ margin: '0 0 14px', maxWidth: '780px' }}>{s.b}</p>
                <ul className="flex flex-wrap" style={{ gap: '8px 22px', listStyle: 'none', margin: 0, padding: 0 }}>
                  {s.bullets.map((b) => (
                    <li key={b} className="inline-flex items-center" style={{ gap: '8px', fontSize: '14px', color: 'var(--ink-dim)' }}>
                      <span aria-hidden="true" style={{ color: 'var(--accent)', fontWeight: 700 }}>✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <TrustStrip />
      <HomeCTABand />
    </main>
  );
}
