'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { setLocaleCookie } from '@/i18n/actions';
import { locales, type Locale } from '@/i18n/config';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'default' | 'mobile';
}

const localeConfig: Record<Locale, { flag: string; code: string; name: string }> = {
  en: { flag: '🇬🇧', code: 'EN', name: 'English' },
  fr: { flag: '🇫🇷', code: 'FR', name: 'Français' },
};

export function LanguageSwitcher({ className, variant = 'default' }: LanguageSwitcherProps) {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (locale: Locale) => {
    if (locale === currentLocale) return;

    startTransition(async () => {
      await setLocaleCookie(locale);
      router.refresh();
    });
  };

  const current = localeConfig[currentLocale];

  // Mobile variant - simple buttons
  if (variant === 'mobile') {
    return (
      <div className={cn('flex gap-2', className)}>
        {locales.map((locale) => {
          const config = localeConfig[locale];
          const isActive = locale === currentLocale;
          return (
            <button
              key={locale}
              onClick={() => handleLocaleChange(locale)}
              disabled={isPending}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'ring-1'
                  : 'hover:bg-white/5'
              )}
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 165, 0, 0.1) 100%)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                ...(isActive && {
                  borderColor: 'rgba(255, 215, 0, 0.3)',
                }),
              }}
            >
              <span className="text-base">{config.flag}</span>
              <span className={isActive ? 'text-primary' : 'text-muted-foreground'}>
                {config.code}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Default variant - dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={isPending}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all duration-200',
            'hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
            isPending && 'opacity-50 cursor-not-allowed',
            className
          )}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <span className="text-base leading-none">{current.flag}</span>
          <span className="text-muted-foreground">{current.code}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-[140px] p-1 animate-in fade-in-0 zoom-in-95 duration-200"
        style={{
          background: '#111118',
          border: '1px solid rgba(255, 215, 0, 0.15)',
          borderRadius: '8px',
        }}
      >
        {locales.map((locale) => {
          const config = localeConfig[locale];
          const isActive = locale === currentLocale;
          return (
            <DropdownMenuItem
              key={locale}
              onClick={() => handleLocaleChange(locale)}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 cursor-pointer transition-colors',
                'focus:bg-white/5 focus:outline-none',
                isActive && 'bg-white/5'
              )}
            >
              <span className="text-base leading-none">{config.flag}</span>
              <span className={cn(
                'flex-1',
                isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
              )}>
                {config.name}
              </span>
              {isActive && (
                <span
                  className="text-xs font-bold"
                  style={{ color: '#FFD700' }}
                >
                  ✓
                </span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
