import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Disc3 } from 'lucide-react';
import { formatDateTime } from '@winucard/shared';
import { HISTORY_LIMIT, type WheelResults } from '@/lib/wheel-results';
import { WheelResultsExport } from './wheel-results-export';

interface WheelResultsCardProps {
  competitionId: string;
  filter: string;
  results: WheelResults;
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function WheelResultsCard({ competitionId, filter, results }: WheelResultsCardProps) {
  const playRate = results.granted > 0 ? Math.round((results.played / results.granted) * 100) : 0;
  const redeemRate =
    results.codesIssued > 0 ? Math.round((results.codesRedeemed / results.codesIssued) * 100) : 0;

  const filters = [
    { key: 'all', label: 'All' },
    ...results.outcomes.map((o) => ({ key: o.key, label: o.label })),
  ];

  return (
    <Card id="wheel-results">
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Disc3 className="h-5 w-5" />
              Wheel Results
            </CardTitle>
            <CardDescription>
              {results.enabled
                ? 'One spin per entry — bought or claimed through the free postal route.'
                : 'The wheel is switched off — no new spins are being granted.'}
            </CardDescription>
          </div>
          <WheelResultsExport competitionId={competitionId} disabled={results.played === 0} />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Spins granted" value={results.granted} />
          <Stat label="Played" value={results.played} hint={`${playRate}% of granted`} />
          <Stat
            label={results.expired ? 'Expired unplayed' : 'Still to play'}
            value={results.unplayed}
            hint={results.expired ? 'The competition has closed' : undefined}
          />
          <Stat
            label="Codes redeemed"
            value={`${results.codesRedeemed} / ${results.codesIssued}`}
            hint={results.codesIssued > 0 ? `${redeemRate}% came back` : undefined}
          />
        </div>

        {results.reversed > 0 && (
          <div className="rounded-md border border-destructive/40 p-3">
            <p className="text-sm text-muted-foreground">Reversed</p>
            <p className="text-xl font-bold">{results.reversed}</p>
            <p className="text-xs text-muted-foreground">
              Spins whose payment came back (refund, chargeback or cancellation). Their pool
              tokens are NOT returned automatically — raise a slot&apos;s stock in the settings
              below if you want them back in play.
            </p>
          </div>
        )}

        <div>
          <p className="text-sm font-medium mb-2">Outcomes</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {results.outcomes.map((outcome) => (
              <div key={outcome.key} className="rounded-md border p-3">
                <p className="text-sm text-muted-foreground">{outcome.label}</p>
                <p className="text-xl font-bold">{outcome.won}</p>
                <p className="text-xs text-muted-foreground">
                  {outcome.remaining} of {outcome.configured} left
                </p>
              </div>
            ))}
          </div>
          {results.outcomes.length === 0 && (
            <p className="text-sm text-muted-foreground">No slots configured yet.</p>
          )}
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Graded card</p>
          {results.jackpotWon ? (
            <Badge variant="success">Won — see the winner card above</Badge>
          ) : (
            <Badge variant="outline">Still in the pool</Badge>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
            <p className="text-sm font-medium">
              History
              {results.historyTotal > HISTORY_LIMIT && (
                <span className="text-muted-foreground font-normal">
                  {' '}— showing the {HISTORY_LIMIT} most recent of {results.historyTotal}. Export for the full list.
                </span>
              )}
            </p>
            {/* Plain links, not client state: the filter changes what the
                database returns, so it belongs in the URL. */}
            <div className="flex gap-1 flex-wrap">
              {filters.map((f) => {
                const active = f.key === filter || (f.key === 'all' && filter === '');
                return (
                  <Link
                    key={f.key}
                    href={`/dashboard/competitions/${competitionId}?wheel=${encodeURIComponent(f.key)}#wheel-results`}
                    scroll={false}
                  >
                    <Badge variant={active ? 'default' : 'outline'} className="cursor-pointer">
                      {f.label}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[170px]">Spun</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No spins yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  results.history.map((row) => (
                    <TableRow key={row.id} className={row.reversed ? 'opacity-60' : undefined}>
                      <TableCell className="text-sm">
                        {formatDateTime(row.spunAt)}
                        {row.reversed && (
                          <p className="text-xs text-destructive">Reversed</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{row.userName}</p>
                        <p className="text-xs text-muted-foreground">{row.userEmail}</p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.orderNumber ? (
                          <>
                            <p>#{row.orderNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {row.ticketCount} ticket{row.ticketCount === 1 ? '' : 's'}
                            </p>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.jackpotStatus ? (
                          <Badge variant="success">{row.resultLabel}</Badge>
                        ) : row.resultKey.startsWith('PERCENT_OFF') ? (
                          <Badge variant="default">{row.resultLabel}</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">{row.resultLabel}</span>
                        )}
                        {row.jackpotStatus && (
                          <p className="text-xs text-muted-foreground mt-1">{row.jackpotStatus}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.promoCode ? (
                          <>
                            <p className="font-mono text-xs">{row.promoCode}</p>
                            <p className="text-xs text-muted-foreground">
                              {row.promoRedeemed ? 'Used' : 'Unused'}
                            </p>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
