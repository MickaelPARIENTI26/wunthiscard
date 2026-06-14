/**
 * Create two TEST competitions (one paid, one free), both ACTIVE and open ~1 month.
 * Idempotent: re-running upserts by slug and only generates tickets if missing.
 *
 * Run against whichever DB the DATABASE_URL points to, e.g. production:
 *   cd packages/database && DATABASE_URL="<prod-url>" npx tsx scripts/create-test-competitions.ts
 *
 * Safe to delete the competitions afterwards from the admin panel.
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const DRAW_DATE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // ~1 month out

interface TestCompetition {
  slug: string;
  title: string;
  subtitle: string;
  descriptionShort: string;
  descriptionLong: string;
  isFree: boolean;
  prizeValue: number;
  ticketPrice: number;
  totalTickets: number;
  maxTicketsPerUser: number;
  mainImageUrl: string;
  questionText: string;
  questionChoices: string[];
  questionAnswer: number;
  grade: string;
}

const COMPETITIONS: TestCompetition[] = [
  {
    slug: 'test-charizard-1st-edition-psa-10',
    title: 'Charizard 1st Edition Base Set — PSA 10 (TEST)',
    subtitle: 'The crown jewel of Pokémon cards',
    descriptionShort:
      'Win the iconic 1st Edition Base Set Charizard, graded PSA 10. (Test competition.)',
    descriptionLong:
      '<p>This is a <strong>test competition</strong>. The prize is a 1st Edition Base Set Charizard graded PSA 10 — graded &amp; authenticated, worth approximately £10,000.</p><p>Answer the skill question, pick your tickets and good luck!</p>',
    isFree: false,
    prizeValue: 10000,
    ticketPrice: 24.9,
    totalTickets: 723, // 723 × £24.90 = £18,002.70 at sell-out
    maxTicketsPerUser: 50,
    mainImageUrl: 'https://images.pokemontcg.io/base1/4_hires.png',
    questionText: 'What type is Charizard?',
    questionChoices: ['Water', 'Fire', 'Grass', 'Electric'],
    questionAnswer: 1,
    grade: 'PSA 10',
  },
  {
    slug: 'test-pikachu-base-set-free-draw',
    title: 'Pikachu Base Set — Free Prize Draw (TEST)',
    subtitle: 'No purchase necessary',
    descriptionShort:
      'Enter for free to win a Base Set Pikachu. (Test free competition.)',
    descriptionLong:
      '<p>This is a <strong>free test competition</strong> — no payment required. Answer the skill question to claim your free entry.</p>',
    isFree: true,
    prizeValue: 500,
    ticketPrice: 0,
    totalTickets: 250,
    maxTicketsPerUser: 1,
    mainImageUrl: 'https://images.pokemontcg.io/base1/58_hires.png',
    questionText: 'What type is Pikachu?',
    questionChoices: ['Fire', 'Water', 'Electric', 'Psychic'],
    questionAnswer: 2,
    grade: 'PSA 9',
  },
];

async function main() {
  console.log(`🎟️  Creating test competitions (draw date: ${DRAW_DATE.toISOString().slice(0, 10)})\n`);

  for (const c of COMPETITIONS) {
    const data = {
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle,
      descriptionShort: c.descriptionShort,
      descriptionLong: c.descriptionLong,
      category: 'POKEMON' as const,
      status: 'ACTIVE' as const,
      isFree: c.isFree,
      drawType: 'single',
      prizeValue: new Prisma.Decimal(c.prizeValue),
      ticketPrice: new Prisma.Decimal(c.ticketPrice),
      totalTickets: c.totalTickets,
      maxTicketsPerUser: c.maxTicketsPerUser,
      saleStartDate: new Date(),
      drawDate: DRAW_DATE,
      mainImageUrl: c.mainImageUrl,
      galleryUrls: [],
      grade: c.grade,
      questionText: c.questionText,
      questionChoices: c.questionChoices,
      questionAnswer: c.questionAnswer,
      metaTitle: c.title,
      metaDescription: c.descriptionShort,
    };

    const competition = await prisma.competition.upsert({
      where: { slug: c.slug },
      update: {
        status: 'ACTIVE',
        drawDate: DRAW_DATE,
        ticketPrice: new Prisma.Decimal(c.ticketPrice),
        prizeValue: new Prisma.Decimal(c.prizeValue),
        totalTickets: c.totalTickets,
        maxTicketsPerUser: c.maxTicketsPerUser,
      },
      create: data,
    });

    // Generate the ticket rows (AVAILABLE by default) if none exist yet.
    const existing = await prisma.ticket.count({ where: { competitionId: competition.id } });
    if (existing === 0) {
      const rows = Array.from({ length: c.totalTickets }, (_, i) => ({
        competitionId: competition.id,
        ticketNumber: i + 1,
      }));
      // createMany in chunks to stay well within parameter limits.
      const CHUNK = 1000;
      for (let i = 0; i < rows.length; i += CHUNK) {
        await prisma.ticket.createMany({ data: rows.slice(i, i + CHUNK) });
      }
      console.log(`✅ ${c.title}\n   ${c.totalTickets} tickets created.`);
    } else {
      console.log(`↩️  ${c.title}\n   already has ${existing} tickets — left untouched.`);
    }

    const revenue = (c.ticketPrice * c.totalTickets).toFixed(2);
    console.log(
      `   /${competition.slug}  ·  ${c.isFree ? 'FREE' : `£${c.ticketPrice}/ticket`}  ·  prize £${c.prizeValue}  ·  sell-out revenue £${revenue}\n`
    );
  }

  console.log('🎉 Done. The competitions are ACTIVE on the public site.');
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
