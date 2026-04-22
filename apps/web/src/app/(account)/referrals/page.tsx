import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ReferralClientSection } from './referral-client-section';

export const metadata: Metadata = {
  title: 'Referrals | WinUCard',
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
      referralTicketCount: true,
      referralTotalTickets: true,
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

  const referralLink = `https://winucard.com/?ref=${user.referralCode}`;
  const progressTowardNext = user.referralTicketCount % 10;

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: '44px', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 8px' }}>
          Refer &amp; Win
        </h1>
        <p style={{ color: 'var(--ink-dim)', fontSize: '15px' }}>
          Invite friends, earn bonus tickets. You get 3 tickets for every friend who signs up and enters.
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
            style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}
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
            style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}
          >
            How it works
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--ink-dim)', lineHeight: 1.6, marginBottom: '6px' }}>
            Share your link. When your friends buy tickets, you earn free ones.
          </p>
          <p style={{ fontSize: '14px', color: 'var(--ink-dim)', lineHeight: 1.6 }}>
            Every <strong style={{ color: 'var(--ink)' }}>10 tickets</strong> purchased by your friends = <strong style={{ color: 'var(--accent)' }}>1 free ticket</strong> for you.
          </p>
        </div>

        {/* Section 3: Stats */}
        <div>
          <h2
            className="font-sans"
            style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}
          >
            Your stats
          </h2>

          <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '20px' }}>
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
              <p style={{ fontSize: '12px', color: 'var(--ink-dim)', marginBottom: '4px' }}>Tickets bought by friends</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink)' }}>{user.referralTotalTickets}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: '20px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
              <p style={{ fontSize: '13px', color: 'var(--ink-dim)' }}>
                Progress: <strong style={{ color: 'var(--ink)' }}>{progressTowardNext}/10</strong> toward next free ticket
              </p>
            </div>
            <div
              style={{
                height: '10px',
                background: 'var(--bg-3)',
                borderRadius: '5px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(progressTowardNext / 10) * 100}%`,
                  background: 'var(--accent)',
                  borderRadius: '5px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div
              style={{
                padding: '16px',
                background: user.referralFreeTicketsAvailable > 0 ? 'rgba(0, 199, 106, 0.06)' : 'var(--bg-2)',
                borderRadius: '12px',
                border: user.referralFreeTicketsAvailable > 0 ? '1px solid rgba(22, 163, 74, 0.2)' : '1px solid transparent',
              }}
            >
              <p style={{ fontSize: '12px', color: 'var(--ink-dim)', marginBottom: '4px' }}>Free tickets available</p>
              <p
                style={{
                  fontSize: '28px',
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
    </div>
  );
}
