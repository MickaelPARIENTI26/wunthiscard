'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, User, Ticket, Trophy, Settings, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MobileMenu } from './mobile-menu';

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  } | null;
}

const navLinks = [
  { href: '/competitions', label: 'Competitions' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function Header({ user = null }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    router.push('/logout');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: 'rgba(242, 240, 236, 0.92)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom: '1.5px solid var(--ink)',
      }}
    >
      <div
        className="mx-auto flex items-center justify-between py-3 px-5 sm:py-3.5 sm:px-8"
        style={{ maxWidth: '1440px', gap: '32px' }}
      >
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5"
          style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '20px', letterSpacing: '-0.03em' }}
        >
          {/* Green square with star */}
          <span
            className="grid place-items-center"
            style={{
              width: 34,
              height: 34,
              background: 'var(--accent)',
              border: '1.5px solid var(--ink)',
              borderRadius: '8px',
              boxShadow: '2px 2px 0 var(--ink)',
              fontWeight: 700,
              fontSize: '18px',
              color: 'var(--ink)',
            }}
          >
            ★
          </span>
          WinUCard
        </Link>

        {/* Desktop nav links */}
        <div className="hidden lg:flex items-center" style={{ gap: '24px', fontSize: '14px', fontWeight: 500 }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors duration-150"
              style={{
                padding: '6px 0',
                borderBottom: `2px solid ${pathname.startsWith(link.href) ? 'var(--ink)' : 'transparent'}`,
                color: pathname.startsWith(link.href) ? 'var(--ink)' : undefined,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--hot)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Desktop auth CTAs or avatar */}
          <div className="hidden lg:flex lg:items-center lg:gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10 rounded-full p-0"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback
                        className="font-semibold"
                        style={{ background: 'var(--accent)', color: 'var(--ink)' }}
                      >
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56"
                  align="end"
                  forceMount
                  style={{ background: 'var(--surface)', border: '1.5px solid var(--ink)', boxShadow: 'var(--shadow-sm)' }}
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none" style={{ color: 'var(--ink-faint)' }}>{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer"><User className="mr-2 h-4 w-4" />Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-tickets" className="cursor-pointer"><Ticket className="mr-2 h-4 w-4" />My Tickets</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-wins" className="cursor-pointer"><Trophy className="mr-2 h-4 w-4" />My Wins</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/referrals" className="cursor-pointer"><Gift className="mr-2 h-4 w-4" />Referrals</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer"><Settings className="mr-2 h-4 w-4" />Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-[var(--hot)]" onClick={handleLogout}>
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => router.push('/login')}>Log In</Button>
                <Button variant="primary" size="sm" onClick={() => router.push('/register')}>Sign Up</Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden grid place-items-center"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
            style={{ width: 40, height: 40, borderRadius: '8px' }}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        navLinks={navLinks}
      />
    </nav>
  );
}
