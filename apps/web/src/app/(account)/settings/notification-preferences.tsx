'use client';

import { Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function NotificationPreferences() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Notification Preferences</CardTitle>
        </div>
        <CardDescription>
          Choose what notifications you would like to receive
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox id="competition-results" defaultChecked disabled />
            <div className="space-y-1">
              <Label htmlFor="competition-results" className="cursor-pointer">
                Competition Results
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive notifications when competitions you have entered are drawn
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox id="win-notifications" defaultChecked disabled />
            <div className="space-y-1">
              <Label htmlFor="win-notifications" className="cursor-pointer">
                Win Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Get notified immediately when you win a competition
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox id="new-competitions" disabled />
            <div className="space-y-1">
              <Label htmlFor="new-competitions" className="cursor-pointer">
                New Competitions
              </Label>
              <p className="text-xs text-muted-foreground">
                Be the first to know about new competitions
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox id="marketing" disabled />
            <div className="space-y-1">
              <Label htmlFor="marketing" className="cursor-pointer">
                Marketing Updates
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive promotional offers and special deals
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Notification preferences will be available soon.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
