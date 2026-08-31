'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import type { JackpotStatus } from '@winucard/database';

/**
 * How long a graded card waits before it may ship, in days.
 *
 * Lives in the existing SiteSettings JSON blob next to jackpotNotificationEmail,
 * so it needs no migration. Fails CLOSED: an unreadable or nonsense value gives
 * the default rather than no protection at all.
 */
async function jackpotShippingHoldDays(): Promise<number> {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
  const raw = (settings?.data as { jackpotShippingHoldDays?: unknown } | null)
    ?.jackpotShippingHoldDays;
  const days = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(days) && days >= 0 ? days : 30;
}

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
    select: {
      status: true,
      shippedAt: true,
      deliveredAt: true,
      paymentReversedAt: true,
      createdAt: true,
      order: { select: { paymentStatus: true, disputeOpenedAt: true } },
    },
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

  // A hold before the card can physically leave.
  //
  // Chargebacks arrive weeks after the payment, and spins are BANKED until the
  // draw date — so the buyer, not the clock, decides when the win happens. The
  // hold therefore runs from the later of the two: paying early and spinning on
  // the last day must not ship the card the same afternoon.
  if (status === 'SHIPPED' && !existing.shippedAt) {
    if (existing.order?.paymentStatus !== 'SUCCEEDED') {
      return {
        success: false,
        message: 'The order behind this win is not in a settled paid state — do not ship it.',
      };
    }

    // A dispute stays open for 60-90 days, comfortably outliving the shipping
    // hold. Nothing leaves while the money is contested.
    if (existing.order.disputeOpenedAt) {
      return {
        success: false,
        message:
          'A payment dispute is open on the order behind this win. Nothing ships until it closes.',
      };
    }

    const holdDays = await jackpotShippingHoldDays();
    const releaseAt = new Date(existing.createdAt.getTime() + holdDays * 24 * 60 * 60 * 1000);

    if (Date.now() < releaseAt.getTime()) {
      if (session.user.role !== 'SUPER_ADMIN') {
        return {
          success: false,
          message:
            `This card is inside its ${holdDays}-day payment hold until ` +
            `${releaseAt.toLocaleDateString('en-GB')}. A super admin can ship it early.`,
        };
      }
      // A super admin may override, but never silently.
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'JACKPOT_SHIPPED_INSIDE_HOLD',
          entity: 'jackpotWin',
          entityId: winId,
          metadata: { holdDays, releaseAt: releaseAt.toISOString() },
        },
      });
    }
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

/**
 * Close a frozen win without sending the card.
 *
 * The counterpart to clearing the hold. Without a terminal outcome a frozen win
 * sits forever: the fulfilment form refuses every edit while frozen, so it can
 * never reach DELIVERED, and the winner could never delete their account.
 */
export async function markJackpotNotAwarded(
  winId: string,
  reason: string
): Promise<JackpotUpdateState> {
  const session = await auth();
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return { success: false, message: 'Only a super admin can close a win.' };
  }

  const trimmed = reason.trim();
  if (trimmed.length < 10) {
    return { success: false, message: 'Give a reason of at least 10 characters.' };
  }

  const existing = await prisma.jackpotWin.findUnique({
    where: { id: winId },
    select: { paymentReversedAt: true, shippedAt: true, prizeValue: true },
  });
  if (!existing) return { success: false, message: 'Jackpot win not found.' };
  if (!existing.paymentReversedAt) {
    return {
      success: false,
      message: 'Only a win whose payment was reversed can be closed this way.',
    };
  }
  if (existing.shippedAt) {
    return {
      success: false,
      message: 'This card has already shipped — it cannot be marked as not awarded.',
    };
  }

  const closed = await prisma.jackpotWin.updateMany({
    where: { id: winId, paymentReversedAt: { not: null }, notAwardedAt: null, shippedAt: null },
    data: { notAwardedAt: new Date(), notAwardedReason: trimmed },
  });
  if (closed.count === 0) {
    return { success: false, message: 'This win changed while you were deciding — reload.' };
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'JACKPOT_NOT_AWARDED',
      entity: 'jackpotWin',
      entityId: winId,
      metadata: {
        prizeValue: existing.prizeValue ? existing.prizeValue.toString() : null,
        reason: trimmed,
      },
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/competitions');
  return { success: true, message: 'Win closed as not awarded.' };
}
