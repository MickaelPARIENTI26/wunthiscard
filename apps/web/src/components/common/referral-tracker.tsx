'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Silent client component that captures the `?ref=CODE` query parameter
 * and stores it in a `ref_code` cookie with a 30-day expiry.
 * First referrer wins — the cookie is only set if not already present.
 * Renders nothing.
 */
export function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (!refCode) return;

    // Only set if not already present (first referrer wins)
    const existingCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('ref_code='));

    if (existingCookie) return;

    // Validate: alphanumeric, 8 chars
    if (!/^[A-Z0-9]{8}$/i.test(refCode)) return;

    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    document.cookie = `ref_code=${encodeURIComponent(refCode.toUpperCase())};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }, [searchParams]);

  return null;
}
