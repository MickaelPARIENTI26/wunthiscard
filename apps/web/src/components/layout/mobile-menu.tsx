'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  LogOut,
  Ticket,
  Trophy,
  Settings,
  Instagram,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavLink {
  href: string;
  label: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  } | null;
  navLinks: NavLink[];
}

// TikTok icon (not in lucide-react)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
  );
}


const socialLinks = [
  {
    href: 'https://www.instagram.com/winucards/',
    label: 'Instagram',
    icon: Instagram,
  },
  {
    href: 'https://www.tiktok.com/@winucards',
    label: 'TikTok',
    icon: TikTokIcon,
  },
];

export function MobileMenu({ isOpen, onClose, user, navLinks }: MobileMenuProps) {
  const router = useRouter();

  const accountLinks = [
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/my-tickets', label: 'My Tickets', icon: Ticket },
    { href: '/my-wins', label: 'My Wins', icon: Trophy },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    onClose();
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
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-sm border-l"
        style={{
          background: 'linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)',
          borderColor: 'var(--line)',
        }}
      >
        <SheetHeader className="text-left">
          <SheetTitle>
            <Link href="/" onClick={onClose} className="flex items-center gap-3">
              <div
                className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden"
                style={{
                  background: 'var(--accent)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent" />
                <Trophy className="h-5 w-5 relative z-10" style={{ color: 'var(--bg)' }} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight font-sans font-bold">
                  WinUCard
                </span>
                <span className="text-[10px] text-muted-foreground -mt-0.5">
                  Premium Collectibles
                </span>
              </div>
            </Link>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto py-6">
          {/* User section (if logged in) */}
          {user && (
            <div
              className="flex items-center gap-3 rounded-xl p-4"
              style={{
                background: 'linear-gradient(135deg, var(--bg-2) 0%, var(--surface) 100%)',
                border: '1px solid var(--line)',
              }}
            >
              <Avatar className="h-12 w-12 ring-2 ring-primary/30">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback
                  className="font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)',
                    color: 'var(--bg)',
                  }}
                >
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
            </div>
          )}

          {/* Main navigation */}
          <nav className="flex flex-col gap-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary/70">
              Menu
            </p>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="group relative rounded-lg px-4 py-3 text-base font-medium transition-all hover:bg-primary/10"
              >
                <span className="relative z-10">{link.label}</span>
                {/* Left border indicator on hover */}
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full scale-y-0 transition-transform group-hover:scale-y-100"
                  style={{
                    background: 'var(--accent)',
                  }}
                />
              </Link>
            ))}
          </nav>

          {/* Account links (if logged in) */}
          {user && (
            <nav className="flex flex-col gap-1">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary/70">
                Account
              </p>
              {accountLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="group flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all hover:bg-primary/10"
                >
                  <link.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Auth buttons (if not logged in) */}
          {!user && (
            <div className="flex flex-col gap-3 pt-2">
              <Button
                asChild
                size="lg"
                className="w-full font-semibold"
                style={{
                  background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)',
                  color: 'var(--bg)',
                }}
              >
                <Link href="/register" onClick={onClose} className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Sign Up
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full"
                style={{
                  background: 'transparent',
                  borderColor: 'var(--ink)',
                }}
              >
                <Link href="/login" onClick={onClose}>
                  Log In
                </Link>
              </Button>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Social links */}
          <div
            className="pt-6"
            style={{
              borderTop: '1px solid var(--line)',
            }}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary/70">
              Follow Us
            </p>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, var(--bg-2) 0%, var(--surface) 100%)',
                    border: '1px solid var(--line)',
                  }}
                  aria-label={`Follow us on ${social.label}`}
                >
                  <social.icon className="h-4 w-4 transition-colors group-hover:text-primary" />
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {social.label}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Logout button (if logged in) */}
          {user && (
            <Button
              variant="ghost"
              className="justify-start text-destructive hover:bg-destructive/10 hover:text-destructive mt-2"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Log Out
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
