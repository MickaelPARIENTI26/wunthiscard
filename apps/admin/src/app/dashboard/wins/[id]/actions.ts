'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { sendWinVoidedEmail } from '@/lib/email';

type DeliveryStatus = 'PENDING' | 'CLAIMED' | 'SHIPPED' | 'DELIVERED';

interface UpdateDeliveryStatusParams {
  winId: string;
  status?: DeliveryStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  shippingCarrier?: string;
  notes?: string;
}

interface UpdateDeliveryStatusResult {
  success: boolean;
  error?: string;
}

export async function updateDeliveryStatus({
  winId,
  status,
  trackingNumber,
  trackingUrl,
  shippingCarrier,
  notes,
}: UpdateDeliveryStatusParams): Promise<UpdateDeliveryStatusResult> {
  try {
    // Verify the current user is admin
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return { success: false, error: 'Unauthorized' };
    }

    const win = await prisma.win.findUnique({
      where: { id: winId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
          },
        },
        competition: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!win) {
      return { success: false, error: 'Win not found' };
    }

    // Build update data
    const updateData: {
      claimedAt?: Date;
      shippedAt?: Date;
      deliveredAt?: Date;
      trackingNumber?: string;
      trackingUrl?: string;
      shippingCarrier?: string;
      notes?: string;
    } = {};

    // Handle status transitions
    if (status) {
      switch (status) {
        case 'CLAIMED':
          if (!win.claimedAt) {
            updateData.claimedAt = new Date();
          }
          break;
        case 'SHIPPED':
          if (!win.claimedAt) {
            updateData.claimedAt = new Date();
          }
          if (!win.shippedAt) {
            updateData.shippedAt = new Date();
          }
          if (trackingNumber) updateData.trackingNumber = trackingNumber;
          if (trackingUrl) updateData.trackingUrl = trackingUrl;
          if (shippingCarrier) updateData.shippingCarrier = shippingCarrier;
          break;
        case 'DELIVERED':
          if (!win.claimedAt) {
            updateData.claimedAt = new Date();
          }
          if (!win.shippedAt) {
            updateData.shippedAt = new Date();
          }
          if (!win.deliveredAt) {
            updateData.deliveredAt = new Date();
          }
          break;
      }
    }

    // Always update tracking info if provided
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (trackingUrl !== undefined) updateData.trackingUrl = trackingUrl;
    if (shippingCarrier !== undefined) updateData.shippingCarrier = shippingCarrier;
    if (notes !== undefined) updateData.notes = notes;

    // Update the win
    await prisma.$transaction(async (tx) => {
      await tx.win.update({
        where: { id: winId },
        data: updateData,
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: status ? `DELIVERY_STATUS_${status}` : 'DELIVERY_NOTES_UPDATED',
          entity: 'win',
          entityId: winId,
          userId: session.user.id,
          metadata: {
            competitionTitle: win.competition.title,
            winnerEmail: win.user?.email,
            status,
            trackingNumber,
            shippingCarrier,
            timestamp: new Date().toISOString(),
          },
        },
      });
    });

    // Revalidate paths
    revalidatePath('/dashboard/wins');
    revalidatePath('/dashboard/wins/' + winId);

    // TODO: Send email notifications to winner when status changes
    // - SHIPPED: Send shipping confirmation with tracking info
    // - DELIVERED: Send delivery confirmation

    return { success: true };
  } catch (error) {
    console.error('Update delivery status error:', error);
    return { success: false, error: 'Failed to update delivery status' };
  }
}

interface VoidWinResult {
  success: boolean;
  error?: string;
}

export async function voidWinAndAllowRedraw(winId: string): Promise<VoidWinResult> {
  try {
    // Verify the current user is SUPER_ADMIN (only super admins can void wins)
    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Only Super Admins can void wins' };
    }

    const win = await prisma.win.findUnique({
      where: { id: winId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
          },
        },
        competition: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!win) {
      return { success: false, error: 'Win not found' };
    }

    // Check if the win is still unclaimed
    if (win.claimedAt) {
      return { success: false, error: 'Cannot void a claimed prize' };
    }

    // Calculate days since win
    const daysSinceWin = Math.floor(
      (Date.now() - win.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceWin < 14) {
      return { success: false, error: 'Cannot void a win before 14 days have passed' };
    }

    // Void the win and update competition to allow new draw
    await prisma.$transaction(async (tx) => {
      // Delete the win record
      await tx.win.delete({
        where: { id: winId },
      });

      // Update competition status back to SOLD_OUT to allow new draw
      await tx.competition.update({
        where: { id: win.competition.id },
        data: { status: 'SOLD_OUT' },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'WIN_VOIDED_FOR_REDRAW',
          entity: 'win',
          entityId: winId,
          userId: session.user.id,
          metadata: {
            competitionId: win.competition.id,
            competitionTitle: win.competition.title,
            originalWinnerEmail: win.user?.email,
            daysSinceWin,
            reason: 'Prize not claimed within 14 days',
            timestamp: new Date().toISOString(),
          },
        },
      });
    });

    // Send notification email to original winner
    if (win.user?.email) {
      try {
        await sendWinVoidedEmail({
          to: win.user.email,
          firstName: win.user.firstName || 'Winner',
          competitionTitle: win.competition.title,
        });
      } catch (emailError) {
        console.error('Failed to send win voided email:', emailError);
        // Don't fail the operation if email fails
      }
    }

    // Revalidate paths
    revalidatePath('/dashboard/wins');
    revalidatePath(`/dashboard/competitions/${win.competition.id}`);

    return { success: true };
  } catch (error) {
    console.error('Void win error:', error);
    return { success: false, error: 'Failed to void win' };
  }
}
