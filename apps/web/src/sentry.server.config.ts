import * as Sentry from '@sentry/nextjs';

// Server (Node.js runtime) Sentry init. No-ops gracefully when no DSN is set, so
// the app runs identically until NEXT_PUBLIC_SENTRY_DSN is configured in the env.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  // Don't capture request bodies / cookies by default — this app handles PII and
  // payment data.
  sendDefaultPii: false,
});
