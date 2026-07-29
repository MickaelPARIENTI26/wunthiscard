import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactForm } from './contact-form';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the WinUPrize team. We reply to every message within 24 hours.',
  openGraph: {
    title: 'Contact Us | WinUPrize',
    description: 'Talk to a human. Our team replies from London — not a call centre.',
  },
};

const infoRows = [
  { label: 'Email', value: 'contact@winuprize.com', meta: 'General enquiries + support' },
  { label: 'Postal / HQ', value: 'YD PARTNERS LTD (WinUPrize)\n71-75 Shelton Street\nCovent Garden\nLondon WC2H 9JQ', meta: 'Also the address for free postal entries.' },
  { label: 'Response', value: 'Within 24h (Mon–Fri)', meta: 'We triage by urgency — prize/win issues first.' },
];

const socials = [
  { href: 'https://www.instagram.com/winuprize/', label: 'Instagram' },
  { href: 'https://www.tiktok.com/@winuprize', label: 'TikTok' },
];

export default function ContactPage() {
  return (
    <main>
      {/* Page header on the raised panel surface */}
      <header
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--line)',
          padding: 'clamp(30px, 4.4vw, 66px) clamp(14px, 3vw, 34px)',
        }}
      >
        <div className="mx-auto" style={{ maxWidth: '1400px' }}>
          <p className="wup-eyebrow" style={{ margin: '0 0 10px' }}>Get in touch</p>
          <h1 className="wup-h1" style={{ margin: '0 0 14px' }}>Contact.</h1>
          <p className="wup-body" style={{ maxWidth: '560px', margin: 0 }}>
            Talk to a human. Our team replies from London — not a call centre.
          </p>
        </div>
      </header>

      {/* Two columns: form left, details right */}
      <section style={{ padding: 'clamp(24px, 3.4vw, 44px) clamp(14px, 3vw, 34px)' }}>
        <div
          className="mx-auto"
          style={{
            maxWidth: '1100px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'clamp(22px, 3.2vw, 44px)',
            alignItems: 'flex-start',
          }}
        >
          {/* Form */}
          <div className="wup-panel wup-panel--accent-top" style={{ flex: '1 1 420px', padding: 'clamp(20px, 2.6vw, 32px)' }}>
            <h2 className="wup-title" style={{ fontSize: 'clamp(20px, 2.4vw, 24px)', margin: '0 0 18px' }}>
              Send a message
            </h2>
            <ContactForm />
          </div>

          {/* Details */}
          <aside style={{ flex: '1 1 300px', minWidth: 0 }}>
            <h2 className="wup-h2-doc" style={{ marginBottom: '18px' }}>Get in touch</h2>
            <dl style={{ margin: 0 }}>
              {infoRows.map((r) => (
                <div key={r.label} style={{ padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
                  <dt className="wup-meta" style={{ marginBottom: '6px' }}>{r.label}</dt>
                  <dd style={{ margin: 0, fontSize: '15px', color: 'var(--ink)', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                    {r.value}
                  </dd>
                  <dd className="wup-fine" style={{ margin: '4px 0 0' }}>{r.meta}</dd>
                </div>
              ))}
            </dl>

            {/* Free postal entry note */}
            <div
              className="wup-panel wup-panel--accent-left"
              style={{ marginTop: '22px', padding: '18px 20px' }}
            >
              <p className="wup-eyebrow" style={{ fontSize: '13px', margin: '0 0 8px' }}>Free postal entry</p>
              <p className="wup-body-sm" style={{ margin: '0 0 10px' }}>
                Every competition has a free entry route by post — same odds as a paid
                ticket. Send a handwritten postcard to the address above.
              </p>
              <Link href="/competition-rules" className="wup-btn wup-btn--link" style={{ fontSize: '15px' }}>
                Full rules →
              </Link>
            </div>

            {/* Socials */}
            <div className="flex flex-wrap" style={{ gap: '8px', marginTop: '22px' }}>
              {socials.map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hard-shadow"
                  style={{
                    padding: '8px 14px',
                    fontFamily: 'var(--display)',
                    fontWeight: 600,
                    fontSize: '13px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-dim)',
                  }}
                >
                  {s.label}
                </a>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* Quick answers */}
      <section style={{ padding: '0 clamp(14px, 3vw, 34px) clamp(40px, 6vw, 80px)' }}>
        <div
          className="wup-panel wup-panel--accent-top mx-auto text-center"
          style={{ maxWidth: '1100px', padding: 'clamp(26px, 3.4vw, 44px)' }}
        >
          <h2 className="wup-h2" style={{ fontSize: 'clamp(24px, 3.4vw, 38px)', margin: '0 0 12px' }}>
            Looking for a quick answer?
          </h2>
          <p className="wup-body-sm" style={{ margin: '0 auto 24px', maxWidth: '520px' }}>
            Most questions about entries, draws and delivery are already answered in the FAQ.
          </p>
          <Link href="/faq" className="wup-btn wup-btn--primary">Read the FAQ →</Link>
        </div>
      </section>
    </main>
  );
}
