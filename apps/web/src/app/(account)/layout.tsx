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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Mobile tabs navigation */}
        <nav className="mb-6 overflow-x-auto md:hidden">
          <div className="flex min-w-max gap-1 rounded-lg bg-muted p-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-background text-foreground shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
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
            <div className="sticky top-8">
              <h2 className="mb-4 text-lg font-semibold">My Account</h2>
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
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
