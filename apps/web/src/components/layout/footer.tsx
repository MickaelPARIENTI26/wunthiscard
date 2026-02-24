import Link from 'next/link';

// Social button data with text labels
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
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        background: '#F5F5F7',
        borderTop: '1px solid #E8E8EC',
      }}
    >
      {/* CSS for hover effects */}
      <style>{`
        .footer-social-btn {
          padding: 6px 14px;
          border-radius: 8px;
          background: #EDEDF0;
          color: #6b7088;
          font-size: 11px;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .footer-social-btn:hover {
          background: #E8A000;
          color: #ffffff;
        }
        .footer-link {
          color: #6b7088;
          font-size: 13px;
          transition: color 0.2s ease;
        }
        .footer-link:hover {
          color: #E8A000;
        }
      `}</style>

      {/* Main footer content */}
      <div
        className="container mx-auto"
        style={{ padding: '56px 40px 32px' }}
      >
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Column 1: Logo & Description */}
          <div className="lg:col-span-2">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
              {/* Gold square with W */}
              <div
                className="flex items-center justify-center"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #F0B90B 0%, #E8A000 100%)',
                }}
              >
                <span
                  style={{
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-outfit)',
                  }}
                >
                  W
                </span>
              </div>
              {/* Text */}
              <span
                className="font-[family-name:var(--font-outfit)]"
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  letterSpacing: '-0.5px',
                  color: 'var(--text-primary)',
                }}
              >
                WinUCard
              </span>
            </Link>

            <p
              style={{
                color: '#8a8ea0',
                fontSize: '12px',
                lineHeight: 1.7,
                maxWidth: '280px',
                marginBottom: '20px',
              }}
            >
              UK&apos;s premium skill-based card competition platform. Must be 18+. Please play responsibly.
            </p>

            {/* Social Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {socialButtons.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-btn"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Platform */}
          <div>
            <h3
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#1a1a2e',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                marginBottom: '16px',
              }}
            >
              Platform
            </h3>
            <ul className="space-y-3">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Support */}
          <div>
            <h3
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#1a1a2e',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                marginBottom: '16px',
              }}
            >
              Support
            </h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h3
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#1a1a2e',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                marginBottom: '16px',
              }}
            >
              Legal
            </h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="container mx-auto"
        style={{
          borderTop: '1px solid #E0E0E4',
          marginTop: '0',
          padding: '20px 40px',
        }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p style={{ color: '#9a9eb0', fontSize: '12px' }}>
            © {currentYear} WinUCard Ltd. All rights reserved.
          </p>

          {/* Trust badges */}
          <div className="flex items-center gap-4">
            <span style={{ color: '#9a9eb0', fontSize: '12px' }}>
              🔒 SSL Secured
            </span>
            <span style={{ color: '#9a9eb0', fontSize: '12px' }}>
              🇬🇧 UK Registered
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
