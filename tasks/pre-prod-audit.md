# Pre-production audit — action list

Source: multi-agent pre-prod review (2026-06, adversarially verified).
37 raw findings → 31 confirmed → 1 P0, 14 P1, 16 P2, 6 dismissed.

**Status: P0 ✅ done · all code-fixable P1 ✅ done · remaining = 2 ops items + P2 polish.**

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
- [ ] (ops) Add error monitoring (Sentry or similar) — needs an account/DSN; ping me to wire it in.

## P2 — minor / polish (not yet done)
- (code) Escape user name/email/firstName in transactional + contact email HTML.
- (code) Guest-checkout password policy weaker than main register.
- (code) Google OAuth login skips credentials login's account-state guards.
- (code) Admin /api/export/* not covered by middleware admin-API guard.
- (code) Avatar upload trusts client MIME, no magic-byte check.
- (code) turbo.json globalEnv missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, CONTACT_EMAIL, ALLOW_DESTRUCTIVE_SEED.
- (code) Global rate limiters defined but unused.
- (code) Webhook has no runtime/maxDuration config → timeout risk.
- (code) Reserve: DB/Redis can desync if rollback release throws.
- (code) Success page swallows all errors → real failures show "Order Not Found".
- (code) resend-verification send not error-wrapped (anti-enumeration).
- (docs) .env.example FROM_EMAIL uses winucard.com (no 's').
- (code) Verification email sent to original-case (not stored lowercase) address.
- (code) Skill-question pass reusable for 1h, not per-entry.

## Dismissed (verified NOT issues)
Shared AUTH_SECRET, double bonus-ticket assignment (idempotent), webhook metadata trust, login rate-limit "client only" (server limiter exists), admin login limiter, dev fail-open limiter.
