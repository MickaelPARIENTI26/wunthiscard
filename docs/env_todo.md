# Production Environment Variables Checklist

This document lists all environment variables required for production deployment of WinThisCard.

## Required Variables

### Database
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/winthiscard?sslmode=require` |

### Authentication
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `AUTH_SECRET` | Yes | NextAuth.js secret (32+ chars) | `your-32-character-secret-string` |
| `NEXTAUTH_SECRET` | Yes | Legacy alias for AUTH_SECRET | Same as AUTH_SECRET |
| `NEXTAUTH_URL` | Yes | Public URL of the web app | `https://winthiscard.com` |
| `AUTH_URL` | Yes | Legacy alias for NEXTAUTH_URL | Same as NEXTAUTH_URL |

### App URLs
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Yes | Public web app URL | `https://winthiscard.com` |
| `NEXT_PUBLIC_ADMIN_URL` | Yes | Admin panel URL | `https://admin.winthiscard.com` |

### Stripe Payments
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Yes | Stripe API secret key | `sk_live_xxxxx` |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key | `pk_live_xxxxx` |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret | `whsec_xxxxx` |

### Redis / Rate Limiting
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `UPSTASH_REDIS_REST_URL` | Yes* | Upstash Redis REST URL | `https://xxxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Yes* | Upstash Redis REST token | `AxxxxYYYY...` |
| `REDIS_URL` | No | Alternative: Standard Redis URL | `redis://localhost:6379` |

*Either Upstash or standard Redis is required for production.

### Email (Resend)
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `RESEND_API_KEY` | Yes | Resend API key | `re_xxxxxxx` |
| `FROM_EMAIL` | Yes | Sender email address | `noreply@winthiscard.com` |

### Cloudflare Turnstile (Bot Protection)
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Yes | Turnstile site key (public) | `0x4AAAxxxxxxx` |
| `TURNSTILE_SECRET_KEY` | Yes | Turnstile secret key | `0x4BBBxxxxxxx` |

### Google OAuth (Optional)
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID | `xxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret | `GOCSPX-xxxxx` |
| `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED` | No | Enable Google login | `true` or `false` |

### Storage (Cloudflare R2)
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `R2_ACCOUNT_ID` | Yes | Cloudflare account ID | `xxxxxxx` |
| `R2_ACCESS_KEY_ID` | Yes | R2 access key ID | `xxxxxxx` |
| `R2_SECRET_ACCESS_KEY` | Yes | R2 secret access key | `xxxxxxx` |
| `R2_BUCKET_NAME` | Yes | R2 bucket name | `winthiscard-images` |
| `R2_PUBLIC_URL` | Yes | Public CDN URL for R2 | `https://images.winthiscard.com` |

### Error Tracking (Optional)
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SENTRY_DSN` | No | Sentry DSN for error tracking | `https://xxx@xxx.ingest.sentry.io/xxx` |

### Environment
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode | `production` |

## Pre-Deployment Checklist

### 1. Database Setup
- [ ] PostgreSQL 16+ database provisioned
- [ ] Database user created with appropriate permissions
- [ ] `DATABASE_URL` configured with SSL mode enabled
- [ ] Prisma migrations applied: `npx prisma migrate deploy`

### 2. Authentication
- [ ] Generate secure 32+ character `AUTH_SECRET`
- [ ] Configure `NEXTAUTH_URL` to match production domain
- [ ] (Optional) Set up Google OAuth credentials in Google Cloud Console

### 3. Payments
- [ ] Stripe account activated for live payments
- [ ] Live API keys obtained (not test keys!)
- [ ] Webhook endpoint configured in Stripe Dashboard
- [ ] Webhook secret obtained and configured

### 4. Redis
- [ ] Upstash Redis instance created (recommended for serverless)
- [ ] OR standard Redis server provisioned
- [ ] Rate limiting configuration tested

### 5. Email
- [ ] Resend account created
- [ ] Domain verified in Resend
- [ ] API key generated
- [ ] SPF/DKIM records configured for deliverability

### 6. Bot Protection
- [ ] Cloudflare Turnstile site created
- [ ] Site key and secret key obtained
- [ ] Turnstile widget tested on forms

### 7. Storage
- [ ] Cloudflare R2 bucket created
- [ ] CORS configured for your domains
- [ ] Public access configured (or CDN domain set up)
- [ ] API credentials generated

### 8. Monitoring (Recommended)
- [ ] Sentry project created
- [ ] DSN configured
- [ ] Source maps uploaded for debugging

## Security Notes

1. **Never commit secrets to version control**
2. **Use environment variable encryption** where available (Vercel, etc.)
3. **Rotate secrets regularly**, especially after any potential exposure
4. **Use different credentials** for staging vs production
5. **Enable audit logging** for sensitive operations
6. **Set up alerts** for unusual activity patterns

## Vercel Deployment

If deploying to Vercel:

1. Add all variables in Project Settings > Environment Variables
2. Set scope appropriately (Production, Preview, Development)
3. Sensitive values should use "Sensitive" flag
4. Use Vercel's integration for Postgres, Redis, etc. where available

## Testing Production Config

Before going live:

```bash
# Verify database connection
npx prisma db pull

# Verify Stripe connection
curl https://api.stripe.com/v1/balance -u sk_live_xxx:

# Verify Redis connection
# (test via your application or Redis CLI)

# Verify email delivery
# Send test email via Resend dashboard
```
