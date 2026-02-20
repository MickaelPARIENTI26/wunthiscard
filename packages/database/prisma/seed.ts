import { PrismaClient, UserRole, CompetitionStatus, CompetitionCategory, TicketStatus, PaymentStatus, EmailTrigger } from '@prisma/client';
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
  // NOTE: All seed users have emailVerified = new Date() for development testing
  // In production, new users require email verification before purchasing
  const adminPassword = await hashPassword('Admin123!');
  const userPassword = await hashPassword('User123!');

  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@winucard.com',
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
      email: 'moderator@winucard.com',
      passwordHash: adminPassword,
      firstName: 'Mod',
      lastName: 'Admin',
      displayName: 'Moderator',
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });

  const drawMasterPassword = await hashPassword(process.env.DRAW_MASTER_PASSWORD || 'DrawMaster123!');
  const drawMaster = await prisma.user.create({
    data: {
      email: 'draw@winthiscard.co.uk',
      passwordHash: drawMasterPassword,
      firstName: 'Draw',
      lastName: 'Master',
      displayName: 'DrawMaster',
      role: UserRole.DRAW_MASTER,
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
      isFeatured: true, // Featured on homepage hero
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
      metaTitle: 'Win a Charizard PSA 10 1st Edition Base Set | WinUCard',
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
      metaTitle: 'Win a Pikachu Illustrator Card | WinUCard',
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
      mainImageUrl: 'https://images.pokemontcg.io/op05/75_hires.png',
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
      mainImageUrl: 'https://picsum.photos/seed/messi/600/800',
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
      mainImageUrl: 'https://picsum.photos/seed/lebron/600/800',
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
      mainImageUrl: 'https://picsum.photos/seed/onepiece/600/800',
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
        heroTitle: 'Win Amazing Collectibles',
        heroCta: 'Browse Competitions',
        companyName: 'WinUCard Ltd',
        companyAddress: '123 Collection Street, London, EC1A 1BB, United Kingdom',
        companyEmail: 'hello@winucard.com',
        socialLinks: {
          instagram: 'https://instagram.com/winucard',
          twitter: 'https://twitter.com/winucard',
          tiktok: 'https://tiktok.com/@winucard',
          facebook: 'https://facebook.com/winucard',
          discord: 'https://discord.gg/winucard',
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
        freeEntryAddress: 'WinUCard Ltd, Free Entry Department, PO Box 123, London EC1A 1BB',
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
      question: 'Is WinUCard legal in the UK?',
      answer:
        'Yes! WinUCard operates as a prize competition (not a lottery) under the UK Gambling Act 2005. All entries require answering a skill-based question, and a free entry route is always available.',
      sortOrder: 1,
    },
    {
      category: 'Legal',
      question: 'What is the minimum age to participate?',
      answer: 'You must be 18 years or older to participate in any WinUCard competition.',
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
        <h1>About WinUCard</h1>
        <p>WinUCard is the UK's premier prize competition platform for collectible cards and memorabilia.</p>
        <h2>Our Mission</h2>
        <p>We're passionate collectors who believe everyone should have the chance to own grail-tier collectibles. That's why we created WinUCard - to give you the opportunity to win cards and memorabilia that would otherwise be out of reach.</p>
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
      content: '<h1>Terms & Conditions</h1><p>Please read these terms carefully before using WinUCard...</p>',
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

  // Email template HTML helpers
  const emailHeader = `
    <tr>
      <td align="center" style="padding: 30px 20px; border-bottom: 1px solid #222;">
        <img src="{{site_logo_url}}" alt="WinUCard" width="144" height="80" style="display: block; max-width: 144px; height: auto;" />
      </td>
    </tr>`;

  const emailFooter = `
    <tr>
      <td style="padding: 30px 40px; border-top: 1px solid #222;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <a href="https://tiktok.com/@winucard" style="display: inline-block; margin: 0 8px;"><img src="https://winucard.co.uk/icons/tiktok.png" alt="TikTok" width="32" height="32" style="display: block;" /></a>
              <a href="https://instagram.com/winucard" style="display: inline-block; margin: 0 8px;"><img src="https://winucard.co.uk/icons/instagram.png" alt="Instagram" width="32" height="32" style="display: block;" /></a>
              <a href="https://youtube.com/@winucard" style="display: inline-block; margin: 0 8px;"><img src="https://winucard.co.uk/icons/youtube.png" alt="YouTube" width="32" height="32" style="display: block;" /></a>
              <a href="https://discord.gg/winucard" style="display: inline-block; margin: 0 8px;"><img src="https://winucard.co.uk/icons/discord.png" alt="Discord" width="32" height="32" style="display: block;" /></a>
            </td>
          </tr>
          <tr>
            <td align="center" style="color: #888; font-size: 12px; line-height: 18px;">
              <p style="margin: 0 0 10px;">WinUCard Ltd | Registered in England & Wales</p>
              <p style="margin: 0 0 10px;">123 Collection Street, London, EC1A 1BB</p>
              <p style="margin: 0;">
                <a href="{{site_url}}/terms" style="color: #888; text-decoration: underline;">Terms</a> &nbsp;|&nbsp;
                <a href="{{site_url}}/privacy" style="color: #888; text-decoration: underline;">Privacy</a> &nbsp;|&nbsp;
                <a href="{{unsubscribe_url}}" style="color: #888; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;

  const wrapEmail = (content: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>WinUCard</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0a0a0f;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #0a0a0f; border: 1px solid #222; border-radius: 8px;">
          ${emailHeader}
          ${content}
          ${emailFooter}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const ctaButton = (text: string, url: string) => `
    <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #FFD700, #FFA500); color: #0a0a0f; font-weight: bold; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-size: 16px;">${text}</a>`;

  // Create email templates (upsert to not overwrite existing content)
  const emailTemplates = [
    {
      slug: 'email_verification',
      name: 'Email Verification',
      subject: 'Verify your email — WinUCard',
      trigger: EmailTrigger.AUTO,
      triggerDescription: 'Sent when user signs up',
      htmlContent: wrapEmail(`
          <tr>
            <td style="padding: 30px 40px; color: #ffffff;">
              <h1 style="margin: 0 0 20px; font-size: 28px; color: #FFD700;">Verify Your Email</h1>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #ffffff;">
                Hi {{user_firstname}},
              </p>
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 24px; color: #cccccc;">
                Thanks for signing up for WinUCard! Please verify your email address to activate your account and start entering competitions.
              </p>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    ${ctaButton('Verify My Email', '{{verification_url}}')}
                  </td>
                </tr>
              </table>
              <p style="margin: 30px 0 0; font-size: 14px; color: #888; text-align: center;">
                This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>`),
    },
    {
      slug: 'welcome',
      name: 'Welcome',
      subject: 'Welcome to WinUCard! 🎉',
      trigger: EmailTrigger.AUTO,
      triggerDescription: 'Sent after email verified',
      htmlContent: wrapEmail(`
          <tr>
            <td style="padding: 30px 40px; color: #ffffff;">
              <h1 style="margin: 0 0 20px; font-size: 28px; color: #FFD700;">Welcome to WinUCard!</h1>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #ffffff;">
                Hi {{user_firstname}},
              </p>
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 24px; color: #cccccc;">
                Your account is now active! You're ready to start winning amazing collectibles.
              </p>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 20px; background-color: #111; border-radius: 8px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 15px;">
                          <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #FFD700, #FFA500); border-radius: 50%; line-height: 50px; font-size: 24px; font-weight: bold; color: #0a0a0f;">1</div>
                          <p style="margin: 10px 0 0; color: #ffffff; font-weight: bold;">Browse</p>
                          <p style="margin: 5px 0 0; color: #888; font-size: 12px;">Find your grail</p>
                        </td>
                        <td align="center" style="padding: 15px;">
                          <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #FFD700, #FFA500); border-radius: 50%; line-height: 50px; font-size: 24px; font-weight: bold; color: #0a0a0f;">2</div>
                          <p style="margin: 10px 0 0; color: #ffffff; font-weight: bold;">Buy</p>
                          <p style="margin: 5px 0 0; color: #888; font-size: 12px;">Get your tickets</p>
                        </td>
                        <td align="center" style="padding: 15px;">
                          <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #FFD700, #FFA500); border-radius: 50%; line-height: 50px; font-size: 24px; font-weight: bold; color: #0a0a0f;">3</div>
                          <p style="margin: 10px 0 0; color: #ffffff; font-weight: bold;">Win</p>
                          <p style="margin: 5px 0 0; color: #888; font-size: 12px;">Claim your prize</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    ${ctaButton('Browse Competitions', '{{site_url}}/competitions')}
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; font-size: 14px; color: #888; text-align: center; padding: 15px; background-color: #111; border-radius: 8px;">
                💡 <strong style="color: #FFD700;">Did you know?</strong> You can enter any competition for FREE via postal entry. See each competition page for details.
              </p>
            </td>
          </tr>`),
    },
    {
      slug: 'ticket_purchase',
      name: 'Ticket Purchase Confirmation',
      subject: 'Your tickets are confirmed! 🎟️ Order #{{order_id}}',
      trigger: EmailTrigger.AUTO,
      triggerDescription: 'Sent after payment',
      htmlContent: wrapEmail(`
          <tr>
            <td style="padding: 30px 40px; color: #ffffff;">
              <h1 style="margin: 0 0 20px; font-size: 28px; color: #FFD700;">Your Tickets Are Confirmed!</h1>
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 24px; color: #cccccc;">
                Hi {{user_firstname}}, great news! Your entry is locked in. Good luck!
              </p>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: #111; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 0;" width="200">
                    <img src="{{competition_card_image}}" alt="{{competition_card_name}}" width="200" style="display: block; max-width: 200px; height: auto;" />
                  </td>
                  <td style="padding: 20px; vertical-align: top;">
                    <p style="margin: 0 0 5px; font-size: 12px; color: #888; text-transform: uppercase;">Competition</p>
                    <p style="margin: 0 0 15px; font-size: 18px; font-weight: bold; color: #ffffff;">{{competition_card_name}}</p>

                    <p style="margin: 0 0 5px; font-size: 12px; color: #888; text-transform: uppercase;">Your Tickets</p>
                    <p style="margin: 0 0 15px; font-size: 16px; color: #FFD700; font-weight: bold;">{{order_ticket_numbers}}</p>

                    <p style="margin: 0 0 5px; font-size: 12px; color: #888; text-transform: uppercase;">Total Paid</p>
                    <p style="margin: 0 0 15px; font-size: 20px; color: #ffffff; font-weight: bold;">{{order_total}}</p>

                    <p style="margin: 0 0 5px; font-size: 12px; color: #888; text-transform: uppercase;">Draw Date</p>
                    <p style="margin: 0; font-size: 14px; color: #cccccc;">{{competition_draw_date}}</p>
                  </td>
                </tr>
              </table>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    ${ctaButton('View Competition', '{{competition_url}}')}
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; font-size: 14px; color: #888; text-align: center;">
                Order #{{order_id}} | {{order_date}}
              </p>
            </td>
          </tr>`),
    },
    {
      slug: 'abandoned_cart',
      name: 'Abandoned Cart',
      subject: 'You left something behind... 👀',
      trigger: EmailTrigger.CRON,
      triggerDescription: 'Sent 1h after cart abandoned',
      htmlContent: wrapEmail(`
          <tr>
            <td style="padding: 30px 40px; color: #ffffff;">
              <h1 style="margin: 0 0 20px; font-size: 28px; color: #FFD700;">You Left Something Behind...</h1>
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 24px; color: #cccccc;">
                Hi {{user_firstname}}, we noticed you didn't complete your entry. Your tickets are still waiting!
              </p>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <img src="{{competition_card_image}}" alt="{{competition_card_name}}" width="300" style="display: block; max-width: 300px; height: auto; border-radius: 8px;" />
                  </td>
                </tr>
              </table>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: #111; border-radius: 8px;">
                <tr>
                  <td align="center" style="padding: 20px;">
                    <p style="margin: 0 0 10px; font-size: 18px; font-weight: bold; color: #ffffff;">{{competition_card_name}}</p>
                    <p style="margin: 0; font-size: 16px; color: #FF6B6B; font-weight: bold;">
                      ⚡ Only {{competition_tickets_remaining}} tickets left!
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    ${ctaButton('Complete My Entry', '{{cart_url}}')}
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; font-size: 14px; color: #888; text-align: center;">
                Don't miss your chance to win!
              </p>
            </td>
          </tr>`),
    },
    {
      slug: 'competition_announcement',
      name: 'Competition Announcement',
      subject: '🔥 Coming Soon: {{competition_card_name}}!',
      trigger: EmailTrigger.MANUAL,
      triggerDescription: 'Sent manually before launch',
      htmlContent: wrapEmail(`
          <tr>
            <td style="padding: 30px 40px; color: #ffffff;">
              <h1 style="margin: 0 0 10px; font-size: 28px; color: #FFD700; text-align: center;">Something BIG Is Coming!</h1>
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 24px; color: #cccccc; text-align: center;">
                Hi {{user_firstname}}, get ready for our biggest competition yet...
              </p>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <img src="{{competition_card_image}}" alt="{{competition_card_name}}" width="350" style="display: block; max-width: 350px; height: auto; border-radius: 8px; border: 2px solid #FFD700;" />
                  </td>
                </tr>
              </table>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: #111; border-radius: 8px;">
                <tr>
                  <td align="center" style="padding: 25px;">
                    <p style="margin: 0 0 10px; font-size: 24px; font-weight: bold; color: #ffffff;">{{competition_card_name}}</p>
                    <p style="margin: 0; font-size: 32px; color: #FFD700; font-weight: bold;">{{competition_card_value}}</p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 30px; font-size: 18px; color: #ffffff; text-align: center; font-weight: bold;">
                🔔 Be the first to enter!
              </p>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    ${ctaButton('Follow Us for Updates', '{{site_url}}')}
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; font-size: 14px; color: #888; text-align: center;">
                Stay tuned — launching soon!
              </p>
            </td>
          </tr>`),
    },
    {
      slug: 'competition_live',
      name: 'Competition Live',
      subject: '🚀 NOW LIVE: Win a {{competition_card_name}}!',
      trigger: EmailTrigger.AUTO,
      triggerDescription: 'Sent when competition goes live',
      htmlContent: wrapEmail(`
          <tr>
            <td style="padding: 30px 40px; color: #ffffff;">
              <h1 style="margin: 0 0 10px; font-size: 32px; color: #FFD700; text-align: center;">It's HERE! 🎉</h1>
              <p style="margin: 0 0 30px; font-size: 18px; line-height: 24px; color: #cccccc; text-align: center;">
                Hi {{user_firstname}}, the competition you've been waiting for is LIVE!
              </p>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <img src="{{competition_card_image}}" alt="{{competition_card_name}}" width="400" style="display: block; max-width: 400px; width: 100%; height: auto; border-radius: 8px; border: 3px solid #FFD700;" />
                  </td>
                </tr>
              </table>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: #111; border-radius: 8px;">
                <tr>
                  <td style="padding: 25px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="50%" style="padding: 10px; text-align: center; border-right: 1px solid #333;">
                          <p style="margin: 0 0 5px; font-size: 12px; color: #888; text-transform: uppercase;">Prize Value</p>
                          <p style="margin: 0; font-size: 24px; color: #FFD700; font-weight: bold;">{{competition_card_value}}</p>
                        </td>
                        <td width="50%" style="padding: 10px; text-align: center;">
                          <p style="margin: 0 0 5px; font-size: 12px; color: #888; text-transform: uppercase;">Ticket Price</p>
                          <p style="margin: 0; font-size: 24px; color: #ffffff; font-weight: bold;">{{competition_ticket_price}}</p>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding: 10px; text-align: center; border-right: 1px solid #333;">
                          <p style="margin: 0 0 5px; font-size: 12px; color: #888; text-transform: uppercase;">Total Tickets</p>
                          <p style="margin: 0; font-size: 18px; color: #ffffff;">{{competition_total_tickets}}</p>
                        </td>
                        <td width="50%" style="padding: 10px; text-align: center;">
                          <p style="margin: 0 0 5px; font-size: 12px; color: #888; text-transform: uppercase;">Draw Date</p>
                          <p style="margin: 0; font-size: 14px; color: #ffffff;">{{competition_draw_date}}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 25px 0;">
                    ${ctaButton('🎟️ Enter Now', '{{competition_url}}')}
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; font-size: 14px; color: #888; text-align: center; padding: 15px; background-color: #111; border-radius: 8px;">
                💡 Free postal entry available — see competition page for details.
              </p>
            </td>
          </tr>`),
    },
    {
      slug: 'competition_ending',
      name: 'Competition Ending Soon',
      subject: '⏰ LAST CHANCE: {{competition_card_name}}',
      trigger: EmailTrigger.CRON,
      triggerDescription: 'Sent 24h before end',
      htmlContent: wrapEmail(`
          <tr>
            <td style="padding: 30px 40px; color: #ffffff;">
              <h1 style="margin: 0 0 10px; font-size: 28px; color: #FF6B6B; text-align: center;">⏰ Time Is Running Out!</h1>
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 24px; color: #cccccc; text-align: center;">
                Hi {{user_firstname}}, this competition ends in less than 24 hours!
              </p>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <img src="{{competition_card_image}}" alt="{{competition_card_name}}" width="300" style="display: block; max-width: 300px; height: auto; border-radius: 8px;" />
                  </td>
                </tr>
              </table>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: #111; border-radius: 8px;">
                <tr>
                  <td align="center" style="padding: 25px;">
                    <p style="margin: 0 0 15px; font-size: 20px; font-weight: bold; color: #ffffff;">{{competition_card_name}}</p>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 300px; margin: 0 auto;">
                      <tr>
                        <td style="padding: 10px; background-color: #0a0a0f; border-radius: 8px;">
                          <p style="margin: 0 0 5px; font-size: 12px; color: #888; text-transform: uppercase; text-align: center;">Tickets Sold</p>
                          <p style="margin: 0; font-size: 24px; color: #FFD700; font-weight: bold; text-align: center;">{{competition_tickets_sold}} / {{competition_total_tickets}}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    ${ctaButton('Get Your Tickets Now', '{{competition_url}}')}
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; font-size: 14px; color: #FF6B6B; text-align: center; font-weight: bold;">
                Don't miss your last chance to win!
              </p>
            </td>
          </tr>`),
    },
    {
      slug: 'draw_announcement',
      name: 'Draw Announcement',
      subject: '🎬 LIVE DRAW Tonight: {{competition_title}}',
      trigger: EmailTrigger.AUTO,
      triggerDescription: 'Sent day of draw',
      htmlContent: wrapEmail(`
          <tr>
            <td style="padding: 30px 40px; color: #ffffff;">
              <h1 style="margin: 0 0 10px; font-size: 28px; color: #FFD700; text-align: center;">The Moment You've Been Waiting For!</h1>
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 24px; color: #cccccc; text-align: center;">
                Hi {{user_firstname}}, the draw for <strong style="color: #ffffff;">{{competition_title}}</strong> is happening TODAY!
              </p>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: #111; border-radius: 8px;">
                <tr>
                  <td align="center" style="padding: 25px;">
                    <p style="margin: 0 0 10px; font-size: 14px; color: #888; text-transform: uppercase;">Your Tickets</p>
                    <p style="margin: 0 0 20px; font-size: 24px; color: #FFD700; font-weight: bold;">{{order_ticket_numbers}}</p>
                    <p style="margin: 0 0 10px; font-size: 14px; color: #888; text-transform: uppercase;">Draw Time</p>
                    <p style="margin: 0; font-size: 20px; color: #ffffff; font-weight: bold;">{{draw_time}}</p>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0; font-size: 18px; color: #ffffff; text-align: center;">
                📺 Watch live on <strong style="color: #FFD700;">YouTube</strong>!
              </p>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    ${ctaButton('🔴 Watch Live', '{{draw_video_url}}')}
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; font-size: 14px; color: #888; text-align: center;">
                Good luck! 🍀
              </p>
            </td>
          </tr>`),
    },
    {
      slug: 'winner_notification',
      name: 'Winner Notification',
      subject: '🏆 YOU WON {{user_firstname}}!',
      trigger: EmailTrigger.AUTO,
      triggerDescription: 'Sent to winner after draw',
      htmlContent: wrapEmail(`
          <tr>
            <td style="padding: 30px 40px; color: #ffffff;">
              <h1 style="margin: 0 0 10px; font-size: 48px; color: #FFD700; text-align: center;">🏆 YOU WON!</h1>
              <p style="margin: 0 0 30px; font-size: 24px; line-height: 32px; color: #ffffff; text-align: center;">
                Congratulations {{user_firstname}}!
              </p>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: #111; border-radius: 8px; border: 2px solid #FFD700;">
                <tr>
                  <td align="center" style="padding: 25px;">
                    <p style="margin: 0 0 10px; font-size: 14px; color: #888; text-transform: uppercase;">Winning Ticket</p>
                    <p style="margin: 0 0 20px; font-size: 48px; color: #FFD700; font-weight: bold;">#{{draw_winning_ticket}}</p>
                  </td>
                </tr>
              </table>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <img src="{{competition_card_image}}" alt="{{competition_card_name}}" width="300" style="display: block; max-width: 300px; height: auto; border-radius: 8px; border: 2px solid #FFD700;" />
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0; font-size: 18px; color: #ffffff; text-align: center; font-weight: bold;">
                {{competition_card_name}}
              </p>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0; background-color: #111; border-radius: 8px;">
                <tr>
                  <td style="padding: 25px;">
                    <p style="margin: 0 0 15px; font-size: 16px; color: #FFD700; font-weight: bold; text-align: center;">What happens next?</p>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 10px 0;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width: 30px; vertical-align: top;">
                                <span style="color: #FFD700; font-weight: bold;">1.</span>
                              </td>
                              <td style="color: #cccccc; font-size: 14px;">
                                Reply to this email to confirm your delivery address
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width: 30px; vertical-align: top;">
                                <span style="color: #FFD700; font-weight: bold;">2.</span>
                              </td>
                              <td style="color: #cccccc; font-size: 14px;">
                                Your prize will be shipped within 3-5 business days
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width: 30px; vertical-align: top;">
                                <span style="color: #FFD700; font-weight: bold;">3.</span>
                              </td>
                              <td style="color: #cccccc; font-size: 14px;">
                                Share your win on social media and tag us @WinUCard!
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    ${ctaButton('Confirm My Address', 'mailto:support@winucard.com?subject=Winner%20Address%20Confirmation')}
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; font-size: 14px; color: #888; text-align: center;">
                Please respond within 14 days to claim your prize.
              </p>
            </td>
          </tr>`),
    },
  ];

  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { slug: template.slug },
      update: {
        name: template.name,
        subject: template.subject,
        htmlContent: template.htmlContent,
        trigger: template.trigger,
        triggerDescription: template.triggerDescription,
      },
      create: {
        slug: template.slug,
        name: template.name,
        subject: template.subject,
        htmlContent: template.htmlContent,
        trigger: template.trigger,
        triggerDescription: template.triggerDescription,
        isActive: true,
      },
    });
  }

  console.log('✅ Created email templates');

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('Test accounts:');
  console.log('  Super Admin: admin@winucard.com / Admin123!');
  console.log('  Admin: moderator@winucard.com / Admin123!');
  console.log('  Draw Master: draw@winthiscard.co.uk / DrawMaster123!');
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
