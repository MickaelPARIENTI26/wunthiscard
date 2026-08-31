'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { validateWheelConfig, type WheelSlotCounts } from '@winucard/shared';

export interface WheelSettingsState {
  success: boolean;
  message: string;
  errors?: string[];
}

/** The four slot kinds the wheel ships with, in display order. */
const SLOT_SHAPE: { type: WheelSlotCounts['type']; value: number; field: string }[] = [
  { type: 'NO_WIN', value: 0, field: 'noWin' },
  { type: 'PERCENT_OFF', value: 5, field: 'off5' },
  { type: 'PERCENT_OFF', value: 10, field: 'off10' },
  { type: 'JACKPOT', value: 0, field: 'jackpot' },
];

function intField(formData: FormData, name: string): number {
  const n = parseInt(String(formData.get(name) ?? '0'), 10);
  return Number.isFinite(n) ? n : 0;
}

/** A slot was won while the admin had the form open. Rolls the whole save back. */
class WheelStockConflictError extends Error {}

export async function saveWheelSettings(
  competitionId: string,
  _prev: WheelSettingsState,
  formData: FormData
): Promise<WheelSettingsState> {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Not authorised.' };
  }

  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    select: { id: true, totalTickets: true, wheelConfig: { include: { slots: true } } },
  });
  if (!competition) return { success: false, message: 'Competition not found.' };

  // quantityWon is read from the database, never from the form — the browser
  // must not be able to talk us into lowering the floor that protects rewards
  // already handed out.
  const wonByKey = new Map(
    (competition.wheelConfig?.slots ?? []).map((s) => [`${s.type}:${s.value}`, s.quantityWon])
  );

  const nextSlots: WheelSlotCounts[] = SLOT_SHAPE.map((shape) => ({
    type: shape.type,
    value: shape.value,
    quantityConfigured: intField(formData, shape.field),
    quantityWon: wonByKey.get(`${shape.type}:${shape.value}`) ?? 0,
  }));

  const { errors } = validateWheelConfig(nextSlots, competition.totalTickets);
  if (errors.length > 0) {
    return {
      success: false,
      message: 'Configuration rejected.',
      errors: errors.map((e) => `${e.slotLabel}: ${e.message}`),
    };
  }

  const enabled = formData.get('enabled') === 'on';
  const jackpotEnabled = formData.get('jackpotEnabled') === 'on';
  const jackpotDescription = String(formData.get('jackpotDescription') ?? '').trim() || null;
  const rawValue = String(formData.get('jackpotValue') ?? '').trim();
  const jackpotValue = rawValue ? Number(rawValue) : null;
  const couponValidityDays = Math.max(1, intField(formData, 'couponValidityDays') || 30);

  if (jackpotValue !== null && (!Number.isFinite(jackpotValue) || jackpotValue < 0)) {
    return { success: false, message: 'Jackpot value must be a positive number.' };
  }

  try {
    await saveSlots();
  } catch (e) {
    if (e instanceof WheelStockConflictError) {
      return { success: false, message: e.message };
    }
    throw e;
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'WHEEL_CONFIG_UPDATED',
      entity: 'competition',
      entityId: competitionId,
      metadata: {
        enabled,
        jackpotEnabled,
        slots: nextSlots.map((s) => ({ type: s.type, value: s.value, qty: s.quantityConfigured })),
      },
    },
  });

  revalidatePath(`/dashboard/competitions/${competitionId}`);
  return { success: true, message: 'Wheel settings saved.' };

  async function saveSlots() {
  await prisma.$transaction(async (tx) => {
    const config = await tx.wheelConfig.upsert({
      where: { competitionId },
      create: {
        competitionId,
        enabled,
        jackpotEnabled,
        jackpotDescription,
        jackpotValue,
        couponValidityDays,
      },
      update: { enabled, jackpotEnabled, jackpotDescription, jackpotValue, couponValidityDays },
    });

    for (const slot of nextSlots) {
      // The "never below what was won" rule was validated against a read taken
      // before this transaction. Spins land continuously, so re-assert it in the
      // WHERE clause: an admin lowering a slot while a spin commits could
      // otherwise leave quantityWon above quantityConfigured — "-1 left" in both
      // admin surfaces, and on the jackpot a committed win plus an alert email
      // for a card that has just been withdrawn.
      const updated = await tx.wheelSlot.updateMany({
        where: {
          wheelConfigId: config.id,
          type: slot.type,
          value: slot.value,
          quantityWon: { lte: slot.quantityConfigured },
        },
        data: { quantityConfigured: slot.quantityConfigured },
      });

      if (updated.count === 0) {
        // Either the row does not exist yet, or a spin overtook us. Creating is
        // safe (the unique index decides); a genuine conflict throws and rolls
        // the whole save back, which is what should happen.
        const existing = await tx.wheelSlot.findUnique({
          where: {
            wheelConfigId_type_value: {
              wheelConfigId: config.id,
              type: slot.type,
              value: slot.value,
            },
          },
          select: { quantityWon: true },
        });

        if (existing) {
          throw new WheelStockConflictError(
            `${slot.type}${slot.value ? ` ${slot.value}%` : ''} has been won ${existing.quantityWon} time(s) ` +
              `since you opened this form — it cannot be set to ${slot.quantityConfigured}.`
          );
        }

        // quantityWon is deliberately absent: it is owned by the spin endpoint
        // and must never be written from an admin form.
        await tx.wheelSlot.create({
          data: {
            wheelConfigId: config.id,
            type: slot.type,
            value: slot.value,
            quantityConfigured: slot.quantityConfigured,
          },
        });
      }
    }
  });
  }
}
