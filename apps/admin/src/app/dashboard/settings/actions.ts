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
