import type { Prisma, PrismaClient } from '@prisma/client';

/**
 * The wheel spin a free entry earns.
 *
 * This lives in @winucard/database, not in apps/web, because there are TWO free
 * routes and they are in different apps:
 *  - apps/web /api/tickets/free-entry — the self-serve route, which only serves
 *    competitions that are free in their entirety (it refuses !competition.isFree);
 *  - apps/admin assignFreeEntry — the STATUTORY POSTAL ROUTE, where staff key in
 *    an envelope. This is the one that runs on PAID competitions, which are the
 *    only competitions the wheel and its single graded card exist on.
 *
 * Wiring only the first is what made the wheel a paid-only allocation of chances
 * in everything that matters. Both call this, and a second copy would be exactly
 * the failure that reasoning is meant to prevent (see wheel-reversal.ts).
 *
 * The spin carries orderId: null — there was no payment — which also means no
 * refund or chargeback can ever reverse it.
 *
 * Idempotent: WheelSpin.ticketId is unique, so a retry cannot mint two.
 */
export async function grantSpinForFreeEntryTicket(
  client: PrismaClient | Prisma.TransactionClient,
  ticketId: string
): Promise<number> {
  const ticket = await client.ticket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      userId: true,
      competitionId: true,
      status: true,
      competition: {
        select: { drawDate: true, wheelConfig: { select: { id: true, enabled: true } } },
      },
    },
  });

  if (!ticket || ticket.status !== 'FREE_ENTRY' || !ticket.userId) return 0;

  const config = ticket.competition.wheelConfig;
  if (!config?.enabled) return 0;

  const { count } = await client.wheelSpin.createMany({
    data: [
      {
        wheelConfigId: config.id,
        competitionId: ticket.competitionId,
        userId: ticket.userId,
        ticketId: ticket.id,
        expiresAt: ticket.competition.drawDate,
      },
    ],
    skipDuplicates: true,
  });

  return count;
}
