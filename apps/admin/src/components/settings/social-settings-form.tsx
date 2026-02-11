'use client';

import { useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateSettings } from '@/app/dashboard/settings/actions';
import { Loader2, Save, Instagram, Youtube, Twitter } from 'lucide-react';

interface SocialSettingsFormProps {
  settings: Record<string, string>;
}

export function SocialSettingsForm({ settings }: SocialSettingsFormProps) {
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
          <CardTitle>Social Media Links</CardTitle>
          <CardDescription>
            Connect your social media accounts to display in the footer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="socialInstagram" className="flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              Instagram
            </Label>
            <Input
              id="socialInstagram"
              name="socialInstagram"
              type="url"
              defaultValue={settings.socialInstagram ?? ''}
              placeholder="https://instagram.com/winthiscard"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="socialTwitter" className="flex items-center gap-2">
              <Twitter className="h-4 w-4" />
              Twitter / X
            </Label>
            <Input
              id="socialTwitter"
              name="socialTwitter"
              type="url"
              defaultValue={settings.socialTwitter ?? ''}
              placeholder="https://twitter.com/winthiscard"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="socialYoutube" className="flex items-center gap-2">
              <Youtube className="h-4 w-4" />
              YouTube
            </Label>
            <Input
              id="socialYoutube"
              name="socialYoutube"
              type="url"
              defaultValue={settings.socialYoutube ?? ''}
              placeholder="https://youtube.com/@winthiscard"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="socialTiktok">TikTok</Label>
            <Input
              id="socialTiktok"
              name="socialTiktok"
              type="url"
              defaultValue={settings.socialTiktok ?? ''}
              placeholder="https://tiktok.com/@winthiscard"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="socialDiscord">Discord</Label>
            <Input
              id="socialDiscord"
              name="socialDiscord"
              type="url"
              defaultValue={settings.socialDiscord ?? ''}
              placeholder="https://discord.gg/winthiscard"
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
