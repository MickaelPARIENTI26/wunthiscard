'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Loader2, X } from 'lucide-react';
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
        label: data.label ?? undefined,
        line1: data.line1,
        line2: data.line2 ?? undefined,
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
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        style={{
          width: '100%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '14px',
          background: 'var(--surface)',
          color: 'var(--ink)',
          border: '1.5px dashed var(--ink)',
          borderRadius: '10px',
          fontFamily: 'var(--mono)',
          fontSize: '11px',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        className="hover:shadow-[var(--shadow-sm)]"
      >
        <Plus className="h-4 w-4" />
        Add new address
      </button>
    );
  }

  return (
    <div
      style={{
        padding: '18px',
        background: 'var(--bg-2)',
        border: '1.5px solid var(--ink)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '10px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
              fontWeight: 700,
            }}
          >
            New address
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            reset();
            setIsExpanded(false);
          }}
          aria-label="Cancel"
          style={{
            width: '28px',
            height: '28px',
            display: 'grid',
            placeItems: 'center',
            background: 'var(--surface)',
            border: '1.5px solid var(--ink)',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="billing-grid">
          <div className="field billing-full">
            <label className="field-label" htmlFor="label">
              Label (optional)
            </label>
            <input id="label" className="input" placeholder="e.g., Home, Office" {...register('label')} />
          </div>

          <div className="field billing-full">
            <label className="field-label" htmlFor="line1">
              Address line 1
            </label>
            <input
              id="line1"
              className={`input ${errors.line1 ? 'input-error' : ''}`}
              placeholder="Street address"
              {...register('line1')}
            />
            {errors.line1 && <span className="field-error">{errors.line1.message}</span>}
          </div>

          <div className="field billing-full">
            <label className="field-label" htmlFor="line2">
              Address line 2 (optional)
            </label>
            <input
              id="line2"
              className="input"
              placeholder="Apartment, suite, unit"
              {...register('line2')}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="city">
              City
            </label>
            <input
              id="city"
              className={`input ${errors.city ? 'input-error' : ''}`}
              {...register('city')}
            />
            {errors.city && <span className="field-error">{errors.city.message}</span>}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="postcode">
              Postcode / ZIP
            </label>
            <input
              id="postcode"
              className={`input ${errors.postcode ? 'input-error' : ''}`}
              placeholder="e.g., SW1A 1AA"
              {...register('postcode')}
            />
            {errors.postcode && <span className="field-error">{errors.postcode.message}</span>}
          </div>

          <div className="field billing-full">
            <label className="field-label" htmlFor="country">
              Country
            </label>
            <select id="country" className="select" {...register('country')}>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.country && <span className="field-error">{errors.country.message}</span>}
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

        {message && (
          <div
            style={{
              marginTop: '14px',
              padding: '10px 14px',
              background: message.type === 'success' ? 'var(--accent)' : 'var(--hot)',
              color: message.type === 'success' ? 'var(--ink)' : '#fff',
              border: '1.5px solid var(--ink)',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: 'var(--shadow-sm)',
            }}
            role="alert"
          >
            {message.text}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            marginTop: '16px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              reset();
              setIsExpanded(false);
            }}
            className="btn btn-ghost"
          >
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
                Adding...
              </>
            ) : (
              <>Add address →</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
