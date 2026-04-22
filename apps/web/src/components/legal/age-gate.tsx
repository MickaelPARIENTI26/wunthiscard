'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const AGE_VERIFIED_COOKIE = 'age_verified';
const COOKIE_EXPIRY_DAYS = 30;

/**
 * Set a cookie with the given name, value, and expiry days
 */
function setCookie(name: string, value: string, days: number): void {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? ';Secure' : '';
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax${secure}`;
}

/**
 * Get a cookie value by name
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const c = cookie.trim();
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length);
    }
  }
  return null;
}

export function AgeGate() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if age has already been verified
    const ageVerified = getCookie(AGE_VERIFIED_COOKIE);
    if (ageVerified !== 'true') {
      // Show the modal
      setIsVisible(true);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      // Trigger animation after mount
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    }
  }, []);

  const handleConfirmAge = () => {
    // Set the cookie
    setCookie(AGE_VERIFIED_COOKIE, 'true', COOKIE_EXPIRY_DAYS);
    // Animate out
    setIsAnimating(false);
    // Re-enable body scroll
    document.body.style.overflow = '';
    // Hide after animation
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  const handleUnderAge = () => {
    // Redirect to Google
    window.location.href = 'https://www.google.com';
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
    >
      <div
        className={`relative w-full max-w-[440px] text-center transition-all duration-300 ${
          isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        style={{
          background: 'var(--surface)',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.12)',
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            {/* Gold square with W */}
            <div
              className="flex items-center justify-center"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'var(--accent)',
                boxShadow: '2px 2px 0 var(--ink)',
              }}
            >
              <span
                style={{
                  color: '#ffffff',
                  fontSize: '18px',
                  fontWeight: 800,
                  fontFamily: 'var(--sans)',
                }}
              >
                W
              </span>
            </div>
            {/* Text */}
            <span
              className="font-sans"
              style={{
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '-0.5px',
                color: 'var(--ink)',
              }}
            >
              WinUCard
            </span>
          </Link>
        </div>

        {/* Title */}
        <h1
          id="age-gate-title"
          className="font-sans mb-3"
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--ink)',
          }}
        >
          Age Verification
        </h1>

        {/* Description */}
        <p
          className="mb-8"
          style={{
            fontSize: '15px',
            color: 'var(--ink-dim)',
            lineHeight: 1.6,
          }}
        >
          You must be 18 years or older to enter this website. WinUCard is a skill-based competition platform. Please confirm your age to continue.
        </p>

        {/* Buttons */}
        <div className="space-y-3">
          {/* Primary Button - Yes, I'm 18+ */}
          <button
            onClick={handleConfirmAge}
            className="w-full transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: 'var(--text-primary)',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              outlineColor: 'var(--accent)',
            }}
          >
            Yes, I&apos;m 18 or over
          </button>

          {/* Secondary Button - No, I'm under 18 */}
          <button
            onClick={handleUnderAge}
            className="w-full transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: 'transparent',
              border: '1.5px solid rgba(0, 0, 0, 0.12)',
              color: 'var(--text-muted)',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              outlineColor: 'var(--accent)',
            }}
          >
            No, I&apos;m under 18
          </button>
        </div>

        {/* Legal Text */}
        <p
          className="mt-6"
          style={{
            fontSize: '12px',
            color: 'var(--ink-faint)',
            lineHeight: 1.5,
          }}
        >
          By entering this site, you agree to our Terms &amp; Conditions and confirm you are of legal age.
        </p>
      </div>
    </div>
  );
}
