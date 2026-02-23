'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  User,
  LogOut,
  Ticket,
  Trophy,
  Settings,
  Instagram,
  Twitter,
  Facebook,
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
import { LanguageSwitcher } from '@/components/common/language-switcher';

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
    href: 'https://instagram.com/winucard',
    label: 'Instagram',
    icon: Instagram,
    followers: '12.5K',
  },
  {
    href: 'https://twitter.com/winucard',
    label: 'Twitter',
    icon: Twitter,
    followers: '8.2K',
  },
  {
    href: 'https://tiktok.com/@winucard',
    label: 'TikTok',
    icon: TikTokIcon,
    followers: '25.1K',
  },
  {
    href: 'https://facebook.com/winucard',
    label: 'Facebook',
    icon: Facebook,
    followers: '5.8K',
  },
  {
    href: 'https://discord.gg/winucard',
    label: 'Discord',
    icon: DiscordIcon,
    followers: '3.2K',
  },
];

export function MobileMenu({ isOpen, onClose, user, navLinks }: MobileMenuProps) {
  const router = useRouter();
  const t = useTranslations();

  const accountLinks = [
    { href: '/profile', label: t('common.profile'), icon: User },
    { href: '/my-tickets', label: t('common.myTickets'), icon: Ticket },
    { href: '/my-wins', label: t('common.myWins'), icon: Trophy },
    { href: '/settings', label: t('common.settings'), icon: Settings },
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
          background: 'linear-gradient(180deg, #161a28 0%, #12151e 100%)',
          borderColor: 'rgba(255, 255, 255, 0.05)',
        }}
      >
        <SheetHeader className="text-left">
          <SheetTitle>
            <Link href="/" onClick={onClose} className="flex items-center gap-3">
              <div
                className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #F0B90B 0%, #C9990A 100%)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent" />
                <Trophy className="h-5 w-5 relative z-10" style={{ color: '#12151e' }} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight font-[family-name:var(--font-outfit)] text-gradient-gold">
                  WinUCard
                </span>
                <span className="text-[10px] text-muted-foreground -mt-0.5">
                  {t('meta.premiumCollectibles')}
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
                background: 'linear-gradient(135deg, #1a1e2e 0%, #161a28 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <Avatar className="h-12 w-12 ring-2 ring-primary/30">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback
                  className="font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, #F0B90B 0%, #C9990A 100%)',
                    color: '#12151e',
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

          {/* Language Switcher */}
          <div className="pb-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary/70">
              {t('common.language')}
            </p>
            <LanguageSwitcher variant="mobile" />
          </div>

          {/* Main navigation */}
          <nav className="flex flex-col gap-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary/70">
              {t('common.menu')}
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
                    background: 'linear-gradient(180deg, #F0B90B, #C9990A)',
                  }}
                />
              </Link>
            ))}
          </nav>

          {/* Account links (if logged in) */}
          {user && (
            <nav className="flex flex-col gap-1">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary/70">
                {t('common.account')}
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
                  background: 'linear-gradient(135deg, #F0B90B 0%, #C9990A 100%)',
                  color: '#12151e',
                }}
              >
                <Link href="/register" onClick={onClose} className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {t('common.register')}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full"
                style={{
                  background: 'transparent',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                }}
              >
                <Link href="/login" onClick={onClose}>
                  {t('common.login')}
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
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary/70">
              {t('common.followUs')}
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
                    background: 'linear-gradient(135deg, #1a1e2e 0%, #161a28 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                  aria-label={`Follow us on ${social.label}`}
                >
                  <social.icon className="h-4 w-4 transition-colors group-hover:text-primary" />
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
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
              className="justify-start text-destructive hover:bg-destructive/10 hover:text-destructive mt-2"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-5 w-5" />
              {t('common.logout')}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
