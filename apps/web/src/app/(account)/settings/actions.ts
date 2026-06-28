'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth, signOut } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/password';
import { passwordSchema } from '@winucard/shared/validators';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export async function changePassword(
  data: ChangePasswordInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: 'You must be logged in to change your password' };
    }

    // Validate input
    const validationResult = changePasswordSchema.safeParse(data);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.errors[0]?.message };
    }

    const { currentPassword, newPassword } = validationResult.data;

    // Get user with current password hash
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // If user has an existing password, verify it
    if (user.passwordHash) {
      const { isValid } = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return { success: false, error: 'Current password is incorrect' };
      }
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password in database. Bump tokenVersion to invalidate every existing
    // JWT session (including any the user has open elsewhere, and any attacker's
    // stolen session) — the jwt callback rejects tokens whose version no longer
    // matches. The current session is invalidated too, so the form signs the user
    // out and sends them to log in again with the new password.
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        passwordHash: newPasswordHash,
        tokenVersion: { increment: 1 },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PASSWORD_CHANGED',
        entity: 'user',
        entityId: session.user.id,
      },
    });

    revalidatePath('/settings');

    return { success: true };
  } catch (error) {
    console.error('Error changing password:', error);
    return { success: false, error: 'Failed to change password. Please try again.' };
  }
}

export async function updateEmailMarketing(
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: 'You must be logged in to update your preferences' };
    }

    const parsed = z.boolean().safeParse(enabled);
    if (!parsed.success) {
      return { success: false, error: 'Invalid preference value' };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { emailMarketing: parsed.data },
    });

    // PECR/GDPR: keep an audit trail of marketing-consent changes.
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EMAIL_PREFERENCES_UPDATED',
        entity: 'user',
        entityId: session.user.id,
        metadata: { emailMarketing: parsed.data },
      },
    });

    revalidatePath('/settings');

    return { success: true };
  } catch (error) {
    console.error('Error updating email preferences:', error);
    return { success: false, error: 'Failed to update preferences. Please try again.' };
  }
}

export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: 'You must be logged in to delete your account' };
    }

    const userId = session.user.id;

    // Check if user has any active competition entries
    const activeTickets = await prisma.ticket.findFirst({
      where: {
        userId,
        status: { in: ['SOLD', 'FREE_ENTRY'] },
        competition: {
          status: {
            in: ['ACTIVE', 'SOLD_OUT', 'DRAWING'],
          },
        },
      },
    });

    if (activeTickets) {
      return {
        success: false,
        error:
          'You have tickets in active competitions. You cannot delete your account until all competitions are completed.',
      };
    }

    // Check if user has any unclaimed wins
    const unclaimedWins = await prisma.win.findFirst({
      where: {
        userId,
        deliveredAt: null,
      },
    });

    if (unclaimedWins) {
      return {
        success: false,
        error:
          'You have prizes that have not been delivered. Please wait until all prizes are delivered before deleting your account.',
      };
    }

    // Log the action before deletion
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ACCOUNT_DELETED',
        entity: 'user',
        entityId: userId,
        metadata: {
          email: session.user.email,
          deletedAt: new Date().toISOString(),
        },
      },
    });

    // Delete user data - using onDelete: SetNull and Cascade where appropriate
    // Orders, Tickets, and Wins are kept for accounting/compliance but anonymized
    await prisma.$transaction([
      // Delete addresses (cascade in schema)
      prisma.address.deleteMany({ where: { userId } }),

      // Delete sessions (cascade in schema)
      prisma.session.deleteMany({ where: { userId } }),

      // Delete accounts/OAuth (cascade in schema)
      prisma.account.deleteMany({ where: { userId } }),

      // Nullify ticket ownership (keep tickets for competition integrity)
      prisma.ticket.updateMany({
        where: { userId },
        data: { userId: null },
      }),

      // Anonymize orders (keep for accounting records)
      prisma.order.updateMany({
        where: { userId },
        data: { userId: null },
      }),

      // Anonymize wins (keep for historical record)
      prisma.win.updateMany({
        where: { userId },
        data: { userId: null },
      }),

      // Anonymize the winner's PLAINTEXT name + email stored on draw logs. DrawLog
      // keeps these as non-null scalars (winnerUserId has no FK, so nothing cascades
      // or nulls them), which would otherwise leave full PII behind after a "right to
      // be forgotten" deletion (UK GDPR Art. 17). Keep the draw record for audit, but
      // strip the identifying fields.
      prisma.drawLog.updateMany({
        where: { winnerUserId: userId },
        data: { winnerName: '[deleted]', winnerEmail: '[deleted]' },
      }),

      // Finally, delete the user
      prisma.user.delete({ where: { id: userId } }),
    ]);

    // Sign out the user
    await signOut({ redirect: false });

    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { success: false, error: 'Failed to delete account. Please try again.' };
  }
}
