'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

    // If accepted, you could trigger analytics initialization here
    if (accepted) {
      // Initialize analytics, etc.
      // window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 p-4 transition-transform duration-300 ease-out print:hidden ${
        isAnimating ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-border bg-card p-4 shadow-lg sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Text Content */}
            <div className="flex-1">
              <h2 className="text-base font-semibold text-foreground">
                We use cookies
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                We use cookies to enhance your browsing experience, analyse site
                traffic, and personalise content. By clicking &quot;Accept&quot;,
                you consent to our use of cookies.{' '}
                <Link
                  href="/cookies"
                  className="text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  Learn more
                </Link>
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConsent(false)}
                className="w-full sm:w-auto"
              >
                Decline
              </Button>
              <Button
                size="sm"
                onClick={() => handleConsent(true)}
                className="w-full sm:w-auto"
              >
                Accept
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to check cookie consent status
export function useCookieConsent(): ConsentStatus {
  const [status, setStatus] = useState<ConsentStatus>('pending');

  useEffect(() => {
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (storedConsent) {
      try {
        const consent: CookieConsent = JSON.parse(storedConsent);
        setStatus(consent.status);
      } catch {
        setStatus('pending');
      }
    }
  }, []);

  return status;
}

// Utility to reset cookie consent (useful for testing)
export function resetCookieConsent(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
  }
}
