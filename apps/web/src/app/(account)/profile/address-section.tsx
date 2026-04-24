'use client';

import { MapPin } from 'lucide-react';
import { AddressList } from '../addresses/address-list';
import { AddressForm } from '../addresses/address-form';

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

interface AddressSectionProps {
  addresses: Address[];
}

export function AddressSection({ addresses }: AddressSectionProps) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1.5px solid var(--ink)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        padding: '28px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          paddingBottom: '20px',
          marginBottom: '24px',
          borderBottom: '1.5px dashed var(--line-2)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '1.5px solid var(--ink)',
            borderRadius: '12px',
            background: 'var(--warn)',
            boxShadow: '3px 3px 0 var(--ink)',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <MapPin className="h-5 w-5" style={{ color: 'var(--ink)' }} />
        </div>
        <div>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '10px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
              fontWeight: 700,
              marginBottom: '4px',
            }}
          >
            Where we ship
          </div>
          <h2
            style={{
              fontFamily: 'var(--display)',
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              marginBottom: '4px',
            }}
          >
            Delivery addresses
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-dim)' }}>
            {addresses.length === 0
              ? 'Add an address for prize delivery'
              : `${addresses.length} address${addresses.length > 1 ? 'es' : ''} saved`}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <AddressList addresses={addresses} />
        <AddressForm />
      </div>
    </div>
  );
}
