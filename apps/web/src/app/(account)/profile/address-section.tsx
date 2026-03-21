'use client';

import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <MapPin className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-lg">Delivery Addresses</CardTitle>
            <p className="text-sm text-muted-foreground">
              {addresses.length === 0
                ? 'Add an address for prize delivery'
                : `${addresses.length} address${addresses.length > 1 ? 'es' : ''} saved`}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <AddressList addresses={addresses} />
        <AddressForm />
      </CardContent>
    </Card>
  );
}
