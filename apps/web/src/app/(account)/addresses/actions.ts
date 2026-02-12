'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// UK postcode regex pattern
const ukPostcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

const addressSchema = z.object({
  label: z.string().max(50).optional(),
  line1: z.string().min(1, 'Address line 1 is required').max(100),
  line2: z.string().max(100).optional(),
  city: z.string().min(1, 'City is required').max(50),
  county: z.string().max(50).optional(),
  postcode: z
    .string()
    .min(1, 'Postcode is required')
    .max(10)
    .regex(ukPostcodeRegex, 'Please enter a valid UK postcode'),
  country: z.string().default('GB'),
  isDefault: z.boolean().default(false),
});

type AddressInput = z.infer<typeof addressSchema>;

export async function addAddress(
  data: AddressInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: 'You must be logged in to add an address' };
    }

    // Validate input
    const validationResult = addressSchema.safeParse(data);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.errors[0]?.message };
    }

    const { label, line1, line2, city, county, postcode, country, isDefault } = validationResult.data;

    // If setting as default, unset any existing default
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    // Create the new address
    await prisma.address.create({
      data: {
        userId: session.user.id,
        label: label ? label : null,
        line1,
        line2: line2 ? line2 : null,
        city,
        county: county ? county : null,
        postcode: postcode.toUpperCase(),
        country,
        isDefault,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADDRESS_ADDED',
        entity: 'address',
        metadata: { city, postcode: postcode.toUpperCase() },
      },
    });

    revalidatePath('/addresses');

    return { success: true };
  } catch (error) {
    console.error('Error adding address:', error);
    return { success: false, error: 'Failed to add address. Please try again.' };
  }
}

export async function updateAddress(
  addressId: string,
  data: AddressInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: 'You must be logged in to update an address' };
    }

    // Validate input
    const validationResult = addressSchema.safeParse(data);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.errors[0]?.message };
    }

    // Verify the address belongs to the user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: session.user.id,
      },
    });

    if (!existingAddress) {
      return { success: false, error: 'Address not found' };
    }

    const { label, line1, line2, city, county, postcode, country, isDefault } = validationResult.data;

    // If setting as default, unset any existing default
    if (isDefault && !existingAddress.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    // Update the address
    await prisma.address.update({
      where: { id: addressId },
      data: {
        label: label ? label : null,
        line1,
        line2: line2 ? line2 : null,
        city,
        county: county ? county : null,
        postcode: postcode.toUpperCase(),
        country,
        isDefault,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADDRESS_UPDATED',
        entity: 'address',
        entityId: addressId,
        metadata: { city, postcode: postcode.toUpperCase() },
      },
    });

    revalidatePath('/addresses');

    return { success: true };
  } catch (error) {
    console.error('Error updating address:', error);
    return { success: false, error: 'Failed to update address. Please try again.' };
  }
}

export async function deleteAddress(
  addressId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: 'You must be logged in to delete an address' };
    }

    // Verify the address belongs to the user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: session.user.id,
      },
    });

    if (!existingAddress) {
      return { success: false, error: 'Address not found' };
    }

    // Delete the address
    await prisma.address.delete({
      where: { id: addressId },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADDRESS_DELETED',
        entity: 'address',
        entityId: addressId,
      },
    });

    revalidatePath('/addresses');

    return { success: true };
  } catch (error) {
    console.error('Error deleting address:', error);
    return { success: false, error: 'Failed to delete address. Please try again.' };
  }
}

export async function setDefaultAddress(
  addressId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: 'You must be logged in to set a default address' };
    }

    // Verify the address belongs to the user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: session.user.id,
      },
    });

    if (!existingAddress) {
      return { success: false, error: 'Address not found' };
    }

    // Unset any existing default
    await prisma.address.updateMany({
      where: {
        userId: session.user.id,
        isDefault: true,
      },
      data: { isDefault: false },
    });

    // Set the new default
    await prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADDRESS_SET_DEFAULT',
        entity: 'address',
        entityId: addressId,
      },
    });

    revalidatePath('/addresses');

    return { success: true };
  } catch (error) {
    console.error('Error setting default address:', error);
    return { success: false, error: 'Failed to set default address. Please try again.' };
  }
}
