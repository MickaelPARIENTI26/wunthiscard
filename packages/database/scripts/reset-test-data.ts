/**
 * Pre-launch test-data reset.
 *
 * Keeps SUPER_ADMIN user(s); removes everyone else and all their play data so the
 * competitions look fresh ("as if nobody ever played"):
 *   - resets their tickets back to AVAILABLE (unowned)
 *   - deletes their orders, wins, draw logs, verification tokens, audit logs
 *   - deletes the users (cascades their accounts/sessions/addresses)
 *   - restores competitions (SOLD_OUT/COMPLETED/DRAWING -> ACTIVE, winner fields cleared)
 *
 * SAFE BY DEFAULT: dry-run unless CONFIRM=yes. Idempotent. Runs in one transaction.
 *
 *   # dry run (shows what WOULD change, no writes):
 *   cd packages/database && DATABASE_URL="<prod-url>" npx tsx scripts/reset-test-data.ts
 *   # execute:
 *   cd packages/database && CONFIRM=yes DATABASE_URL="<prod-url>" npx tsx scripts/reset-test-data.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const EXECUTE = process.env.CONFIRM === 'yes';

async function main() {
  const keep = await prisma.user.findMany({
    where: { role: 'SUPER_ADMIN' },
    select: { id: true, email: true },
  });
  const targets = await prisma.user.findMany({
    where: { role: { not: 'SUPER_ADMIN' } },
    select: { id: true, email: true },
  });
  const ids = targets.map((u) => u.id);
  const emails = targets.map((u) => u.email);

  if (keep.length === 0) {
    console.error('ABORT: no SUPER_ADMIN found — refusing to delete every user. Promote your admin first.');
    process.exit(1);
  }

  const [orders, wins, tickets, drawLogs, auditLogs, comps] = await Promise.all([
    prisma.order.count({ where: { userId: { in: ids } } }),
    prisma.win.count({ where: { userId: { in: ids } } }),
    prisma.ticket.count({ where: { userId: { in: ids } } }),
    prisma.drawLog.count({ where: { OR: [{ winnerUserId: { in: ids } }, { drawnById: { in: ids } }] } }),
    prisma.auditLog.count({ where: { userId: { in: ids } } }),
    prisma.competition.count({ where: { status: { in: ['SOLD_OUT', 'COMPLETED', 'DRAWING'] } } }),
  ]);

  console.log('--- Test-data reset ---');
  console.log(`KEEP  ${keep.length} SUPER_ADMIN: ${keep.map((k) => k.email).join(', ')}`);
  console.log(`DELETE ${targets.length} users`);
  console.log(`RESET  ${tickets} tickets -> AVAILABLE`);
  console.log(`DELETE ${orders} orders, ${wins} wins, ${drawLogs} draw logs, ${auditLogs} audit logs, tokens for ${emails.length} emails`);
  console.log(`RESTORE ${comps} competitions (SOLD_OUT/COMPLETED/DRAWING -> ACTIVE, winner fields cleared)`);

  if (!EXECUTE) {
    console.log('\nDRY RUN — no changes made. Re-run with CONFIRM=yes to execute.');
    return;
  }
  if (targets.length === 0) {
    console.log('\nNothing to delete. Done.');
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.ticket.updateMany({
      where: { userId: { in: ids } },
      data: { status: 'AVAILABLE', userId: null, orderId: null, reservedUntil: null, isBonus: false },
    });
    await tx.drawLog.deleteMany({ where: { OR: [{ winnerUserId: { in: ids } }, { drawnById: { in: ids } }] } });
    await tx.win.deleteMany({ where: { userId: { in: ids } } });
    await tx.order.deleteMany({ where: { userId: { in: ids } } });
    await tx.verificationToken.deleteMany({ where: { identifier: { in: emails } } });
    await tx.auditLog.deleteMany({ where: { userId: { in: ids } } });
    await tx.user.deleteMany({ where: { id: { in: ids } } }); // cascades Account/Session/Address
    await tx.competition.updateMany({
      where: { status: { in: ['SOLD_OUT', 'COMPLETED', 'DRAWING'] } },
      data: { status: 'ACTIVE', winningTicketNumber: null, actualDrawDate: null, drawnById: null, winnerNotified: false },
    });
  });

  const remaining = await prisma.user.count();
  console.log(`\nDONE. Users remaining: ${remaining}.`);
}

main()
  .then(() => prisma.$disconnect().then(() => process.exit(0)))
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
