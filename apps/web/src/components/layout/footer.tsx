import Link from 'next/link';
import { BrandWordmark } from './header';

const socialButtons = [
  { href: 'https://www.instagram.com/winuprize/', label: 'Instagram' },
  { href: 'https://www.tiktok.com/@winuprize', label: 'TikTok' },
  { href: 'https://www.facebook.com/winuprize', label: 'Facebook' },
];

const platformLinks = [
  { href: '/competitions', label: 'Competitions' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/faq', label: 'FAQ' },
];

const supportLinks = [
  { href: '/contact', label: 'Contact Us' },
  { href: '/delivery', label: 'Delivery Info' },
  { href: '/responsible-play', label: 'Responsible Play' },
];

const legalLinks = [
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/cookies', label: 'Cookie Policy' },
  { href: '/competition-rules', label: 'Competition Rules' },
];

export function Footer() {
  return (
    <footer style={{ background: 'var(--surface)', borderTop: '1px solid rgba(244, 241, 234, 0.14)' }}>
      <div
        className="mx-auto px-5 sm:px-8"
        style={{ maxWidth: '1400px', paddingTop: '46px', paddingBottom: '24px' }}
      >
        {/* Mobile: compact layout */}
        <div className="sm:hidden">
          {/* Brand + socials centred */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center justify-center" style={{ marginBottom: '12px' }}>
              <BrandWordmark size="20px" />
            </Link>
            <p style={{ color: 'var(--ink-dim)', fontSize: '12px', lineHeight: 1.55, marginBottom: '12px' }}>
              UK&apos;s premium skill-based card competition platform. 18+.
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {socialButtons.map((s) => (
                <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" className="hard-shadow"
                  style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--display)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-dim)' }}
                >{s.label}</a>
              ))}
            </div>
          </div>

          {/* Link columns: 2-up on very narrow phones, 3-up from 420px */}
          <div className="grid grid-cols-2 min-[420px]:grid-cols-3 gap-4 mb-6" style={{ borderTop: '1px solid var(--line)', paddingTop: '18px' }}>
            <FooterColumn title="Platform" links={platformLinks} compact />
            <FooterColumn title="Support" links={supportLinks} compact />
            <FooterColumn title="Legal" links={legalLinks} compact />
          </div>
        </div>

        {/* Desktop: full 4-col layout */}
        <div className="hidden sm:block">
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '48px', marginBottom: '38px' }}>
            <div>
              <Link href="/" className="inline-flex items-center" style={{ marginBottom: '14px' }}>
                <BrandWordmark size="22px" />
              </Link>
              <p style={{ color: 'var(--ink-dim)', fontSize: '14px', lineHeight: 1.6, maxWidth: '300px', marginBottom: '18px' }}>
                UK&apos;s premium skill-based card competition platform. Must be 18+.
                Please play responsibly.
              </p>
              <div className="flex flex-wrap gap-2">
                {socialButtons.map((social) => (
                  <a key={social.href} href={social.href} target="_blank" rel="noopener noreferrer" className="hard-shadow"
                    style={{ padding: '7px 14px', fontSize: '12.5px', fontWeight: 600, fontFamily: 'var(--display)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-dim)' }}
                  >{social.label}</a>
                ))}
              </div>
            </div>
            <FooterColumn title="Platform" links={platformLinks} />
            <FooterColumn title="Support" links={supportLinks} />
            <FooterColumn title="Legal" links={legalLinks} />
          </div>
        </div>

        {/* Bottom strip */}
        <div
          className="flex flex-wrap items-center justify-between gap-3"
          style={{ borderTop: '1px solid var(--line)', paddingTop: '16px', fontFamily: 'var(--display)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--ink-faint)', textTransform: 'uppercase' }}
        >
          <span>© {new Date().getFullYear()} WinUPrize · 🔒 SSL · UK Registered</span>
          <span>18+ · Games of skill · Play responsibly</span>
        </div>
      </div>

      <style>{`
        @media (min-width: 640px) and (max-width: 960px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </footer>
  );
}

function FooterColumn({ title, links, compact = false }: { title: string; links: { href: string; label: string }[]; compact?: boolean }) {
  return (
    <div>
      <h5 style={{ fontFamily: 'var(--display)', fontSize: compact ? '12.5px' : '14px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: compact ? '9px' : '14px', fontWeight: 700 }}>
        {title}
      </h5>
      <ul className="flex flex-col" style={{ gap: compact ? '7px' : '10px' }}>
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="transition-colors duration-150 hover:text-[var(--ink)]"
              style={{ fontSize: compact ? '13px' : '14.5px', color: 'var(--ink-dim)' }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
