# WinUCard — Lessons Learned

<!-- Format : [date] | ce qui a mal tourné | règle pour l'éviter -->

| Date | Problème | Règle |
|------|----------|-------|
| 2026-03-19 | Gold text (#F0B90B) on white fails WCAG AA contrast (1.95:1) | Always use --accent-text (#946800) for gold text on light backgrounds, reserve --accent for decorative/non-text elements |
| 2026-03-19 | JS hover handlers (onMouseEnter/onMouseLeave) don't work on touch devices and create no pressed state | Use CSS :hover/:active/:focus-visible instead of JS style manipulation for interactive states |
| 2026-03-19 | min-h-screen on mobile Safari includes address bar height, hiding content | Use min-h-[100dvh] instead of min-h-screen for full-viewport sections |
| 2026-03-19 | Pre-existing unused variable (`filters`) blocked entire build via lint error | Always check build passes before pushing; prefix unused destructured params with `_` |
| 2026-03-19 | Making a Prisma field nullable (`Int?`) breaks every file that uses it without null-check | When changing a schema field to nullable, grep ALL usages across both apps (web + admin) and fix every one before building |
| 2026-03-19 | Referral counting in payment webhook must never block payment confirmation | Always wrap post-payment side effects (referrals, analytics, notifications) in try/catch outside the main transaction |
| 2026-03-19 | CAPTCHA token was optional — bots could skip it entirely | Make CAPTCHA required in production via conditional Zod schema |
| 2026-03-19 | In-memory rate limiting (Map) resets on serverless cold starts | Always use Redis-based rate limiting in production, never in-memory Maps |
| 2026-03-19 | findFirst + update is not atomic — race condition on concurrent claims | Use updateMany with a status guard in the WHERE clause for atomic claim operations |
