'use server';

import { cookies } from 'next/headers';
import { LOCALE_COOKIE_NAME, LOCALE_COOKIE_MAX_AGE, locales, type Locale } from './config';

export async function setLocaleCookie(locale: Locale): Promise<void> {
  if (!locales.includes(locale)) {
    throw new Error(`Invalid locale: ${locale}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function getLocaleCookie(): Promise<Locale | null> {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

  if (locale && locales.includes(locale as Locale)) {
    return locale as Locale;
  }

  return null;
}
