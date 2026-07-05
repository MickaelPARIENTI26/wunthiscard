import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import type { MarketingRecipient } from '@/lib/email';

/**
 * Everyone who may receive a promotional / lifecycle marketing email:
 * opted in (emailMarketing), a verified address (deliverability), and an
 * active, non-banned account. Each recipient carries a stable unsubscribe
 * token — generated lazily for the rare user missing one (the migration
 * backfills all existing users, so this normally never hits the DB).
 */
export async function getMarketingRecipients(): Promise<MarketingRecipient[]> {
  const users = await prisma.user.findMany({
    where: {
      emailMarketing: true,
      isActive: true,
      isBanned: false,
      emailVerified: { not: null },
    },
    select: { id: true, email: true, firstName: true, unsubscribeToken: true },
  });

  const recipients: MarketingRecipient[] = [];
  for (const u of users) {
    let token = u.unsubscribeToken;
    if (!token) {
      token = randomUUID();
      await prisma.user.update({ where: { id: u.id }, data: { unsubscribeToken: token } });
    }
    recipients.push({ email: u.email, firstName: u.firstName, unsubscribeToken: token });
  }
  return recipients;
}
