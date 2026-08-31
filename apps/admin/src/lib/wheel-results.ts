import { prisma } from '@/lib/db';
import { formatDateTime, wheelSlotLabel, type WheelSlotKind } from '@winucard/shared';

/**
 * Everything the Wheel Results card shows.
 *
 * The history is deliberately capped and read from the database per request
 * rather than shipped to the browser and filtered there: a 100k-ticket
 * competition mints 100k spins, and the operator's answer to "show me every
 * one" is the export, not a page that has to hold them all in memory.
 */

export const HISTORY_LIMIT = 50;

/** "all", or a slot key such as `PERCENT_OFF:10`. */
export type WheelFilter = string;

export function slotKey(type: WheelSlotKind, value: number): string {
  return `${type}:${value}`;
}

function parseFilter(filter: WheelFilter): { type: WheelSlotKind; value: number } | null {
  if (!filter || filter === 'all') return null;
  const [type, raw] = filter.split(':');
  if (type !== 'NO_WIN' && type !== 'PERCENT_OFF' && type !== 'JACKPOT') return null;
  const value = Number(raw);
  return Number.isInteger(value) ? { type, value } : null;
}

export interface WheelOutcomeCount {
  key: string;
  label: string;
  type: WheelSlotKind;
  value: number;
  won: number;
  configured: number;
  remaining: number;
}

export interface WheelHistoryRow {
  id: string;
  spunAt: Date;
  resultLabel: string;
  resultKey: string;
  userName: string;
  userEmail: string;
  userId: string | null;
  orderNumber: string | null;
  ticketCount: number | null;
  promoCode: string | null;
  promoRedeemed: boolean;
  jackpotStatus: string | null;
  reversed: boolean;
}

export interface WheelResults {
  configured: boolean;
  enabled: boolean;
  granted: number;
  played: number;
  unplayed: number;
  /** Spins whose payment came back. Shown separately, never netted off silently. */
  reversed: number;
  /** True once the draw date has passed: the unplayed spins are dead, not pending. */
  expired: boolean;
  outcomes: WheelOutcomeCount[];
  codesIssued: number;
  codesRedeemed: number;
  jackpotWon: boolean;
  history: WheelHistoryRow[];
  historyTotal: number;
}

export async function getWheelResults(
  competitionId: string,
  filter: WheelFilter = 'all'
): Promise<WheelResults | null> {
  const config = await prisma.wheelConfig.findUnique({
    where: { competitionId },
    select: {
      id: true,
      enabled: true,
      jackpotEnabled: true,
      slots: {
        select: { type: true, value: true, quantityConfigured: true, quantityWon: true },
      },
      competition: { select: { drawDate: true } },
    },
  });
  if (!config) return null;

  const parsed = parseFilter(filter);
  const resultWhere = parsed
    ? { resultType: parsed.type, resultValue: parsed.value }
    : {};

  const [granted, played, reversed, byResult, codes, jackpots, historyTotal, history] = await Promise.all([
    // granted and played both exclude reversed spins, together — filtering one
    // and not the other would quietly inflate "still to play", which is derived
    // from the difference.
    prisma.wheelSpin.count({ where: { competitionId, reversedAt: null } }),
    prisma.wheelSpin.count({ where: { competitionId, reversedAt: null, spunAt: { not: null } } }),
    prisma.wheelSpin.count({ where: { competitionId, reversedAt: { not: null } } }),
    // Deliberately NOT filtered on reversedAt. WheelSlot.quantityWon is monotonic,
    // so this is the count that must keep agreeing with it — filtering here would
    // break the won-vs-remaining tripwire this card exists to show.
    prisma.wheelSpin.groupBy({
      by: ['resultType', 'resultValue'],
      where: { competitionId, spunAt: { not: null } },
      _count: { _all: true },
    }),
    prisma.promoCode.groupBy({
      by: ['redeemedAt'],
      where: { competitionId },
      _count: { _all: true },
    }),
    prisma.jackpotWin.count({ where: { competitionId } }),
    prisma.wheelSpin.count({ where: { competitionId, spunAt: { not: null }, ...resultWhere } }),
    prisma.wheelSpin.findMany({
      where: { competitionId, spunAt: { not: null }, ...resultWhere },
      select: {
        id: true,
        spunAt: true,
        resultType: true,
        resultValue: true,
        userId: true,
        reversedAt: true,
        user: { select: { firstName: true, lastName: true, email: true } },
        order: { select: { orderNumber: true, ticketCount: true } },
        promoCode: { select: { code: true, redeemedAt: true } },
        jackpotWin: { select: { status: true } },
      },
      orderBy: { spunAt: 'desc' },
      take: HISTORY_LIMIT,
    }),
  ]);

  const wonByKey = new Map<string, number>();
  for (const row of byResult) {
    if (!row.resultType) continue;
    wonByKey.set(slotKey(row.resultType, row.resultValue ?? 0), row._count._all);
  }

  const outcomes: WheelOutcomeCount[] = config.slots
    .filter((s) => config.jackpotEnabled || s.type !== 'JACKPOT')
    .map((s) => ({
      key: slotKey(s.type, s.value),
      label: wheelSlotLabel(s.type, s.value),
      type: s.type,
      value: s.value,
      // The spin table is the record of what players actually saw; quantityWon
      // is the stock counter. They should agree, and showing the spin-derived
      // number means a divergence is visible rather than hidden.
      won: wonByKey.get(slotKey(s.type, s.value)) ?? 0,
      configured: s.quantityConfigured,
      remaining: s.quantityConfigured - s.quantityWon,
    }))
    .sort((a, b) => {
      const rank = (t: WheelSlotKind) => (t === 'NO_WIN' ? 0 : t === 'PERCENT_OFF' ? 1 : 2);
      return rank(a.type) - rank(b.type) || a.value - b.value;
    });

  let codesIssued = 0;
  let codesRedeemed = 0;
  for (const row of codes) {
    codesIssued += row._count._all;
    if (row.redeemedAt) codesRedeemed += row._count._all;
  }

  return {
    configured: true,
    enabled: config.enabled,
    granted,
    played,
    reversed,
    unplayed: granted - played,
    expired: config.competition.drawDate.getTime() <= Date.now(),
    outcomes,
    codesIssued,
    codesRedeemed,
    jackpotWon: jackpots > 0,
    historyTotal,
    history: history.map((spin) => ({
      id: spin.id,
      spunAt: spin.spunAt as Date,
      resultLabel: spin.resultType
        ? wheelSlotLabel(spin.resultType, spin.resultValue ?? 0)
        : '—',
      resultKey: spin.resultType ? slotKey(spin.resultType, spin.resultValue ?? 0) : '',
      // A deleted account leaves the spin behind with a null user — the row
      // still counts, so it is shown rather than dropped.
      userName: spin.user ? `${spin.user.firstName} ${spin.user.lastName}`.trim() : 'Deleted account',
      userEmail: spin.user?.email ?? '',
      userId: spin.userId,
      orderNumber: spin.order?.orderNumber ?? null,
      ticketCount: spin.order?.ticketCount ?? null,
      promoCode: spin.promoCode?.code ?? null,
      promoRedeemed: Boolean(spin.promoCode?.redeemedAt),
      jackpotStatus: spin.jackpotWin?.status ?? null,
      reversed: spin.reversedAt !== null,
    })),
  };
}

/**
 * The export's rows and columns.
 *
 * Kept here rather than in the route so the shape of "a wheel row" lives with
 * the queries that produce it — and so the accessors can be tested without
 * standing up an HTTP request.
 *
 * Same ceiling reasoning as the participants export: one spin is minted per paid
 * ticket, so the row count cannot exceed the validated totalTickets maximum. If
 * it ever does, fail loudly rather than hand over a file that silently omits
 * winners.
 */
const EXPORT_MAX_ROWS = 200000;
const EXPORT_BATCH_SIZE = 10000;

export class WheelExportTooLargeError extends Error {
  constructor(public readonly count: number) {
    super(
      `Export aborted: this competition has ${count}+ spins, above the safe limit of ` +
        `${EXPORT_MAX_ROWS}. Nothing was produced rather than a truncated record.`
    );
    this.name = 'WheelExportTooLargeError';
  }
}

const SPIN_EXPORT_SELECT = {
  id: true,
  spunAt: true,
  resultType: true,
  resultValue: true,
  userId: true,
  reversedAt: true,
  reversalReason: true,
  user: { select: { firstName: true, lastName: true, email: true } },
  order: { select: { orderNumber: true, ticketCount: true } },
  promoCode: { select: { code: true, redeemedAt: true } },
  jackpotWin: { select: { status: true } },
} as const;

export type WheelExportRow = Awaited<
  ReturnType<typeof prisma.wheelSpin.findMany<{ select: typeof SPIN_EXPORT_SELECT }>>
>[number];

export async function fetchAllWheelSpins(competitionId: string): Promise<WheelExportRow[]> {
  const all: WheelExportRow[] = [];

  for (let skip = 0; ; skip += EXPORT_BATCH_SIZE) {
    const batch = await prisma.wheelSpin.findMany({
      where: { competitionId, spunAt: { not: null } },
      select: SPIN_EXPORT_SELECT,
      // spunAt alone can tie; id breaks it so paging never repeats or skips a row.
      orderBy: [{ spunAt: 'asc' }, { id: 'asc' }],
      skip,
      take: EXPORT_BATCH_SIZE,
    });

    if (batch.length === 0) break;
    all.push(...batch);
    if (all.length > EXPORT_MAX_ROWS) throw new WheelExportTooLargeError(all.length);
    if (batch.length < EXPORT_BATCH_SIZE) break;
  }

  return all;
}

export const WHEEL_EXPORT_COLUMNS = [
  { key: 'spunAt', header: 'spun_at', accessor: (r: WheelExportRow) => (r.spunAt ? formatDateTime(r.spunAt) : '') },
  { key: 'userId', header: 'user_id', accessor: (r: WheelExportRow) => r.userId ?? '' },
  { key: 'firstName', header: 'first_name', accessor: (r: WheelExportRow) => r.user?.firstName ?? '' },
  { key: 'lastName', header: 'last_name', accessor: (r: WheelExportRow) => r.user?.lastName ?? '' },
  { key: 'email', header: 'email', accessor: (r: WheelExportRow) => r.user?.email ?? '' },
  { key: 'orderNumber', header: 'order_number', accessor: (r: WheelExportRow) => r.order?.orderNumber ?? '' },
  { key: 'ticketCount', header: 'tickets_in_order', accessor: (r: WheelExportRow) => r.order?.ticketCount ?? 0 },
  {
    key: 'result',
    header: 'result',
    accessor: (r: WheelExportRow) => (r.resultType ? wheelSlotLabel(r.resultType, r.resultValue ?? 0) : ''),
  },
  { key: 'promoCode', header: 'promo_code', accessor: (r: WheelExportRow) => r.promoCode?.code ?? '' },
  {
    key: 'promoStatus',
    header: 'promo_status',
    accessor: (r: WheelExportRow) => (!r.promoCode ? '' : r.promoCode.redeemedAt ? 'used' : 'unused'),
  },
  { key: 'jackpotStatus', header: 'jackpot_status', accessor: (r: WheelExportRow) => r.jackpotWin?.status ?? '' },
  {
    key: 'reversed',
    header: 'reversed',
    accessor: (r: WheelExportRow) => (r.reversedAt ? (r.reversalReason ?? 'yes') : ''),
  },
];
