/**
 * Production bootstrap — idempotent and NON-destructive.
 *
 * Unlike `seed.ts` (which wipes the database and is dev-only), this script is
 * safe to run against a production database. It:
 *   1. Upserts a single SUPER_ADMIN from ADMIN_EMAIL / ADMIN_PASSWORD env vars
 *      (so admin login works without hardcoded credentials).
 *   2. Seeds baseline SiteSettings('global') only if absent (never clobbers
 *      live settings).
 *
 * Run:  ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:bootstrap
 */

import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const BCRYPT_COST = 12;

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      'ADMIN_EMAIL and ADMIN_PASSWORD must be set to bootstrap the first SUPER_ADMIN.',
    );
  }

  if (adminPassword.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
  }

  console.log('🔐 Bootstrapping production baseline…');

  // 1. SUPER_ADMIN — upsert by email (idempotent). The password is only set on
  //    create so re-running won't reset a rotated password; role + verification
  //    are kept in sync.
  const passwordHash = await bcrypt.hash(adminPassword, BCRYPT_COST);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: UserRole.SUPER_ADMIN,
      emailVerified: new Date(),
      isActive: true,
      isBanned: false,
    },
    create: {
      email: adminEmail,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      displayName: 'SuperAdmin',
      role: UserRole.SUPER_ADMIN,
      emailVerified: new Date(),
    },
  });
  console.log(`✅ SUPER_ADMIN ready: ${admin.email}`);

  // 2. SiteSettings — create only if missing (preserve live edits).
  const existingSettings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
  if (!existingSettings) {
    await prisma.siteSettings.create({
      data: {
        id: 'global',
        data: {
          heroTitle: 'Win Amazing Collectibles',
          heroCta: 'Browse Competitions',
          companyName: 'YD PARTNERS LTD (trading as WinUCard)',
          companyEmail: 'hello@winucards.com',
          bonusTiers: [
            { ticketsBought: 10, bonusTickets: 1 },
            { ticketsBought: 15, bonusTickets: 2 },
            { ticketsBought: 20, bonusTickets: 3 },
            { ticketsBought: 50, bonusTickets: 5 },
          ],
          freeEntryAddress: 'WinUCard Free Entry, YD PARTNERS LTD, 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ',
        },
      },
    });
    console.log('✅ SiteSettings("global") created');
  } else {
    console.log('↩️  SiteSettings("global") already exists — left untouched');
  }

  console.log('🎉 Bootstrap complete.');
}

main()
  .catch((e) => {
    console.error('❌ Bootstrap failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
