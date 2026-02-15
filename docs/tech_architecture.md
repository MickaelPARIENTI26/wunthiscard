# WinUCard — Technical Architecture

> Version 1.0 — February 2026

---

## 1. Overview

Architecture monorepo avec séparation claire entre le site public (user-facing) et le panneau d'administration. Stack moderne, performante, et orientée sécurité.

```
┌─────────────────────────────────────────────────────┐
│                    CLIENTS                           │
│                                                      │
│   ┌──────────────┐         ┌──────────────┐         │
│   │  Site Public  │         │  Admin Panel │         │
│   │  (Next.js)   │         │  (Next.js)   │         │
│   │  Mobile-first│         │  Desktop     │         │
│   └──────┬───────┘         └──────┬───────┘         │
│          │                        │                  │
└──────────┼────────────────────────┼──────────────────┘
           │         HTTPS          │
           ▼                        ▼
┌─────────────────────────────────────────────────────┐
│                   API LAYER                          │
│                                                      │
│   ┌──────────────────────────────────────────┐      │
│   │           Next.js API Routes             │      │
│   │      (Server Actions + Route Handlers)    │      │
│   │                                           │      │
│   │   /api/auth/*    — Authentication         │      │
│   │   /api/competitions/* — Competitions CRUD │      │
│   │   /api/tickets/* — Ticket purchase flow   │      │
│   │   /api/users/*   — User management        │      │
│   │   /api/admin/*   — Admin operations       │      │
│   │   /api/payments/* — Stripe webhooks       │      │
│   │   /api/draw/*    — Draw management        │      │
│   └──────────────────┬───────────────────────┘      │
│                      │                               │
└──────────────────────┼───────────────────────────────┘
                       │
           ┌───────────┼───────────┐
           ▼           ▼           ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐
│  PostgreSQL  │ │  Redis   │ │  Stripe  │
│  (Primary DB)│ │  (Cache) │ │ (Payment)│
└──────────────┘ └──────────┘ └──────────┘
```

---

## 2. Tech Stack

### 2.1 Frontend — Site Public (User-Facing)

| Technologie | Justification |
|-------------|---------------|
| **Next.js 15 (App Router)** | SSR/SSG pour le SEO, Server Components pour la performance, API Routes intégrées |
| **TypeScript** | Typage strict, moins de bugs, meilleure maintenabilité |
| **Tailwind CSS 4** | Utility-first, mobile-first natif, rapide à développer |
| **shadcn/ui** | Composants accessibles, customisables, pas de dépendance lourde |
| **Framer Motion** | Animations fluides pour les interactions (countdown, ticket selection) |
| **React Hook Form + Zod** | Validation de formulaires côté client et serveur |
| **SWR ou TanStack Query** | Data fetching avec cache, revalidation, optimistic updates |

### 2.2 Frontend — Admin Panel

| Technologie | Justification |
|-------------|---------------|
| **Next.js 15 (App Router)** | Même stack que le site public, réutilisation des types et de la logique |
| **Tailwind CSS 4 + shadcn/ui** | Dashboard professionnel avec composants pré-construits |
| **Recharts** | Graphiques pour le dashboard analytics |
| **TanStack Table** | Tableaux de données avec tri, filtres, pagination |
| **React Hook Form + Zod** | Formulaires admin (création de compétitions, etc.) |
| **CKEditor 5 ou TipTap** | Éditeur rich text pour les descriptions et pages statiques |

### 2.3 Backend

| Technologie | Justification |
|-------------|---------------|
| **Next.js API Routes + Server Actions** | Fullstack dans le même projet, pas besoin d'un backend séparé |
| **Prisma ORM** | Type-safe database access, migrations, excellent avec TypeScript |
| **NextAuth.js v5 (Auth.js)** | Auth complète : credentials, Google OAuth, sessions JWT |
| **Stripe SDK** | Paiement sécurisé, webhooks, SCA intégré |
| **Resend** | Emails transactionnels (alternative : SendGrid) |
| **Upstash Redis** | Rate limiting, cache de sessions, file d'attente |
| **Zod** | Validation de toutes les entrées côté serveur |

### 2.4 Base de Données

| Technologie | Justification |
|-------------|---------------|
| **PostgreSQL 16** | ACID compliant, robuste, parfait pour les transactions financières |
| **Prisma** | ORM type-safe, migrations versionnées, seeding |
| **Redis (Upstash)** | Cache, rate limiting, sessions, locks pour la sélection de tickets |

**Pourquoi PostgreSQL plutôt que MongoDB :**
- Transactions ACID natives (critique pour les achats de tickets et les paiements)
- Contraintes d'intégrité référentielle (pas de tickets orphelins, pas de données incohérentes)
- Row-level locking pour la sélection concurrente de tickets
- Meilleur pour les requêtes analytiques (reporting admin)
- Extensions : `pgcrypto` pour le chiffrement, `pg_trgm` pour la recherche

### 2.5 Infrastructure & Hosting

| Service | Usage |
|---------|-------|
| **Vercel** | Hosting Next.js (site public + admin), Edge Functions, CDN global |
| **Neon** ou **Supabase** | PostgreSQL managé, serverless-compatible, backups automatiques |
| **Upstash** | Redis serverless |
| **Cloudflare R2** ou **AWS S3** | Stockage d'images (lots, compétitions) |
| **Cloudflare** | DNS, DDoS protection, WAF |
| **Stripe** | Paiement |
| **Resend** | Emails |
| **Sentry** | Error tracking et monitoring |
| **Vercel Analytics** | Performance monitoring |

**Alternative self-hosted :**
Si tu préfères un VPS (ex: Hetzner, OVH), tu peux héberger le tout avec Docker + Coolify/Caprover comme orchestrateur.

---

## 3. Database Schema (Prisma)

```prisma
// ==========================================
// AUTH & USERS
// ==========================================

model User {
  id                String    @id @default(cuid())
  email             String    @unique
  emailVerified     DateTime?
  passwordHash      String?   // null if OAuth only
  firstName         String
  lastName          String
  displayName       String?
  dateOfBirth       DateTime?
  phone             String?
  avatarUrl         String?
  role              UserRole  @default(USER)
  isActive          Boolean   @default(true)
  isBanned          Boolean   @default(false)
  banReason         String?
  failedLoginAttempts Int     @default(0)
  lockedUntil       DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  accounts          Account[]
  sessions          Session[]
  addresses         Address[]
  orders            Order[]
  tickets           Ticket[]
  wins              Win[]
}

enum UserRole {
  USER
  ADMIN
  SUPER_ADMIN
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String  // "oauth" | "credentials"
  provider          String  // "google" | "credentials"
  providerAccountId String
  access_token      String?
  refresh_token     String?
  token_type        String?
  scope             String?
  id_token          String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  type       TokenType @default(EMAIL_VERIFICATION)

  @@unique([identifier, token])
}

enum TokenType {
  EMAIL_VERIFICATION
  PASSWORD_RESET
  ACCOUNT_UNLOCK
}

model Address {
  id          String  @id @default(cuid())
  userId      String
  label       String? // "Home", "Office", etc.
  line1       String
  line2       String?
  city        String
  county      String?
  postcode    String
  country     String  @default("GB")
  isDefault   Boolean @default(false)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ==========================================
// COMPETITIONS
// ==========================================

model Competition {
  id                String            @id @default(cuid())
  slug              String            @unique
  title             String
  subtitle          String?
  descriptionShort  String
  descriptionLong   String            // Rich HTML content
  category          CompetitionCategory
  subcategory       String?
  status            CompetitionStatus @default(DRAFT)

  // Prize details
  prizeValue        Decimal           @db.Decimal(10, 2) // £ value
  ticketPrice       Decimal           @db.Decimal(10, 2)
  totalTickets      Int
  maxTicketsPerUser Int               @default(50)

  // Dates
  saleStartDate     DateTime?         // When tickets go on sale
  drawDate          DateTime          // Latest date for the draw
  actualDrawDate    DateTime?         // When the draw actually happened

  // Media
  mainImageUrl      String
  galleryUrls       String[]          // Array of image URLs
  videoUrl          String?

  // Authentication / Grading
  certificationNumber String?
  grade               String?
  condition           String?
  provenance          String?

  // Skill Question (QCM)
  questionText      String
  questionChoices   Json              // ["Choice A", "Choice B", "Choice C", "Choice D"]
  questionAnswer    Int               // Index of correct answer (0-3)

  // SEO
  metaTitle         String?
  metaDescription   String?

  // Draw result
  winningTicketNumber Int?
  drawProofUrl        String?         // Link to video/proof

  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  tickets           Ticket[]
  orders            Order[]
  wins              Win[]
}

enum CompetitionCategory {
  POKEMON
  ONE_PIECE
  SPORTS_BASKETBALL
  SPORTS_FOOTBALL
  SPORTS_OTHER
  MEMORABILIA
  YUGIOH
  MTG
  OTHER
}

enum CompetitionStatus {
  DRAFT
  UPCOMING
  ACTIVE
  SOLD_OUT
  DRAWING
  COMPLETED
  CANCELLED
}

// ==========================================
// TICKETS & ORDERS
// ==========================================

model Ticket {
  id              String       @id @default(cuid())
  competitionId   String
  ticketNumber    Int          // 1 to totalTickets
  userId          String?      // null = available
  orderId         String?
  isBonus         Boolean      @default(false) // Free bonus ticket
  isFreeEntry     Boolean      @default(false) // Free postal entry
  status          TicketStatus @default(AVAILABLE)
  reservedUntil   DateTime?    // Temporary reservation during checkout

  competition Competition @relation(fields: [competitionId], references: [id])
  user        User?       @relation(fields: [userId], references: [id])
  order       Order?      @relation(fields: [orderId], references: [id])

  @@unique([competitionId, ticketNumber])
  @@index([competitionId, status])
  @@index([userId])
}

enum TicketStatus {
  AVAILABLE
  RESERVED     // Temporarily held during checkout (5 min TTL)
  SOLD
  FREE_ENTRY   // Postal free entry
}

model Order {
  id                String      @id @default(cuid())
  orderNumber       String      @unique // Human-readable: WTC-20260209-XXXX
  userId            String
  competitionId     String
  ticketCount       Int         // Paid tickets
  bonusTicketCount  Int         @default(0)
  totalAmount       Decimal     @db.Decimal(10, 2) // £
  currency          String      @default("GBP")

  // Stripe
  stripePaymentIntentId String? @unique
  stripeSessionId       String?
  paymentStatus         PaymentStatus @default(PENDING)

  // QCM
  questionAnswered  Boolean     @default(false)
  questionCorrect   Boolean     @default(false)

  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  user        User        @relation(fields: [userId], references: [id])
  competition Competition @relation(fields: [competitionId], references: [id])
  tickets     Ticket[]
}

enum PaymentStatus {
  PENDING
  PROCESSING
  SUCCEEDED
  FAILED
  REFUNDED
  CANCELLED
}

// ==========================================
// WINS & RESULTS
// ==========================================

model Win {
  id              String    @id @default(cuid())
  competitionId   String    @unique
  userId          String
  ticketNumber    Int
  claimedAt       DateTime?
  shippedAt       DateTime?
  deliveredAt     DateTime?
  trackingNumber  String?
  trackingUrl     String?
  shippingCarrier String?
  notes           String?

  competition Competition @relation(fields: [competitionId], references: [id])
  user        User        @relation(fields: [userId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ==========================================
// CMS & SETTINGS
// ==========================================

model StaticPage {
  id        String   @id @default(cuid())
  slug      String   @unique // "about-us", "faq", "how-it-works"
  title     String
  content   String   // Rich HTML
  updatedAt DateTime @updatedAt
}

model FaqItem {
  id        String @id @default(cuid())
  category  String // "Account", "Tickets", "Payment", etc.
  question  String
  answer    String
  sortOrder Int    @default(0)
  isActive  Boolean @default(true)
}

model SiteSettings {
  id    String @id @default("global")
  data  Json   // All settings as JSON
  // Contains: company info, social links, bonus tiers,
  // default QCM, email config, etc.
}

model ContactMessage {
  id        String   @id @default(cuid())
  name      String
  email     String
  subject   String
  message   String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
}

// ==========================================
// AUDIT LOG
// ==========================================

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String   // "TICKET_PURCHASED", "DRAW_EXECUTED", "USER_BANNED", etc.
  entity    String   // "competition", "ticket", "user", etc.
  entityId  String?
  metadata  Json?    // Additional context
  ipAddress String?
  createdAt DateTime @default(now())

  @@index([entity, entityId])
  @@index([userId])
  @@index([createdAt])
}
```

---

## 4. Architecture Détaillée

### 4.1 Structure du Projet (Monorepo)

```
winucard/
├── apps/
│   ├── web/                    # Site public (user-facing)
│   │   ├── app/
│   │   │   ├── (auth)/         # Routes auth (login, register, forgot-password)
│   │   │   ├── (main)/         # Routes publiques
│   │   │   │   ├── page.tsx            # Homepage
│   │   │   │   ├── competitions/
│   │   │   │   │   ├── page.tsx        # Liste des compétitions
│   │   │   │   │   └── [slug]/
│   │   │   │   │       └── page.tsx    # Détail compétition
│   │   │   │   ├── how-it-works/
│   │   │   │   ├── faq/
│   │   │   │   ├── about/
│   │   │   │   ├── contact/
│   │   │   │   ├── winners/
│   │   │   │   ├── terms/
│   │   │   │   ├── privacy/
│   │   │   │   └── cookie-policy/
│   │   │   ├── (account)/      # Routes authentifiées
│   │   │   │   ├── profile/
│   │   │   │   ├── my-tickets/
│   │   │   │   └── my-wins/
│   │   │   ├── checkout/
│   │   │   │   └── [competitionId]/
│   │   │   ├── api/
│   │   │   │   ├── auth/[...nextauth]/
│   │   │   │   ├── competitions/
│   │   │   │   ├── tickets/
│   │   │   │   ├── checkout/
│   │   │   │   ├── webhooks/stripe/
│   │   │   │   └── contact/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui components
│   │   │   ├── layout/         # Header, Footer, Navigation
│   │   │   ├── competition/    # CompetitionCard, TicketSelector, etc.
│   │   │   ├── checkout/       # CheckoutFlow, QCMStep, PaymentStep
│   │   │   └── common/         # Countdown, ProgressBar, etc.
│   │   ├── lib/
│   │   │   ├── auth.ts         # NextAuth config
│   │   │   ├── stripe.ts       # Stripe client
│   │   │   ├── db.ts           # Prisma client
│   │   │   ├── redis.ts        # Redis client
│   │   │   ├── email.ts        # Email service
│   │   │   └── validators/     # Zod schemas
│   │   └── public/
│   │       └── images/
│   │
│   └── admin/                  # Admin panel
│       ├── app/
│       │   ├── (auth)/
│       │   │   └── login/
│       │   ├── (dashboard)/
│       │   │   ├── page.tsx            # Dashboard
│       │   │   ├── competitions/
│       │   │   │   ├── page.tsx        # Liste
│       │   │   │   ├── new/
│       │   │   │   └── [id]/edit/
│       │   │   ├── users/
│       │   │   ├── orders/
│       │   │   ├── draws/
│       │   │   ├── messages/
│       │   │   ├── pages/              # CMS pages statiques
│       │   │   ├── faq/
│       │   │   ├── settings/
│       │   │   └── analytics/
│       │   └── api/
│       │       └── admin/
│       └── components/
│           ├── ui/
│           ├── dashboard/
│           ├── forms/
│           └── tables/
│
├── packages/
│   ├── database/               # Prisma schema, migrations, seed
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── index.ts            # Prisma client export
│   ├── shared/                 # Shared types, utils, validators
│   │   ├── types/
│   │   ├── validators/
│   │   ├── constants/
│   │   └── utils/
│   └── email-templates/        # React Email templates
│       └── templates/
│
├── turbo.json                  # Turborepo config
├── package.json
└── docker-compose.yml          # Local dev (PostgreSQL + Redis)
```

### 4.2 Routing Strategy

**Site Public** : `winucard.com`
**Admin Panel** : `admin.winucard.com` (sous-domaine séparé)

Les deux apps partagent la même base de données et les mêmes packages via le monorepo Turborepo.

### 4.3 Flux d'Achat de Tickets (Sequence)

```
User                    Frontend              API                  Stripe              DB
 │                         │                    │                    │                  │
 ├─ Select tickets ───────►│                    │                    │                  │
 │                         ├─ Reserve tickets ──►│                    │                  │
 │                         │                    ├─ Lock in Redis ────────────────────────►│
 │                         │                    │  (5 min TTL)       │                  │
 │                         │◄── Reserved ───────┤                    │                  │
 │                         │                    │                    │                  │
 ├─ Answer QCM ───────────►│                    │                    │                  │
 │                         ├─ Validate answer ──►│                    │                  │
 │                         │◄── Correct ────────┤                    │                  │
 │                         │                    │                    │                  │
 ├─ Proceed to payment ──►│                    │                    │                  │
 │                         ├─ Create checkout ──►│                    │                  │
 │                         │                    ├─ Create Session ──►│                  │
 │                         │                    │◄── Session URL ────┤                  │
 │                         │◄── Redirect ───────┤                    │                  │
 │                         │                    │                    │                  │
 ├─ Pay on Stripe ────────────────────────────────────────────────►│                  │
 │                         │                    │◄── Webhook ────────┤                  │
 │                         │                    ├─ Confirm tickets ──────────────────────►│
 │                         │                    ├─ Send email ──────►│                  │
 │                         │◄── Confirmation ───┤                    │                  │
```

### 4.4 Ticket Reservation System

Pour éviter les conflits de concurrence (deux users qui achètent le même ticket), on utilise **Redis** comme lock distribué :

1. Quand un user sélectionne des tickets → **RESERVE** dans Redis avec un TTL de 5 minutes
2. Les tickets réservés apparaissent comme "indisponibles" pour les autres users
3. Si le paiement réussit → marquer comme SOLD dans PostgreSQL, supprimer la réservation Redis
4. Si le TTL expire (abandon de panier) → les tickets redeviennent disponibles automatiquement
5. Pattern Redis : `ticket:lock:{competitionId}:{ticketNumber}` → `{userId}` avec TTL 300s

### 4.5 Image Storage

- Upload depuis le CMS admin vers **Cloudflare R2** (ou S3)
- URLs servies via CDN Cloudflare
- Optimisation d'images via Next.js `<Image>` component (WebP automatique, lazy loading)
- Tailles prédéfinies : thumbnail (300px), medium (800px), large (1600px)

---

## 5. APIs Principales

### 5.1 Public APIs

```
GET    /api/competitions                    # Liste (avec filtres, pagination)
GET    /api/competitions/:slug              # Détail d'une compétition
GET    /api/competitions/:slug/tickets      # Tickets disponibles/vendus
POST   /api/tickets/reserve                 # Réserver des tickets (auth required)
POST   /api/tickets/release                 # Libérer une réservation
POST   /api/checkout/validate-answer        # Valider la réponse QCM
POST   /api/checkout/create-session         # Créer une session Stripe
POST   /api/webhooks/stripe                 # Webhook Stripe
GET    /api/winners                         # Liste des gagnants récents
POST   /api/contact                         # Formulaire de contact
GET    /api/faq                             # FAQ items
```

### 5.2 Auth APIs (NextAuth)

```
POST   /api/auth/signin                     # Login (credentials or OAuth)
POST   /api/auth/signup                     # Register
POST   /api/auth/signout                    # Logout
GET    /api/auth/session                    # Current session
POST   /api/auth/forgot-password            # Request password reset
POST   /api/auth/reset-password             # Reset with token
POST   /api/auth/verify-email               # Verify email token
```

### 5.3 Admin APIs

```
# Competitions
GET    /api/admin/competitions              # Liste (all statuses)
POST   /api/admin/competitions              # Create
PUT    /api/admin/competitions/:id          # Update
DELETE /api/admin/competitions/:id          # Delete (draft only)
POST   /api/admin/competitions/:id/publish  # Change status
POST   /api/admin/competitions/:id/draw     # Execute draw
POST   /api/admin/competitions/:id/tickets  # Add manual ticket (free entry)

# Users
GET    /api/admin/users
GET    /api/admin/users/:id
PUT    /api/admin/users/:id/ban
PUT    /api/admin/users/:id/unban

# Orders
GET    /api/admin/orders
GET    /api/admin/orders/:id

# Settings
GET    /api/admin/settings
PUT    /api/admin/settings

# Analytics
GET    /api/admin/analytics/revenue
GET    /api/admin/analytics/users
GET    /api/admin/analytics/competitions

# CMS
GET    /api/admin/pages
PUT    /api/admin/pages/:slug
GET    /api/admin/faq
POST   /api/admin/faq
PUT    /api/admin/faq/:id
DELETE /api/admin/faq/:id

# Messages
GET    /api/admin/messages
PUT    /api/admin/messages/:id/read
```

---

## 6. Third-Party Integrations

| Service | Usage | Env Variables |
|---------|-------|---------------|
| **Stripe** | Paiements, Checkout Sessions, Webhooks | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Google OAuth** | Connexion via Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| **Resend** | Emails transactionnels | `RESEND_API_KEY` |
| **Cloudflare R2** | Stockage d'images | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET` |
| **Upstash Redis** | Cache, rate limiting, ticket locks | `REDIS_URL`, `REDIS_TOKEN` |
| **Sentry** | Error tracking | `SENTRY_DSN` |
| **NextAuth** | Auth framework | `NEXTAUTH_SECRET`, `NEXTAUTH_URL` |

---

## 7. Environments

| Env | URL | DB | Usage |
|-----|-----|-----|-------|
| **Local** | `localhost:3000` / `localhost:3001` | Docker PostgreSQL + Redis | Dev |
| **Staging** | `staging.winucard.com` | Neon branch | Testing |
| **Production** | `winucard.com` | Neon main | Live |

---

## 8. Performance Targets

| Métrique | Cible |
|----------|-------|
| **LCP (Largest Contentful Paint)** | < 2.5s |
| **FID (First Input Delay)** | < 100ms |
| **CLS (Cumulative Layout Shift)** | < 0.1 |
| **TTFB (Time to First Byte)** | < 200ms |
| **Lighthouse Score (Mobile)** | > 90 |
| **API Response Time** | < 200ms (p95) |
| **Uptime** | 99.9% |
