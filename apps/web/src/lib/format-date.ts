/**
 * Locale-aware date formatting utilities
 */

type SupportedLocale = 'en' | 'fr';

const dateLocaleMap: Record<SupportedLocale, string> = {
  en: 'en-GB',
  fr: 'fr-FR',
};

/**
 * Format a date in a locale-aware manner
 * @param date - The date to format
 * @param locale - The locale to use (en or fr)
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  locale: string = 'en',
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const localeCode = dateLocaleMap[locale as SupportedLocale] || 'en-GB';

  return new Intl.DateTimeFormat(localeCode, options).format(dateObj);
}

/**
 * Format a date with time
 */
export function formatDateTime(
  date: Date | string,
  locale: string = 'en'
): string {
  return formatDate(date, locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a relative date (e.g., "2 days ago")
 * Note: This uses relative time formatting which is locale-aware
 */
export function formatRelativeDate(
  date: Date | string,
  locale: string = 'en'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const localeCode = dateLocaleMap[locale as SupportedLocale] || 'en-GB';
  const rtf = new Intl.RelativeTimeFormat(localeCode, { numeric: 'auto' });

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return rtf.format(-diffMinutes, 'minute');
    }
    return rtf.format(-diffHours, 'hour');
  }

  if (diffDays < 30) {
    return rtf.format(-diffDays, 'day');
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return rtf.format(-diffMonths, 'month');
  }

  const diffYears = Math.floor(diffMonths / 12);
  return rtf.format(-diffYears, 'year');
}
