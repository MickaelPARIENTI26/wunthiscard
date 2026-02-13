'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Star, AlertCircle } from 'lucide-react';
import { setFeaturedCompetition } from '@/app/dashboard/competitions/actions';

interface Competition {
  id: string;
  title: string;
  prizeValue: number;
  isFeatured: boolean;
}

interface HomepageSettingsFormProps {
  activeCompetitions: Competition[];
  currentFeaturedId: string | null;
}

export function HomepageSettingsForm({ activeCompetitions, currentFeaturedId }: HomepageSettingsFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(currentFeaturedId ?? 'none');
  const [error, setError] = useState<string | null>(null);

  const hasChanges = selectedId !== (currentFeaturedId ?? 'none');

  async function handleSave() {
    setIsSubmitting(true);
    setError(null);

    try {
      await setFeaturedCompetition(selectedId === 'none' ? null : selectedId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update featured competition');
    } finally {
      setIsSubmitting(false);
    }
  }

  const formatPrize = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" />
          Homepage Hero
        </CardTitle>
        <CardDescription>
          Select which competition to feature prominently on the homepage hero section.
          Only active competitions can be featured.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="featuredCompetition">Featured Competition</Label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger id="featuredCompetition" className="w-full">
              <SelectValue placeholder="Select a competition to feature" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground">No featured competition (use fallback)</span>
              </SelectItem>
              {activeCompetitions.map((comp) => (
                <SelectItem key={comp.id} value={comp.id}>
                  <div className="flex items-center gap-2">
                    {comp.isFeatured && <Star className="h-3 w-3 text-amber-500" fill="currentColor" />}
                    <span>{comp.title}</span>
                    <span className="text-muted-foreground">({formatPrize(comp.prizeValue)})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            If no competition is featured, the homepage will display the active competition with the highest prize value.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {activeCompetitions.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
            <p>No active competitions available to feature.</p>
            <p className="text-sm">Create and activate a competition first.</p>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!hasChanges || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
