'use client';

import { useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateSettings } from '@/app/dashboard/settings/actions';
import { Loader2, Save } from 'lucide-react';

interface CompanySettingsFormProps {
  settings: Record<string, string>;
}

export function CompanySettingsForm({ settings }: CompanySettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateSettings(formData);
    });
  }

  return (
    <form action={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Basic company details displayed across the website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                name="companyName"
                defaultValue={settings.companyName ?? 'WinThisCard'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Support Email</Label>
              <Input
                id="companyEmail"
                name="companyEmail"
                type="email"
                defaultValue={settings.companyEmail ?? ''}
                placeholder="support@winthiscard.com"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Phone Number</Label>
              <Input
                id="companyPhone"
                name="companyPhone"
                type="tel"
                defaultValue={settings.companyPhone ?? ''}
                placeholder="+44 20 1234 5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyRegistration">Company Registration</Label>
              <Input
                id="companyRegistration"
                name="companyRegistration"
                defaultValue={settings.companyRegistration ?? ''}
                placeholder="Company number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyAddress">Address</Label>
            <Textarea
              id="companyAddress"
              name="companyAddress"
              defaultValue={settings.companyAddress ?? ''}
              placeholder="Full business address"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyTagline">Tagline</Label>
            <Input
              id="companyTagline"
              name="companyTagline"
              defaultValue={settings.companyTagline ?? ''}
              placeholder="Win premium collectible cards for just £2.99"
            />
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
