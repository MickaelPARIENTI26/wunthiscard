# Pre-production audit — action list

Source: multi-agent pre-prod review (2026-06, adversarially verified).
37 raw findings → 31 confirmed → 1 P0, 14 P1, 16 P2, 6 dismissed.

**Status: P0 ✅ · all code-fixable P1 ✅ · all 14 P2 ✅ — remaining = 2 ops items only (SPF/DKIM, Sentry).**

Legend: `[x]` done · `[ ]` todo · (code) fixed by Claude · (ops) needs you

---

## P0 — BLOCKS LAUNCH (legal)
- [x] (code) **18+ enforced server-side** on checkout / reserve / free-entry (DOB ≥18 guard + `AGE_VERIFICATION_REQUIRED`); OAuth users complete DOB via /profile; profile no longer wipes DOB on name edits. `lib/age.ts` + 3 endpoints. — commit 2e12420

## P1 — code (all done)
- [x] IDOR on /checkout/success — ownership check before processing/render. — 4d8fdfa
- [x] Webhook verifies charged amount/currency vs order, fails closed on mismatch. — 4d8fdfa
- [x] Refund/dispute handlers (charge.refunded / charge.dispute.created) → order REFUNDED + tickets pulled from draw, idempotent. — 4d8fdfa
- [x] create-session recreate path re-enforces maxTicketsPerUser; ticketNumbers capped (Zod). — 4d8fdfa
- [x] generateOrderNumber 8 CSPRNG hex + DB-collision retry. — 4d8fdfa
- [x] No selling past drawDate (reserve + checkout time guard). — 60ce1d4
- [x] Manual draw logs honest `selectionMethod: manual_admin` (no fake RNG). — 60ce1d4
- [x] Webhook Redis-release wrapped → no more lost confirmation email/audit. — d9b10bc
- [x] Draw confirm: winnerNotified = allEmailsSent (was always true). — d9b10bc
- [x] Admin sendEmail() fails (not "success") when RESEND key missing in prod. — d9b10bc
- [x] Login requires a Turnstile token when captcha is configured. — d9b10bc
- [~] Per-user max-ticket cap — REVIEWED: adequately enforced (reserve reuses a user's own holds; SOLD count bounds cross-purchase). No change needed.

## P1 — ops (need you)
- [ ] (ops) Verify SPF/DKIM/DMARC + Resend-verified FROM domain on winucards.com before launch.
- [x] (code) Sentry wired into web + admin (graceful no-op until DSN set). — commit f769282
  - [ ] (ops) Create 2 Sentry projects (web, admin), then set `NEXT_PUBLIC_SENTRY_DSN`
    in each Vercel project to its DSN. Optional: SENTRY_ORG/PROJECT/AUTH_TOKEN for source maps.

## P2 — minor / polish (ALL DONE — commit fixes)
- [x] Escaped user name/email/firstName in transactional + contact email HTML.
- [x] Guest-checkout now enforces the shared passwordSchema.
- [x] Google OAuth login re-applies isActive + lockedUntil guards.
- [x] Admin middleware backstop covers /api/export/*.
- [x] Avatar upload validates magic bytes + uses detected ContentType.
- [x] turbo.json: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY + CONTACT_EMAIL + ALLOW_DESTRUCTIVE_SEED.
- [x] Removed dead rateLimits.globalAuth.
- [x] Webhook runtime='nodejs' + maxDuration=60.
- [x] Reserve + create-session rollback release wrapped (no 500 masking 409).
- [x] Success page differentiates "Confirming payment…" vs "Order Not Found".
- [x] resend-verification send error-wrapped (anti-enumeration).
- [x] .env.example + docs winucard.com → winucards.com.
- [x] Verification email sent to lowercased address.
- [x] Skill-question pass consumed per completed purchase (clearQcmPassed).

## Dismissed (verified NOT issues)
Shared AUTH_SECRET, double bonus-ticket assignment (idempotent), webhook metadata trust, login rate-limit "client only" (server limiter exists), admin login limiter, dev fail-open limiter.
