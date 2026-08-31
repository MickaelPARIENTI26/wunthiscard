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
    select: { status: true, shippedAt: true, deliveredAt: true, paymentReversedAt: true },
  });
  if (!existing) return { success: false, message: 'Jackpot win not found.' };

  // The payment behind this card came back. Advancing fulfilment now would post a
  // graded card paid for with money we no longer hold — so the form stops here
  // until a human clears the hold, which is a deliberate, separate decision.
  if (existing.paymentReversedAt) {
    return {
      success: false,
      message:
        'This win is frozen: the payment behind it was reversed. Clear the payment hold before updating fulfilment.',
    };
  }

  // Stamp the milestone the first time it is reached, and leave it alone after —
  // re-saving the form should not rewrite when the parcel actually went out.
  const shippedAt =
    status === 'SHIPPED' && !existing.shippedAt ? new Date() : existing.shippedAt;
  const deliveredAt =
    status === 'DELIVERED' && !existing.deliveredAt ? new Date() : existing.deliveredAt;

  // Guarded, not a bare update: a reversal can land between the read above and
  // here, and the freeze must win that race rather than be written straight over.
  const updated = await prisma.jackpotWin.updateMany({
    where: { id: winId, paymentReversedAt: null },
    data: { status, adminNotes, trackingNumber, shippedAt, deliveredAt },
  });
  if (updated.count === 0) {
    return {
      success: false,
      message: 'This win was frozen while you were editing — the payment behind it was reversed.',
    };
  }

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

/**
 * Clear a payment hold on a jackpot win.
 *
 * The freeze is automatic; lifting it never is. This is the moment someone
 * decides the card is honoured despite the reversed payment — usually because
 * the refund was our own goodwill, or the dispute was resolved in our favour.
 * The reason is mandatory and recorded: it is the only account of why a card
 * worth thousands went out on an order that did not pay.
 */
export async function clearJackpotPaymentHold(
  winId: string,
  reason: string
): Promise<JackpotUpdateState> {
  const session = await auth();
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return { success: false, message: 'Only a super admin can clear a payment hold.' };
  }

  const trimmed = reason.trim();
  if (trimmed.length < 10) {
    return { success: false, message: 'Give a reason of at least 10 characters.' };
  }

  const existing = await prisma.jackpotWin.findUnique({
    where: { id: winId },
    select: { paymentReversedAt: true, paymentReversedReason: true, prizeValue: true },
  });
  if (!existing) return { success: false, message: 'Jackpot win not found.' };
  if (!existing.paymentReversedAt) {
    return { success: false, message: 'This win is not frozen.' };
  }

  const cleared = await prisma.jackpotWin.updateMany({
    where: { id: winId, paymentReversedAt: { not: null } },
    data: { paymentReversedAt: null, paymentReversedReason: null },
  });
  if (cleared.count === 0) {
    return { success: false, message: 'This win is no longer frozen.' };
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'JACKPOT_PAYMENT_HOLD_CLEARED',
      entity: 'jackpotWin',
      entityId: winId,
      metadata: {
        frozenReason: existing.paymentReversedReason,
        prizeValue: existing.prizeValue ? existing.prizeValue.toString() : null,
        reason: trimmed,
      },
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/competitions');
  return { success: true, message: 'Payment hold cleared.' };
}
