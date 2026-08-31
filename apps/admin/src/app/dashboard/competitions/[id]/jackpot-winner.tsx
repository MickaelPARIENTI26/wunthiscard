'use client';

import { useActionState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Trophy } from 'lucide-react';
import { useActionState as useHoldState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import {
  updateJackpotWin,
  clearJackpotPaymentHold,
  markJackpotNotAwarded,
  type JackpotUpdateState,
} from './jackpot-actions';

export interface JackpotWinnerProps {
  win: {
    id: string;
    status: string;
    prizeDescription: string;
    prizeValue: number | null;
    adminNotes: string | null;
    trackingNumber: string | null;
    shippedAt: string | null;
    createdAt: string;
    paymentReversedAt: string | null;
    paymentReversedReason: string | null;
    notAwardedAt: string | null;
    notAwardedReason: string | null;
    spinId: string;
    orderId: string | null;
    competitionId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
    } | null;
    address: string | null;
  };
}

const STATUSES = ['PENDING', 'CONTACTED', 'ADDRESS_CONFIRMED', 'SHIPPED', 'DELIVERED'] as const;

/** Anything before ADDRESS_CONFIRMED still needs someone to act. */
const NEEDS_ACTION = ['PENDING', 'CONTACTED'];

export function JackpotWinner({ win }: JackpotWinnerProps) {
  const [state, formAction, pending] = useActionState<JackpotUpdateState, FormData>(
    updateJackpotWin.bind(null, win.id),
    { success: false, message: '' }
  );

  const closed = win.notAwardedAt !== null;
  const frozen = win.paymentReversedAt !== null && !closed;
  const urgent = NEEDS_ACTION.includes(win.status) || frozen;

  const rows: [string, string][] = [
    ['Name', win.user ? `${win.user.firstName} ${win.user.lastName}` : 'Account deleted'],
    ['Email', win.user?.email ?? '—'],
    ['Phone', win.user?.phone ?? 'Not provided'],
    ['User ID', win.user?.id ?? '—'],
    ['Order ID', win.orderId ?? 'n/a'],
    ['Wheel Spin ID', win.spinId],
    ['Won at', new Date(win.createdAt).toLocaleString('en-GB')],
    ['Prize', win.prizeDescription],
    ['Approx. value', win.prizeValue !== null ? `£${win.prizeValue.toFixed(2)}` : 'Not set'],
    ['Shipping address', win.address ?? 'None on file — ask the winner'],
  ];

  return (
    <Card className={frozen ? 'border-2 border-destructive' : urgent ? 'border-2 border-amber-500' : undefined}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-3">
          <Trophy className="h-5 w-5 text-amber-500" />
          JACKPOT WINNER
          <Badge variant={urgent ? 'destructive' : 'secondary'}>{win.status}</Badge>
          {urgent && (
            <span className="text-sm font-normal text-amber-600">🎉 to process</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <dt className="min-w-36 text-muted-foreground">{k}</dt>
              <dd className="break-words font-medium">{v}</dd>
            </div>
          ))}
        </dl>

        {closed && (
          <div className="rounded-md border p-4">
            <p className="font-semibold">Closed — card not awarded</p>
            <p className="text-sm text-muted-foreground">
              {win.notAwardedReason ?? 'No reason recorded.'}
            </p>
          </div>
        )}

        {frozen && (
          <div className="rounded-md border border-destructive p-4 space-y-2">
            <p className="font-semibold text-destructive">
              Payment reversed — fulfilment is frozen
            </p>
            <p className="text-sm text-muted-foreground">
              The money behind this win came back ({win.paymentReversedReason ?? 'unknown cause'}).
              Nothing has been revoked and the winner has not been told. If the card has already
              shipped this is a recovery job; if it has not, decide before it does.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <ClearHold winId={win.id} />
              <NotAwarded winId={win.id} shipped={win.shippedAt !== null} />
            </div>
          </div>
        )}

        <form action={formAction} className="space-y-4 border-t pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor={`status-${win.id}`}>Processing status</Label>
              <select
                id={`status-${win.id}`}
                name="status"
                defaultValue={win.status}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor={`tracking-${win.id}`}>Tracking number</Label>
              <Input
                id={`tracking-${win.id}`}
                name="trackingNumber"
                defaultValue={win.trackingNumber ?? ''}
              />
              {win.shippedAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Shipped {new Date(win.shippedAt).toLocaleDateString('en-GB')}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor={`notes-${win.id}`}>Admin notes</Label>
            <Input id={`notes-${win.id}`} name="adminNotes" defaultValue={win.adminNotes ?? ''} />
          </div>

          {state.message && (
            <p className={`text-sm ${state.success ? 'text-green-700' : 'text-destructive'}`}>
              {state.message}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Update
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * Lifting a freeze is a decision, so it asks for one in writing. Super-admin
 * only, and the reason lands in the audit log — it is the only account of why a
 * card worth thousands went out on an order that did not pay.
 */
function ClearHold({ winId }: { winId: string }) {
  const [state, action, pending] = useHoldState<JackpotUpdateState, FormData>(
    async (_prev, formData) =>
      clearJackpotPaymentHold(winId, String(formData.get('reason') ?? '')),
    { success: false, message: '' }
  );

  return (
    <form action={action} className="space-y-2">
      <Label htmlFor={`hold-reason-${winId}`}>Reason for honouring this win anyway</Label>
      <Textarea
        id={`hold-reason-${winId}`}
        name="reason"
        rows={2}
        placeholder="e.g. refund was our goodwill gesture, the win stands"
        required
        minLength={10}
      />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Clear payment hold
      </Button>
      {state.message && (
        <p className={state.success ? 'text-sm text-green-600' : 'text-sm text-destructive'}>
          {state.message}
        </p>
      )}
    </form>
  );
}

/**
 * The other half of a freeze: closing it without sending the card. Blocked once
 * the card has shipped — at that point it is a recovery job, not a decision.
 */
function NotAwarded({ winId, shipped }: { winId: string; shipped: boolean }) {
  const [state, action, pending] = useHoldState<JackpotUpdateState, FormData>(
    async (_prev, formData) =>
      markJackpotNotAwarded(winId, String(formData.get('reason') ?? '')),
    { success: false, message: '' }
  );

  if (shipped) {
    return (
      <p className="text-sm text-muted-foreground">
        This card has already shipped — recover it before closing the win.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-2">
      <Label htmlFor={`not-awarded-${winId}`}>Reason for NOT sending the card</Label>
      <Textarea
        id={`not-awarded-${winId}`}
        name="reason"
        rows={2}
        placeholder="e.g. chargeback upheld, buyer unreachable"
        required
        minLength={10}
      />
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Close — not awarded
      </Button>
      {state.message && (
        <p className={state.success ? 'text-sm text-green-600' : 'text-sm text-destructive'}>
          {state.message}
        </p>
      )}
    </form>
  );
}
