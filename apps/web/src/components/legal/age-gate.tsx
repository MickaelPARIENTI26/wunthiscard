'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Trophy, AlertTriangle } from 'lucide-react';

const AGE_VERIFIED_COOKIE = 'age_verified';
const COOKIE_EXPIRY_DAYS = 30;

/**
 * Set a cookie with the given name, value, and expiry days
 */
function setCookie(name: string, value: string, days: number): void {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
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
  const t = useTranslations('ageGate');
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
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
    >
      <div
        className={`relative w-full max-w-[480px] rounded-2xl p-6 sm:p-8 transition-all duration-300 ${
          isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        style={{
          backgroundColor: '#161a28',
          border: '1px solid rgba(240, 185, 11, 0.2)',
          boxShadow: '0 0 60px rgba(240, 185, 11, 0.1), 0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3">
            <div
              className="relative flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #F0B90B 0%, #C9990A 100%)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent" />
              <Trophy className="h-6 w-6 relative z-10" style={{ color: '#12151e' }} />
            </div>
            <span
              className="text-2xl font-bold tracking-tight font-[family-name:var(--font-outfit)]"
              style={{
                background: 'linear-gradient(135deg, #F0B90B 0%, #C9990A 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              WinUCard
            </span>
          </div>
        </div>

        {/* Warning Icon */}
        <div className="flex justify-center mb-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(240, 185, 11, 0.15) 0%, rgba(240, 185, 11, 0.08) 100%)',
              border: '1px solid rgba(240, 185, 11, 0.3)',
            }}
          >
            <AlertTriangle className="h-8 w-8" style={{ color: '#F0B90B' }} />
          </div>
        </div>

        {/* Title */}
        <h1
          id="age-gate-title"
          className="text-2xl sm:text-3xl font-bold text-center mb-4 font-[family-name:var(--font-outfit)]"
          style={{
            background: 'linear-gradient(135deg, #F0B90B 0%, #FFD000 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {t('title')}
        </h1>

        {/* Description */}
        <p className="text-center text-sm sm:text-base mb-8" style={{ color: '#7a7e90' }}>
          {t('message')}
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          {/* Primary Button - Yes, I'm 18+ */}
          <button
            onClick={handleConfirmAge}
            className="w-full py-4 px-6 rounded-lg text-base sm:text-lg font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #F0B90B 0%, #C9990A 100%)',
              color: '#12151e',
              boxShadow: '0 4px 20px rgba(240, 185, 11, 0.3)',
            }}
          >
            {t('confirm')}
          </button>

          {/* Secondary Button - No, I'm under 18 */}
          <button
            onClick={handleUnderAge}
            className="w-full py-3 px-6 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/5"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#7a7e90',
            }}
          >
            {t('deny')}
          </button>
        </div>

        {/* Legal Text */}
        <p className="text-center text-xs mt-6" style={{ color: '#5a5e70' }}>
          {t('legal')}
        </p>
      </div>
    </div>
  );
}
