import type { Metadata } from 'next';
import Link from 'next/link';
import { Chip } from '@/components/ui/chip';
import { Eyebrow } from '@/components/ui/eyebrow';
import { TrustStrip } from '@/components/home/trust-strip';
import { HomeCTABand } from '@/components/home/home-cta-band';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Learn about WinUCard, the UK-based prize competition platform for collectible cards and memorabilia.',
  openGraph: {
    title: 'About Us | WinUCard',
    description: 'Real cards. Real winners. Zero BS.',
  },
};

const stats = [
  { v: '£500K+', l: 'Prizes Paid', c: 'var(--accent)' },
  { v: '482', l: 'Cards Won', c: 'var(--hot)' },
  { v: '100%', l: 'Live TikTok Draws', c: 'var(--pop)' },
  { v: 'PSA 10', l: 'Every Card Graded', c: 'var(--warn)' },
];

const pillars = [
  {
    mark: '01 / Transparency',
    title: 'Every draw, live.',
    body: "No pre-recorded videos. No \"trust us\". Every single draw is streamed on TikTok Live with a certified RNG rolling on-screen. The winning ticket is posted publicly — alongside the entrant's first name and city.",
    foot: { text: "Watch last week's →", href: '/winners', label: 'winners' },
  },
  {
    mark: '02 / Provenance',
    title: 'Only PSA 10.',
    body: "If it isn't PSA-graded, it isn't on WinUCard. Every card is authenticated, encapsulated, and cross-referenced by cert number before we list it. You win exactly what you saw — with full documentation and a chain of custody.",
    foot: { text: 'View our', href: '/competitions', label: 'live comps' },
  },
  {
    mark: '03 / Access',
    title: 'Free postal entry, always.',
    body: "UK law requires a free route. We don't just comply — we make it easy: handwritten postcard, one per comp per day, same odds as paid entries. If you can't pay, you can still play.",
    foot: { text: 'Full rules →', href: '/competition-rules', label: 'Comp Rules' },
  },
];


export default function AboutPage() {
  return (
    <main>
      {/* Editorial hero */}
      <section className="mx-auto px-5 sm:px-8" style={{ maxWidth: '1440px', padding: '80px 32px 48px' }}>
        <div className="about-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '48px', alignItems: 'center' }}>
          <div>
            <div
              className="inline-flex items-center gap-2.5"
              style={{
                padding: '7px 14px', background: 'var(--ink)', color: 'var(--accent)',
                borderRadius: '999px', fontFamily: 'var(--mono)', fontSize: '11px',
                letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '28px',
              }}
            >
              <span className="live-dot" style={{ boxShadow: '0 0 10px var(--accent)' }} /> About WinUCard
            </div>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(36px, 8vw, 124px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.9 }}>
              Real cards.<br />
              <span style={{ textDecoration: 'underline', textDecorationColor: 'var(--accent)', textDecorationThickness: '7px', textUnderlineOffset: '8px' }}>Real winners.</span><br />
              <Chip color="accent" className="mt-2">Zero BS.</Chip>
            </h1>
          </div>

          {/* Manifesto quote card */}
          <div
            className="relative"
            style={{
              background: 'var(--surface)', border: '1.5px solid var(--ink)',
              borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
              padding: '34px 36px', fontSize: '18px', lineHeight: 1.55,
            }}
          >
            <div style={{ fontFamily: 'var(--display)', fontSize: '140px', fontWeight: 700, lineHeight: 0.4, color: 'var(--accent)', position: 'absolute', top: '40px', left: '18px', pointerEvents: 'none' }}>
              &ldquo;
            </div>
            <p style={{ position: 'relative', paddingLeft: '40px' }}>
              We started WinUCard because Grail cards shouldn&apos;t be locked away in vaults owned by the richest collectors. A Charizard PSA 10 for £9.99 a ticket? That&apos;s not a gimmick — that&apos;s how we give the hobby back to the hobbyists.
            </p>
            <div style={{ marginTop: '18px', paddingLeft: '40px', fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-dim)', fontWeight: 600 }}>
              — The WinUCard team
            </div>
          </div>
        </div>

        {/* Responsive */}
        <style>{`
          @media (max-width: 900px) {
            .about-hero-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>

      {/* Stats band */}
      <section className="about-stats">
        {stats.map((s) => (
          <div key={s.l} className="about-stat">
            <div style={{ fontFamily: 'var(--display)', fontSize: 'clamp(40px, 5vw, 68px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '10px', color: s.c }}>
              {s.v}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
              {s.l}
            </div>
          </div>
        ))}
      </section>

      {/* Pillars */}
      <section className="drop-section">
        <div className="flex flex-wrap items-end justify-between gap-8 mb-10">
          <div>
            <Eyebrow>What We Stand For</Eyebrow>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(28px, 5.5vw, 72px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.96, marginTop: '12px' }}>
              Three{' '}
              <span style={{ textDecoration: 'underline', textDecorationColor: 'var(--accent)', textDecorationThickness: '5px', textUnderlineOffset: '6px' }}>rules</span>.
            </h2>
          </div>
          <p style={{ color: 'var(--ink-dim)', fontSize: '15px', maxWidth: '360px', lineHeight: 1.5 }}>
            We say no to a lot of things so we can say yes to the ones that matter.
          </p>
        </div>

        <div className="about-pillars">
          {pillars.map((p) => (
            <article
              key={p.mark}
              className="flex flex-col gap-3.5 transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[var(--shadow-lg)]"
              style={{ background: 'var(--surface)', border: '1.5px solid var(--ink)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '30px 28px 24px' }}
            >
              <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-faint)', fontWeight: 700 }}>
                {p.mark}
              </span>
              <h3 style={{ fontFamily: 'var(--display)', fontSize: '30px', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
                {p.title}
              </h3>
              <p style={{ color: 'var(--ink-dim)', fontSize: '14.5px', lineHeight: 1.6, flex: 1 }}>
                {p.body}
              </p>
              <div style={{ paddingTop: '14px', borderTop: '1px dashed var(--line-2)', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-dim)', fontWeight: 700 }}>
                {p.foot.text} <Link href={p.foot.href} style={{ color: 'var(--ink)', borderBottom: '1.5px solid var(--accent)' }}>{p.foot.label}</Link>
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
