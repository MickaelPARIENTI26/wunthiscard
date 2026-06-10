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
          companyEmail: 'support@winucards.com',
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

  // 3. FAQ — seed the starter set ONLY if the table is empty, so the public
  //    FAQ page isn't blank on a fresh prod DB. Once seeded, the FAQ is fully
  //    managed from the admin panel (we never overwrite admin edits).
  const faqCount = await prisma.faqItem.count();
  if (faqCount === 0) {
    await prisma.faqItem.createMany({
      data: [
        { category: 'Account', sortOrder: 1, question: 'How do I create an account?', answer: 'Click the "Sign Up" button in the top right corner of the website. You can register with your email address or sign in with Google.' },
        { category: 'Account', sortOrder: 2, question: 'I forgot my password. How can I reset it?', answer: 'Click "Forgot Password" on the login page and enter your email address. We\'ll send you a link to reset your password.' },
        { category: 'Tickets', sortOrder: 1, question: 'How do I buy tickets?', answer: 'Browse our active competitions, select the one you want to enter, choose your ticket numbers (or use the random picker), answer the skill question correctly, and complete your payment.' },
        { category: 'Tickets', sortOrder: 2, question: 'What are bonus tickets?', answer: 'When you buy 10+ tickets in a single purchase, you receive bonus tickets for free! Buy 10 get 1 free, 15 get 2 free, 20 get 3 free, 50 get 5 free.' },
        { category: 'Tickets', sortOrder: 3, question: 'Is there a free entry route?', answer: 'Yes! You can enter any competition for free by sending a letter to our postal address with your name, email, chosen ticket number(s), and the correct answer to the skill question. See the competition page for details.' },
        { category: 'Payment', sortOrder: 1, question: 'What payment methods do you accept?', answer: 'We accept all major credit and debit cards (Visa, Mastercard, American Express), processed securely through Stripe.' },
        { category: 'Draw', sortOrder: 1, question: 'How is the winner selected?', answer: 'Winners are selected using a certified random number generator under independent supervision. The draw is conducted fairly and transparently.' },
        { category: 'Draw', sortOrder: 2, question: 'When does the draw take place?', answer: 'The draw takes place either when all tickets are sold or on the scheduled draw date, whichever comes first.' },
        { category: 'Legal', sortOrder: 1, question: 'Is WinUCard legal in the UK?', answer: 'Yes! WinUCard operates as a prize competition (not a lottery) under the UK Gambling Act 2005. All entries require answering a skill-based question, and a free entry route is always available.' },
        { category: 'Legal', sortOrder: 2, question: 'What is the minimum age to participate?', answer: 'You must be 18 years or older to participate in any WinUCard competition.' },
      ],
    });
    console.log('✅ FAQ starter items seeded (10)');
  } else {
    console.log(`↩️  FAQ already has ${faqCount} item(s) — left untouched (managed in admin)`);
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
