'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const COOKIE_CONSENT_KEY = 'cookie-consent';
/** Broadcast by the cookie banner so this mounts without a page reload. */
export const CONSENT_EVENT = 'winuprize:cookie-consent';
/**
 * Broadcast once gtag actually exists. Consent alone is not enough to start
 * sending: the tag still has to load, so anything queued at consent time would
 * fire into a window with no gtag on it.
 */
export const GA_READY_EVENT = 'winuprize:ga-ready';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function hasAnalyticsConsent(): boolean {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return false;
    return (JSON.parse(raw) as { status?: string }).status === 'accepted';
  } catch {
    return false;
  }
}

/**
 * GA4, loaded only after the visitor accepts cookies.
 *
 * PECR treats analytics cookies as non-essential, so the tag cannot be on the
 * page before consent — hence the script is mounted conditionally rather than
 * loaded upfront and muted with Consent Mode. Declining means no GA request is
 * ever made, which is the only version that survives an ICO complaint.
 *
 * No-ops entirely when NEXT_PUBLIC_GA_MEASUREMENT_ID is unset, so nothing
 * breaks before the property exists.
 */
export function Analytics() {
  const [consented, setConsented] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setConsented(hasAnalyticsConsent());
    const onConsent = () => setConsented(hasAnalyticsConsent());
    window.addEventListener(CONSENT_EVENT, onConsent);
    // Another tab may have accepted in the meantime.
    window.addEventListener('storage', onConsent);
    return () => {
      window.removeEventListener(CONSENT_EVENT, onConsent);
      window.removeEventListener('storage', onConsent);
    };
  }, []);

  // App Router navigations don't reload the page, so GA never sees them on its
  // own — each route change has to be sent explicitly.
  useEffect(() => {
    if (!consented || !MEASUREMENT_ID || typeof window.gtag !== 'function') return;
    const qs = searchParams.toString();
    window.gtag('event', 'page_view', {
      page_path: qs ? `${pathname}?${qs}` : pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [consented, pathname, searchParams]);

  if (!MEASUREMENT_ID || !consented) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga4-init"
        strategy="afterInteractive"
        onReady={() => {
          window.dispatchEvent(new Event(GA_READY_EVENT));
        }}
      >
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'granted'
          });
          gtag('config', '${MEASUREMENT_ID}', {
            anonymize_ip: true,
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}
