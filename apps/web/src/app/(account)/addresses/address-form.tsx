'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { addAddress } from './actions';

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

export function AddressForm() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: '',
      line1: '',
      line2: '',
      city: '',
      county: '',
      postcode: '',
      isDefault: false,
    },
  });

  const isDefault = watch('isDefault');

  const onSubmit = async (data: AddressFormData) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await addAddress({
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
        setMessage({ type: 'success', text: 'Address added successfully' });
        reset();
        setIsExpanded(false);
      } else {
        setMessage({ type: 'error', text: result.error ?? 'Failed to add address' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isExpanded) {
    return (
      <Button onClick={() => setIsExpanded(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add New Address
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Address</CardTitle>
        <CardDescription>
          Add a delivery address for your prizes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label">Label (optional)</Label>
            <Input
              id="label"
              placeholder="e.g., Home, Office"
              {...register('label')}
            />
          </div>

          {/* Address Line 1 */}
          <div className="space-y-2">
            <Label htmlFor="line1">Address Line 1</Label>
            <Input
              id="line1"
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
            <Label htmlFor="line2">Address Line 2 (optional)</Label>
            <Input
              id="line2"
              placeholder="Apartment, suite, unit, etc."
              {...register('line2')}
            />
          </div>

          {/* City and County */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="City"
                {...register('city')}
                aria-invalid={!!errors.city}
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="county">County (optional)</Label>
              <Input
                id="county"
                placeholder="County"
                {...register('county')}
              />
            </div>
          </div>

          {/* Postcode */}
          <div className="space-y-2">
            <Label htmlFor="postcode">Postcode</Label>
            <Input
              id="postcode"
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
              id="isDefault"
              checked={isDefault}
              onCheckedChange={(checked) => setValue('isDefault', checked === true)}
            />
            <Label htmlFor="isDefault" className="cursor-pointer text-sm font-normal">
              Set as default delivery address
            </Label>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`rounded-md p-3 text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setIsExpanded(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Address
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
