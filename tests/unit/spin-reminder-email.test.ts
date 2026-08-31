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

describe('spin reminder email', () => {
  it('says how many spins are left, and when they die', async () => {
    const m = await import('../../apps/web/src/lib/email');
    await m.sendSpinReminderEmail('john@example.com', 'John', {
      competitionTitle: 'Luffy Gear 5 Alt Art OP05',
      mainImageUrl: 'https://cdn.winuprize.com/luffy.jpg',
      spins: 3,
      expiresAt: new Date('2026-09-12T19:00:00Z'),
    });

    const sent = h.pending[0]!;
    expect(sent.subject).toBe('⏳ 3 unused spins — expiring soon');
    expect(sent.html).toContain('Luffy Gear 5 Alt Art OP05');
    expect(sent.html).toContain('John');
    // UK time, spelled out: an email that says only "expires soon" is useless.
    expect(sent.html).toContain('Saturday 12 September');
    expect(sent.html).toContain('20:00'); // BST, not UTC
    expect(sent.html).toContain('https://winuprize.com/my-rewards');
    // The reassurance that stops "is my entry at risk?" support mail.
    expect(sent.html).toContain('already in the draw');

    writeFileSync('/tmp/spin-reminder.html', sent.html);
  });

  it('keeps the copy singular for one spin', async () => {
    const m = await import('../../apps/web/src/lib/email');
    await m.sendSpinReminderEmail('john@example.com', '', {
      competitionTitle: 'Charizard PSA 10',
      spins: 1,
      expiresAt: new Date('2026-09-12T19:00:00Z'),
    });

    const sent = h.pending[h.pending.length - 1]!;
    expect(sent.subject).toBe('⏳ 1 unused spin — expiring soon');
    expect(sent.html).toContain('1 unused spin<');
    expect(sent.html).not.toContain('unused spins');
    // No first name: the sentence must still start with a capital.
    expect(sent.html).toContain('You still have 1 spin waiting');
  });
});
