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

describe('jackpot alert email', () => {
  it('renders every field the team needs', async () => {
    const m = await import('../../apps/web/src/lib/email');
    await m.sendJackpotAlertEmail('team@winuprize.com', {
      competitionTitle: 'Charizard PSA 10 · Base Set',
      prizeDescription: 'Charizard PSA 9 Base Set',
      prizeValue: 200,
      firstName: 'Mickael',
      lastName: 'Parienti',
      email: 'winner@example.com',
      phone: '+44 7700 900123',
      userId: 'usr_123',
      orderId: 'ord_456',
      spinId: 'spin_789',
      wonAt: new Date('2026-08-18T14:30:00Z'),
    });

    const sent = h.pending[0]!;
    expect(sent.subject).toBe('🎉 WinUPrize — JACKPOT WON');
    for (const needle of [
      'Charizard PSA 9 Base Set', '£200.00', 'Mickael Parienti',
      'winner@example.com', '+44 7700 900123', 'usr_123', 'ord_456', 'spin_789',
    ]) {
      expect(sent.html).toContain(needle);
    }
    writeFileSync('/tmp/jackpot-alert.html', sent.html);
  });

  it('does not print an empty value when the phone is missing', async () => {
    h.pending.length = 0;
    const m = await import('../../apps/web/src/lib/email');
    await m.sendJackpotAlertEmail('team@winuprize.com', {
      competitionTitle: 'X', prizeDescription: 'Y', prizeValue: null,
      firstName: 'A', lastName: 'B', email: 'a@b.com', phone: null,
      userId: 'u', orderId: null, spinId: 's', wonAt: new Date(),
    });
    expect(h.pending[0]!.html).toContain('Not provided');
    expect(h.pending[0]!.html).toContain('Not set');
  });
});
