'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateBonusTiers } from '@/app/dashboard/settings/actions';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';
import { BONUS_TIERS } from '@winthiscard/shared';

interface BonusTiersFormProps {
  settings: Record<string, string>;
}

interface BonusTier {
  minTickets: number;
  bonusPercent: number;
}

export function BonusTiersForm({ settings }: BonusTiersFormProps) {
  const [isPending, startTransition] = useTransition();

  const defaultTiers: BonusTier[] = settings.bonusTiers
    ? JSON.parse(settings.bonusTiers)
    : BONUS_TIERS.map((tier) => ({
        minTickets: tier.minTickets,
        bonusPercent: tier.bonusPercent,
      }));

  const [tiers, setTiers] = useState<BonusTier[]>(defaultTiers);

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    setTiers([
      ...tiers,
      {
        minTickets: lastTier ? lastTier.minTickets + 10 : 10,
        bonusPercent: lastTier ? lastTier.bonusPercent + 5 : 5,
      },
    ]);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof BonusTier, value: number) => {
    const newTiers = [...tiers];
    const currentTier = newTiers[index];
    if (currentTier) {
      newTiers[index] = {
        minTickets: field === 'minTickets' ? value : currentTier.minTickets,
        bonusPercent: field === 'bonusPercent' ? value : currentTier.bonusPercent,
      };
      setTiers(newTiers);
    }
  };

  async function handleSubmit() {
    startTransition(async () => {
      const sortedTiers = [...tiers].sort((a, b) => a.minTickets - b.minTickets);
      await updateBonusTiers(sortedTiers);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bonus Ticket Tiers</CardTitle>
        <CardDescription>
          Configure bonus tickets awarded based on the number of tickets purchased
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border">
          <div className="grid grid-cols-3 gap-4 border-b bg-muted/50 p-4 font-medium">
            <div>Minimum Tickets</div>
            <div>Bonus Percentage</div>
            <div>Actions</div>
          </div>
          {tiers.map((tier, index) => (
            <div key={index} className="grid grid-cols-3 gap-4 border-b p-4 last:border-0">
              <div className="space-y-1">
                <Label htmlFor={`minTickets-${index}`} className="sr-only">
                  Minimum tickets
                </Label>
                <Input
                  id={`minTickets-${index}`}
                  type="number"
                  min="1"
                  value={tier.minTickets}
                  onChange={(e) => updateTier(index, 'minTickets', parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">Min. tickets required</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor={`bonusPercent-${index}`} className="sr-only">
                  Bonus percentage
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={`bonusPercent-${index}`}
                    type="number"
                    min="0"
                    max="100"
                    value={tier.bonusPercent}
                    onChange={(e) => updateTier(index, 'bonusPercent', parseInt(e.target.value) || 0)}
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  +{Math.floor((tier.minTickets * tier.bonusPercent) / 100)} bonus tickets
                </p>
              </div>
              <div className="flex items-start">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTier(index)}
                  disabled={tiers.length <= 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={addTier} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Tier
        </Button>

        <div className="rounded-lg bg-muted p-4">
          <h4 className="font-medium mb-2">Preview</h4>
          <div className="space-y-1 text-sm">
            {[...tiers]
              .sort((a, b) => a.minTickets - b.minTickets)
              .map((tier, index) => (
                <p key={index} className="text-muted-foreground">
                  Buy {tier.minTickets}+ tickets → Get {tier.bonusPercent}% bonus (
                  {Math.floor((tier.minTickets * tier.bonusPercent) / 100)}+ free tickets)
                </p>
              ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
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
  );
}
