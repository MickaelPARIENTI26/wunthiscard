'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50).trim(),
  lastName: z.string().min(1, 'Last name is required').max(50).trim(),
  phone: z.string().max(20).optional(),
  dateOfBirth: z.string().optional(),
});

type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export async function updateProfile(
  data: UpdateProfileInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: 'You must be logged in to update your profile' };
    }

    // Validate input
    const validationResult = updateProfileSchema.safeParse(data);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.errors[0]?.message };
    }

    const { firstName, lastName, phone, dateOfBirth } = validationResult.data;

    // Parse date of birth if provided
    let parsedDateOfBirth: Date | null = null;
    if (dateOfBirth) {
      parsedDateOfBirth = new Date(dateOfBirth);

      // Validate age (must be 18+)
      const today = new Date();
      const age = today.getFullYear() - parsedDateOfBirth.getFullYear();
      const monthDiff = today.getMonth() - parsedDateOfBirth.getMonth();
      const dayDiff = today.getDate() - parsedDateOfBirth.getDate();

      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

      if (actualAge < 18) {
        return { success: false, error: 'You must be 18 or older to participate in competitions' };
      }
    }

    // Update user in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        phone: phone ? phone : null,
        dateOfBirth: parsedDateOfBirth,
      },
    });

    // Log the action for audit purposes
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PROFILE_UPDATED',
        entity: 'user',
        entityId: session.user.id,
        metadata: {
          updatedFields: ['firstName', 'lastName', 'phone', 'dateOfBirth'].filter(
            (field) => data[field as keyof UpdateProfileInput] !== undefined
          ),
        },
      },
    });

    revalidatePath('/profile');

    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: 'Failed to update profile. Please try again.' };
  }
}
