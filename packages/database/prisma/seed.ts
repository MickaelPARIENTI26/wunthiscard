import { PrismaClient, UserRole, CompetitionStatus, CompetitionCategory, TicketStatus, PaymentStatus } from '@prisma/client';
import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const prisma = new PrismaClient();
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.faqItem.deleteMany();
  await prisma.staticPage.deleteMany();
  await prisma.siteSettings.deleteMany();
  await prisma.win.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.order.deleteMany();
  await prisma.competition.deleteMany();
  await prisma.address.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleaned existing data');

  // Create users
  const adminPassword = await hashPassword('Admin123!');
  const userPassword = await hashPassword('User123!');

  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@winthiscard.com',
      passwordHash: adminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      displayName: 'SuperAdmin',
      role: UserRole.SUPER_ADMIN,
      emailVerified: new Date(),
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'moderator@winthiscard.com',
      passwordHash: adminPassword,
      firstName: 'Mod',
      lastName: 'Admin',
      displayName: 'Moderator',
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      passwordHash: userPassword,
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'JohnD',
      dateOfBirth: new Date('1990-05-15'),
      role: UserRole.USER,
      emailVerified: new Date(),
      addresses: {
        create: {
          label: 'Home',
          line1: '123 Main Street',
          city: 'London',
          postcode: 'SW1A 1AA',
          country: 'GB',
          isDefault: true,
        },
      },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      passwordHash: userPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      displayName: 'JaneS',
      dateOfBirth: new Date('1988-09-20'),
      role: UserRole.USER,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Created users');

  // Create competitions
  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const competition1 = await prisma.competition.create({
    data: {
      slug: 'charizard-psa-10-base-set',
      title: 'Charizard PSA 10 Base Set 1st Edition',
      subtitle: 'The Holy Grail of Pokémon Cards',
      descriptionShort:
        'Win this iconic Charizard PSA 10 1st Edition Base Set - one of the most sought-after Pokémon cards in existence!',
      descriptionLong: `
        <h2>The Ultimate Pokémon Prize</h2>
        <p>This is your chance to win the most iconic Pokémon card ever printed - a PSA 10 graded 1st Edition Base Set Charizard.</p>
        <h3>Card Details</h3>
        <ul>
          <li>Set: Base Set 1st Edition</li>
          <li>Card Number: 4/102</li>
          <li>Grade: PSA 10 Gem Mint</li>
          <li>Language: English</li>
        </ul>
        <p>This card represents the pinnacle of Pokémon collecting and is a true investment piece.</p>
      `,
      category: CompetitionCategory.POKEMON,
      subcategory: 'Base Set',
      status: CompetitionStatus.ACTIVE,
      prizeValue: 150000,
      ticketPrice: 9.99,
      totalTickets: 5000,
      maxTicketsPerUser: 50,
      saleStartDate: now,
      drawDate: oneMonthFromNow,
      mainImageUrl: 'https://images.pokemontcg.io/base1/4_hires.png',
      galleryUrls: [
        'https://images.pokemontcg.io/base1/4_hires.png',
        'https://images.pokemontcg.io/base1/4_hires.png',
      ],
      certificationNumber: '45678901',
      grade: 'PSA 10',
      condition: 'Gem Mint',
      questionText: 'In what year was the first Pokémon TCG Base Set released in Japan?',
      questionChoices: ['1996', '1997', '1998', '1999'],
      questionAnswer: 0,
      metaTitle: 'Win a Charizard PSA 10 1st Edition Base Set | WinThisCard',
      metaDescription:
        'Enter for a chance to win the most iconic Pokémon card - a PSA 10 graded 1st Edition Charizard worth £150,000!',
    },
  });

  const competition2 = await prisma.competition.create({
    data: {
      slug: 'pikachu-illustrator-promo',
      title: 'Pikachu Illustrator Promo',
      subtitle: 'The Rarest Pokémon Card in the World',
      descriptionShort:
        'An ultra-rare opportunity to win the legendary Pikachu Illustrator card - only 39 known to exist!',
      descriptionLong: `
        <h2>The Rarest Card in Existence</h2>
        <p>The Pikachu Illustrator card is considered the most valuable and rarest Pokémon card ever made.</p>
        <p>Only 39 copies are known to exist, making this a once-in-a-lifetime opportunity.</p>
      `,
      category: CompetitionCategory.POKEMON,
      subcategory: 'Promo',
      status: CompetitionStatus.UPCOMING,
      prizeValue: 500000,
      ticketPrice: 24.99,
      totalTickets: 10000,
      maxTicketsPerUser: 50,
      saleStartDate: oneWeekFromNow,
      drawDate: twoWeeksFromNow,
      mainImageUrl: 'https://images.pokemontcg.io/basep/4_hires.png',
      galleryUrls: [],
      grade: 'PSA 9',
      questionText: 'How many Pikachu Illustrator cards are known to exist?',
      questionChoices: ['20', '39', '50', '100'],
      questionAnswer: 1,
      metaTitle: 'Win a Pikachu Illustrator Card | WinThisCard',
      metaDescription: 'The rarest Pokémon card in the world could be yours!',
    },
  });

  const competition3 = await prisma.competition.create({
    data: {
      slug: 'luffy-gear-5-alt-art',
      title: 'Luffy Gear 5 Alt Art OP05',
      subtitle: 'One Piece TCG Chase Card',
      descriptionShort: 'Win this stunning Luffy Gear 5 alternate art card from the Awakening of the New Era set!',
      descriptionLong: `
        <h2>One Piece TCG Hit Card</h2>
        <p>The Monkey D. Luffy (Gear 5) alternate art is one of the most sought-after cards in the One Piece TCG.</p>
      `,
      category: CompetitionCategory.ONE_PIECE,
      status: CompetitionStatus.ACTIVE,
      prizeValue: 500,
      ticketPrice: 2.99,
      totalTickets: 500,
      maxTicketsPerUser: 50,
      saleStartDate: now,
      drawDate: oneWeekFromNow,
      mainImageUrl: 'https://example.com/luffy-gear5.jpg',
      galleryUrls: [],
      condition: 'Near Mint',
      questionText: 'What is the name of Luffy\'s ultimate transformation in One Piece?',
      questionChoices: ['Gear 4', 'Gear 5', 'Gear 6', 'Super Saiyan'],
      questionAnswer: 1,
    },
  });

  const competition4 = await prisma.competition.create({
    data: {
      slug: 'signed-messi-jersey-2022',
      title: 'Lionel Messi Signed Argentina Jersey',
      subtitle: '2022 World Cup Winner Jersey',
      descriptionShort: 'Win an authentic signed Lionel Messi Argentina jersey from the 2022 World Cup!',
      descriptionLong: `
        <h2>World Cup Champion Memorabilia</h2>
        <p>This authentic Argentina national team jersey has been personally signed by Lionel Messi.</p>
        <p>Comes with a certificate of authenticity from PSA/DNA.</p>
      `,
      category: CompetitionCategory.SPORTS_FOOTBALL,
      subcategory: 'Football',
      status: CompetitionStatus.ACTIVE,
      prizeValue: 5000,
      ticketPrice: 4.99,
      totalTickets: 1000,
      maxTicketsPerUser: 50,
      saleStartDate: now,
      drawDate: twoWeeksFromNow,
      mainImageUrl: 'https://example.com/messi-jersey.jpg',
      galleryUrls: [],
      certificationNumber: 'PSA-DNA-123456',
      provenance: 'Obtained at charity event, Buenos Aires 2023',
      questionText: 'How many FIFA World Cups has Lionel Messi won?',
      questionChoices: ['0', '1', '2', '3'],
      questionAnswer: 1,
    },
  });

  // DRAFT competition (not visible on public site)
  const competition5 = await prisma.competition.create({
    data: {
      slug: 'lebron-rookie-card-draft',
      title: 'LeBron James Rookie Card PSA 10',
      subtitle: '2003 Topps Chrome Refractor',
      descriptionShort: 'Coming soon - a legendary LeBron James rookie card!',
      descriptionLong: `
        <h2>Basketball Legend Rookie Card</h2>
        <p>This 2003 Topps Chrome Refractor LeBron James rookie card is one of the most valuable basketball cards ever.</p>
      `,
      category: CompetitionCategory.SPORTS_BASKETBALL,
      status: CompetitionStatus.DRAFT,
      prizeValue: 75000,
      ticketPrice: 14.99,
      totalTickets: 2000,
      maxTicketsPerUser: 50,
      drawDate: oneMonthFromNow,
      mainImageUrl: 'https://example.com/lebron-rookie.jpg',
      galleryUrls: [],
      grade: 'PSA 10',
      condition: 'Gem Mint',
      questionText: 'In which year was LeBron James drafted to the NBA?',
      questionChoices: ['2002', '2003', '2004', '2005'],
      questionAnswer: 1,
    },
  });

  // COMPLETED competition with a winner
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const competition6 = await prisma.competition.create({
    data: {
      slug: 'blastoise-psa-9-completed',
      title: 'Blastoise PSA 9 Base Set',
      subtitle: 'Classic Water Starter',
      descriptionShort: 'This competition has ended - congratulations to our winner!',
      descriptionLong: `
        <h2>Classic Pokémon Card</h2>
        <p>A beautiful PSA 9 graded Blastoise from the original Base Set.</p>
      `,
      category: CompetitionCategory.POKEMON,
      subcategory: 'Base Set',
      status: CompetitionStatus.COMPLETED,
      prizeValue: 2500,
      ticketPrice: 2.99,
      totalTickets: 500,
      maxTicketsPerUser: 50,
      saleStartDate: twoWeeksAgo,
      drawDate: oneWeekAgo,
      actualDrawDate: oneWeekAgo,
      mainImageUrl: 'https://images.pokemontcg.io/base1/2_hires.png',
      galleryUrls: [],
      grade: 'PSA 9',
      condition: 'Mint',
      winningTicketNumber: 42,
      drawProofUrl: 'https://example.com/draw-proof-blastoise.mp4',
      questionText: 'In the original Pokémon Red/Blue, what level does Wartortle evolve into Blastoise?',
      questionChoices: ['32', '36', '40', '44'],
      questionAnswer: 1,
    },
  });

  // Memorabilia competition (different from sports)
  const competition7 = await prisma.competition.create({
    data: {
      slug: 'signed-one-piece-manga',
      title: 'Signed One Piece Volume 1',
      subtitle: 'Autographed by Eiichiro Oda',
      descriptionShort: 'A rare signed first edition of One Piece Volume 1 by creator Eiichiro Oda!',
      descriptionLong: `
        <h2>Manga Legend Signature</h2>
        <p>This first edition One Piece Volume 1 has been personally signed by Eiichiro Oda.</p>
        <p>Includes certificate of authenticity.</p>
      `,
      category: CompetitionCategory.MEMORABILIA,
      status: CompetitionStatus.ACTIVE,
      prizeValue: 8000,
      ticketPrice: 5.99,
      totalTickets: 800,
      maxTicketsPerUser: 50,
      saleStartDate: now,
      drawDate: oneMonthFromNow,
      mainImageUrl: 'https://example.com/one-piece-signed.jpg',
      galleryUrls: [],
      certificationNumber: 'JSA-789012',
      provenance: 'Signed at Jump Festa 2023',
      questionText: 'In what year did the One Piece manga first begin serialization in Weekly Shonen Jump?',
      questionChoices: ['1995', '1996', '1997', '1998'],
      questionAnswer: 2,
    },
  });

  console.log('✅ Created competitions');

  // Helper to create tickets in batches
  async function createTicketsForCompetition(
    competitionId: string,
    totalTickets: number,
    soldCount: number = 0,
    buyerUserId?: string
  ) {
    const BATCH_SIZE = 500;
    for (let batch = 0; batch < Math.ceil(totalTickets / BATCH_SIZE); batch++) {
      const tickets = [];
      const start = batch * BATCH_SIZE + 1;
      const end = Math.min((batch + 1) * BATCH_SIZE, totalTickets);
      for (let i = start; i <= end; i++) {
        const isSold = i <= soldCount && buyerUserId;
        tickets.push({
          competitionId,
          ticketNumber: i,
          status: isSold ? TicketStatus.SOLD : TicketStatus.AVAILABLE,
          userId: isSold ? buyerUserId : null,
        });
      }
      await prisma.ticket.createMany({ data: tickets });
    }
  }

  // Create tickets for ACTIVE competitions (with some sold)
  // Competition 1: Charizard - 5000 tickets, 150 sold (3%)
  await createTicketsForCompetition(competition1.id, competition1.totalTickets, 150, user1.id);

  // Competition 3: Luffy - 500 tickets, 85 sold (17%)
  await createTicketsForCompetition(competition3.id, competition3.totalTickets, 85, user2.id);

  // Competition 4: Messi Jersey - 1000 tickets, 230 sold (23%)
  await createTicketsForCompetition(competition4.id, competition4.totalTickets, 230, user1.id);

  // Competition 7: Signed One Piece - 800 tickets, 45 sold (5.6%)
  await createTicketsForCompetition(competition7.id, competition7.totalTickets, 45, user2.id);

  // Competition 2: UPCOMING - create tickets but none sold
  await createTicketsForCompetition(competition2.id, competition2.totalTickets, 0);

  // Competition 6: COMPLETED - all tickets sold, winning ticket #42 belongs to user1
  const ticketsComp6 = [];
  for (let i = 1; i <= competition6.totalTickets; i++) {
    ticketsComp6.push({
      competitionId: competition6.id,
      ticketNumber: i,
      status: TicketStatus.SOLD,
      userId: i === 42 ? user1.id : (i % 2 === 0 ? user1.id : user2.id),
    });
  }
  // Create in batches
  for (let i = 0; i < ticketsComp6.length; i += 500) {
    await prisma.ticket.createMany({ data: ticketsComp6.slice(i, i + 500) });
  }

  console.log('✅ Created tickets');

  // Create orders for sold tickets
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'WTC-20260101-TEST1',
      userId: user1.id,
      competitionId: competition1.id,
      ticketCount: 150,
      bonusTicketCount: 5,
      totalAmount: 150 * 9.99,
      paymentStatus: PaymentStatus.SUCCEEDED,
      stripePaymentIntentId: 'pi_test_' + Date.now(),
      questionAnswered: true,
      questionCorrect: true,
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'WTC-20260101-TEST2',
      userId: user2.id,
      competitionId: competition3.id,
      ticketCount: 85,
      bonusTicketCount: 5,
      totalAmount: 85 * 2.99,
      paymentStatus: PaymentStatus.SUCCEEDED,
      stripePaymentIntentId: 'pi_test_' + (Date.now() + 1),
      questionAnswered: true,
      questionCorrect: true,
    },
  });

  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'WTC-20260101-TEST3',
      userId: user1.id,
      competitionId: competition4.id,
      ticketCount: 230,
      bonusTicketCount: 5,
      totalAmount: 230 * 4.99,
      paymentStatus: PaymentStatus.SUCCEEDED,
      stripePaymentIntentId: 'pi_test_' + (Date.now() + 2),
      questionAnswered: true,
      questionCorrect: true,
    },
  });

  // Link tickets to orders
  await prisma.ticket.updateMany({
    where: {
      competitionId: competition1.id,
      ticketNumber: { lte: 150 },
    },
    data: { orderId: order1.id },
  });

  await prisma.ticket.updateMany({
    where: {
      competitionId: competition3.id,
      ticketNumber: { lte: 85 },
    },
    data: { orderId: order2.id },
  });

  await prisma.ticket.updateMany({
    where: {
      competitionId: competition4.id,
      ticketNumber: { lte: 230 },
    },
    data: { orderId: order3.id },
  });

  console.log('✅ Created orders');

  // Create Win record for COMPLETED competition
  await prisma.win.create({
    data: {
      competitionId: competition6.id,
      userId: user1.id,
      ticketNumber: 42,
      claimedAt: oneWeekAgo,
      shippedAt: new Date(oneWeekAgo.getTime() + 2 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(oneWeekAgo.getTime() + 5 * 24 * 60 * 60 * 1000),
      trackingNumber: 'RM123456789GB',
      trackingUrl: 'https://www.royalmail.com/track-your-item',
      shippingCarrier: 'Royal Mail',
    },
  });

  console.log('✅ Created win record');

  // Create site settings
  await prisma.siteSettings.create({
    data: {
      id: 'global',
      data: {
        companyName: 'WinThisCard Ltd',
        companyAddress: '123 Collection Street, London, EC1A 1BB, United Kingdom',
        companyEmail: 'hello@winthiscard.com',
        socialLinks: {
          instagram: 'https://instagram.com/winthiscard',
          twitter: 'https://twitter.com/winthiscard',
          tiktok: 'https://tiktok.com/@winthiscard',
          facebook: 'https://facebook.com/winthiscard',
          discord: 'https://discord.gg/winthiscard',
        },
        socialFollowers: {
          instagram: 15000,
          twitter: 8500,
          tiktok: 25000,
          facebook: 5000,
          discord: 3500,
        },
        bonusTiers: [
          { ticketsBought: 10, bonusTickets: 1 },
          { ticketsBought: 15, bonusTickets: 2 },
          { ticketsBought: 20, bonusTickets: 3 },
          { ticketsBought: 50, bonusTickets: 5 },
        ],
        freeEntryAddress: 'WinThisCard Ltd, Free Entry Department, PO Box 123, London EC1A 1BB',
      },
    },
  });

  console.log('✅ Created site settings');

  // Create FAQ items
  const faqItems = [
    {
      category: 'Account',
      question: 'How do I create an account?',
      answer:
        'Click the "Sign Up" button in the top right corner of the website. You can register with your email address or sign in with Google.',
      sortOrder: 1,
    },
    {
      category: 'Account',
      question: 'I forgot my password. How can I reset it?',
      answer:
        'Click "Forgot Password" on the login page and enter your email address. We\'ll send you a link to reset your password.',
      sortOrder: 2,
    },
    {
      category: 'Tickets',
      question: 'How do I buy tickets?',
      answer:
        'Browse our active competitions, select the one you want to enter, choose your ticket numbers (or use the random picker), answer the skill question correctly, and complete your payment.',
      sortOrder: 1,
    },
    {
      category: 'Tickets',
      question: 'What are bonus tickets?',
      answer:
        'When you buy 10+ tickets in a single purchase, you receive bonus tickets for free! Buy 10 get 1 free, 15 get 2 free, 20 get 3 free, 50 get 5 free.',
      sortOrder: 2,
    },
    {
      category: 'Tickets',
      question: 'Is there a free entry route?',
      answer:
        'Yes! You can enter any competition for free by sending a letter to our postal address with your name, email, chosen ticket number(s), and the correct answer to the skill question. See the competition page for details.',
      sortOrder: 3,
    },
    {
      category: 'Payment',
      question: 'What payment methods do you accept?',
      answer:
        'We accept all major credit and debit cards (Visa, Mastercard, American Express), as well as Apple Pay and Google Pay through Stripe.',
      sortOrder: 1,
    },
    {
      category: 'Draw',
      question: 'How is the winner selected?',
      answer:
        'Winners are selected using a certified random number generator under independent supervision. The draw is conducted fairly and transparently.',
      sortOrder: 1,
    },
    {
      category: 'Draw',
      question: 'When does the draw take place?',
      answer:
        'The draw takes place either when all tickets are sold or on the scheduled draw date, whichever comes first.',
      sortOrder: 2,
    },
    {
      category: 'Legal',
      question: 'Is WinThisCard legal in the UK?',
      answer:
        'Yes! WinThisCard operates as a prize competition (not a lottery) under the UK Gambling Act 2005. All entries require answering a skill-based question, and a free entry route is always available.',
      sortOrder: 1,
    },
    {
      category: 'Legal',
      question: 'What is the minimum age to participate?',
      answer: 'You must be 18 years or older to participate in any WinThisCard competition.',
      sortOrder: 2,
    },
  ];

  await prisma.faqItem.createMany({ data: faqItems });

  console.log('✅ Created FAQ items');

  // Create static pages
  await prisma.staticPage.create({
    data: {
      slug: 'about-us',
      title: 'About Us',
      content: `
        <h1>About WinThisCard</h1>
        <p>WinThisCard is the UK's premier prize competition platform for collectible cards and memorabilia.</p>
        <h2>Our Mission</h2>
        <p>We're passionate collectors who believe everyone should have the chance to own grail-tier collectibles. That's why we created WinThisCard - to give you the opportunity to win cards and memorabilia that would otherwise be out of reach.</p>
        <h2>Why Choose Us?</h2>
        <ul>
          <li>100% authentic, verified items</li>
          <li>Fair and transparent draws</li>
          <li>Free entry route available on all competitions</li>
          <li>Insured, tracked delivery on all prizes</li>
        </ul>
      `,
    },
  });

  await prisma.staticPage.create({
    data: {
      slug: 'how-it-works',
      title: 'How It Works',
      content: `
        <h1>How It Works</h1>
        <h2>Step 1: Choose Your Competition</h2>
        <p>Browse our active competitions and find the card or memorabilia you want to win.</p>
        <h2>Step 2: Pick Your Numbers</h2>
        <p>Select your lucky ticket numbers or let us pick randomly for you. The more tickets you buy, the better your odds!</p>
        <h2>Step 3: Answer the Question</h2>
        <p>Correctly answer a skill-based question to validate your entry. This ensures we operate as a legal prize competition.</p>
        <h2>Step 4: Wait for the Draw</h2>
        <p>Once all tickets are sold (or the draw date arrives), we conduct a fair, random draw using certified technology.</p>
        <h2>Step 5: Claim Your Prize!</h2>
        <p>If you win, we'll contact you immediately. Your prize will be shipped insured and tracked to your door.</p>
      `,
    },
  });

  await prisma.staticPage.create({
    data: {
      slug: 'terms-and-conditions',
      title: 'Terms & Conditions',
      content: '<h1>Terms & Conditions</h1><p>Please read these terms carefully before using WinThisCard...</p>',
    },
  });

  await prisma.staticPage.create({
    data: {
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      content: '<h1>Privacy Policy</h1><p>This privacy policy explains how we collect and use your data...</p>',
    },
  });

  await prisma.staticPage.create({
    data: {
      slug: 'cookie-policy',
      title: 'Cookie Policy',
      content: '<h1>Cookie Policy</h1><p>This website uses cookies to enhance your experience...</p>',
    },
  });

  console.log('✅ Created static pages');

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('Test accounts:');
  console.log('  Super Admin: admin@winthiscard.com / Admin123!');
  console.log('  Admin: moderator@winthiscard.com / Admin123!');
  console.log('  User: john@example.com / User123!');
  console.log('  User: jane@example.com / User123!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
