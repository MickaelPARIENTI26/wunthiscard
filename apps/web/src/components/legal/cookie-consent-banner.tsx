'use client';

import { useState, useEffect } from 'react';
import { CONSENT_EVENT } from '@/components/common/analytics';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'cookie-consent';

type ConsentStatus = 'pending' | 'accepted' | 'declined';

interface CookieConsent {
  status: ConsentStatus;
  timestamp: string;
}

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if consent has already been given
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!storedConsent) {
      // Delay showing the banner slightly for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
        // Trigger animation after mount
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (accepted: boolean) => {
    const consent: CookieConsent = {
      status: accepted ? 'accepted' : 'declined',
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));

    // Animate out
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
    }, 300);

    // Let <Analytics> mount (or stay away) straight away rather than on the
    // next page load.
    window.dispatchEvent(new Event(CONSENT_EVENT));
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      role="region"
      aria-labelledby="cookie-consent-title"
      className={`cookie-banner fixed inset-x-0 bottom-0 z-50 p-4 transition-transform duration-300 ease-out print:hidden ${
        isAnimating ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="mx-auto max-w-4xl">
        <div
          className="p-4 sm:p-6"
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(244, 241, 234, 0.18)',
            borderTop: '3px solid var(--accent)',
            boxShadow: '0 -12px 40px rgba(0, 0, 0, 0.55)',
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Text Content */}
            <div className="flex-1">
              <h2
                id="cookie-consent-title"
                style={{
                  fontFamily: 'var(--display)',
                  fontWeight: 700,
                  fontSize: '18px',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  color: 'var(--ink)',
                }}
              >
                We use cookies
              </h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--ink-dim)' }}>
                We use cookies to enhance your browsing experience, analyse site traffic, and personalise content. By clicking &quot;Accept&quot;, you consent to our use of cookies.{' '}
                <Link
                  href="/cookies"
                  className="underline underline-offset-2"
                  style={{ color: 'var(--accent)' }}
                >
                  Learn more
                </Link>
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                onClick={() => handleConsent(false)}
                className="btn btn-ghost w-full sm:w-auto"
                style={{ padding: '11px 20px', fontSize: '14px', justifyContent: 'center' }}
              >
                Decline
              </button>
              <button
                onClick={() => handleConsent(true)}
                className="btn btn-primary w-full sm:w-auto"
                style={{ padding: '11px 22px', fontSize: '14px', justifyContent: 'center' }}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

