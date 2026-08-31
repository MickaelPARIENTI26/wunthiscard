'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, Ticket, Trophy, Sparkles, Settings, Gift } from 'lucide-react';
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
  { href: '/contact', label: 'Contact' },
];

/** Matchday wordmark: animated gold wedge + WinU (text) / Prize (gold). */
export function BrandWordmark({ size = 'clamp(23px, 3vw, 29px)' }: { size?: string }) {
  return (
    <span className="flex items-center" style={{ gap: '10px' }}>
      <span className="wup-wedge" aria-hidden="true" />
      <span
        style={{
          fontFamily: 'var(--display)',
          fontWeight: 700,
          fontSize: size,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          lineHeight: 1,
          color: 'var(--ink)',
          whiteSpace: 'nowrap',
        }}
      >
        WinU<span style={{ color: 'var(--accent)' }}>Prize</span>
      </span>
    </span>
  );
}

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
        background: 'rgba(10, 10, 10, 0.9)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(244, 241, 234, 0.14)',
      }}
    >
      <div
        className="mx-auto flex items-center justify-between px-5 sm:px-8"
        style={{ maxWidth: '1400px', gap: '28px', height: 'clamp(60px, 7vw, 74px)' }}
      >
        {/* Brand */}
        <Link href="/" aria-label="WinUPrize home" className="flex items-center">
          <BrandWordmark />
        </Link>

        {/* Desktop nav links (single 980px breakpoint per the design spec) */}
        <div className="hidden min-[980px]:flex items-center" style={{ gap: '22px' }}>
          {navLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors duration-150"
                style={{
                  fontFamily: 'var(--display)',
                  fontWeight: 600,
                  fontSize: '16px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '6px 0 4px',
                  borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                  color: active ? 'var(--ink)' : 'rgba(244, 241, 234, 0.66)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = active ? 'var(--ink)' : 'rgba(244, 241, 234, 0.66)'; }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2.5">
          {/* Desktop auth CTAs or avatar */}
          <div className="hidden min-[980px]:flex min-[980px]:items-center" style={{ gap: '10px' }}>
            {user ? (
              // modal={false}: the default (modal) dropdown locks page scroll via
              // overflow:hidden on <body>, which breaks the sticky header's
              // position:sticky — so after scrolling down, opening the avatar menu
              // made the top bar jump/disappear. A nav menu doesn't need modal.
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    className="relative grid h-10 w-10 place-items-center p-0"
                    aria-label="Account menu"
                    style={{ cursor: 'pointer' }}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback
                        className="font-semibold"
                        style={{ background: 'var(--accent)', color: '#0A0A0A' }}
                      >
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56"
                  align="end"
                  forceMount
                  style={{ background: 'var(--surface)', border: '1px solid rgba(244, 241, 234, 0.18)', borderRadius: 0, boxShadow: '0 18px 40px -18px rgba(0, 0, 0, 0.8)' }}
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none" style={{ color: 'var(--ink)' }}>{user.name}</p>
                      <p className="text-xs leading-none" style={{ color: 'var(--ink-faint)' }}>{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator style={{ background: 'var(--line)' }} />
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
                    <Link href="/my-rewards" className="cursor-pointer"><Sparkles className="mr-2 h-4 w-4" />My Rewards</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/referrals" className="cursor-pointer"><Gift className="mr-2 h-4 w-4" />Referrals</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer"><Settings className="mr-2 h-4 w-4" />Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator style={{ background: 'var(--line)' }} />
                  <DropdownMenuItem className="cursor-pointer" style={{ color: 'var(--accent)' }} onClick={handleLogout}>
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <button
                  onClick={() => router.push('/login')}
                  className="btn btn-ghost"
                  style={{ padding: '10px 18px', fontSize: '14px' }}
                >
                  Log In
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', fontSize: '14px' }}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger — 3 bars, third one gold */}
          <button
            className="min-[980px]:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
            style={{
              width: 44,
              height: 44,
              display: 'grid',
              placeItems: 'center',
              border: '1px solid rgba(244, 241, 234, 0.28)',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            <span className="flex flex-col" style={{ gap: '5px' }} aria-hidden="true">
              <span style={{ width: 20, height: 2, background: 'var(--ink)' }} />
              <span style={{ width: 20, height: 2, background: 'var(--ink)' }} />
              <span style={{ width: 20, height: 2, background: 'var(--accent)' }} />
            </span>
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
