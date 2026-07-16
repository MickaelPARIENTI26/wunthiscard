import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ReferralClientSection } from './referral-client-section';

export const metadata: Metadata = {
  title: 'Referrals | Lucky TCG',
};

function generateReferralCode(firstName: string): string {
  const sanitised = firstName.replace(/[^A-Za-z]/g, '').toUpperCase();
  const randomPad = randomBytes(4).toString('hex').toUpperCase();
  const prefix = (sanitised + randomPad).slice(0, 4);
  const suffix = randomBytes(2).toString('hex').toUpperCase();
  return prefix + suffix;
}

export default async function ReferralsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;

  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      referralCode: true,
      referralFreeTicketsEarned: true,
      referralFreeTicketsAvailable: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  // Generate referral code if user doesn't have one yet
  if (!user.referralCode) {
    let code = generateReferralCode(user.firstName);
    // Ensure uniqueness
    let existing = await prisma.user.findUnique({ where: { referralCode: code } });
    while (existing) {
      code = generateReferralCode(user.firstName);
      existing = await prisma.user.findUnique({ where: { referralCode: code } });
    }
    await prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
    });
    user = { ...user, referralCode: code };
  }

  const friendsInvited = await prisma.user.count({
    where: { referredById: userId },
  });

  const referralLink = `https://lucky-tcg.com/?ref=${user.referralCode}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(30px, 6vw, 44px)', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 8px' }}>
          Refer &amp; Win
        </h1>
        <p style={{ color: 'var(--ink-dim)', fontSize: '15px' }}>
          Invite friends and earn free tickets. Every friend who makes their first purchase gets you 1 free ticket.
        </p>
      </div>

      <div
        style={{
          background: 'var(--surface)',
          border: '1.5px solid var(--ink)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)',
          padding: '32px',
        }}
      >
        {/* Section 1: Referral Link */}
        <div style={{ marginBottom: '32px' }}>
          <h2
            className="font-sans"
            style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px' }}
          >
            Your referral link
          </h2>
          <ReferralClientSection referralLink={referralLink} referralCode={user.referralCode!} />
        </div>

        {/* Section 2: How it works */}
        <div
          style={{
            marginBottom: '32px',
            padding: '20px',
            background: 'var(--bg-2)',
            borderRadius: '14px',
          }}
        >
          <h2
            className="font-sans"
            style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px' }}
          >
            How it works
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--ink-dim)', lineHeight: 1.6, marginBottom: '6px' }}>
            Share your link and invite your friends to join Lucky TCG.
          </p>
          <p style={{ fontSize: '14px', color: 'var(--ink-dim)', lineHeight: 1.6 }}>
            The first time a friend makes a purchase, you get <strong style={{ color: 'var(--accent)' }}>1 free ticket</strong> — no matter how many tickets they buy.
          </p>
        </div>

        {/* Section 3: Stats */}
        <div>
          <h2
            className="font-sans"
            style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', marginBottom: '16px' }}
          >
            Your stats
          </h2>

          <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '16px' }}>
            <div
              style={{
                padding: '16px',
                background: 'var(--bg-2)',
                borderRadius: '12px',
              }}
            >
              <p style={{ fontSize: '12px', color: 'var(--ink-dim)', marginBottom: '4px' }}>Friends invited</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink)' }}>{friendsInvited}</p>
            </div>
            <div
              style={{
                padding: '16px',
                background: 'var(--bg-2)',
                borderRadius: '12px',
              }}
            >
              <p style={{ fontSize: '12px', color: 'var(--ink-dim)', marginBottom: '4px' }}>Free tickets earned</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink)' }}>{user.referralFreeTicketsEarned}</p>
            </div>
          </div>

          <div
            style={{
              padding: '20px',
              background: user.referralFreeTicketsAvailable > 0 ? 'rgba(0, 199, 106, 0.06)' : 'var(--bg-2)',
              borderRadius: '12px',
              border: user.referralFreeTicketsAvailable > 0 ? '1px solid rgba(22, 163, 74, 0.2)' : '1px solid transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <p style={{ fontSize: '13px', color: 'var(--ink-dim)', marginBottom: '2px' }}>Free tickets available</p>
              <p style={{ fontSize: '12px', color: 'var(--ink-faint)' }}>Apply them at checkout when buying 2+ tickets</p>
            </div>
            <p
              style={{
                fontSize: '32px',
                fontWeight: 800,
                color: user.referralFreeTicketsAvailable > 0 ? 'var(--accent)' : 'var(--ink)',
              }}
            >
              {user.referralFreeTicketsAvailable}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
