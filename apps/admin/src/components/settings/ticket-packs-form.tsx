'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateTicketPacks } from '@/app/dashboard/settings/actions';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';

interface TicketPacksFormProps {
  settings: Record<string, string>;
}

interface TicketPack {
  name: string;
  tickets: number;
  bonus: number;
  badge: string;
  active: boolean;
}

const DEFAULT_PACKS: TicketPack[] = [
  { name: 'Starter', tickets: 5, bonus: 0, badge: 'none', active: true },
  { name: 'Popular', tickets: 10, bonus: 1, badge: 'Most Popular', active: true },
  { name: 'Best Value', tickets: 20, bonus: 3, badge: 'Best Value', active: true },
  { name: 'Ultimate', tickets: 50, bonus: 5, badge: 'none', active: true },
];

const BADGE_OPTIONS = ['none', 'Most Popular', 'Best Value'] as const;

export function TicketPacksForm({ settings }: TicketPacksFormProps) {
  const [isPending, startTransition] = useTransition();

  const initialPacks: TicketPack[] = settings.ticketPacks
    ? JSON.parse(settings.ticketPacks)
    : DEFAULT_PACKS;

  const [packs, setPacks] = useState<TicketPack[]>(initialPacks);

  const addPack = () => {
    setPacks([
      ...packs,
      { name: '', tickets: 1, bonus: 0, badge: 'none', active: true },
    ]);
  };

  const removePack = (index: number) => {
    setPacks(packs.filter((_, i) => i !== index));
  };

  const updatePack = <K extends keyof TicketPack>(index: number, field: K, value: TicketPack[K]) => {
    const newPacks = [...packs];
    const current = newPacks[index];
    if (current) {
      newPacks[index] = { ...current, [field]: value };
      setPacks(newPacks);
    }
  };

  async function handleSubmit() {
    startTransition(async () => {
      await updateTicketPacks(packs);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Packs</CardTitle>
        <CardDescription>
          Configure the ticket pack options available to customers when purchasing tickets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border">
          <div className="grid grid-cols-[1fr_100px_100px_160px_80px_60px] gap-4 border-b bg-muted/50 p-4 font-medium">
            <div>Name</div>
            <div>Tickets</div>
            <div>Bonus</div>
            <div>Badge</div>
            <div>Active</div>
            <div>Actions</div>
          </div>
          {packs.map((pack, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_100px_100px_160px_80px_60px] gap-4 border-b p-4 last:border-0 items-center"
            >
              <div>
                <Label htmlFor={`pack-name-${index}`} className="sr-only">
                  Pack name
                </Label>
                <Input
                  id={`pack-name-${index}`}
                  type="text"
                  value={pack.name}
                  onChange={(e) => updatePack(index, 'name', e.target.value)}
                  placeholder="Pack name"
                />
              </div>
              <div>
                <Label htmlFor={`pack-tickets-${index}`} className="sr-only">
                  Tickets
                </Label>
                <Input
                  id={`pack-tickets-${index}`}
                  type="number"
                  min="1"
                  value={pack.tickets}
                  onChange={(e) => updatePack(index, 'tickets', parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label htmlFor={`pack-bonus-${index}`} className="sr-only">
                  Bonus tickets
                </Label>
                <Input
                  id={`pack-bonus-${index}`}
                  type="number"
                  min="0"
                  value={pack.bonus}
                  onChange={(e) => updatePack(index, 'bonus', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor={`pack-badge-${index}`} className="sr-only">
                  Badge
                </Label>
                <Select
                  value={pack.badge}
                  onValueChange={(value) => updatePack(index, 'badge', value)}
                >
                  <SelectTrigger id={`pack-badge-${index}`}>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    {BADGE_OPTIONS.map((badge) => (
                      <SelectItem key={badge} value={badge}>
                        {badge === 'none' ? 'None' : badge}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-center">
                <Checkbox
                  id={`pack-active-${index}`}
                  checked={pack.active}
                  onCheckedChange={(checked) =>
                    updatePack(index, 'active', checked === true)
                  }
                />
              </div>
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePack(index)}
                  disabled={packs.length <= 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={addPack} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Pack
        </Button>

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
