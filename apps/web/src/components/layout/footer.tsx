import Link from 'next/link';

const socialButtons = [
  { href: 'https://tiktok.com/@winucard', label: 'TikTok' },
  { href: 'https://instagram.com/winucard', label: 'Instagram' },
  { href: 'https://youtube.com/@winucard', label: 'YouTube' },
  { href: 'https://discord.gg/winucard', label: 'Discord' },
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
    <footer style={{ borderTop: '1.5px solid var(--ink)' }}>
      <div
        className="mx-auto px-5 sm:px-8"
        style={{ maxWidth: '1440px', paddingTop: '40px', paddingBottom: '24px' }}
      >
        {/* Mobile: compact layout */}
        <div className="sm:hidden">
          {/* Brand + socials centred */}
          <div className="text-center mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 justify-center"
              style={{ fontFamily: 'var(--display)', fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}
            >
              <span
                className="grid place-items-center"
                style={{ width: 24, height: 24, background: 'var(--accent)', border: '1.5px solid var(--ink)', borderRadius: '5px', boxShadow: '1.5px 1.5px 0 var(--ink)', fontWeight: 700, fontSize: '13px', color: 'var(--ink)' }}
              >★</span>
              WinUCard
            </Link>
            <p style={{ color: 'var(--ink-dim)', fontSize: '11px', lineHeight: 1.5, marginBottom: '12px' }}>
              UK&apos;s premium skill-based card competition platform. 18+.
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {socialButtons.map((s) => (
                <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer"
                  style={{ padding: '4px 10px', border: '1.5px solid var(--ink)', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: 'var(--surface)', boxShadow: '1px 1px 0 var(--ink)' }}
                >{s.label}</a>
              ))}
            </div>
          </div>

          {/* 3 link columns side by side */}
          <div className="grid grid-cols-3 gap-4 mb-6" style={{ borderTop: '1px dashed var(--line-2)', paddingTop: '16px' }}>
            <FooterColumnCompact title="Platform" links={platformLinks} />
            <FooterColumnCompact title="Support" links={supportLinks} />
            <FooterColumnCompact title="Legal" links={legalLinks} />
          </div>
        </div>

        {/* Desktop: full 4-col layout */}
        <div className="hidden sm:block">
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '48px', marginBottom: '36px' }}>
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2.5"
                style={{ fontFamily: 'var(--display)', fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}
              >
                <span
                  className="grid place-items-center"
                  style={{ width: 28, height: 28, background: 'var(--accent)', border: '1.5px solid var(--ink)', borderRadius: '6px', boxShadow: '2px 2px 0 var(--ink)', fontWeight: 700, fontSize: '15px', color: 'var(--ink)' }}
                >★</span>
                WinUCard
              </Link>
              <p style={{ color: 'var(--ink-dim)', fontSize: '13px', lineHeight: 1.55, maxWidth: '280px', marginBottom: '18px' }}>
                UK&apos;s premium skill-based card competition platform. Must be 18+. Please play responsibly.
              </p>
              <div className="flex flex-wrap gap-2">
                {socialButtons.map((social) => (
                  <a key={social.href} href={social.href} target="_blank" rel="noopener noreferrer"
                    className="transition-colors duration-150 hover:bg-[var(--bg-2)]"
                    style={{ padding: '6px 12px', border: '1.5px solid var(--ink)', borderRadius: '999px', fontSize: '12px', fontWeight: 600, background: 'var(--surface)', boxShadow: '1.5px 1.5px 0 var(--ink)' }}
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
          style={{ borderTop: '1.5px dashed var(--ink)', paddingTop: '16px', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--ink-faint)', textTransform: 'uppercase' }}
        >
          <span>© {new Date().getFullYear()} WinUCard Ltd.</span>
          <span>🔒 SSL · ⚑ UK Registered</span>
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

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h5 style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink)', marginBottom: '14px', fontWeight: 700 }}>
        {title}
      </h5>
      <ul className="flex flex-col" style={{ gap: '10px' }}>
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="transition-colors duration-150 hover:text-[var(--ink)]" style={{ fontSize: '14px', color: 'var(--ink-dim)' }}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterColumnCompact({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h5 style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink)', marginBottom: '8px', fontWeight: 700 }}>
        {title}
      </h5>
      <ul className="flex flex-col" style={{ gap: '6px' }}>
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} style={{ fontSize: '12px', color: 'var(--ink-dim)' }}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
