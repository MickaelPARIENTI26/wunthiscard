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
        // Getting started
        { category: 'Getting Started', sortOrder: 1, question: 'How does WinUCard work?', answer: 'WinUCard is a skill-based prize competition platform for collectible cards. Browse our live competitions, pick how many tickets you want, answer a short skill question, and complete your payment. When the competition closes, an independent live random draw (via RandomDraws.com) selects the winner — who gets the card delivered to their door.' },
        { category: 'Getting Started', sortOrder: 2, question: 'How do I create an account?', answer: 'Click "Sign Up" in the top-right corner. You can register with your email address or sign in with Google. You\'ll need to verify your email before you can enter a competition.' },
        { category: 'Getting Started', sortOrder: 3, question: 'I forgot my password. How can I reset it?', answer: 'Click "Forgot Password" on the login page and enter your email address. We\'ll send you a link to choose a new password.' },

        // Tickets & entry
        { category: 'Tickets & Entry', sortOrder: 1, question: 'How do I enter a competition?', answer: 'Choose a live competition, select how many tickets you want (auto-pick or choose your own numbers), answer the skill question correctly, and complete your payment. Your entry is confirmed once payment is received.' },
        { category: 'Tickets & Entry', sortOrder: 2, question: 'How many tickets can I buy?', answer: 'Each competition has a maximum number of tickets per person, shown on the competition page. You can buy any amount up to that limit while tickets remain.' },
        { category: 'Tickets & Entry', sortOrder: 3, question: 'What are bonus tickets?', answer: 'When you buy in bundles, you get extra tickets for free: 10 tickets get +1 free, 25 get +4 free, 50 get +9 free, and 100 get +20 free. The bigger the bundle, the better the discount.' },
        { category: 'Tickets & Entry', sortOrder: 4, question: 'Is there a free entry route?', answer: 'Yes. UK law requires a free entry route on every competition. Send a postcard with your full name, email, the competition name, your chosen ticket number(s) and your answer to the skill question to our postal address (shown on each competition page). One entry per envelope, no purchase necessary.' },

        // Payment
        { category: 'Payment', sortOrder: 1, question: 'What payment methods do you accept?', answer: 'We accept all major credit and debit cards (Visa, Mastercard, American Express), processed securely through Stripe.' },
        { category: 'Payment', sortOrder: 2, question: 'Can I get a refund?', answer: 'Tickets are non-refundable once purchased. The only exception is if a competition is cancelled — in that case all entrants are fully refunded.' },

        // The draw
        { category: 'The Draw', sortOrder: 1, question: 'How is the winner selected?', answer: 'Winners are selected by an independent, live random draw carried out on RandomDraws.com. The draw is recorded for full transparency, and the winning ticket number is published publicly.' },
        { category: 'The Draw', sortOrder: 2, question: 'When does the draw take place?', answer: 'The draw happens either when all tickets sell out or on the scheduled draw date — whichever comes first. You\'ll see the countdown on every competition.' },
        { category: 'The Draw', sortOrder: 3, question: 'How many winners are there?', answer: 'Most competitions have a single winner. Some competitions offer multiple prizes and multiple winners — this is always shown clearly on the competition page.' },
        { category: 'The Draw', sortOrder: 4, question: 'How will I know if I\'ve won?', answer: 'We notify the winner by email within 24 hours of the draw. The winning ticket number is also posted publicly on the competition page and our winners page.' },

        // Winners & delivery
        { category: 'Winners & Delivery', sortOrder: 1, question: 'How long does delivery take?', answer: 'Once the win is verified, we ship your prize within a few business days using insured, tracked delivery.' },
        { category: 'Winners & Delivery', sortOrder: 2, question: 'Where do you deliver?', answer: 'Delivery is free across the UK with full tracking and insurance. International delivery can be arranged where possible.' },
        { category: 'Winners & Delivery', sortOrder: 3, question: 'Are the cards authenticated?', answer: 'Yes. Prizes are professionally graded and authenticated (for example PSA, Beckett or equivalent) where applicable, so you know exactly what you\'re winning.' },

        // Legal & eligibility
        { category: 'Legal & Eligibility', sortOrder: 1, question: 'Is this a lottery?', answer: 'No. WinUCard is a skill-based prize competition, fully compliant with the UK Gambling Act 2005. Every entry requires correctly answering a skill question, and a free entry route is always available.' },
        { category: 'Legal & Eligibility', sortOrder: 2, question: 'What is the skill question?', answer: 'Each competition includes a fair multiple-choice trivia question about the card you\'re entering for. A correct answer validates your entry — this is what makes it a skill competition and not a lottery.' },
        { category: 'Legal & Eligibility', sortOrder: 3, question: 'Who can participate?', answer: 'You must be 18 years or older to enter any WinUCard competition. Age verification may be required for larger prizes.' },
        { category: 'Legal & Eligibility', sortOrder: 4, question: 'Who runs WinUCard?', answer: 'WinUCard is a trading name of YD PARTNERS LTD, a company registered in England & Wales (company number 16766570), with registered office at 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ.' },
      ],
    });
    console.log('✅ FAQ starter items seeded (22)');
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
