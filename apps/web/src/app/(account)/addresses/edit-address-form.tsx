'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { updateAddress } from './actions';

const addressSchema = z.object({
  label: z.string().max(50).optional(),
  line1: z.string().min(1, 'Address line 1 is required').max(100),
  line2: z.string().max(100).optional(),
  city: z.string().min(1, 'City is required').max(50),
  postcode: z.string().min(1, 'Postcode / ZIP is required').max(15),
  country: z.string().min(1).default('GB'),
  isDefault: z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressSchema>;

const COUNTRIES: { code: string; name: string }[] = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IE', name: 'Ireland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'PT', name: 'Portugal' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'DK', name: 'Denmark' },
  { code: 'NO', name: 'Norway' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'GR', name: 'Greece' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' },
];

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
      postcode: address.postcode,
      country: address.country,
      isDefault: address.isDefault,
    },
  });

  const isDefault = watch('isDefault');

  const onSubmit = async (data: AddressFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateAddress(address.id, {
        label: data.label ?? undefined,
        line1: data.line1,
        line2: data.line2 ?? undefined,
        city: data.city,
        postcode: data.postcode,
        country: data.country,
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="billing-grid">
        <div className="field billing-full">
          <label className="field-label" htmlFor="edit-label">
            Label (optional)
          </label>
          <input
            id="edit-label"
            className="input"
            placeholder="e.g., Home, Office"
            {...register('label')}
          />
        </div>

        <div className="field billing-full">
          <label className="field-label" htmlFor="edit-line1">
            Address line 1
          </label>
          <input
            id="edit-line1"
            className={`input ${errors.line1 ? 'input-error' : ''}`}
            placeholder="Street address"
            {...register('line1')}
          />
          {errors.line1 && <span className="field-error">{errors.line1.message}</span>}
        </div>

        <div className="field billing-full">
          <label className="field-label" htmlFor="edit-line2">
            Address line 2 (optional)
          </label>
          <input
            id="edit-line2"
            className="input"
            placeholder="Apartment, suite, unit"
            {...register('line2')}
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="edit-city">
            City
          </label>
          <input
            id="edit-city"
            className={`input ${errors.city ? 'input-error' : ''}`}
            {...register('city')}
          />
          {errors.city && <span className="field-error">{errors.city.message}</span>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="edit-postcode">
            Postcode / ZIP
          </label>
          <input
            id="edit-postcode"
            className={`input ${errors.postcode ? 'input-error' : ''}`}
            placeholder="e.g., SW1A 1AA"
            {...register('postcode')}
          />
          {errors.postcode && <span className="field-error">{errors.postcode.message}</span>}
        </div>

        <div className="field billing-full">
          <label className="field-label" htmlFor="edit-country">
            Country
          </label>
          <select id="edit-country" className="select" {...register('country')}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="check-row" style={{ marginTop: '12px' }}>
        <input
          type="checkbox"
          className="checkbox"
          checked={isDefault}
          onChange={(e) => setValue('isDefault', e.target.checked)}
        />
        <span>Set as default delivery address</span>
      </label>

      {error && (
        <div
          style={{
            marginTop: '14px',
            padding: '10px 14px',
            background: 'var(--hot)',
            color: '#fff',
            border: '1.5px solid var(--ink)',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: 'var(--shadow-sm)',
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
        <button type="button" onClick={onCancel} className="btn btn-ghost">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`btn ${isSubmitting ? 'btn-mute' : 'btn-primary'}`}
        >
          {isSubmitting ? (
            <>
              <Loader2
                className="h-4 w-4 animate-spin"
                style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }}
              />
              Saving...
            </>
          ) : (
            <>Save changes →</>
          )}
        </button>
      </div>
    </form>
  );
}
