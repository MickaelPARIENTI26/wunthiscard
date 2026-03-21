'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { addAddress } from './actions';

const addressSchema = z.object({
  label: z.string().max(50).optional(),
  line1: z.string().min(1, 'Address line 1 is required').max(100),
  line2: z.string().max(100).optional(),
  city: z.string().min(1, 'City is required').max(50),
  postcode: z.string().min(1, 'Postcode / ZIP is required').max(15),
  country: z.string().min(1, 'Country is required'),
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
      postcode: '',
      country: 'GB',
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
        postcode: data.postcode.toUpperCase(),
        country: data.country,
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
      <Button
        variant="outline"
        onClick={() => setIsExpanded(true)}
        className="w-full gap-2 border-dashed"
      >
        <Plus className="h-4 w-4" />
        Add New Address
      </Button>
    );
  }

  return (
    <div
      className="rounded-lg border p-4 space-y-4"
      style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          New Address
        </h4>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => {
            reset();
            setIsExpanded(false);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {/* Label */}
        <div className="space-y-1.5">
          <Label htmlFor="label" className="text-xs">Label (optional)</Label>
          <Input
            id="label"
            placeholder="e.g., Home, Office"
            {...register('label')}
          />
        </div>

        {/* Address Line 1 */}
        <div className="space-y-1.5">
          <Label htmlFor="line1" className="text-xs">Address Line 1</Label>
          <Input
            id="line1"
            placeholder="Street address"
            {...register('line1')}
            aria-invalid={!!errors.line1}
          />
          {errors.line1 && (
            <p className="text-xs text-destructive">{errors.line1.message}</p>
          )}
        </div>

        {/* Address Line 2 */}
        <div className="space-y-1.5">
          <Label htmlFor="line2" className="text-xs">Address Line 2 (optional)</Label>
          <Input
            id="line2"
            placeholder="Apartment, suite, unit, etc."
            {...register('line2')}
          />
        </div>

        {/* City and Postcode */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-xs">City</Label>
            <Input
              id="city"
              placeholder="City"
              {...register('city')}
              aria-invalid={!!errors.city}
            />
            {errors.city && (
              <p className="text-xs text-destructive">{errors.city.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="postcode" className="text-xs">Postcode / ZIP</Label>
            <Input
              id="postcode"
              placeholder="e.g., SW1A 1AA"
              {...register('postcode')}
              aria-invalid={!!errors.postcode}
            />
            {errors.postcode && (
              <p className="text-xs text-destructive">{errors.postcode.message}</p>
            )}
          </div>
        </div>

        {/* Country */}
        <div className="space-y-1.5">
          <Label htmlFor="country" className="text-xs">Country</Label>
          <select
            id="country"
            {...register('country')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Select a country</option>
            <option value="GB">United Kingdom</option>
            <option value="FR">France</option>
            <option value="DE">Germany</option>
            <option value="ES">Spain</option>
            <option value="IT">Italy</option>
            <option value="NL">Netherlands</option>
            <option value="BE">Belgium</option>
            <option value="PT">Portugal</option>
            <option value="IE">Ireland</option>
            <option value="AT">Austria</option>
            <option value="CH">Switzerland</option>
            <option value="SE">Sweden</option>
            <option value="DK">Denmark</option>
            <option value="NO">Norway</option>
            <option value="FI">Finland</option>
            <option value="PL">Poland</option>
            <option value="CZ">Czech Republic</option>
            <option value="GR">Greece</option>
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
            <option value="JP">Japan</option>
          </select>
          {errors.country && (
            <p className="text-xs text-destructive">{errors.country.message}</p>
          )}
        </div>

        {/* Set as default */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isDefault"
            checked={isDefault}
            onCheckedChange={(checked) => setValue('isDefault', checked === true)}
          />
          <Label htmlFor="isDefault" className="cursor-pointer text-xs font-normal">
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
            role="alert"
          >
            {message.text}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              reset();
              setIsExpanded(false);
            }}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Address
          </Button>
        </div>
      </form>
    </div>
  );
}
