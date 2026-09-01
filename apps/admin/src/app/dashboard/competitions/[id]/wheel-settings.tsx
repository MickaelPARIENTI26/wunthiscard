'use client';

import { useActionState, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, AlertTriangle } from 'lucide-react';
import {
  summariseWheelSlots,
  validateWheelConfig,
  expectedSpins,
  wheelPoolSize,
  type WheelSlotCounts,
} from '@winucard/shared';
import { saveWheelSettings, type WheelSettingsState } from './wheel-actions';

export interface WheelSettingsProps {
  competitionId: string;
  totalTickets: number | null;
  config: {
    enabled: boolean;
    jackpotEnabled: boolean;
    jackpotDescription: string | null;
    jackpotValue: number | null;
    couponValidityDays: number;
  } | null;
  /** Current stock, keyed "TYPE:value". Empty on a competition with no wheel yet. */
  slots: WheelSlotCounts[];
}

const DEFAULTS: Record<string, number> = { 'NO_WIN:0': 420, 'PERCENT_OFF:5': 210, 'PERCENT_OFF:10': 69, 'JACKPOT:0': 1 };
const ROWS: { key: string; type: WheelSlotCounts['type']; value: number; field: string; label: string }[] = [
  { key: 'NO_WIN:0', type: 'NO_WIN', value: 0, field: 'noWin', label: 'No Win' },
  { key: 'PERCENT_OFF:5', type: 'PERCENT_OFF', value: 5, field: 'off5', label: '5% OFF' },
  { key: 'PERCENT_OFF:10', type: 'PERCENT_OFF', value: 10, field: 'off10', label: '10% OFF' },
  { key: 'JACKPOT:0', type: 'JACKPOT', value: 0, field: 'jackpot', label: 'Graded Card' },
];

export function WheelSettings({ competitionId, totalTickets, config, slots }: WheelSettingsProps) {
  const wonByKey = useMemo(
    () => new Map(slots.map((s) => [`${s.type}:${s.value}`, s.quantityWon])),
    [slots]
  );
  const configuredByKey = useMemo(
    () => new Map(slots.map((s) => [`${s.type}:${s.value}`, s.quantityConfigured])),
    [slots]
  );

  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(ROWS.map((r) => [r.key, configuredByKey.get(r.key) ?? DEFAULTS[r.key] ?? 0]))
  );

  const [state, formAction, pending] = useActionState<WheelSettingsState, FormData>(
    saveWheelSettings.bind(null, competitionId),
    { success: false, message: '' }
  );

  // Live preview: the same functions the server validates with, so what the
  // admin sees before saving is what the server will decide.
  const draft: WheelSlotCounts[] = ROWS.map((r) => ({
    type: r.type,
    value: r.value,
    quantityConfigured: quantities[r.key] ?? 0,
    quantityWon: wonByKey.get(r.key) ?? 0,
  }));
  const summary = summariseWheelSlots(draft);
  const { errors, warnings } = validateWheelConfig(draft, totalTickets);
  const pool = wheelPoolSize(draft);
  const spins = expectedSpins(totalTickets);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wheel / Reward Settings</CardTitle>
        <CardDescription>
          The wheel draws without replacement: a slot set to 1 can be won exactly once.
          Percentages below are derived from the quantities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="enabled" defaultChecked={config?.enabled ?? false} />
              Enable the wheel for this competition
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="jackpotEnabled"
                defaultChecked={config?.jackpotEnabled ?? true}
              />
              Enable the jackpot
            </label>
          </div>

          {/* Rewards */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 font-medium">Reward</th>
                  <th className="py-2 font-medium">Configured</th>
                  <th className="py-2 font-medium">Won</th>
                  <th className="py-2 font-medium">Remaining</th>
                  <th className="py-2 font-medium">Chance</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, i) => {
                  const s = summary[i]!;
                  const won = wonByKey.get(row.key) ?? 0;
                  const belowFloor = s.quantityConfigured < won;
                  return (
                    <tr key={row.key} className="border-b last:border-0">
                      <td className="py-2 font-medium">{row.label}</td>
                      <td className="py-2">
                        <Input
                          type="number"
                          min={won}
                          name={row.field}
                          value={quantities[row.key] ?? 0}
                          onChange={(e) =>
                            setQuantities((q) => ({
                              ...q,
                              [row.key]: parseInt(e.target.value, 10) || 0,
                            }))
                          }
                          className={`w-28 ${belowFloor ? 'border-destructive' : ''}`}
                        />
                      </td>
                      <td className="py-2 tabular-nums">{won}</td>
                      <td className="py-2 tabular-nums">
                        {s.remaining}
                        {row.type === 'JACKPOT' && won > 0 && (
                          <Badge variant="secondary" className="ml-2">WON</Badge>
                        )}
                      </td>
                      <td className="py-2 tabular-nums text-muted-foreground">{s.percentage}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pool vs reality — bonus and referral tickets grant no spin, so the
              pool is never the same as the competition's ticket count. */}
          <div className="rounded-md border p-3 text-sm">
            <div className="flex flex-wrap gap-x-8 gap-y-1">
              <span>Slots configured: <b className="tabular-nums">{pool}</b></span>
              <span>
                Expected spins: <b className="tabular-nums">~{spins}</b>{' '}
                <span className="text-muted-foreground">(excludes bonus tickets)</span>
              </span>
            </div>
            {warnings.map((w) => (
              <p key={w.message} className="mt-2 flex items-start gap-2 text-amber-600">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {w.message}
              </p>
            ))}
          </div>

          {/* Jackpot */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label htmlFor="jackpotDescription">Jackpot description</Label>
              <Input
                id="jackpotDescription"
                name="jackpotDescription"
                defaultValue={config?.jackpotDescription ?? ''}
                placeholder="Charizard PSA 9 Base Set"
              />
            </div>
            <div>
              <Label htmlFor="jackpotValue">Approx. value (£)</Label>
              <Input
                id="jackpotValue"
                name="jackpotValue"
                type="number"
                step="0.01"
                min="0"
                defaultValue={config?.jackpotValue ?? ''}
              />
            </div>
            <div>
              <Label htmlFor="couponValidityDays">Coupon validity (days)</Label>
              <Input
                id="couponValidityDays"
                name="couponValidityDays"
                type="number"
                min="1"
                defaultValue={config?.couponValidityDays ?? 30}
              />
            </div>
          </div>

          {errors.length > 0 && (
            <div className="rounded-md border border-destructive p-3 text-sm text-destructive">
              {errors.map((e) => (
                <p key={`${e.slotLabel}-${e.message}`}>{e.slotLabel}: {e.message}</p>
              ))}
            </div>
          )}

          {state.message && (
            <div
              className={`rounded-md border p-3 text-sm ${
                state.success ? 'border-green-600 text-green-700' : 'border-destructive text-destructive'
              }`}
            >
              <p>{state.message}</p>
              {state.errors?.map((e) => <p key={e}>{e}</p>)}
            </div>
          )}

          <Button type="submit" disabled={pending || errors.length > 0}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save wheel settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
