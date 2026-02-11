'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { cancelCompetition } from '../actions';
import { formatPrice } from '@winthiscard/shared';

interface CancelCompetitionDialogProps {
  competitionId: string;
  competitionTitle: string;
  orderCount: number;
  totalRevenue: number;
}

export function CancelCompetitionDialog({
  competitionId,
  competitionTitle,
  orderCount,
  totalRevenue,
}: CancelCompetitionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    refundedCount?: number;
    refundedAmount?: number;
  } | null>(null);

  const handleCancel = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await cancelCompetition(competitionId, reason);

      if (response.success) {
        setResult({
          refundedCount: response.refundedCount,
          refundedAmount: response.refundedAmount,
        });
        router.refresh();
        // Keep dialog open briefly to show result, then close
        setTimeout(() => {
          setOpen(false);
        }, 2000);
      } else {
        setError(response.error || 'Failed to cancel competition');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <XCircle className="h-4 w-4" />
          Cancel Competition
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancel Competition
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                You are about to cancel <strong>{competitionTitle}</strong>.
              </p>

              {orderCount > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Refunds Required</AlertTitle>
                  <AlertDescription>
                    This will refund <strong>{orderCount}</strong> order(s) totaling{' '}
                    <strong>{formatPrice(totalRevenue)}</strong>.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Cancellation</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Prize no longer available, insufficient ticket sales..."
                  rows={3}
                  disabled={isLoading || !!result}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {result && (
                <Alert className="border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200">
                  <AlertTitle>Competition Cancelled</AlertTitle>
                  <AlertDescription>
                    {result.refundedCount && result.refundedCount > 0
                      ? `Successfully refunded ${result.refundedCount} order(s) totaling ${formatPrice(result.refundedAmount || 0)}.`
                      : 'Competition has been cancelled.'}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleCancel();
            }}
            disabled={isLoading || !!result}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : result ? (
              'Done'
            ) : (
              'Cancel Competition & Refund'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
