import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { defaultLocale, locales, LOCALE_COOKIE_NAME, type Locale } from './config';

function getLocaleFromHeaders(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  // Parse Accept-Language header
  const languages = acceptLanguage
    .split(',')
    .map((lang) => {
      const parts = lang.trim().split(';');
      const localePart = parts[0] ?? '';
      const qualityPart = parts[1] ?? 'q=1';
      const qualityValue = qualityPart.split('=')[1];
      return {
        locale: localePart.split('-')[0]?.toLowerCase() ?? '',
        quality: parseFloat(qualityValue ?? '1') || 1,
      };
    })
    .filter((lang) => lang.locale.length > 0)
    .sort((a, b) => b.quality - a.quality);

  // Find first matching locale
  for (const { locale } of languages) {
    if (locales.includes(locale as Locale)) {
      return locale as Locale;
    }
  }

  return defaultLocale;
}

export default getRequestConfig(async () => {
  // 1. Check cookie first
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

  let locale: Locale = defaultLocale;

  if (localeCookie && locales.includes(localeCookie as Locale)) {
    locale = localeCookie as Locale;
  } else {
    // 2. Fall back to Accept-Language header
    const headerStore = await headers();
    const acceptLanguage = headerStore.get('accept-language');
    locale = getLocaleFromHeaders(acceptLanguage);
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
