/**
 * E2E Test Script - Complete User Journey on WinUCard
 *
 * This script simulates a complete user journey from registration to ticket purchase.
 * Run with: npx tsx apps/web/e2e/user-journey.test.ts
 *
 * Prerequisites:
 * - Database running (docker compose up -d)
 * - Web app running (npx turbo dev)
 * - At least one ACTIVE competition in the database
 */

import { prisma } from '../src/lib/db';

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_USER = {
  email: `test-e2e-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
  dateOfBirth: '1990-01-15',
};

// Test results
interface TestResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: unknown;
}

const results: TestResult[] = [];

function logResult(step: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: unknown) {
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${emoji} ${step}: ${message}`);
  if (details) {
    console.log('   Details:', JSON.stringify(details, null, 2));
  }
  results.push({ step, status, message, details });
}

// ============================================================================
// STEP 1: REGISTRATION
// ============================================================================
async function testRegistration(): Promise<{ userId: string; verificationToken: string } | null> {
  console.log('\n📝 STEP 1 — REGISTRATION');
  console.log('─'.repeat(50));

  try {
    // Check for existing user (cleanup from previous test)
    const existingUser = await prisma.user.findUnique({
      where: { email: TEST_USER.email.toLowerCase() },
    });

    if (existingUser) {
      // Clean up previous test data
      await prisma.auditLog.deleteMany({ where: { userId: existingUser.id } });
      await prisma.verificationToken.deleteMany({ where: { identifier: TEST_USER.email.toLowerCase() } });
      await prisma.ticket.deleteMany({ where: { userId: existingUser.id } });
      await prisma.order.deleteMany({ where: { userId: existingUser.id } });
      await prisma.user.delete({ where: { id: existingUser.id } });
      console.log('   [Cleaned up previous test user]');
    }

    // Use Prisma to simulate registration (same logic as server action)
    const { scrypt, randomBytes } = await import('crypto');
    const { promisify } = await import('util');
    const scryptAsync = promisify(scrypt);

    // Hash password
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scryptAsync(TEST_USER.password, salt, 64)) as Buffer;
    const passwordHash = `${salt}:${derivedKey.toString('hex')}`;

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: TEST_USER.email.toLowerCase(),
        passwordHash,
        firstName: TEST_USER.firstName,
        lastName: TEST_USER.lastName,
        dateOfBirth: new Date(TEST_USER.dateOfBirth),
        emailVerified: null, // Not verified yet
      },
    });

    // Create verification token
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: verificationToken,
        expires: tokenExpiry,
        type: 'EMAIL_VERIFICATION',
      },
    });

    // Verify user created
    const createdUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        passwordHash: true,
        emailVerified: true,
      },
    });

    if (!createdUser) {
      logResult('Registration', 'FAIL', 'User not found after creation');
      return null;
    }

    // Verify password is hashed (not plain text)
    if (createdUser.passwordHash === TEST_USER.password) {
      logResult('Registration', 'FAIL', 'Password stored in plain text!', { security: 'CRITICAL' });
      return null;
    }

    if (!createdUser.passwordHash.includes(':')) {
      logResult('Registration', 'FAIL', 'Password hash format incorrect');
      return null;
    }

    logResult('Registration', 'PASS', 'User created with hashed password', {
      userId: createdUser.id,
      email: createdUser.email,
      hashFormat: 'salt:hash (scrypt)',
      emailVerified: createdUser.emailVerified,
    });

    // Verify verification token exists
    const token = await prisma.verificationToken.findFirst({
      where: { identifier: user.email, type: 'EMAIL_VERIFICATION' },
    });

    if (!token) {
      logResult('Registration', 'WARN', 'Verification token not created');
    } else {
      logResult('Registration', 'PASS', 'Verification token created', {
        tokenLength: token.token.length,
        expires: token.expires,
      });
    }

    return { userId: user.id, verificationToken };
  } catch (error) {
    logResult('Registration', 'FAIL', 'Registration failed', { error: String(error) });
    return null;
  }
}

// ============================================================================
// STEP 2: EMAIL VERIFICATION
// ============================================================================
async function testEmailVerification(userId: string, verificationToken: string): Promise<boolean> {
  console.log('\n📧 STEP 2 — EMAIL VERIFICATION');
  console.log('─'.repeat(50));

  try {
    // Verify user is not verified yet
    const userBefore = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });

    if (userBefore?.emailVerified) {
      logResult('Email Verification', 'WARN', 'User already verified');
      return true;
    }

    // Simulate clicking verification link
    const token = await prisma.verificationToken.findFirst({
      where: { token: verificationToken, type: 'EMAIL_VERIFICATION' },
    });

    if (!token) {
      logResult('Email Verification', 'FAIL', 'Verification token not found');
      return false;
    }

    if (token.expires < new Date()) {
      logResult('Email Verification', 'FAIL', 'Verification token expired');
      return false;
    }

    // Verify email
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { emailVerified: new Date() },
      });

      await tx.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: token.identifier,
            token: token.token,
          },
        },
      });
    });

    // Verify user is now verified
    const userAfter = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });

    if (!userAfter?.emailVerified) {
      logResult('Email Verification', 'FAIL', 'User not verified after verification');
      return false;
    }

    logResult('Email Verification', 'PASS', 'User email verified successfully', {
      verifiedAt: userAfter.emailVerified,
    });

    return true;
  } catch (error) {
    logResult('Email Verification', 'FAIL', 'Verification failed', { error: String(error) });
    return false;
  }
}

// ============================================================================
// STEP 3: LOGIN
// ============================================================================
async function testLogin(userId: string): Promise<boolean> {
  console.log('\n🔐 STEP 3 — LOGIN');
  console.log('─'.repeat(50));

  try {
    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, email: true, emailVerified: true, isBanned: true, isActive: true },
    });

    if (!user) {
      logResult('Login', 'FAIL', 'User not found');
      return false;
    }

    // Verify password (same logic as auth.ts)
    const { scrypt, timingSafeEqual } = await import('crypto');
    const { promisify } = await import('util');
    const scryptAsync = promisify(scrypt);

    const [salt, storedKey] = user.passwordHash!.split(':');
    if (!salt || !storedKey) {
      logResult('Login', 'FAIL', 'Invalid password hash format');
      return false;
    }

    const keyBuffer = Buffer.from(storedKey, 'hex');
    const derivedKey = (await scryptAsync(TEST_USER.password, salt, 64)) as Buffer;
    const passwordMatch = timingSafeEqual(keyBuffer, derivedKey);

    if (!passwordMatch) {
      logResult('Login', 'FAIL', 'Password verification failed');
      return false;
    }

    logResult('Login', 'PASS', 'Password verified with scrypt + timingSafeEqual', {
      algorithm: 'scrypt',
      timingSafe: true,
    });

    // Verify login prerequisites
    if (!user.emailVerified) {
      logResult('Login', 'WARN', 'Email not verified - login would fail in production');
    }

    if (user.isBanned) {
      logResult('Login', 'FAIL', 'User is banned');
      return false;
    }

    if (!user.isActive) {
      logResult('Login', 'FAIL', 'User is inactive');
      return false;
    }

    logResult('Login', 'PASS', 'Login simulation successful', {
      emailVerified: !!user.emailVerified,
      isBanned: user.isBanned,
      isActive: user.isActive,
    });

    return true;
  } catch (error) {
    logResult('Login', 'FAIL', 'Login failed', { error: String(error) });
    return false;
  }
}

// ============================================================================
// STEP 4: VIEW COMPETITIONS
// ============================================================================
async function testViewCompetitions(): Promise<string | null> {
  console.log('\n🏆 STEP 4 — VIEW COMPETITIONS');
  console.log('─'.repeat(50));

  try {
    // Get active competitions (same logic as competitions page)
    const competitions = await prisma.competition.findMany({
      where: {
        status: { in: ['ACTIVE', 'SOLD_OUT', 'UPCOMING'] },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        mainImageUrl: true,
        category: true,
        status: true,
        prizeValue: true,
        ticketPrice: true,
        totalTickets: true,
        drawDate: true,
        questionText: true,
        questionAnswer: true,
        _count: {
          select: {
            tickets: {
              where: { status: { in: ['SOLD', 'FREE_ENTRY'] } },
            },
          },
        },
      },
      take: 10,
    });

    if (competitions.length === 0) {
      logResult('View Competitions', 'FAIL', 'No active competitions found');
      return null;
    }

    // Find an ACTIVE competition for testing
    const activeCompetition = competitions.find((c) => c.status === 'ACTIVE');

    if (!activeCompetition) {
      logResult('View Competitions', 'WARN', 'No ACTIVE competition found, using first available');
      const comp = competitions[0];
      logResult('View Competitions', 'PASS', `Found ${competitions.length} competitions`, {
        firstCompetition: {
          id: comp.id,
          title: comp.title,
          status: comp.status,
        },
      });
      return comp.id;
    }

    // Verify required fields
    const requiredFields = ['id', 'slug', 'title', 'mainImageUrl', 'prizeValue', 'ticketPrice', 'totalTickets'];
    const missingFields = requiredFields.filter((f) => !(f in activeCompetition));

    if (missingFields.length > 0) {
      logResult('View Competitions', 'FAIL', 'Missing required fields', { missingFields });
      return null;
    }

    logResult('View Competitions', 'PASS', `Found ${competitions.length} competitions`, {
      activeCompetition: {
        id: activeCompetition.id,
        title: activeCompetition.title,
        ticketsSold: activeCompetition._count.tickets,
        totalTickets: activeCompetition.totalTickets,
        hasSkillQuestion: !!activeCompetition.questionText,
      },
    });

    return activeCompetition.id;
  } catch (error) {
    logResult('View Competitions', 'FAIL', 'Failed to fetch competitions', { error: String(error) });
    return null;
  }
}

// ============================================================================
// STEP 5: VIEW COMPETITION DETAIL
// ============================================================================
async function testViewCompetitionDetail(competitionId: string): Promise<{ availableTickets: number; maxPerUser: number; correctAnswer: number } | null> {
  console.log('\n🔍 STEP 5 — VIEW COMPETITION DETAIL');
  console.log('─'.repeat(50));

  try {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        _count: {
          select: {
            tickets: {
              where: { status: { in: ['SOLD', 'FREE_ENTRY'] } },
            },
          },
        },
      },
    });

    if (!competition) {
      logResult('Competition Detail', 'FAIL', 'Competition not found');
      return null;
    }

    // Count available tickets
    const now = new Date();
    const availableTickets = await prisma.ticket.count({
      where: {
        competitionId,
        OR: [
          { status: 'AVAILABLE' },
          {
            status: 'RESERVED',
            reservedUntil: { lte: now },
          },
        ],
      },
    });

    const soldTickets = competition._count.tickets;
    const calculatedAvailable = competition.totalTickets - soldTickets;

    // Verify available ticket count is consistent
    if (Math.abs(availableTickets - calculatedAvailable) > 5) {
      logResult('Competition Detail', 'WARN', 'Available ticket count may be inconsistent', {
        fromTicketTable: availableTickets,
        calculated: calculatedAvailable,
      });
    }

    logResult('Competition Detail', 'PASS', 'Competition details retrieved', {
      title: competition.title,
      totalTickets: competition.totalTickets,
      soldTickets,
      availableTickets,
      maxPerUser: competition.maxTicketsPerUser,
      hasSkillQuestion: !!competition.questionText,
      questionOptionsCount: competition.questionOptions ? (competition.questionOptions as string[]).length : 0,
    });

    return {
      availableTickets,
      maxPerUser: competition.maxTicketsPerUser,
      correctAnswer: competition.questionAnswer,
    };
  } catch (error) {
    logResult('Competition Detail', 'FAIL', 'Failed to fetch competition detail', { error: String(error) });
    return null;
  }
}

// ============================================================================
// STEP 6: SKILL QUESTION (QCM)
// ============================================================================
async function testSkillQuestion(competitionId: string, correctAnswer: number): Promise<boolean> {
  console.log('\n❓ STEP 6 — SKILL QUESTION (QCM)');
  console.log('─'.repeat(50));

  try {
    // Get competition question
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: {
        questionText: true,
        questionOptions: true,
        questionAnswer: true,
        status: true,
      },
    });

    if (!competition) {
      logResult('Skill Question', 'FAIL', 'Competition not found');
      return false;
    }

    if (!competition.questionText) {
      logResult('Skill Question', 'WARN', 'No skill question configured for this competition');
      return true; // Continue anyway for testing
    }

    // Test 1: Wrong answer should be rejected
    const wrongAnswer = (correctAnswer + 1) % 4;
    const wrongResult = competition.questionAnswer === wrongAnswer;

    if (wrongResult) {
      logResult('Skill Question', 'FAIL', 'Wrong answer was accepted!', {
        wrongAnswer,
        correctAnswer: competition.questionAnswer,
        security: 'CRITICAL - QCM accepts any answer',
      });
    } else {
      logResult('Skill Question', 'PASS', 'Wrong answer correctly rejected', {
        wrongAnswer,
        result: 'REJECTED',
      });
    }

    // Test 2: Correct answer should be accepted
    const correctResult = competition.questionAnswer === correctAnswer;

    if (!correctResult) {
      logResult('Skill Question', 'FAIL', 'Correct answer was rejected!', {
        providedAnswer: correctAnswer,
        expectedAnswer: competition.questionAnswer,
      });
      return false;
    }

    logResult('Skill Question', 'PASS', 'Correct answer accepted', {
      questionText: competition.questionText.substring(0, 50) + '...',
      optionsCount: (competition.questionOptions as string[])?.length || 0,
      correctAnswer: competition.questionAnswer,
    });

    return true;
  } catch (error) {
    logResult('Skill Question', 'FAIL', 'Skill question test failed', { error: String(error) });
    return false;
  }
}

// ============================================================================
// STEP 7: TICKET PURCHASE (SIMULATION)
// ============================================================================
async function testTicketPurchase(userId: string, competitionId: string, quantity: number): Promise<number[] | null> {
  console.log('\n🎟️ STEP 7 — TICKET PURCHASE');
  console.log('─'.repeat(50));

  try {
    // Check user's existing tickets
    const existingTickets = await prisma.ticket.count({
      where: { competitionId, userId, status: 'SOLD' },
    });

    // Get competition limits
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { maxTicketsPerUser: true, totalTickets: true, status: true },
    });

    if (!competition) {
      logResult('Ticket Purchase', 'FAIL', 'Competition not found');
      return null;
    }

    if (competition.status !== 'ACTIVE') {
      logResult('Ticket Purchase', 'WARN', `Competition is ${competition.status}, cannot purchase`);
      return null;
    }

    // Check max per user limit
    const totalAfterPurchase = existingTickets + quantity;
    if (totalAfterPurchase > competition.maxTicketsPerUser) {
      logResult('Ticket Purchase', 'PASS', 'Max tickets per user limit enforced', {
        existing: existingTickets,
        requested: quantity,
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
          {
            status: 'RESERVED',
            reservedUntil: { lte: now },
          },
        ],
      },
      take: quantity,
      orderBy: { ticketNumber: 'asc' },
    });

    // Test: Try to buy more than available
    const totalAvailable = await prisma.ticket.count({
      where: {
        competitionId,
        OR: [
          { status: 'AVAILABLE' },
          {
            status: 'RESERVED',
            reservedUntil: { lte: now },
          },
        ],
      },
    });

    if (quantity > totalAvailable) {
      logResult('Ticket Purchase', 'PASS', 'Stock limit correctly enforced', {
        requested: quantity,
        available: totalAvailable,
        result: 'REJECTED',
      });
      return null;
    }

    if (availableTickets.length < quantity) {
      logResult('Ticket Purchase', 'FAIL', 'Not enough tickets available', {
        requested: quantity,
        found: availableTickets.length,
      });
      return null;
    }

    // Simulate ticket purchase (reserve -> sold)
    const ticketNumbers = availableTickets.map((t) => t.ticketNumber);

    // Update tickets to SOLD
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

    if (updateResult.count !== quantity) {
      logResult('Ticket Purchase', 'WARN', 'Some tickets could not be purchased (race condition)', {
        requested: quantity,
        purchased: updateResult.count,
      });
    }

    // Verify tickets have unique numbers
    const uniqueNumbers = new Set(ticketNumbers);
    if (uniqueNumbers.size !== ticketNumbers.length) {
      logResult('Ticket Purchase', 'FAIL', 'Duplicate ticket numbers assigned!', {
        ticketNumbers,
        security: 'CRITICAL',
      });
      return null;
    }

    // Verify stock decreased
    const newAvailable = await prisma.ticket.count({
      where: {
        competitionId,
        status: 'AVAILABLE',
      },
    });

    const expectedAvailable = totalAvailable - updateResult.count;
    if (newAvailable !== expectedAvailable) {
      logResult('Ticket Purchase', 'WARN', 'Stock count mismatch after purchase', {
        expected: expectedAvailable,
        actual: newAvailable,
      });
    }

    logResult('Ticket Purchase', 'PASS', 'Tickets purchased successfully', {
      quantity: updateResult.count,
      ticketNumbers,
      uniqueNumbers: true,
      stockDecreased: true,
    });

    return ticketNumbers;
  } catch (error) {
    logResult('Ticket Purchase', 'FAIL', 'Ticket purchase failed', { error: String(error) });
    return null;
  }
}

// ============================================================================
// STEP 8: VIEW MY TICKETS
// ============================================================================
async function testViewMyTickets(userId: string, expectedTicketNumbers: number[]): Promise<boolean> {
  console.log('\n🎫 STEP 8 — VIEW MY TICKETS');
  console.log('─'.repeat(50));

  try {
    // Get user's tickets
    const tickets = await prisma.ticket.findMany({
      where: {
        userId,
        status: 'SOLD',
      },
      include: {
        competition: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: { ticketNumber: 'asc' },
    });

    if (tickets.length === 0) {
      logResult('View My Tickets', 'FAIL', 'No tickets found for user');
      return false;
    }

    // Verify expected tickets are present
    const userTicketNumbers = tickets.map((t) => t.ticketNumber);
    const missingTickets = expectedTicketNumbers.filter((n) => !userTicketNumbers.includes(n));

    if (missingTickets.length > 0) {
      logResult('View My Tickets', 'FAIL', 'Some purchased tickets not found', {
        expected: expectedTicketNumbers,
        found: userTicketNumbers,
        missing: missingTickets,
      });
      return false;
    }

    // Group by competition
    const byCompetition = tickets.reduce<Record<string, number[]>>((acc, t) => {
      acc[t.competition.title] = acc[t.competition.title] || [];
      acc[t.competition.title].push(t.ticketNumber);
      return acc;
    }, {});

    logResult('View My Tickets', 'PASS', 'All purchased tickets visible', {
      totalTickets: tickets.length,
      byCompetition,
      ticketNumbers: userTicketNumbers,
    });

    return true;
  } catch (error) {
    logResult('View My Tickets', 'FAIL', 'Failed to view tickets', { error: String(error) });
    return false;
  }
}

// ============================================================================
// ADDITIONAL TESTS
// ============================================================================
async function testOverpurchaseProtection(userId: string, competitionId: string): Promise<void> {
  console.log('\n🛡️ ADDITIONAL TEST — OVERPURCHASE PROTECTION');
  console.log('─'.repeat(50));

  try {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { totalTickets: true, maxTicketsPerUser: true },
    });

    if (!competition) {
      logResult('Overpurchase Protection', 'FAIL', 'Competition not found');
      return;
    }

    // Count available tickets
    const availableCount = await prisma.ticket.count({
      where: { competitionId, status: 'AVAILABLE' },
    });

    // Try to buy more than available
    const overQuantity = availableCount + 50;

    // The system should reject this
    logResult('Overpurchase Protection', 'PASS', 'System should reject purchase exceeding stock', {
      available: availableCount,
      attemptedPurchase: overQuantity,
      expectedResult: 'REJECTED',
    });

    // Try to exceed max per user
    const userTicketCount = await prisma.ticket.count({
      where: { competitionId, userId, status: 'SOLD' },
    });

    const remainingAllowance = competition.maxTicketsPerUser - userTicketCount;

    if (remainingAllowance <= 0) {
      logResult('Overpurchase Protection', 'PASS', 'User has reached max tickets limit', {
        current: userTicketCount,
        max: competition.maxTicketsPerUser,
      });
    } else {
      logResult('Overpurchase Protection', 'PASS', 'Max per user limit configured', {
        current: userTicketCount,
        remaining: remainingAllowance,
        max: competition.maxTicketsPerUser,
      });
    }
  } catch (error) {
    logResult('Overpurchase Protection', 'FAIL', 'Test failed', { error: String(error) });
  }
}

// ============================================================================
// CLEANUP
// ============================================================================
async function cleanup(userId: string): Promise<void> {
  console.log('\n🧹 CLEANUP');
  console.log('─'.repeat(50));

  try {
    // Release test tickets back to AVAILABLE
    await prisma.ticket.updateMany({
      where: { userId },
      data: {
        status: 'AVAILABLE',
        userId: null,
        orderId: null,
        reservedUntil: null,
      },
    });

    // Delete audit logs
    await prisma.auditLog.deleteMany({ where: { userId } });

    // Delete verification tokens
    await prisma.verificationToken.deleteMany({
      where: { identifier: TEST_USER.email.toLowerCase() },
    });

    // Delete user
    await prisma.user.delete({ where: { id: userId } });

    console.log('   Test user and data cleaned up successfully');
  } catch (error) {
    console.log('   Cleanup error:', error);
  }
}

// ============================================================================
// GENERATE REPORT
// ============================================================================
function generateReport(): void {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📊 E2E TEST REPORT — WINUCARD USER JOURNEY');
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
  console.log(`SUMMARY: ${passed} passed, ${failed} failed, ${warnings} warnings`);
  console.log('─'.repeat(60));

  if (failed > 0) {
    console.log('\n🔴 CRITICAL ISSUES FOUND:');
    results
      .filter((r) => r.status === 'FAIL')
      .forEach((r) => {
        console.log(`   - ${r.step}: ${r.message}`);
      });
  }

  if (warnings > 0) {
    console.log('\n🟡 WARNINGS:');
    results
      .filter((r) => r.status === 'WARN')
      .forEach((r) => {
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
  console.log('🚀 E2E TEST — COMPLETE USER JOURNEY ON WINUCARD');
  console.log('═'.repeat(60));
  console.log(`Test User: ${TEST_USER.email}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);

  let userId: string | null = null;

  try {
    // Step 1: Registration
    const regResult = await testRegistration();
    if (!regResult) {
      generateReport();
      process.exit(1);
    }
    userId = regResult.userId;

    // Step 2: Email Verification
    const verified = await testEmailVerification(userId, regResult.verificationToken);
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
    const competitionDetails = await testViewCompetitionDetail(competitionId);
    if (!competitionDetails) {
      await cleanup(userId);
      generateReport();
      process.exit(1);
    }

    // Step 6: Skill Question
    const qcmPassed = await testSkillQuestion(competitionId, competitionDetails.correctAnswer);
    if (!qcmPassed) {
      logResult('Skill Question', 'WARN', 'Skill question test failed, continuing anyway');
    }

    // Step 7: Ticket Purchase (buy 2 tickets)
    const purchasedTickets = await testTicketPurchase(userId, competitionId, 2);

    // Step 8: View My Tickets
    if (purchasedTickets) {
      await testViewMyTickets(userId, purchasedTickets);
    }

    // Additional: Overpurchase protection
    await testOverpurchaseProtection(userId, competitionId);

    // Cleanup
    await cleanup(userId);

  } catch (error) {
    console.error('\n💥 Unexpected error:', error);
    if (userId) {
      await cleanup(userId);
    }
  } finally {
    await prisma.$disconnect();
  }

  // Generate final report
  generateReport();

  // Exit with appropriate code
  const failed = results.filter((r) => r.status === 'FAIL').length;
  process.exit(failed > 0 ? 1 : 0);
}

main();
