# WinUCard Launch Checklist

## Pre-Launch Verification

### Security Audit Results

| Check | Status | Notes |
|-------|--------|-------|
| CSP Headers | ✅ PASS | Configured in `next.config.ts` for both apps |
| Rate Limiting | ✅ PASS | Implemented for login (5/15min), signup (3/hr), API routes |
| Skill Question | ✅ PASS | Required before checkout, validates answer server-side |
| Zod Validation | ✅ PASS | All inputs validated client AND server side |
| No Hardcoded Secrets | ✅ PASS | All secrets via environment variables |
| Audit Logging | ✅ PASS | 26+ files with audit log integration |
| HTTPS Enforcement | ✅ PASS | `upgrade-insecure-requests` in CSP |
| XSS Prevention | ✅ PASS | DOMPurify sanitization, CSP headers |
| CSRF Protection | ✅ PASS | NextAuth built-in CSRF tokens |

### Build Verification Results

| Check | Status | Notes |
|-------|--------|-------|
| TypeScript Build | ✅ PASS | Zero errors in web and admin |
| ESLint | ✅ PASS | Zero errors (warnings only) |
| Unit Tests | ✅ PASS | 76/76 tests passing |
| Test Coverage | ⚠️ REVIEW | Validators and business logic covered |

---

## Production Environment Setup

### Vercel Configuration

- [ ] Create production project in Vercel
- [ ] Connect GitHub repository
- [ ] Configure build settings:
  - Build Command: `turbo build`
  - Output Directory: `apps/web/.next` (web), `apps/admin/.next` (admin)
  - Install Command: `npm install`
  - Node.js Version: 20.x

### Environment Variables (Production)

Copy from `.env.example` and fill in production values:

```
# App URLs (update for production)
NEXT_PUBLIC_APP_URL=https://winucard.com
NEXT_PUBLIC_ADMIN_URL=https://admin.winucard.com

# Database (Neon or production PostgreSQL)
DATABASE_URL=postgresql://...

# Redis (Upstash production)
REDIS_URL=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Auth
NEXTAUTH_SECRET=<generate-new-secret>
NEXTAUTH_URL=https://winucard.com

# Google OAuth (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true

# Stripe (LIVE keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@winucard.com

# Storage (Cloudflare R2)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=winucard-images
R2_PUBLIC_URL=...

# Monitoring
SENTRY_DSN=...

# Environment
NODE_ENV=production
```

### Database Setup

- [ ] Create production database (Neon recommended)
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Verify schema matches development
- [ ] Create SUPER_ADMIN user manually via SQL or seed

### Stripe Setup

- [ ] Activate Stripe account (complete verification)
- [ ] Switch to live API keys
- [ ] Configure webhook endpoint: `https://winucard.com/api/webhooks/stripe`
- [ ] Add webhook events:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.refunded`
- [ ] Test webhook with Stripe CLI before go-live

### DNS & Domain

- [ ] Register domain (winucard.com)
- [ ] Configure DNS for Vercel
- [ ] Add custom domain in Vercel project
- [ ] Setup subdomain for admin (admin.winucard.com)
- [ ] Verify SSL certificates are issued

### Email Setup

- [ ] Verify domain in Resend
- [ ] Configure SPF, DKIM, DMARC records
- [ ] Test email delivery
- [ ] Setup email templates

### Storage Setup

- [ ] Create R2 bucket for production
- [ ] Configure CORS for bucket
- [ ] Update R2_PUBLIC_URL

---

## Launch Day Checklist

### Pre-Launch (Morning)

- [ ] Final build and deploy to production
- [ ] Verify all environment variables are set
- [ ] Test database connection
- [ ] Test Redis connection
- [ ] Verify Stripe webhook is receiving events

### Launch Verification

- [ ] Homepage loads correctly
- [ ] Competitions page shows data
- [ ] Registration flow works
- [ ] Login flow works (credentials)
- [ ] Login flow works (Google OAuth)
- [ ] Complete a test purchase with real card
- [ ] Verify order confirmation email received
- [ ] Verify tickets appear in user profile
- [ ] Admin panel accessible
- [ ] Admin can view orders
- [ ] Admin can view users

### Monitoring Setup

- [ ] Sentry error tracking active
- [ ] Uptime monitoring configured (BetterUptime, Pingdom, etc.)
- [ ] Set up alerts for:
  - Error rate spike
  - Response time degradation
  - Database connection issues
  - Stripe webhook failures

### Content & Legal

- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] Cookie Policy published
- [ ] Competition Rules published
- [ ] Free Entry instructions clear
- [ ] Company details in footer

---

## Post-Launch (First 48 Hours)

### Monitoring Tasks

- [ ] Monitor error logs every 4 hours
- [ ] Check Stripe dashboard for failed payments
- [ ] Review user registrations
- [ ] Check email delivery rates
- [ ] Monitor server performance

### First Competition

- [ ] Create first live competition
- [ ] Set appropriate draw date
- [ ] Upload high-quality images
- [ ] Write compelling description
- [ ] Set realistic ticket price and quantity
- [ ] Double-check skill question

### Marketing Launch

- [ ] Announce on social media
- [ ] Send launch email to beta users (if any)
- [ ] Submit to relevant directories/forums

---

## Rollback Plan

If critical issues are discovered:

1. **Disable purchases temporarily**
   - Set all competitions to DRAFT status
   - Add maintenance banner

2. **Identify the issue**
   - Check Sentry for errors
   - Review Vercel deployment logs
   - Check database query logs

3. **Rollback deployment if needed**
   - Vercel: Instant rollback to previous deployment
   - Database: Restore from backup if data corruption

4. **Communicate with users**
   - Update status page
   - Email affected users about refunds

---

## Emergency Contacts

| Service | Contact |
|---------|---------|
| Vercel Support | https://vercel.com/support |
| Stripe Support | https://support.stripe.com |
| Neon Support | https://neon.tech/docs/support |
| Upstash Support | https://upstash.com/support |
| Resend Support | https://resend.com/contact |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA Tester | | | |
| Product Owner | | | |

---

*Document created: Phase 6 - Testing & Launch*
*Last updated: February 2026*
