'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// This boundary renders its own <html>, so globals.css may not be loaded —
// every colour is hardcoded to the Matchday Gold palette on purpose.
const INK = '#0A0A0A';
const PANEL = '#141312';
const GOLD = '#C9A227';
const TEXT = '#F4F1EA';

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Report to Sentry (no-op until a DSN is configured) and keep the console log.
    Sentry.captureException(error);
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: INK, color: TEXT, fontFamily: 'Barlow, system-ui, sans-serif' }}>
        <main style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 16px' }}>
          <div style={{ textAlign: 'center', maxWidth: '560px' }}>
            {/* Error Icon */}
            <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: PANEL, border: `1px solid rgba(244, 241, 234, 0.18)`, borderTop: `3px solid ${GOLD}`, padding: '22px' }}>
                <AlertTriangle style={{ height: '44px', width: '44px', color: GOLD }} />
              </div>
            </div>

            {/* Error Message */}
            <h1 style={{ margin: '0 0 14px', fontSize: '30px', fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              Critical Error
            </h1>
            <p style={{ margin: '0 auto 24px', maxWidth: '440px', color: 'rgba(244, 241, 234, 0.7)', lineHeight: 1.6 }}>
              We apologise for the inconvenience. A critical error has occurred. Please refresh the
              page or return to the homepage.
            </p>

            {/* Error Digest (for debugging) */}
            {error.digest && (
              <p style={{ margin: '0 0 22px', fontSize: '12px', letterSpacing: '0.08em', color: 'rgba(244, 241, 234, 0.45)' }}>
                Error Reference: {error.digest}
              </p>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={reset}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: GOLD, color: INK, border: 'none', borderRadius: 0,
                  padding: '14px 26px', fontSize: '14px', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                <RefreshCw style={{ height: '16px', width: '16px' }} />
                Try Again
              </button>
              <a
                href="/"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'transparent', color: TEXT,
                  border: '1px solid rgba(244, 241, 234, 0.28)', borderRadius: 0,
                  padding: '13px 26px', fontSize: '14px', fontWeight: 600,
                  letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none',
                }}
              >
                <Home style={{ height: '16px', width: '16px' }} />
                Go Home
              </a>
            </div>

            {/* Support Info */}
            <div style={{ marginTop: '28px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: 'rgba(244, 241, 234, 0.55)' }}>
                If this problem continues, please contact us at{' '}
                <a href="mailto:contact@winuprize.com" style={{ color: GOLD, textDecoration: 'underline' }}>
                  contact@winuprize.com
                </a>
              </p>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
