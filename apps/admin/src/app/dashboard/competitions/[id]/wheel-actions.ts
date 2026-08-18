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
      await tx.wheelSlot.upsert({
        where: {
          wheelConfigId_type_value: {
            wheelConfigId: config.id,
            type: slot.type,
            value: slot.value,
          },
        },
        // quantityWon is deliberately absent from `update`: it is owned by the
        // spin endpoint and must never be rewritten from an admin form.
        create: {
          wheelConfigId: config.id,
          type: slot.type,
          value: slot.value,
          quantityConfigured: slot.quantityConfigured,
        },
        update: { quantityConfigured: slot.quantityConfigured },
      });
    }
  });

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
}
