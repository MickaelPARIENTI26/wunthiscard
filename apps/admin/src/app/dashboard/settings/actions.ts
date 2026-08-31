'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import { auth } from '@/lib/auth';
import type { Prisma } from '@winucard/database';

function requireAdmin(session: { user?: { id?: string; role?: string } } | null): string {
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Admin access required');
  }
  return session.user.id;
}

// Sensitive keys (Stripe) must be configured via environment variables only
// Never store API keys in the database for security
interface SiteSettingsData {
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyRegistration?: string;
  companyAddress?: string;
  companyTagline?: string;
  socialInstagram?: string;
  socialTwitter?: string;
  socialYoutube?: string;
  socialTiktok?: string;
  socialDiscord?: string;
  /** Where the wheel jackpot alert is sent. Never hardcoded. */
  jackpotNotificationEmail?: string;
  bonusTiers?: Array<{ minTickets: number; bonusPercent: number }>;
  ticketPacks?: Array<{
    name: string;
    tickets: number;
    bonus: number;
    badge: string;
    active: boolean;
  }>;
}

/**
 * Read, change and write the settings blob as ONE atomic step.
 *
 * Every settings card posts to this same single JSON column, so a plain
 * read-then-write let two concurrent saves silently revert each other's fields —
 * including jackpotNotificationEmail, after which jackpot alerts fall back to the
 * default inbox while the form reports success. Serializable makes the loser fail
 * rather than overwrite; the retry then re-reads and re-applies its own change.
 */
async function mutateSettings(
  change: (current: SiteSettingsData) => SiteSettingsData
): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    try {
      await prisma.$transaction(
        async (tx) => {
          const existing = await tx.siteSettings.findUnique({ where: { id: 'global' } });
          const next = change((existing?.data as SiteSettingsData) ?? {});
          await tx.siteSettings.upsert({
            where: { id: 'global' },
            update: { data: next as Prisma.InputJsonValue },
            create: { id: 'global', data: next as Prisma.InputJsonValue },
          });
        },
        { isolationLevel: 'Serializable' }
      );
      return;
    } catch (error) {
      // Serialisation failure (P2034) or a write conflict: someone else committed
      // between our read and our write. Re-run — the change closure is pure.
      const code =
        error && typeof error === 'object' && 'code' in error
          ? (error as { code?: string }).code
          : undefined;
      if (attempt >= 3 || (code !== 'P2034' && code !== 'P2002')) throw error;
    }
  }
}

// Keys that must never be stored in database (security)
const BLOCKED_KEYS = [
  'stripePublishableKey',
  'stripeSecretKey',
  'stripeWebhookSecret',
  'stripeMode',
  'currency',
  'currencySymbol',
];

export async function updateSettings(formData: FormData) {
  const session = await auth();
  const adminId = requireAdmin(session);

  const updates: Record<string, string> = {};

  formData.forEach((value, key) => {
    // Filter out sensitive/blocked keys
    if (typeof value === 'string' && !BLOCKED_KEYS.includes(key)) {
      updates[key] = value;
    }
  });

  await mutateSettings((current) => ({ ...current, ...updates }));

  await createAuditLog({
    action: 'SETTINGS_UPDATED',
    entityType: 'SiteSettings',
    entityId: 'global',
    adminId,
    details: { keys: Object.keys(updates) },
  });

  revalidatePath('/dashboard/settings');
}

export async function updateTicketPacks(
  packs: Array<{ name: string; tickets: number; bonus: number; badge: string; active: boolean }>
) {
  const session = await auth();
  const adminId = requireAdmin(session);

  // Validate packs
  if (!Array.isArray(packs) || packs.length === 0) {
    throw new Error('At least one ticket pack is required');
  }

  for (const pack of packs) {
    if (!pack.name || typeof pack.name !== 'string' || pack.name.trim().length === 0) {
      throw new Error('Each pack must have a name');
    }
    if (!Number.isInteger(pack.tickets) || pack.tickets < 1) {
      throw new Error('Tickets must be a positive integer');
    }
    if (!Number.isInteger(pack.bonus) || pack.bonus < 0) {
      throw new Error('Bonus must be a non-negative integer');
    }
    if (typeof pack.badge !== 'string') {
      throw new Error('Badge must be a string');
    }
    if (typeof pack.active !== 'boolean') {
      throw new Error('Active must be a boolean');
    }
  }

  const sanitizedPacks = packs.map((pack) => ({
    name: pack.name.trim(),
    tickets: pack.tickets,
    bonus: pack.bonus,
    badge: pack.badge,
    active: pack.active,
  }));

  await mutateSettings((current) => ({ ...current, ticketPacks: sanitizedPacks }));

  await createAuditLog({
    action: 'TICKET_PACKS_UPDATED',
    entityType: 'SiteSettings',
    entityId: 'global',
    adminId,
    details: { packs: sanitizedPacks },
  });

  revalidatePath('/dashboard/settings');
}

export async function updateBonusTiers(tiers: Array<{ minTickets: number; bonusPercent: number }>) {
  const session = await auth();
  const adminId = requireAdmin(session);

  await mutateSettings((current) => ({ ...current, bonusTiers: tiers }));

  await createAuditLog({
    action: 'BONUS_TIERS_UPDATED',
    entityType: 'SiteSettings',
    entityId: 'global',
    adminId,
    details: { tiers },
  });

  revalidatePath('/dashboard/settings');
}
