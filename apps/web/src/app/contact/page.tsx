import type { Metadata } from 'next';
import Link from 'next/link';
import { Chip } from '@/components/ui/chip';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the WinUCard team. We reply to every message within 24 hours.',
  openGraph: {
    title: 'Contact Us | WinUCard',
    description: 'Talk to a human. Our team replies from London — not a call centre.',
  },
};

const infoRows = [
  { label: 'Email', value: 'hello@winucard.com', meta: 'General enquiries + support' },
  { label: 'Press', value: 'press@winucard.com', meta: 'Media, partnerships, PR' },
  { label: 'Postal / HQ', value: 'WinUCard Ltd\nUnit 14 Skyline House\n200 Union Street\nLondon SE1 0LX', meta: 'Also the address for free postal entries.' },
  { label: 'Response', value: 'Within 24h (Mon–Fri)', meta: 'We triage by urgency — prize/win issues first.' },
];

const topics = ['Entry / ticket', 'Delivery', 'Account', 'Press', 'Other'];
const socials = [
  { href: 'https://tiktok.com/@winucard', label: 'TikTok' },
  { href: 'https://instagram.com/winucard', label: 'Instagram' },
  { href: 'https://youtube.com/@winucard', label: 'YouTube' },
  { href: 'https://discord.gg/winucard', label: 'Discord' },
];

export default function ContactPage() {
  return (
    <main>
      {/* Editorial hero */}
      <section className="px-5 sm:px-8 py-15 sm:py-20" style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', paddingBottom: '40px' }}>
        <div
          className="inline-flex items-center gap-2.5"
          style={{
            padding: '7px 14px', border: '1.5px solid var(--ink)', borderRadius: '999px',
            background: 'var(--surface)', boxShadow: '2px 2px 0 var(--ink)',
            fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.12em',
            textTransform: 'uppercase', fontWeight: 600, marginBottom: '22px',
          }}
        >
          <span className="live-dot" /> Support · Average reply &lt; 24h
        </div>

        <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(32px, 7vw, 108px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.94, margin: '0 0 18px' }}>
          Talk to a <Chip color="accent">human</Chip>.
        </h1>

        <p style={{ fontSize: '17px', color: 'var(--ink-dim)', lineHeight: 1.55, maxWidth: '620px', margin: '0 auto' }}>
          Question about a draw, a prize, your account, or the free postal route? Our team replies from the WinUCard HQ in London — not a call centre.
        </p>
      </section>

      {/* Contact grid */}
      <section className="section-gray" style={{ borderTop: '1.5px solid var(--ink)', borderBottom: '1.5px solid var(--ink)' }}>
        <div className="drop-section">
          <div className="contact-grid">
            {/* Left: editorial info list */}
            <aside style={{ background: 'var(--surface)', border: '1.5px solid var(--ink)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '32px' }}>
              <h3 style={{ fontFamily: 'var(--display)', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.025em', marginBottom: '24px', paddingBottom: '14px', borderBottom: '1.5px solid var(--ink)' }}>
                Reach us
              </h3>

              {infoRows.map((row) => (
                <div key={row.label} className="contact-info-row">
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-faint)', fontWeight: 700, marginBottom: '6px' }}>
                    {row.label}
                  </div>
                  <div style={{ fontFamily: 'var(--display)', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.45, marginBottom: '4px', whiteSpace: 'pre-line' }}>
                    {row.value}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ink-dim)', lineHeight: 1.4 }}>
                    {row.meta}
                  </div>
                </div>
              ))}

              {/* Socials */}
              <div style={{ paddingTop: '18px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-faint)', fontWeight: 700 }}>
                  Socials
                </div>
                <div className="flex flex-wrap gap-2">
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '10px 14px', minHeight: '44px', border: '1.5px solid var(--ink)', borderRadius: '999px',
                        fontSize: '12px', fontWeight: 600, background: 'var(--surface)',
                        boxShadow: '1.5px 1.5px 0 var(--ink)',
                      }}
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            </aside>

            {/* Right: form */}
            <form
              style={{
                background: 'var(--surface)', border: '1.5px solid var(--ink)',
                borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
                padding: '34px 36px', display: 'flex', flexDirection: 'column', gap: '20px',
              }}
              action="#"
            >
              <div style={{ marginBottom: '6px' }}>
                <Eyebrow>Send a message</Eyebrow>
                <h3 style={{ fontFamily: 'var(--display)', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.1, marginTop: '8px' }}>
                  We reply to every single one.
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="drop-field-label">Full name *</label>
                  <input className="drop-input" placeholder="Alex Taylor" />
                </div>
                <div>
                  <label className="drop-field-label">Email *</label>
                  <input type="email" className="drop-input" placeholder="you@domain.com" />
                </div>
              </div>

              <div>
                <label className="drop-field-label">Topic *</label>
                <div className="contact-topics">
                  {topics.map((t, i) => (
                    <label key={t} className="contact-topic">
                      <input type="radio" name="topic" defaultChecked={i === 0} />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="drop-field-label">Message *</label>
                <textarea className="drop-input" rows={6} placeholder="What's up?" style={{ resize: 'vertical' }} />
              </div>

              <div className="flex flex-wrap items-center gap-4" style={{ paddingTop: '10px' }}>
                <Button variant="hot" size="xl">Send message →</Button>
                <span style={{ fontSize: '12px', color: 'var(--ink-dim)' }}>
                  By sending you agree to our <Link href="/privacy" style={{ color: 'var(--ink)', borderBottom: '1.5px solid var(--accent)' }}>privacy policy</Link>.
                </span>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Quick answers CTA */}
      <section className="drop-section" style={{ textAlign: 'center', paddingBottom: '80px' }}>
        <h2 style={{ fontFamily: 'var(--display)', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '10px' }}>
          Looking for quick answers?
        </h2>
        <p style={{ color: 'var(--ink-dim)', marginBottom: '20px' }}>Check the FAQ for the most common questions.</p>
        <Button variant="ghost" size="lg" asChild>
          <Link href="/faq">View FAQ</Link>
        </Button>
      </section>
    </main>
  );
}
