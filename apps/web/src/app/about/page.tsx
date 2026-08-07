import type { Metadata } from 'next';
import Link from 'next/link';
import { TrustStrip } from '@/components/home/trust-strip';
import { HomeCTABand } from '@/components/home/home-cta-band';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Learn about WinUPrize, the UK-based prize competition platform for collectible cards and memorabilia.',
  openGraph: {
    title: 'About Us | WinUPrize',
    description: 'Real cards. Real winners. Zero BS.',
  },
};

// Forward-looking commitments only — NOT historical counts. (We deliberately don't
// claim "£X paid" / "N cards won" numbers we can't stand behind on day one.)
const stats = [
  { v: '100%', l: 'Results Published' },
  { v: '100%', l: 'Graded & Authenticated' },
  { v: 'FREE', l: 'Postal Entry Route' },
  { v: '24H', l: 'Winner Notified' },
];

// Operating company details (spec screen 9). Trading name only — the legal
// entity is unchanged.
const companyRows: [string, string][] = [
  ['Operating company', 'YD PARTNERS LTD (company no. 16766570)'],
  ['Trading name', 'WinUPrize'],
  ['Registered address', '71-75 Shelton Street, Covent Garden, London WC2H 9JQ'],
  ['Email', 'contact@winuprize.com'],
  ['Draw partner', 'RandomDraws.com (independent)'],
  ['Eligibility', '18+'],
];

const pillars = [
  {
    mark: '01 / Transparency',
    title: 'Every result, published.',
    body: "No \"trust us\". Every winner is drawn by an independent third party, and the result is published and verifiable on the competition page within 24 hours — the winning ticket number alongside the entrant's first name and city.",
    foot: { text: "Watch last week's →", href: '/winners', label: 'winners' },
  },
  {
    mark: '02 / Provenance',
    title: 'Graded & authenticated.',
    body: "Every card is professionally graded and cross-referenced by its cert number before we list it, and memorabilia comes with its certificate of authenticity. You win exactly what you saw — with full documentation and a chain of custody.",
    foot: { text: 'View our', href: '/competitions', label: 'live comps' },
  },
  {
    mark: '03 / Access',
    title: 'Free postal entry, always.',
    body: "UK law requires a free route. We don't just comply — we make it easy: write your details on a postcard or piece of paper and post it to us in an envelope, one entry per envelope (send as many as you like), same odds as paid entries. If you can't pay, you can still play.",
    foot: { text: 'Full rules →', href: '/competition-rules', label: 'Comp Rules' },
  },
];


export default function AboutPage() {
  return (
    <main>
      {/* Hero with breathing glow */}
      <section className="wup-hero">
        <div className="wup-hero__glow" aria-hidden="true" />
        <div
          className="relative mx-auto"
          style={{ maxWidth: '1400px', padding: 'clamp(38px, 5.5vw, 78px) clamp(14px, 3vw, 34px)' }}
        >
          <p className="wup-eyebrow wup-in-skew" style={{ margin: '0 0 16px' }}>About us</p>
          <h1 className="wup-h1 wup-in-slam" style={{ animationDelay: '0.05s', margin: '0 0 20px', maxWidth: '900px' }}>
            The UK&apos;s premium
            <br />
            <span style={{ color: 'var(--accent)' }}>card competitions.</span>
          </h1>
          <p className="wup-body wup-in-wipe" style={{ animationDelay: '0.3s', maxWidth: '640px', margin: 0 }}>
            Real cards. Real winners. Every draw run by an independent third party
            and published within 24 hours — with a free postal entry route on every
            competition, as UK law requires.
          </p>
        </div>
      </section>

      {/* Commitments */}
      <section style={{ padding: 'clamp(30px, 4.4vw, 66px) clamp(14px, 3vw, 34px)' }}>
        <div
          className="mx-auto"
          style={{
            maxWidth: '1400px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: 'clamp(14px, 1.8vw, 22px)',
          }}
        >
          {stats.map((s) => (
            <div key={s.l} className="wup-panel wup-panel--accent-top" style={{ padding: 'clamp(18px, 2vw, 26px)' }}>
              <div className="wup-num" style={{ fontSize: 'clamp(30px, 4vw, 44px)', color: 'var(--accent)' }}>{s.v}</div>
              <div className="wup-meta" style={{ marginTop: '8px' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Value pillars */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', padding: 'clamp(30px, 4.4vw, 66px) clamp(14px, 3vw, 34px)' }}>
        <div className="mx-auto" style={{ maxWidth: '1400px' }}>
          <p className="wup-eyebrow" style={{ margin: '0 0 10px' }}>What we stand for</p>
          <h2 className="wup-h2" style={{ margin: '0 0 30px' }}>How we operate.</h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: 'clamp(14px, 1.8vw, 22px)',
            }}
          >
            {pillars.map((p) => (
              <article
                key={p.mark}
                className="wup-panel wup-panel--accent-top wup-panel--hover"
                style={{ background: 'var(--bg)', padding: 'clamp(18px, 2vw, 26px)' }}
              >
                <div className="wup-meta" style={{ marginBottom: '10px' }}>{p.mark}</div>
                <h3 className="wup-title" style={{ margin: '0 0 12px' }}>{p.title}</h3>
                <p className="wup-body-sm" style={{ margin: '0 0 14px' }}>{p.body}</p>
                <Link href={p.foot.href} className="wup-btn wup-btn--link" style={{ fontSize: '15px' }}>
                  {p.foot.text}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Company details */}
      <section style={{ padding: 'clamp(30px, 4.4vw, 66px) clamp(14px, 3vw, 34px)' }}>
        <div className="mx-auto" style={{ maxWidth: '900px' }}>
          <h2 className="wup-h2-doc" style={{ marginBottom: '18px' }}>Company details</h2>
          <ul className="about-card-details" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {companyRows.map(([k, v]) => (
              <li key={k}>
                <span className="about-card-k">{k}</span>
                <span className="about-card-v">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <TrustStrip />
      <HomeCTABand />
    </main>
  );
}
