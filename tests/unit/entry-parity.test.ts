import { describe, it, expect, vi } from 'vitest';
import { writeFileSync } from 'node:fs';

process.env.RESEND_API_KEY = 're_capture';
process.env.NEXT_PUBLIC_APP_URL = 'https://winuprize.com';

const h = vi.hoisted(() => {
  const pending: { subject: string; html: string }[] = [];
  const factory = () => ({
    Resend: class {
      emails = { send: async (m: { subject: string; html: string }) => { pending.push(m); return { data: {}, error: null }; } };
      batch = { send: async () => ({ data: null, error: null }) };
    },
  });
  return { pending, factory };
});
vi.mock('resend', h.factory);
vi.mock('../../apps/web/node_modules/resend', h.factory);

/**
 * The wheel's legal position rests on the free postal route having parity with
 * the paid one. Parity is not only "the spin exists" — a free entrant who is
 * never told they have one will never play it, and the routes would be formally
 * equal and practically not. Both confirmations must say the same thing.
 */
describe('entry parity — both routes are told about the wheel identically', () => {
  it('tells a free postal entrant they have a spin', async () => {
    const m = await import('../../apps/web/src/lib/email');
    await m.sendFreeEntryConfirmationEmail('post@example.com', 'Sam', {
      competitionTitle: 'Luffy Gear 5 Alt Art OP05',
      competitionSlug: 'luffy',
      ticketNumber: 42,
      drawDate: new Date('2026-09-12T19:00:00Z'),
      entryMethod: 'email',
      wheelSpins: 1,
    });

    const sent = h.pending[h.pending.length - 1]!;
    expect(sent.html).toContain('Wheel spins earned');
    expect(sent.html).toContain('https://winuprize.com/my-rewards');
    writeFileSync('/tmp/free-entry-parity.html', sent.html);
  });

  it('tells a buyer the same thing, in the same words', async () => {
    const m = await import('../../apps/web/src/lib/email');
    await m.sendPurchaseConfirmationEmail('buyer@example.com', 'Alex', {
      orderNumber: 'WUP-1',
      competitionTitle: 'Luffy Gear 5 Alt Art OP05',
      competitionSlug: 'luffy',
      ticketNumbers: [1, 2, 3],
      bonusTicketNumbers: [],
      totalAmount: 8.97,
      drawDate: new Date('2026-09-12T19:00:00Z'),
      wheelSpins: 3,
    });

    const sent = h.pending[h.pending.length - 1]!;
    expect(sent.html).toContain('Wheel spins earned');
    expect(sent.html).toContain('One for every entry');
    expect(sent.html).toContain('https://winuprize.com/my-rewards');
  });

  it('says nothing when the competition has no wheel', async () => {
    // A block promising spins on a competition without one would be worse than
    // silence on both routes.
    const m = await import('../../apps/web/src/lib/email');
    await m.sendFreeEntryConfirmationEmail('post@example.com', 'Sam', {
      competitionTitle: 'No wheel here',
      competitionSlug: 'none',
      ticketNumber: 7,
      drawDate: new Date('2026-09-12T19:00:00Z'),
      entryMethod: 'email',
      wheelSpins: 0,
    });

    const sent = h.pending[h.pending.length - 1]!;
    expect(sent.html).not.toContain('Wheel spins earned');
  });
});
