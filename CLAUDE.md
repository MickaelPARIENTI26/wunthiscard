# WinThisCard — Claude Code Instructions

## Project Overview
WinThisCard is a UK-based prize competition platform for collectible cards (Pokémon, One Piece, Sports) and memorabilia (signed jerseys, etc.). Users buy tickets to win prizes. This is NOT a lottery — it's a skill-based prize competition compliant with the UK Gambling Act 2005 (requires a skill question + free postal entry route).

## Documentation
READ THESE FILES BEFORE ANY WORK:
- `docs/business_rules.md` — All business logic, competition lifecycle, ticket rules, UK legal compliance
- `docs/tech_architecture.md` — Full tech stack, database schema (Prisma), project structure, API endpoints
- `docs/security_rules.md` — All security requirements (auth, payments, rate limiting, headers, audit log)
- `docs/dev_roadmap.md` — Development phases and task breakdown

## Tech Stack
- **Monorepo**: Turborepo
- **Frontend (public site)**: Next.js 15 (App Router), TypeScript, Tailwind CSS 4, shadcn/ui
- **Frontend (admin)**: Same stack + Recharts, TanStack Table, TipTap editor
- **Backend**: Next.js API Routes + Server Actions
- **ORM**: Prisma with PostgreSQL 16
- **Auth**: NextAuth.js v5 (credentials + Google OAuth)
- **Payments**: Stripe Checkout Sessions
- **Cache/Locks**: Upstash Redis
- **Email**: Resend
- **Storage**: Cloudflare R2
- **Hosting**: Vercel

## Architecture
- `apps/web` — Public user-facing site (port 3000)
- `apps/admin` — Admin CMS panel (port 3001)
- `packages/database` — Prisma schema, migrations, client
- `packages/shared` — Shared types, validators (Zod), utils, constants

## Critical Rules
1. **TypeScript strict** — No `any`, no `@ts-ignore`
2. **Mobile-first** — All public pages must be responsive, mobile-first
3. **Zod validation** — Every input validated client AND server side
4. **Security** — See security_rules.md. Rate limiting, audit log, CSP headers from day 1
5. **100% English** — All user-facing content in English
6. **GBP currency** — All prices in British Pounds (£)
7. **Prisma** — Use Prisma for ALL database operations, never raw SQL
8. **Audit log** — Log every sensitive action (see security_rules.md)

## Commands
```bash
docker compose up -d          # Start PostgreSQL + Redis
npx turbo dev                 # Start both apps
npx prisma migrate dev        # Run migrations
npx prisma db seed            # Seed test data
npx prisma studio             # Visual DB browser
```

## Current Phase
Phase 0 — Setup & Foundation (see dev_roadmap.md)
