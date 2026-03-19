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
  bonusTiers?: Array<{ minTickets: number; bonusPercent: number }>;
  referralTicketsRequired?: number;
  ticketPacks?: Array<{
    name: string;
    tickets: number;
    bonus: number;
    badge: string;
    active: boolean;
  }>;
}

async function getSettings(): Promise<SiteSettingsData> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 'global' },
  });
  return (settings?.data as SiteSettingsData) ?? {};
}

async function saveSettings(data: SiteSettingsData) {
  await prisma.siteSettings.upsert({
    where: { id: 'global' },
    update: { data: data as Prisma.InputJsonValue },
    create: { id: 'global', data: data as Prisma.InputJsonValue },
  });
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

  const currentSettings = await getSettings();
  const updates: Record<string, string> = {};

  formData.forEach((value, key) => {
    // Filter out sensitive/blocked keys
    if (typeof value === 'string' && !BLOCKED_KEYS.includes(key)) {
      updates[key] = value;
    }
  });

  const newSettings = { ...currentSettings, ...updates };
  await saveSettings(newSettings);

  await createAuditLog({
    action: 'SETTINGS_UPDATED',
    entityType: 'SiteSettings',
    entityId: 'global',
    adminId,
    details: { keys: Object.keys(updates) },
  });

  revalidatePath('/dashboard/settings');
}

export async function updateReferralSettings(referralTicketsRequired: number) {
  const session = await auth();
  const adminId = requireAdmin(session);

  if (referralTicketsRequired < 1 || !Number.isInteger(referralTicketsRequired)) {
    throw new Error('Tickets required must be a positive integer');
  }

  const currentSettings = await getSettings();
  const newSettings = { ...currentSettings, referralTicketsRequired };
  await saveSettings(newSettings);

  await createAuditLog({
    action: 'REFERRAL_SETTINGS_UPDATED',
    entityType: 'SiteSettings',
    entityId: 'global',
    adminId,
    details: { referralTicketsRequired },
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

  const currentSettings = await getSettings();
  const newSettings = { ...currentSettings, ticketPacks: sanitizedPacks };
  await saveSettings(newSettings);

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

  const currentSettings = await getSettings();
  const newSettings = { ...currentSettings, bonusTiers: tiers };
  await saveSettings(newSettings);

  await createAuditLog({
    action: 'BONUS_TIERS_UPDATED',
    entityType: 'SiteSettings',
    entityId: 'global',
    adminId,
    details: { tiers },
  });

  revalidatePath('/dashboard/settings');
}
