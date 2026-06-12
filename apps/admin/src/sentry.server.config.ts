import * as Sentry from '@sentry/nextjs';

// Server (Node.js runtime) Sentry init. No-ops gracefully when no DSN is set.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
});
