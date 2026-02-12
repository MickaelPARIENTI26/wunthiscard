'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Gift, Ticket, AlertTriangle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatPrice, calculateBonusTickets } from '@winthiscard/shared/utils';

interface CheckoutSummaryProps {
  competitionId: string;
  competitionSlug: string;
  competitionTitle: string;
  competitionImage: string;
  ticketPrice: number;
  userEmail: string;
  userName: string;
}

export function CheckoutSummary({
  competitionId,
  competitionSlug,
  competitionTitle,
  competitionImage,
  ticketPrice,
  userEmail,
  userName,
}: CheckoutSummaryProps) {
  const router = useRouter();
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [hasPassedQcm, setHasPassedQcm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Retrieve selected tickets and QCM status from sessionStorage
    const storedTickets = sessionStorage.getItem(`tickets_${competitionId}`);
    const storedQcm = sessionStorage.getItem(`qcm_passed_${competitionId}`);

    if (storedTickets) {
      setSelectedTickets(JSON.parse(storedTickets));
    }
    if (storedQcm === 'true') {
      setHasPassedQcm(true);
    }

    setIsLoading(false);
  }, [competitionId]);

  // Redirect if no tickets selected or QCM not passed
  useEffect(() => {
    if (!isLoading && (selectedTickets.length === 0 || !hasPassedQcm)) {
      router.push(`/competitions/${competitionSlug}/tickets`);
    }
  }, [isLoading, selectedTickets, hasPassedQcm, competitionSlug, router]);

  if (isLoading || selectedTickets.length === 0 || !hasPassedQcm) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  const bonusTickets = calculateBonusTickets(selectedTickets.length);
  const totalTickets = selectedTickets.length + bonusTickets;
  const subtotal = selectedTickets.length * ticketPrice;
  const total = subtotal; // No additional fees for now

  return (
    <div className="space-y-6">
      {/* Competition Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
              <Image
                src={competitionImage}
                alt={competitionTitle}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="font-semibold">{competitionTitle}</h3>
              <p className="text-sm text-muted-foreground">
                {formatPrice(ticketPrice)} per ticket
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Tickets */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Selected Tickets</p>
                <p className="text-sm text-muted-foreground">
                  #{selectedTickets.sort((a, b) => a - b).join(', #')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">{selectedTickets.length}</p>
              <p className="text-sm text-muted-foreground">
                {formatPrice(subtotal)}
              </p>
            </div>
          </div>

          {/* Bonus Tickets */}
          {bonusTickets > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-700 dark:text-green-400">
                  Bonus Tickets
                </span>
              </div>
              <span className="font-medium text-green-700 dark:text-green-400">
                +{bonusTickets} FREE
              </span>
            </div>
          )}

          <Separator />

          {/* Total */}
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Total tickets: {totalTickets} ({selectedTickets.length} purchased
            {bonusTickets > 0 && ` + ${bonusTickets} bonus`})
          </p>
        </CardContent>
      </Card>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Details</CardTitle>
          <CardDescription>
            Tickets will be assigned to this account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>{userName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{userEmail}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase 3 Notice */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Payment Coming Soon
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Stripe payment integration will be implemented in Phase 3.
                For now, this is where the checkout flow ends.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pay Button (disabled for Phase 2) */}
      <Button size="lg" className="w-full" disabled>
        <Lock className="mr-2 h-4 w-4" />
        Pay {formatPrice(total)} (Coming in Phase 3)
      </Button>

      {/* Security Notice */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span>Payments secured by Stripe</span>
      </div>

      {/* Back Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => router.push(`/competitions/${competitionSlug}`)}
      >
        Back to Competition
      </Button>
    </div>
  );
}
