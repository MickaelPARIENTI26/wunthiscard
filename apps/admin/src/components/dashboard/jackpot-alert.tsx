import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Trophy, ArrowRight } from 'lucide-react';

/**
 * Standing alert for jackpots nobody has dealt with yet.
 *
 * Shown until the winner has been contacted AND their address confirmed —
 * the email announcing the win can be missed or filtered, and a graded card
 * quietly never posted is the worst outcome this feature has.
 */
export async function JackpotAlert() {
  const pending = await prisma.jackpotWin.findMany({
    where: {
      notAwardedAt: null,
      OR: [
        { status: { in: ['PENDING', 'CONTACTED'] } },
        // A frozen win at ANY status, including SHIPPED and DELIVERED. That is
        // precisely the case the alert email calls a recovery job, and filtering
        // on status alone made the dashboard blind to it.
        { paymentReversedAt: { not: null } },
      ],
    },
    select: {
      id: true,
      status: true,
      paymentReversedAt: true,
      prizeDescription: true,
      createdAt: true,
      competitionId: true,
      competition: { select: { title: true } },
      user: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (pending.length === 0) return null;

  return (
    <div className="rounded-lg border-2 border-amber-500 bg-amber-50 p-4 dark:bg-amber-950/30">
      <div className="mb-3 flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
        <Trophy className="h-5 w-5" />
        🎉 JACKPOT WINNER TO PROCESS
        {pending.length > 1 && <span>({pending.length})</span>}
      </div>
      <ul className="space-y-2">
        {pending.map((w) => (
          <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span>
              <b>{w.user ? `${w.user.firstName} ${w.user.lastName}` : 'Deleted account'}</b>
              {' won '}
              {w.prizeDescription}
              {' — '}
              <span className="text-muted-foreground">
                {w.competition.title} · {w.status}
                {w.paymentReversedAt ? ' · PAYMENT REVERSED' : ''} ·{' '}
                {new Date(w.createdAt).toLocaleDateString('en-GB')}
              </span>
            </span>
            <Link
              href={`/dashboard/competitions/${w.competitionId}`}
              className="inline-flex items-center gap-1 font-medium text-amber-700 underline dark:text-amber-400"
            >
              View winner <ArrowRight className="h-3 w-3" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
