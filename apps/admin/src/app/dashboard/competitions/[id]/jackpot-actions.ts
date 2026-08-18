'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import type { JackpotStatus } from '@winucard/database';

export interface JackpotUpdateState {
  success: boolean;
  message: string;
}

const STATUSES: JackpotStatus[] = [
  'PENDING',
  'CONTACTED',
  'ADDRESS_CONFIRMED',
  'SHIPPED',
  'DELIVERED',
];

export async function updateJackpotWin(
  winId: string,
  _prev: JackpotUpdateState,
  formData: FormData
): Promise<JackpotUpdateState> {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Not authorised.' };
  }

  const status = String(formData.get('status') ?? '') as JackpotStatus;
  if (!STATUSES.includes(status)) {
    return { success: false, message: 'Unknown status.' };
  }

  const adminNotes = String(formData.get('adminNotes') ?? '').trim() || null;
  const trackingNumber = String(formData.get('trackingNumber') ?? '').trim() || null;

  const existing = await prisma.jackpotWin.findUnique({
    where: { id: winId },
    select: { status: true, shippedAt: true, deliveredAt: true },
  });
  if (!existing) return { success: false, message: 'Jackpot win not found.' };

  // Stamp the milestone the first time it is reached, and leave it alone after —
  // re-saving the form should not rewrite when the parcel actually went out.
  const shippedAt =
    status === 'SHIPPED' && !existing.shippedAt ? new Date() : existing.shippedAt;
  const deliveredAt =
    status === 'DELIVERED' && !existing.deliveredAt ? new Date() : existing.deliveredAt;

  await prisma.jackpotWin.update({
    where: { id: winId },
    data: { status, adminNotes, trackingNumber, shippedAt, deliveredAt },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'JACKPOT_WIN_UPDATED',
      entity: 'jackpotWin',
      entityId: winId,
      metadata: { from: existing.status, to: status, trackingNumber },
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/competitions');
  return { success: true, message: 'Jackpot updated.' };
}
