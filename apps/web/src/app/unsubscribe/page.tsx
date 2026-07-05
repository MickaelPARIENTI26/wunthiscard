import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Unsubscribe',
  robots: { index: false, follow: false },
};

// Server action: performed on the user's explicit button click (POST), never on
// a bare GET — so an email link-scanner prefetching the URL can't opt someone out.
async function unsubscribeAction(formData: FormData) {
  'use server';
  const token = formData.get('token');
  if (typeof token === 'string' && token) {
    await prisma.user.updateMany({
      where: { unsubscribeToken: token },
      data: { emailMarketing: false },
    });
  }
  redirect('/unsubscribe?done=1');
}

const cardStyle: React.CSSProperties = {
  maxWidth: '480px',
  margin: '0 auto',
  padding: '40px 28px',
  textAlign: 'center',
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; done?: string }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : '';
  const done = params.done === '1';

  return (
    <main className="mx-auto px-5 sm:px-8 py-15 sm:py-20" style={{ maxWidth: '1440px' }}>
      <div style={cardStyle}>
        {done ? (
          <>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: '28px', fontWeight: 700, marginBottom: '12px' }}>
              You&apos;re unsubscribed
            </h1>
            <p style={{ color: 'var(--ink-dim)', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
              You won&apos;t receive competition update emails anymore. You&apos;ll still get essential emails about your
              orders, entries and wins. Changed your mind? You can turn updates back on any time in your{' '}
              <Link href="/settings" style={{ textDecoration: 'underline' }}>
                email preferences
              </Link>
              .
            </p>
            <Link
              href="/competitions"
              style={{
                display: 'inline-block',
                background: 'var(--ink)',
                color: '#fff',
                padding: '12px 28px',
                borderRadius: '8px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Browse competitions →
            </Link>
          </>
        ) : !token ? (
          <>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔗</div>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: '28px', fontWeight: 700, marginBottom: '12px' }}>
              Invalid unsubscribe link
            </h1>
            <p style={{ color: 'var(--ink-dim)', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
              This link is missing or incomplete. You can manage all your email preferences from your account
              settings.
            </p>
            <Link href="/settings" style={{ textDecoration: 'underline' }}>
              Go to email preferences →
            </Link>
          </>
        ) : (
          <>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✉️</div>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: '28px', fontWeight: 700, marginBottom: '12px' }}>
              Unsubscribe from updates?
            </h1>
            <p style={{ color: 'var(--ink-dim)', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
              You&apos;ll stop receiving marketing emails about new competitions and closing reminders. Essential
              emails (orders, entries, wins) will still be sent.
            </p>
            <form action={unsubscribeAction}>
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                style={{
                  display: 'inline-block',
                  background: 'var(--ink)',
                  color: '#fff',
                  padding: '12px 28px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                }}
              >
                Yes, unsubscribe me
              </button>
            </form>
            <p style={{ marginTop: '16px' }}>
              <Link href="/settings" style={{ color: 'var(--ink-dim)', fontSize: '14px', textDecoration: 'underline' }}>
                Manage preferences instead
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
