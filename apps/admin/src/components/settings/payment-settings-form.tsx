'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, CreditCard, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function PaymentSettingsForm() {
  // Stripe mode is determined by environment variable prefix (pk_live_ vs pk_test_)
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
  const isLiveMode = publishableKey.startsWith('pk_live_');
  const isConfigured = publishableKey.length > 0;

  return (
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
                Payment gateway configuration status
              </CardDescription>
            </div>
            <Badge variant={isLiveMode ? 'success' : 'warning'}>
              {isLiveMode ? 'Live Mode' : 'Test Mode'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Security Notice</AlertTitle>
            <AlertDescription>
              Stripe API keys are configured via environment variables for security.
              Keys should never be stored in the database.
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Publishable Key</span>
              <Badge variant={isConfigured ? 'success' : 'destructive'}>
                {isConfigured ? 'Configured' : 'Not Set'}
              </Badge>
            </div>
            {isConfigured && (
              <p className="text-xs text-muted-foreground font-mono">
                {publishableKey.substring(0, 12)}...
              </p>
            )}
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Secret Key</span>
              <Badge variant="outline">
                Environment Variable
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Set via <code className="bg-muted px-1 rounded">STRIPE_SECRET_KEY</code>
            </p>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Webhook Secret</span>
              <Badge variant="outline">
                Environment Variable
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Set via <code className="bg-muted px-1 rounded">STRIPE_WEBHOOK_SECRET</code>
            </p>
          </div>

          <Alert variant="default" className="bg-muted/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Environment Variables Required</AlertTitle>
            <AlertDescription className="text-sm">
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li><code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> - Public key (pk_...)</li>
                <li><code>STRIPE_SECRET_KEY</code> - Secret key (sk_...)</li>
                <li><code>STRIPE_WEBHOOK_SECRET</code> - Webhook secret (whsec_...)</li>
              </ul>
            </AlertDescription>
          </Alert>

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
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Currency</span>
              <Badge variant="outline">GBP</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Currency is fixed to GBP (British Pounds) for UK compliance
            </p>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Currency Symbol</span>
              <Badge variant="outline">&pound;</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
