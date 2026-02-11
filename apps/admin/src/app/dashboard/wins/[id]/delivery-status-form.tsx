'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Package, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { updateDeliveryStatus } from './actions';

type DeliveryStatus = 'PENDING' | 'CLAIMED' | 'SHIPPED' | 'DELIVERED';

interface DeliveryStatusFormProps {
  winId: string;
  currentStatus: DeliveryStatus;
  claimedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippingCarrier: string | null;
  notes: string | null;
}

const SHIPPING_CARRIERS = [
  'Royal Mail',
  'Royal Mail Special Delivery',
  'DHL',
  'DHL Express',
  'FedEx',
  'UPS',
  'Hermes/Evri',
  'DPD',
  'Parcelforce',
  'Other',
];

export function DeliveryStatusForm({
  winId,
  currentStatus,
  claimedAt: _claimedAt,
  shippedAt: _shippedAt,
  deliveredAt: _deliveredAt,
  trackingNumber,
  trackingUrl,
  shippingCarrier,
  notes,
}: DeliveryStatusFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    trackingNumber: trackingNumber || '',
    trackingUrl: trackingUrl || '',
    shippingCarrier: shippingCarrier || '',
    notes: notes || '',
  });

  const handleStatusUpdate = async (newStatus: DeliveryStatus) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateDeliveryStatus({
        winId,
        status: newStatus,
        trackingNumber: formData.trackingNumber || undefined,
        trackingUrl: formData.trackingUrl || undefined,
        shippingCarrier: formData.shippingCarrier || undefined,
        notes: formData.notes || undefined,
      });

      if (result.success) {
        setSuccess(`Status updated to ${newStatus.toLowerCase()}`);
        router.refresh();
      } else {
        setError(result.error || 'Failed to update status');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotesUpdate = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateDeliveryStatus({
        winId,
        notes: formData.notes || undefined,
      });

      if (result.success) {
        setSuccess('Notes updated');
        router.refresh();
      } else {
        setError(result.error || 'Failed to update notes');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Status Update Buttons */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Update Status</h4>

        <div className="flex flex-wrap gap-3">
          {currentStatus === 'PENDING' && (
            <Button
              onClick={() => handleStatusUpdate('CLAIMED')}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Package className="h-4 w-4" />
              )}
              Mark as Claimed
            </Button>
          )}

          {(currentStatus === 'PENDING' || currentStatus === 'CLAIMED') && (
            <>
              {/* Shipping Details */}
              <div className="w-full grid gap-4 sm:grid-cols-3 rounded-lg border p-4">
                <div className="space-y-2">
                  <Label htmlFor="shippingCarrier">Shipping Carrier</Label>
                  <Select
                    value={formData.shippingCarrier}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, shippingCarrier: value }))
                    }
                  >
                    <SelectTrigger id="shippingCarrier">
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIPPING_CARRIERS.map((carrier) => (
                        <SelectItem key={carrier} value={carrier}>
                          {carrier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trackingNumber">Tracking Number</Label>
                  <Input
                    id="trackingNumber"
                    value={formData.trackingNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, trackingNumber: e.target.value }))
                    }
                    placeholder="e.g., AB123456789GB"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trackingUrl">Tracking URL (optional)</Label>
                  <Input
                    id="trackingUrl"
                    type="url"
                    value={formData.trackingUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, trackingUrl: e.target.value }))
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

              <Button
                onClick={() => handleStatusUpdate('SHIPPED')}
                disabled={isLoading || !formData.shippingCarrier || !formData.trackingNumber}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Truck className="h-4 w-4" />
                )}
                Mark as Shipped
              </Button>
            </>
          )}

          {currentStatus === 'SHIPPED' && (
            <Button
              onClick={() => handleStatusUpdate('DELIVERED')}
              disabled={isLoading}
              variant="default"
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Mark as Delivered
            </Button>
          )}

          {currentStatus === 'DELIVERED' && (
            <p className="text-sm text-muted-foreground">
              This prize has been delivered. No further status updates available.
            </p>
          )}
        </div>
      </div>

      {/* Notes Section */}
      <div className="space-y-4 rounded-lg border p-4">
        <div className="space-y-2">
          <Label htmlFor="notes">Internal Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Add any notes about this delivery..."
            rows={3}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNotesUpdate}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Notes'}
        </Button>
      </div>
    </div>
  );
}
