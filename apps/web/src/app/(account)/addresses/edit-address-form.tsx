'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { updateAddress } from './actions';

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
  isDefault: z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface Address {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  county: string | null;
  postcode: string;
  country: string;
  isDefault: boolean;
}

interface EditAddressFormProps {
  address: Address;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditAddressForm({ address, onSuccess, onCancel }: EditAddressFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: address.label ?? '',
      line1: address.line1,
      line2: address.line2 ?? '',
      city: address.city,
      county: address.county ?? '',
      postcode: address.postcode,
      isDefault: address.isDefault,
    },
  });

  const isDefault = watch('isDefault');

  const onSubmit = async (data: AddressFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateAddress(address.id, {
        label: data.label || undefined,
        line1: data.line1,
        line2: data.line2 || undefined,
        city: data.city,
        county: data.county || undefined,
        postcode: data.postcode.toUpperCase(),
        country: 'GB',
        isDefault: data.isDefault,
      });

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error ?? 'Failed to update address');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Label */}
      <div className="space-y-2">
        <Label htmlFor="edit-label">Label (optional)</Label>
        <Input
          id="edit-label"
          placeholder="e.g., Home, Office"
          {...register('label')}
        />
      </div>

      {/* Address Line 1 */}
      <div className="space-y-2">
        <Label htmlFor="edit-line1">Address Line 1</Label>
        <Input
          id="edit-line1"
          placeholder="Street address"
          {...register('line1')}
          aria-invalid={!!errors.line1}
        />
        {errors.line1 && (
          <p className="text-sm text-destructive">{errors.line1.message}</p>
        )}
      </div>

      {/* Address Line 2 */}
      <div className="space-y-2">
        <Label htmlFor="edit-line2">Address Line 2 (optional)</Label>
        <Input
          id="edit-line2"
          placeholder="Apartment, suite, unit, etc."
          {...register('line2')}
        />
      </div>

      {/* City and County */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edit-city">City</Label>
          <Input
            id="edit-city"
            placeholder="City"
            {...register('city')}
            aria-invalid={!!errors.city}
          />
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-county">County (optional)</Label>
          <Input
            id="edit-county"
            placeholder="County"
            {...register('county')}
          />
        </div>
      </div>

      {/* Postcode */}
      <div className="space-y-2">
        <Label htmlFor="edit-postcode">Postcode</Label>
        <Input
          id="edit-postcode"
          placeholder="e.g., SW1A 1AA"
          {...register('postcode')}
          aria-invalid={!!errors.postcode}
          className="uppercase"
        />
        {errors.postcode && (
          <p className="text-sm text-destructive">{errors.postcode.message}</p>
        )}
      </div>

      {/* Country (fixed to UK) */}
      <div className="space-y-2">
        <Label>Country</Label>
        <Input value="United Kingdom" disabled className="bg-muted" />
      </div>

      {/* Set as default */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="edit-isDefault"
          checked={isDefault}
          onCheckedChange={(checked) => setValue('isDefault', checked === true)}
        />
        <Label htmlFor="edit-isDefault" className="cursor-pointer text-sm font-normal">
          Set as default delivery address
        </Label>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
