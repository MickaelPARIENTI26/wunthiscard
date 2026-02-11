'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  User,
  LogOut,
  Ticket,
  Trophy,
  Settings,
  Instagram,
  Twitter,
  Facebook,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
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

// Discord icon (not in lucide-react)
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

const socialLinks = [
  {
    href: 'https://instagram.com/winthiscard',
    label: 'Instagram',
    icon: Instagram,
    followers: '12.5K',
  },
  {
    href: 'https://twitter.com/winthiscard',
    label: 'Twitter',
    icon: Twitter,
    followers: '8.2K',
  },
  {
    href: 'https://tiktok.com/@winthiscard',
    label: 'TikTok',
    icon: TikTokIcon,
    followers: '25.1K',
  },
  {
    href: 'https://facebook.com/winthiscard',
    label: 'Facebook',
    icon: Facebook,
    followers: '5.8K',
  },
  {
    href: 'https://discord.gg/winthiscard',
    label: 'Discord',
    icon: DiscordIcon,
    followers: '3.2K',
  },
];

const accountLinks = [
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/my-tickets', label: 'My Tickets', icon: Ticket },
  { href: '/my-wins', label: 'My Wins', icon: Trophy },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function MobileMenu({ isOpen, onClose, user, navLinks }: MobileMenuProps) {
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
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-sm">
        <SheetHeader className="text-left">
          <SheetTitle>
            <Link href="/" onClick={onClose} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-base font-bold text-primary-foreground">W</span>
              </div>
              <span className="text-lg font-bold tracking-tight">WinThisCard</span>
            </Link>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto py-6">
          {/* User section (if logged in) */}
          {user && (
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
            </div>
          )}

          {/* Main navigation */}
          <nav className="flex flex-col gap-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Menu
            </p>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="rounded-md px-3 py-3 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground active:bg-accent"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Account links (if logged in) */}
          {user && (
            <nav className="flex flex-col gap-1">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Account
              </p>
              {accountLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground active:bg-accent"
                >
                  <link.icon className="h-5 w-5 text-muted-foreground" />
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Auth buttons (if not logged in) */}
          {!user && (
            <div className="flex flex-col gap-2">
              <Button asChild size="lg" className="w-full">
                <Link href="/register" onClick={onClose}>
                  Register
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full">
                <Link href="/login" onClick={onClose}>
                  Login
                </Link>
              </Button>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Social links */}
          <div className="border-t pt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Follow us
            </p>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-sm transition-colors hover:bg-muted/80"
                  aria-label={`Follow us on ${social.label}`}
                >
                  <social.icon className="h-4 w-4" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {social.followers}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Logout button (if logged in) */}
          {user && (
            <Button
              variant="ghost"
              className="justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                onClose();
                signOut({ callbackUrl: '/' });
              }}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Log out
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
