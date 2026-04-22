import type { Metadata } from 'next';
import { Chip } from '@/components/ui/chip';
import { TrustStrip } from '@/components/home/trust-strip';
import { HomeCTABand } from '@/components/home/home-cta-band';

export const metadata: Metadata = {
  title: 'How It Works',
  description:
    'Learn how WinUCard prize competitions work. Browse competitions, select tickets, answer a skill question, and win amazing collectible cards and memorabilia.',
  openGraph: {
    title: 'How It Works | WinUCard',
    description:
      'Learn how WinUCard prize competitions work. Browse, answer, enter, win.',
  },
};

const steps = [
  {
    n: '01', t: 'Browse',
    lead: 'Pick the card you want to win.',
    b: "Curated drops across Pokémon, One Piece TCG, sports cards and signed memorabilia. Each comp shows the prize value, ticket price, tickets left and draw date — no surprises, no hidden cost.",
    swatch: 'var(--accent)',
    bullets: ['PSA 10 authenticated', 'Live count of tickets left', 'Countdown to draw'],
  },
  {
    n: '02', t: 'Answer',
    lead: 'One skill question per entry.',
    b: "UK prize-competition law requires a skill test — we ask you a fair trivia question about the card you're entering for. Correct answer = valid entry. Simple.",
    swatch: 'var(--warn)',
    bullets: ['Category-specific questions', 'Multiple choice, 4 options', 'You see the answer after the draw'],
  },
  {
    n: '03', t: 'Enter',
    lead: 'Pick your numbers. Stack your odds.',
    b: 'Choose ticket numbers manually or let us auto-pick. Buy bundles and unlock bonus tickets — buy 10, get 2 free. The more tickets, the better your shot.',
    swatch: 'var(--pop)',
    bullets: ['Manual or auto-pick', 'Bonus tickets on bundles', 'Apple Pay · Google Pay · Card'],
  },
  {
    n: '04', t: 'Win',
    lead: 'Live draw. Tracked delivery.',
    b: "When the comp sells out (or hits its end date), we run a certified RNG draw — streamed live on TikTok. Winner notified within 24h. Insured tracked shipping, free in the UK.",
    swatch: 'var(--hot)',
    bullets: ['RNG + live TikTok draw', 'Winner posted publicly', 'Free UK delivery'],
  },
];


export default function HowItWorksPage() {
  return (
    <main>
      {/* Editorial hero */}
      <section className="hiw-hero">
        <div
          className="inline-flex items-center gap-2.5"
          style={{
            padding: '7px 14px', border: '1.5px solid var(--ink)', borderRadius: '999px',
            background: 'var(--surface)', boxShadow: '2px 2px 0 var(--ink)',
            fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.12em',
            textTransform: 'uppercase', fontWeight: 600, marginBottom: '24px',
          }}
        >
          <span className="live-dot" /> The Process · 4 Steps
        </div>

        <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(32px, 7vw, 104px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.92, margin: '0 0 22px' }}>
          Win in <Chip color="accent">four</Chip><br />
          <span style={{ textDecoration: 'underline', textDecorationColor: 'var(--hot)', textDecorationThickness: '6px', textUnderlineOffset: '8px' }}>simple</span> steps.
        </h1>

        <p style={{ fontSize: '18px', color: 'var(--ink-dim)', lineHeight: 1.55, maxWidth: '640px', margin: '0 auto 32px' }}>
          No gambling. No loopholes. A skill-based UK prize competition where <b style={{ color: 'var(--ink)', background: 'var(--accent)', padding: '1px 6px', borderRadius: '5px' }}>anyone with a good memory</b> has a real shot at a PSA 10 card.
        </p>

        <div className="hiw-hero-marquee">
          ★ BROWSE · ANSWER · ENTER · WIN · BROWSE · ANSWER · ENTER · WIN · BROWSE · ANSWER · ENTER · WIN ★
        </div>
      </section>

      {/* Big numbered zigzag steps */}
      <section className="section-gray" style={{ borderTop: '1.5px solid var(--ink)', borderBottom: '1.5px solid var(--ink)' }}>
        <div className="mx-auto px-5 sm:px-8 py-15 sm:py-20" style={{ maxWidth: '1440px' }}>
          <div className="hiw-steps">
            {steps.map((s) => (
              <article key={s.n} className="hiw-step">
                <aside className="hiw-step-num" style={{ background: s.swatch }}>
                  <span style={{ fontFamily: 'var(--display)', fontSize: '104px', fontWeight: 700, letterSpacing: '-0.06em', color: 'var(--ink)', position: 'relative', lineHeight: 1 }}>
                    {s.n}
                  </span>
                </aside>
                <div className="hiw-step-body" style={{ background: 'var(--surface)', border: '1.5px solid var(--ink)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-faint)', fontWeight: 700, marginBottom: '8px' }}>
                    Step {s.n} · {s.t}
                  </div>
                  <h3 style={{ fontFamily: 'var(--display)', fontSize: '34px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05, margin: '0 0 12px' }}>
                    {s.lead}
                  </h3>
                  <p style={{ color: 'var(--ink-dim)', fontSize: '15px', lineHeight: 1.6, marginBottom: '14px' }}>
                    {s.b}
                  </p>
                  <ul className="flex flex-wrap" style={{ gap: '8px 18px' }}>
                    {s.bullets.map((b, j) => (
                      <li key={j} className="inline-flex items-center gap-2" style={{ fontSize: '13px', fontWeight: 600 }}>
                        <span className="grid place-items-center" style={{ width: '20px', height: '20px', borderRadius: '50%', background: s.swatch, border: '1.5px solid var(--ink)', fontSize: '10px', flexShrink: 0 }}>✓</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <TrustStrip />
      <HomeCTABand />
    </main>
  );
}
