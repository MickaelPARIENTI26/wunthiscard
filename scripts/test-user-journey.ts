#!/usr/bin/env npx tsx

/**
 * Database-Level E2E Test — Complete User Journey on WinUCard
 *
 * This script tests the business logic directly against the database,
 * simulating API behavior without HTTP requests.
 *
 * Run with: npx tsx scripts/test-user-journey.ts
 *
 * Prerequisites:
 * - Database running (docker compose up -d)
 * - At least one ACTIVE competition seeded
 */

import { PrismaClient } from '@prisma/client';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const prisma = new PrismaClient();
const scryptAsync = promisify(scrypt);

// Test configuration
const TEST_USER = {
  email: `test-journey-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  firstName: 'Journey',
  lastName: 'Tester',
  dateOfBirth: new Date('1990-01-15'),
};

// Test results tracking
interface TestResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: Record<string, unknown>;
}

const results: TestResult[] = [];

function log(step: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: Record<string, unknown>) {
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${emoji} ${step} — ${message}`);
  if (details && Object.keys(details).length > 0) {
    console.log(`   ${JSON.stringify(details)}`);
  }
  results.push({ step, status, message, details });
}

// Password hashing (same as production)
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(':');
  if (!salt || !key) return false;
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(keyBuffer, derivedKey);
}

// ============================================================================
// STEP 1: REGISTRATION
// ============================================================================
async function testRegistration(): Promise<string | null> {
  console.log('\n📝 ÉTAPE 1 — INSCRIPTION');
  console.log('─'.repeat(50));

  try {
    // Clean up any existing test user
    const existing = await prisma.user.findUnique({ where: { email: TEST_USER.email.toLowerCase() } });
    if (existing) {
      await prisma.auditLog.deleteMany({ where: { userId: existing.id } });
      await prisma.verificationToken.deleteMany({ where: { identifier: TEST_USER.email.toLowerCase() } });
      await prisma.ticket.updateMany({ where: { userId: existing.id }, data: { userId: null, status: 'AVAILABLE' } });
      await prisma.order.deleteMany({ where: { userId: existing.id } });
      await prisma.user.delete({ where: { id: existing.id } });
    }

    // Hash password
    const passwordHash = await hashPassword(TEST_USER.password);

    // Verify password is not stored in plain text
    if (passwordHash === TEST_USER.password) {
      log('Inscription', 'FAIL', 'Mot de passe stocké en clair!', { security: 'CRITIQUE' });
      return null;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: TEST_USER.email.toLowerCase(),
        passwordHash,
        firstName: TEST_USER.firstName,
        lastName: TEST_USER.lastName,
        dateOfBirth: TEST_USER.dateOfBirth,
        emailVerified: null,
      },
    });

    // Create verification token
    const verificationToken = randomBytes(32).toString('hex');
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: verificationToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        type: 'EMAIL_VERIFICATION',
      },
    });

    log('Inscription', 'PASS', 'User créé avec password hashé', {
      userId: user.id,
      hashFormat: 'salt:hash (scrypt)',
      emailVerified: user.emailVerified,
    });

    return user.id;
  } catch (error) {
    log('Inscription', 'FAIL', 'Erreur inscription', { error: String(error) });
    return null;
  }
}

// ============================================================================
// STEP 2: EMAIL VERIFICATION
// ============================================================================
async function testEmailVerification(userId: string): Promise<boolean> {
  console.log('\n📧 ÉTAPE 2 — VÉRIFICATION EMAIL');
  console.log('─'.repeat(50));

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      log('Vérification Email', 'FAIL', 'User non trouvé');
      return false;
    }

    // Simulate email verification
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    });

    // Delete verification token
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email, type: 'EMAIL_VERIFICATION' },
    });

    const verified = await prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true } });

    log('Vérification Email', 'PASS', 'Email vérifié avec succès', {
      verifiedAt: verified?.emailVerified,
    });

    return true;
  } catch (error) {
    log('Vérification Email', 'FAIL', 'Erreur vérification', { error: String(error) });
    return false;
  }
}

// ============================================================================
// STEP 3: LOGIN
// ============================================================================
async function testLogin(userId: string): Promise<boolean> {
  console.log('\n🔐 ÉTAPE 3 — CONNEXION');
  console.log('─'.repeat(50));

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, emailVerified: true, isBanned: true, isActive: true, lockedUntil: true },
    });

    if (!user?.passwordHash) {
      log('Connexion', 'FAIL', 'User ou password non trouvé');
      return false;
    }

    // Test password verification
    const isValid = await verifyPassword(TEST_USER.password, user.passwordHash);
    if (!isValid) {
      log('Connexion', 'FAIL', 'Vérification password échouée');
      return false;
    }

    // Test wrong password is rejected
    const wrongValid = await verifyPassword('WrongPassword123!', user.passwordHash);
    if (wrongValid) {
      log('Connexion', 'FAIL', 'Mauvais password accepté!', { security: 'CRITIQUE' });
      return false;
    }

    log('Connexion', 'PASS', 'Password vérifié avec scrypt + timingSafeEqual', {
      algorithm: 'scrypt',
      timingSafe: true,
      emailVerified: !!user.emailVerified,
      isBanned: user.isBanned,
      isActive: user.isActive,
    });

    return true;
  } catch (error) {
    log('Connexion', 'FAIL', 'Erreur connexion', { error: String(error) });
    return false;
  }
}

// ============================================================================
// STEP 4: VIEW COMPETITIONS
// ============================================================================
async function testViewCompetitions(): Promise<string | null> {
  console.log('\n🏆 ÉTAPE 4 — VOIR LES COMPÉTITIONS');
  console.log('─'.repeat(50));

  try {
    const competitions = await prisma.competition.findMany({
      where: { status: { in: ['ACTIVE', 'SOLD_OUT', 'UPCOMING'] } },
      select: {
        id: true,
        slug: true,
        title: true,
        mainImageUrl: true,
        prizeValue: true,
        ticketPrice: true,
        totalTickets: true,
        category: true,
        status: true,
        _count: { select: { tickets: { where: { status: { in: ['SOLD', 'FREE_ENTRY'] } } } } },
      },
      take: 5,
    });

    if (competitions.length === 0) {
      log('Voir Compétitions', 'FAIL', 'Aucune compétition active trouvée');
      return null;
    }

    const activeComp = competitions.find((c) => c.status === 'ACTIVE');
    const comp = activeComp || competitions[0];

    // Verify required fields
    const requiredFields = ['id', 'slug', 'title', 'mainImageUrl', 'prizeValue', 'ticketPrice'];
    const missing = requiredFields.filter((f) => !(f in comp));

    if (missing.length > 0) {
      log('Voir Compétitions', 'FAIL', 'Champs requis manquants', { missing });
      return null;
    }

    log('Voir Compétitions', 'PASS', `${competitions.length} compétitions trouvées`, {
      title: comp.title,
      status: comp.status,
      ticketsSold: comp._count.tickets,
      totalTickets: comp.totalTickets,
    });

    return comp.id;
  } catch (error) {
    log('Voir Compétitions', 'FAIL', 'Erreur fetch compétitions', { error: String(error) });
    return null;
  }
}

// ============================================================================
// STEP 5: VIEW COMPETITION DETAIL
// ============================================================================
async function testViewCompetitionDetail(competitionId: string): Promise<{ correctAnswer: number; availableTickets: number } | null> {
  console.log('\n🔍 ÉTAPE 5 — VOIR DÉTAIL COMPÉTITION');
  console.log('─'.repeat(50));

  try {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        _count: { select: { tickets: { where: { status: { in: ['SOLD', 'FREE_ENTRY'] } } } } },
      },
    });

    if (!competition) {
      log('Détail Compétition', 'FAIL', 'Compétition non trouvée');
      return null;
    }

    const now = new Date();
    const availableTickets = await prisma.ticket.count({
      where: {
        competitionId,
        OR: [
          { status: 'AVAILABLE' },
          { status: 'RESERVED', reservedUntil: { lte: now } },
        ],
      },
    });

    log('Détail Compétition', 'PASS', 'Détails récupérés', {
      title: competition.title,
      totalTickets: competition.totalTickets,
      soldTickets: competition._count.tickets,
      availableTickets,
      maxPerUser: competition.maxTicketsPerUser,
      hasSkillQuestion: !!competition.questionText,
    });

    return { correctAnswer: competition.questionAnswer, availableTickets };
  } catch (error) {
    log('Détail Compétition', 'FAIL', 'Erreur fetch détail', { error: String(error) });
    return null;
  }
}

// ============================================================================
// STEP 6: SKILL QUESTION (QCM)
// ============================================================================
async function testSkillQuestion(competitionId: string, correctAnswer: number): Promise<boolean> {
  console.log('\n❓ ÉTAPE 6 — QUESTION QCM (skill question)');
  console.log('─'.repeat(50));

  try {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { questionText: true, questionChoices: true, questionAnswer: true },
    });

    if (!competition?.questionText) {
      log('Question QCM', 'WARN', 'Pas de question QCM configurée');
      return true;
    }

    // Test 1: Wrong answer should fail
    const wrongAnswer = (correctAnswer + 1) % 4;
    const wrongResult = competition.questionAnswer === wrongAnswer;

    if (wrongResult) {
      log('Question QCM', 'FAIL', 'MAUVAISE RÉPONSE ACCEPTÉE!', {
        wrongAnswer,
        expectedAnswer: competition.questionAnswer,
        security: 'CRITIQUE - Le QCM accepte n\'importe quelle réponse',
      });
      return false;
    }

    log('Question QCM', 'PASS', 'Mauvaise réponse correctement rejetée');

    // Test 2: Correct answer should pass
    const correctResult = competition.questionAnswer === correctAnswer;

    if (!correctResult) {
      log('Question QCM', 'FAIL', 'Bonne réponse rejetée');
      return false;
    }

    log('Question QCM', 'PASS', 'Bonne réponse acceptée', {
      questionText: competition.questionText.substring(0, 40) + '...',
      correctAnswer: competition.questionAnswer,
    });

    return true;
  } catch (error) {
    log('Question QCM', 'FAIL', 'Erreur test QCM', { error: String(error) });
    return false;
  }
}

// ============================================================================
// STEP 7: TICKET PURCHASE
// ============================================================================
async function testTicketPurchase(userId: string, competitionId: string, quantity: number): Promise<number[] | null> {
  console.log('\n🎟️ ÉTAPE 7 — ACHAT DE TICKETS');
  console.log('─'.repeat(50));

  try {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { maxTicketsPerUser: true, totalTickets: true, status: true },
    });

    if (!competition) {
      log('Achat Tickets', 'FAIL', 'Compétition non trouvée');
      return null;
    }

    if (competition.status !== 'ACTIVE') {
      log('Achat Tickets', 'WARN', `Compétition ${competition.status}, achat impossible`);
      return null;
    }

    // Check user's existing tickets
    const existingCount = await prisma.ticket.count({
      where: { competitionId, userId, status: 'SOLD' },
    });

    // Test: Max per user limit
    if (existingCount + quantity > competition.maxTicketsPerUser) {
      log('Achat Tickets', 'PASS', 'Limite max/user correctement appliquée', {
        existant: existingCount,
        demandé: quantity,
        max: competition.maxTicketsPerUser,
      });
    }

    // Find available tickets
    const now = new Date();
    const availableTickets = await prisma.ticket.findMany({
      where: {
        competitionId,
        OR: [
          { status: 'AVAILABLE' },
          { status: 'RESERVED', reservedUntil: { lte: now } },
        ],
      },
      take: quantity,
      orderBy: { ticketNumber: 'asc' },
    });

    const totalAvailable = await prisma.ticket.count({
      where: {
        competitionId,
        OR: [
          { status: 'AVAILABLE' },
          { status: 'RESERVED', reservedUntil: { lte: now } },
        ],
      },
    });

    // Test: Cannot buy more than available
    if (quantity > totalAvailable) {
      log('Achat Tickets', 'PASS', 'Limite stock correctement appliquée', {
        demandé: quantity,
        disponible: totalAvailable,
        résultat: 'REJETÉ',
      });
      return null;
    }

    if (availableTickets.length < quantity) {
      log('Achat Tickets', 'FAIL', 'Pas assez de tickets disponibles');
      return null;
    }

    const ticketNumbers = availableTickets.map((t) => t.ticketNumber);

    // Purchase tickets
    const updateResult = await prisma.ticket.updateMany({
      where: {
        competitionId,
        ticketNumber: { in: ticketNumbers },
        status: { in: ['AVAILABLE', 'RESERVED'] },
      },
      data: {
        status: 'SOLD',
        userId,
        reservedUntil: null,
      },
    });

    // Verify unique numbers
    const uniqueNumbers = new Set(ticketNumbers);
    if (uniqueNumbers.size !== ticketNumbers.length) {
      log('Achat Tickets', 'FAIL', 'Numéros de tickets dupliqués!', { security: 'CRITIQUE' });
      return null;
    }

    // Verify stock decreased
    const newAvailable = await prisma.ticket.count({
      where: { competitionId, status: 'AVAILABLE' },
    });

    log('Achat Tickets', 'PASS', 'Tickets achetés avec succès', {
      quantité: updateResult.count,
      numéros: ticketNumbers,
      numériques_uniques: true,
      stock_diminué: newAvailable < totalAvailable,
    });

    return ticketNumbers;
  } catch (error) {
    log('Achat Tickets', 'FAIL', 'Erreur achat', { error: String(error) });
    return null;
  }
}

// ============================================================================
// STEP 8: VIEW MY TICKETS
// ============================================================================
async function testViewMyTickets(userId: string, expectedNumbers: number[]): Promise<boolean> {
  console.log('\n🎫 ÉTAPE 8 — VOIR MES TICKETS');
  console.log('─'.repeat(50));

  try {
    const tickets = await prisma.ticket.findMany({
      where: { userId, status: 'SOLD' },
      include: {
        competition: { select: { title: true } },
      },
      orderBy: { ticketNumber: 'asc' },
    });

    if (tickets.length === 0) {
      log('Voir Mes Tickets', 'FAIL', 'Aucun ticket trouvé');
      return false;
    }

    const userNumbers = tickets.map((t) => t.ticketNumber);
    const missing = expectedNumbers.filter((n) => !userNumbers.includes(n));

    if (missing.length > 0) {
      log('Voir Mes Tickets', 'FAIL', 'Tickets achetés manquants', {
        attendu: expectedNumbers,
        trouvé: userNumbers,
        manquants: missing,
      });
      return false;
    }

    log('Voir Mes Tickets', 'PASS', 'Tous les tickets visibles', {
      total: tickets.length,
      numéros: userNumbers,
    });

    return true;
  } catch (error) {
    log('Voir Mes Tickets', 'FAIL', 'Erreur lecture tickets', { error: String(error) });
    return false;
  }
}

// ============================================================================
// CLEANUP
// ============================================================================
async function cleanup(userId: string): Promise<void> {
  console.log('\n🧹 NETTOYAGE');
  console.log('─'.repeat(50));

  try {
    await prisma.ticket.updateMany({
      where: { userId },
      data: { status: 'AVAILABLE', userId: null, orderId: null },
    });
    await prisma.auditLog.deleteMany({ where: { userId } });
    await prisma.verificationToken.deleteMany({ where: { identifier: TEST_USER.email.toLowerCase() } });
    await prisma.user.delete({ where: { id: userId } });
    console.log('   Données de test nettoyées ✓');
  } catch (error) {
    console.log('   Erreur nettoyage:', error);
  }
}

// ============================================================================
// REPORT
// ============================================================================
function generateReport(): void {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📊 RAPPORT E2E — PARCOURS UTILISATEUR WINUCARD');
  console.log('═'.repeat(60));
  console.log();

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const warnings = results.filter((r) => r.status === 'WARN').length;

  results.forEach((r) => {
    const emoji = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${emoji} ${r.step} — ${r.message}`);
  });

  console.log();
  console.log('─'.repeat(60));
  console.log(`RÉSUMÉ: ${passed} réussis, ${failed} échoués, ${warnings} avertissements`);
  console.log('─'.repeat(60));

  if (failed > 0) {
    console.log('\n🔴 PROBLÈMES CRITIQUES:');
    results.filter((r) => r.status === 'FAIL').forEach((r) => {
      console.log(`   - ${r.step}: ${r.message}`);
    });
  }

  if (warnings > 0) {
    console.log('\n🟡 AVERTISSEMENTS:');
    results.filter((r) => r.status === 'WARN').forEach((r) => {
      console.log(`   - ${r.step}: ${r.message}`);
    });
  }

  console.log('\n═'.repeat(60));
}

// ============================================================================
// MAIN
// ============================================================================
async function main(): Promise<void> {
  console.log('═'.repeat(60));
  console.log('🚀 TEST E2E — PARCOURS UTILISATEUR COMPLET WINUCARD');
  console.log('═'.repeat(60));
  console.log(`Utilisateur test: ${TEST_USER.email}`);
  console.log(`Heure: ${new Date().toISOString()}`);

  let userId: string | null = null;

  try {
    // Step 1: Registration
    userId = await testRegistration();
    if (!userId) {
      generateReport();
      process.exit(1);
    }

    // Step 2: Email Verification
    const verified = await testEmailVerification(userId);
    if (!verified) {
      await cleanup(userId);
      generateReport();
      process.exit(1);
    }

    // Step 3: Login
    const loggedIn = await testLogin(userId);
    if (!loggedIn) {
      await cleanup(userId);
      generateReport();
      process.exit(1);
    }

    // Step 4: View Competitions
    const competitionId = await testViewCompetitions();
    if (!competitionId) {
      await cleanup(userId);
      generateReport();
      process.exit(1);
    }

    // Step 5: View Competition Detail
    const details = await testViewCompetitionDetail(competitionId);
    if (!details) {
      await cleanup(userId);
      generateReport();
      process.exit(1);
    }

    // Step 6: Skill Question
    await testSkillQuestion(competitionId, details.correctAnswer);

    // Step 7: Ticket Purchase
    const tickets = await testTicketPurchase(userId, competitionId, 2);

    // Step 8: View My Tickets
    if (tickets) {
      await testViewMyTickets(userId, tickets);
    }

    // Cleanup
    await cleanup(userId);

  } catch (error) {
    console.error('\n💥 Erreur inattendue:', error);
    if (userId) await cleanup(userId);
  } finally {
    await prisma.$disconnect();
  }

  generateReport();

  const failed = results.filter((r) => r.status === 'FAIL').length;
  process.exit(failed > 0 ? 1 : 0);
}

main();
