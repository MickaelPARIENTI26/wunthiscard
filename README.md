# WinUCard

UK-based prize competition platform for collectible cards (Pokemon, One Piece, Sports) and memorabilia. Users purchase tickets for a chance to win high-value prizes through skill-based competitions compliant with UK Gambling Act 2005.

## Tech Stack

- **Monorepo**: Turborepo
- **Frontend (Public)**: Next.js 15, TypeScript, Tailwind CSS 4, shadcn/ui
- **Frontend (Admin)**: Same stack + Recharts, TanStack Table
- **Backend**: Next.js API Routes + Server Actions
- **Database**: PostgreSQL 16 (Prisma ORM)
- **Cache/Locks**: Redis (Upstash)
- **Auth**: NextAuth.js v5 (credentials + Google OAuth)
- **Payments**: Stripe Checkout Sessions
- **Email**: Resend
- **Storage**: Cloudflare R2

## Project Structure

```
winucard/
├── apps/
│   ├── web/          # Public user-facing site (port 3000)
│   └── admin/        # Admin CMS panel (port 3001)
├── packages/
│   ├── database/     # Prisma schema, migrations, client
│   └── shared/       # Shared types, validators, utils
├── tests/
│   └── unit/         # Unit tests (Vitest)
└── docs/             # Project documentation
```

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL and Redis)

### Installation

```bash
# Install dependencies
npm install

# Start databases
docker compose up -d

# Run database migrations
npx prisma migrate dev

# Seed test data (optional)
npx prisma db seed

# Start development servers
npx turbo dev
```

### Available Commands

```bash
npm run dev           # Start all apps in development
npm run build         # Build all apps
npm run lint          # Run ESLint
npm run test          # Run unit tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run format        # Format code with Prettier
npm run db:studio     # Open Prisma Studio
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

See `.env.example` for all required environment variables.

## Documentation

| Document | Description |
|----------|-------------|
| [Business Rules](docs/business_rules.md) | Competition lifecycle, ticket rules, UK legal compliance |
| [Tech Architecture](docs/tech_architecture.md) | Full tech stack, database schema, API endpoints |
| [Security Rules](docs/security_rules.md) | Auth, payments, rate limiting, headers, audit log |
| [Dev Roadmap](docs/dev_roadmap.md) | Development phases and task breakdown |
| [E2E Tests](docs/e2e_manual_tests.md) | Manual test scenarios for QA |
| [Launch Checklist](docs/launch_checklist.md) | Production deployment checklist |

## Key Features

- **Skill-Based Competitions**: Users must answer a skill question before purchase (UK legal requirement)
- **Bonus Ticket System**: Buy more tickets, get bonus entries free
- **Free Postal Entry**: Alternative entry method for legal compliance
- **Real-Time Countdown**: Live countdown timers for competition end dates
- **Secure Payments**: Stripe Checkout with webhook verification
- **Admin Dashboard**: Full competition management, user admin, analytics
- **Winner Selection**: Cryptographically secure random draw

## Testing

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

Current test coverage: 76 tests covering validators and business logic.

## Deployment

See [Launch Checklist](docs/launch_checklist.md) for complete deployment instructions.

Quick deploy to Vercel:

1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Deploy with `turbo build`

## License

Proprietary - All rights reserved
