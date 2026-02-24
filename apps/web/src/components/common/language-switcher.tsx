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
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200'
              )}
              style={{
                background: isActive ? '#F0B90B' : '#F5F5F7',
                border: '1px solid #e8e8ec',
                borderRadius: '10px',
                color: isActive ? '#1a1a2e' : '#6b7088',
              }}
            >
              <span className="text-base">{config.flag}</span>
              <span>{config.code}</span>
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
            'flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium transition-all duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
            isPending && 'opacity-50 cursor-not-allowed',
            className
          )}
          style={{
            background: '#F5F5F7',
            border: '1px solid #e8e8ec',
            borderRadius: '10px',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#EDEDF0';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#F5F5F7';
          }}
        >
          <span className="text-base leading-none">{current.flag}</span>
          <span style={{ color: '#6b7088', fontWeight: 500 }}>{current.code}</span>
          <ChevronDown className="h-3 w-3" style={{ color: '#6b7088' }} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-[140px] p-1 animate-in fade-in-0 zoom-in-95 duration-200"
        style={{
          background: '#ffffff',
          border: '1px solid #e8e8ec',
          borderRadius: '10px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
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
                'focus:outline-none'
              )}
              style={{
                background: isActive ? '#F5F5F7' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = '#F5F5F7';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }
              }}
            >
              <span className="text-base leading-none">{config.flag}</span>
              <span
                className="flex-1"
                style={{
                  color: isActive ? '#1a1a2e' : '#6b7088',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {config.name}
              </span>
              {isActive && (
                <span
                  className="text-xs font-bold"
                  style={{ color: '#E8A000' }}
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
