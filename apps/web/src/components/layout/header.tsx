'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, User, Ticket, Trophy, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
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

const navLinks = [
  { href: '/competitions', label: 'Competitions' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

interface HeaderProps {
  /** Mock user state for demo - replace with actual auth */
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  } | null;
}

export function Header({ user = null }: HeaderProps) {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    router.push('/logout');
  };

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        isScrolled
          ? 'border-b backdrop-blur-xl'
          : 'bg-transparent'
      )}
      style={isScrolled ? {
        background: 'linear-gradient(180deg, oklch(0.08 0.02 270 / 0.95) 0%, oklch(0.06 0.02 270 / 0.9) 100%)',
        borderColor: 'oklch(0.25 0.02 270)',
      } : undefined}
    >
      {/* Subtle gold line at top when scrolled */}
      {isScrolled && (
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, oklch(0.65 0.18 85 / 0.3) 50%, transparent 100%)',
          }}
        />
      )}

      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div
            className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden transition-transform duration-300 group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, oklch(0.82 0.165 85) 0%, oklch(0.65 0.18 85) 100%)',
            }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent" />
            <Trophy className="h-5 w-5 text-black relative z-10" />
          </div>
          <div className="flex flex-col">
            <span className="hidden text-lg font-bold tracking-tight sm:inline-block font-[family-name:var(--font-display)] text-gradient-gold">
              WinThisCard
            </span>
            <span className="hidden text-[10px] text-muted-foreground sm:inline-block -mt-0.5">
              Premium Collectibles
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="relative z-10">{link.label}</span>
              {/* Hover underline */}
              <span
                className="absolute inset-x-4 -bottom-0.5 h-0.5 scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                style={{
                  background: 'linear-gradient(90deg, oklch(0.82 0.165 85), oklch(0.65 0.18 85))',
                }}
              />
              {/* Hover background */}
              <span
                className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.82 0.165 85 / 0.1) 0%, transparent 100%)',
                }}
              />
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
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
                          background: 'linear-gradient(135deg, oklch(0.82 0.165 85) 0%, oklch(0.65 0.18 85) 100%)',
                          color: 'black',
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
                    background: 'linear-gradient(135deg, oklch(0.12 0.02 270) 0%, oklch(0.08 0.02 270) 100%)',
                    border: '1px solid oklch(0.25 0.02 270)',
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
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-tickets" className="cursor-pointer">
                      <Ticket className="mr-2 h-4 w-4" />
                      My Tickets
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-wins" className="cursor-pointer">
                      <Trophy className="mr-2 h-4 w-4 text-primary" />
                      My Wins
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={handleLogout}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  asChild
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Link href="/login">Login</Link>
                </Button>
                <Button
                  asChild
                  className="relative overflow-hidden font-semibold transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, oklch(0.82 0.165 85) 0%, oklch(0.65 0.18 85) 100%)',
                    color: 'black',
                  }}
                >
                  <Link href="/register" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Register
                  </Link>
                </Button>
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
