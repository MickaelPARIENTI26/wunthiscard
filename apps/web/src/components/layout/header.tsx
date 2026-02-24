'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Menu, User, Ticket, Trophy, Settings } from 'lucide-react';
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
import { LanguageSwitcher } from '@/components/common/language-switcher';

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  } | null;
}

export function Header({ user = null }: HeaderProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { href: '/competitions', label: t('nav.competitions') },
    { href: '/how-it-works', label: t('nav.howItWorks') },
    { href: '/faq', label: t('nav.faq') },
    { href: '/about', label: t('nav.about') },
    { href: '/contact', label: t('nav.contact') },
  ];

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
    <header
      className="fixed top-0 w-full"
      style={{
        height: '66px',
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
      }}
    >
      <div className="container mx-auto flex h-full items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
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

        {/* Desktop Navigation */}
        <style>{`
          .header-nav-link {
            position: relative;
            padding: 8px 16px;
            font-size: 14px;
            font-weight: 500;
            color: var(--text-muted);
            transition: color 0.2s ease;
          }
          .header-nav-link:hover {
            color: var(--text-primary);
          }
          .header-login-btn {
            padding: 8px 16px;
            background: #ffffff;
            border: 1.5px solid #e0e0e4;
            border-radius: 12px;
            color: #333333;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.2s ease;
          }
          .header-login-btn:hover {
            background: #f5f5f7;
            border-color: #d0d0d4;
          }
          .header-signup-btn {
            padding: 8px 20px;
            background: #1a1a2e;
            border-radius: 12px;
            color: #ffffff;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.2s ease;
          }
          .header-signup-btn:hover {
            background: #2a2a3e;
          }
        `}</style>
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="header-nav-link"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {/* Desktop: User menu or Login/Register */}
          <div className="hidden lg:flex lg:items-center lg:gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full p-0 ring-2 ring-transparent transition-all hover:ring-primary/50"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback
                        className="font-semibold"
                        style={{
                          background: 'linear-gradient(135deg, #F0B90B 0%, #E8A000 100%)',
                          color: '#ffffff',
                        }}
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
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e8e8ec',
                  }}
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      {t('common.profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-tickets" className="cursor-pointer">
                      <Ticket className="mr-2 h-4 w-4" />
                      {t('common.myTickets')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-wins" className="cursor-pointer">
                      <Trophy className="mr-2 h-4 w-4 text-primary" />
                      {t('common.myWins')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      {t('common.settings')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={handleLogout}
                  >
                    {t('common.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                {/* Login Button */}
                <button
                  onClick={() => router.push('/login')}
                  className="header-login-btn"
                >
                  {t('common.login')}
                </button>

                {/* Sign Up Button */}
                <button
                  onClick={() => router.push('/register')}
                  className="header-signup-btn"
                >
                  {t('common.register')}
                </button>
              </>
            )}
          </div>

          {/* Mobile: Hamburger menu */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden relative"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
            style={{ color: 'var(--text-muted)' }}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        navLinks={navLinks}
      />
    </header>
  );
}
