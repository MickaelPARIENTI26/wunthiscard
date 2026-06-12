import * as Sentry from '@sentry/nextjs';

// Browser Sentry init. Uses the PUBLIC DSN (the only one safe to inline client-side)
// and no-ops when it isn't set.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  // Session Replay off by default (lighter bundle, avoids capturing PII screens).
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  sendDefaultPii: false,
});

// Instruments App Router client-side navigations.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
