'use client';

import { useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { updateSettings } from '@/app/dashboard/settings/actions';
import { Loader2, Save, ExternalLink, CreditCard } from 'lucide-react';

interface PaymentSettingsFormProps {
  settings: Record<string, string>;
}

export function PaymentSettingsForm({ settings }: PaymentSettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateSettings(formData);
    });
  }

  const isLiveMode = settings.stripeMode === 'live';

  return (
    <form action={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Stripe Configuration
                </CardTitle>
                <CardDescription>
                  Configure your Stripe payment gateway settings
                </CardDescription>
              </div>
              <Badge variant={isLiveMode ? 'success' : 'warning'}>
                {isLiveMode ? 'Live Mode' : 'Test Mode'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Live Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enable live mode to process real payments
                </p>
              </div>
              <Switch
                name="stripeMode"
                defaultChecked={isLiveMode}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stripePublishableKey">Publishable Key</Label>
              <Input
                id="stripePublishableKey"
                name="stripePublishableKey"
                type="password"
                defaultValue={settings.stripePublishableKey ?? ''}
                placeholder="pk_test_..."
              />
              <p className="text-xs text-muted-foreground">
                Your Stripe publishable key (starts with pk_)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stripeSecretKey">Secret Key</Label>
              <Input
                id="stripeSecretKey"
                name="stripeSecretKey"
                type="password"
                defaultValue={settings.stripeSecretKey ?? ''}
                placeholder="sk_test_..."
              />
              <p className="text-xs text-muted-foreground">
                Your Stripe secret key (starts with sk_). Never share this publicly.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stripeWebhookSecret">Webhook Secret</Label>
              <Input
                id="stripeWebhookSecret"
                name="stripeWebhookSecret"
                type="password"
                defaultValue={settings.stripeWebhookSecret ?? ''}
                placeholder="whsec_..."
              />
              <p className="text-xs text-muted-foreground">
                Your Stripe webhook signing secret (starts with whsec_)
              </p>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium mb-2">Important Notes:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Use test keys during development (pk_test_, sk_test_)</li>
                <li>Switch to live keys only when ready for production</li>
                <li>Set up webhooks in your Stripe dashboard for payment events</li>
              </ul>
            </div>

            <Button variant="outline" asChild>
              <a
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Stripe Dashboard
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Currency Settings</CardTitle>
            <CardDescription>
              Payment currency configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                name="currency"
                defaultValue={settings.currency ?? 'GBP'}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Currency is fixed to GBP (British Pounds) for UK compliance
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currencySymbol">Currency Symbol</Label>
              <Input
                id="currencySymbol"
                name="currencySymbol"
                defaultValue={settings.currencySymbol ?? '£'}
                disabled
              />
            </div>
          </CardContent>
        </Card>

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
      </div>
    </form>
  );
}
