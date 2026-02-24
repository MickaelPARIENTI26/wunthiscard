'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Ticket, Trophy, MapPin, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/my-tickets', label: 'My Tickets', icon: Ticket },
  { href: '/my-wins', label: 'My Wins', icon: Trophy },
  { href: '/addresses', label: 'Addresses', icon: MapPin },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface AccountLayoutProps {
  children: React.ReactNode;
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  const pathname = usePathname();

  return (
    <div
      className="min-h-screen"
      style={{
        background: `
          radial-gradient(ellipse 50% 40% at 20% 20%, rgba(240, 185, 11, 0.03), transparent 60%),
          linear-gradient(180deg, var(--bg-base) 0%, var(--bg-elevated) 50%, var(--bg-base) 100%)
        `,
      }}
    >
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Mobile tabs navigation */}
        <nav className="mb-6 overflow-x-auto md:hidden">
          <div
            className="flex min-w-max gap-1 rounded-xl p-1"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300'
                  )}
                  style={{
                    background: isActive ? 'linear-gradient(135deg, #F0B90B 0%, #E8A000 100%)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: isActive ? '0 2px 8px rgba(240, 185, 11, 0.25)' : 'none',
                  }}
                >
                  <Icon className="h-4 w-4" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="flex gap-8">
          {/* Desktop sidebar navigation */}
          <aside className="hidden w-64 shrink-0 md:block">
            <div
              className="sticky top-8 rounded-xl p-4"
              style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
              }}
            >
              <h2
                className="mb-4 text-lg font-semibold font-[family-name:var(--font-outfit)]"
                style={{ color: 'var(--text-primary)' }}
              >
                My Account
              </h2>
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300"
                      style={{
                        background: isActive ? 'linear-gradient(135deg, #F0B90B 0%, #E8A000 100%)' : 'transparent',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                        boxShadow: isActive ? '0 2px 8px rgba(240, 185, 11, 0.25)' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'var(--bg-card-hover)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-muted)';
                        }
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main content area */}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
