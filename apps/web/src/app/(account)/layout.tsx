'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/profile', label: 'Profile', icon: '👤' },
  { href: '/my-tickets', label: 'My Tickets', icon: '🎟' },
  { href: '/my-wins', label: 'My Wins', icon: '🏆' },
  { href: '/addresses', label: 'Addresses', icon: '📍' },
  { href: '/referrals', label: 'Referrals', icon: '🎁' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="drop-section" style={{ paddingTop: '40px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Desktop sidebar */}
        <aside className="hidden md:block">
          <nav
            style={{
              background: 'var(--surface)',
              border: '1.5px solid var(--ink)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)',
              padding: '8px',
              position: 'sticky',
              top: '90px',
            }}
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 transition-colors duration-150"
                  style={{
                    padding: '11px 14px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    background: isActive ? 'var(--ink)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--ink)',
                  }}
                >
                  <span>{item.icon}</span>{item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile tabs */}
        <nav className="md:hidden col-span-full overflow-x-auto mb-2">
          <div className="flex gap-2 min-w-max">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 whitespace-nowrap"
                  style={{
                    padding: '8px 14px',
                    borderRadius: '999px',
                    fontSize: '13px',
                    fontWeight: 600,
                    background: isActive ? 'var(--ink)' : 'var(--surface)',
                    color: isActive ? 'var(--accent)' : 'var(--ink)',
                    border: '1.5px solid var(--ink)',
                    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  <span>{item.icon}</span>{item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <main className="min-w-0">{children}</main>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .drop-section > div:first-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
