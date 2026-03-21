'use client';

import { useState } from 'react';
import { MapPin, Star, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { deleteAddress, setDefaultAddress } from './actions';
import { EditAddressForm } from './edit-address-form';

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

const COUNTRY_NAMES: Record<string, string> = {
  GB: 'United Kingdom',
  FR: 'France',
  DE: 'Germany',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'Netherlands',
  BE: 'Belgium',
  PT: 'Portugal',
  IE: 'Ireland',
  AT: 'Austria',
  CH: 'Switzerland',
  SE: 'Sweden',
  DK: 'Denmark',
  NO: 'Norway',
  FI: 'Finland',
  PL: 'Poland',
  CZ: 'Czech Republic',
  GR: 'Greece',
  US: 'United States',
  CA: 'Canada',
  AU: 'Australia',
  JP: 'Japan',
};

interface AddressListProps {
  addresses: Address[];
}

export function AddressList({ addresses }: AddressListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editAddress, setEditAddress] = useState<Address | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingDefault, setIsSettingDefault] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await deleteAddress(deleteId);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setIsSettingDefault(id);
    try {
      await setDefaultAddress(id);
    } finally {
      setIsSettingDefault(null);
    }
  };

  if (addresses.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-3">
        {addresses.map((address) => (
          <div
            key={address.id}
            className="rounded-lg border p-4"
            style={{
              borderColor: address.isDefault ? 'rgba(240, 185, 11, 0.3)' : 'var(--border-subtle)',
              background: address.isDefault ? 'rgba(240, 185, 11, 0.03)' : 'transparent',
            }}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {address.label ?? 'Address'}
                </span>
                {address.isDefault && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Star className="h-3 w-3" />
                    Default
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setEditAddress(address)}
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(address.id)}
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="space-y-0.5 text-sm text-muted-foreground">
              <p>{address.line1}</p>
              {address.line2 && <p>{address.line2}</p>}
              <p>{address.city}, {address.postcode}</p>
              <p>{COUNTRY_NAMES[address.country] ?? address.country}</p>
            </div>

            {!address.isDefault && (
              <Button
                variant="link"
                size="sm"
                className="mt-2 h-auto p-0 text-xs"
                onClick={() => handleSetDefault(address.id)}
                disabled={isSettingDefault === address.id}
              >
                {isSettingDefault === address.id ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Star className="mr-1 h-3 w-3" />
                )}
                Set as default
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Address</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit address dialog */}
      <Dialog open={!!editAddress} onOpenChange={() => setEditAddress(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
            <DialogDescription>
              Update your delivery address details.
            </DialogDescription>
          </DialogHeader>
          {editAddress && (
            <EditAddressForm
              address={editAddress}
              onSuccess={() => setEditAddress(null)}
              onCancel={() => setEditAddress(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
