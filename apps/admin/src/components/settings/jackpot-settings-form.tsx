'use client';

import { useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateSettings } from '@/app/dashboard/settings/actions';
import { Loader2, Save } from 'lucide-react';

export function JackpotSettingsForm({ settings }: { settings: { jackpotNotificationEmail?: string } }) {
  const [pending, start] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wheel Jackpot</CardTitle>
        <CardDescription>
          Where to send the alert when someone wins the graded card. The same alert
          also appears on the dashboard, so a missed email never means a missed winner.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={(fd) => start(() => void updateSettings(fd))} className="space-y-4">
          <div>
            <Label htmlFor="jackpotNotificationEmail">Notification email</Label>
            <Input
              id="jackpotNotificationEmail"
              name="jackpotNotificationEmail"
              type="email"
              defaultValue={settings.jackpotNotificationEmail ?? ''}
              placeholder="contact@winuprize.com"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Left empty, alerts go to contact@winuprize.com.
            </p>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
