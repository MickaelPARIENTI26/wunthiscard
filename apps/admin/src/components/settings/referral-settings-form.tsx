'use client';

import { useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateReferralSettings } from '@/app/dashboard/settings/actions';
import { Loader2, Save } from 'lucide-react';

interface ReferralSettingsFormProps {
  settings: Record<string, string>;
}

export function ReferralSettingsForm({ settings }: ReferralSettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const value = Number(formData.get('referralTicketsRequired'));
      if (value >= 1 && Number.isInteger(value)) {
        await updateReferralSettings(value);
      }
    });
  }

  return (
    <form action={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Referral Settings</CardTitle>
          <CardDescription>
            Configure the referral reward system. Referrers earn a free ticket after their
            referred users have collectively purchased the required number of tickets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm space-y-2">
            <Label htmlFor="referralTicketsRequired">
              Tickets required per free ticket
            </Label>
            <Input
              id="referralTicketsRequired"
              name="referralTicketsRequired"
              type="number"
              min={1}
              step={1}
              defaultValue={settings.referralTicketsRequired ?? '10'}
              placeholder="10"
            />
            <p className="text-xs text-muted-foreground">
              Number of tickets a referee must purchase before the referrer earns one free ticket.
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
