import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ReferralClientSection } from './referral-client-section';

export const metadata: Metadata = {
  title: 'Referrals',
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
      <h1
        className="font-[family-name:var(--font-outfit)]"
        style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}
      >
        Invite Friends, Win Free Tickets
      </h1>

      <div
        style={{
          background: '#ffffff',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: '20px',
          padding: '32px',
        }}
      >
        {/* Section 1: Referral Link */}
        <div style={{ marginBottom: '32px' }}>
          <h2
            className="font-[family-name:var(--font-outfit)]"
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
            background: '#F7F7FA',
            borderRadius: '14px',
          }}
        >
          <h2
            className="font-[family-name:var(--font-outfit)]"
            style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}
          >
            How it works
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7088', lineHeight: 1.6, marginBottom: '6px' }}>
            Share your link. When your friends buy tickets, you earn free ones.
          </p>
          <p style={{ fontSize: '14px', color: '#6b7088', lineHeight: 1.6 }}>
            Every <strong style={{ color: '#1a1a2e' }}>10 tickets</strong> purchased by your friends = <strong style={{ color: '#F0B90B' }}>1 free ticket</strong> for you.
          </p>
        </div>

        {/* Section 3: Stats */}
        <div>
          <h2
            className="font-[family-name:var(--font-outfit)]"
            style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}
          >
            Your stats
          </h2>

          <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '20px' }}>
            <div
              style={{
                padding: '16px',
                background: '#F7F7FA',
                borderRadius: '12px',
              }}
            >
              <p style={{ fontSize: '12px', color: '#6b7088', marginBottom: '4px' }}>Friends invited</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e' }}>{friendsInvited}</p>
            </div>
            <div
              style={{
                padding: '16px',
                background: '#F7F7FA',
                borderRadius: '12px',
              }}
            >
              <p style={{ fontSize: '12px', color: '#6b7088', marginBottom: '4px' }}>Tickets bought by friends</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e' }}>{user.referralTotalTickets}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: '20px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
              <p style={{ fontSize: '13px', color: '#6b7088' }}>
                Progress: <strong style={{ color: '#1a1a2e' }}>{progressTowardNext}/10</strong> toward next free ticket
              </p>
            </div>
            <div
              style={{
                height: '10px',
                background: '#F0F0F0',
                borderRadius: '5px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(progressTowardNext / 10) * 100}%`,
                  background: '#F0B90B',
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
                background: '#F7F7FA',
                borderRadius: '12px',
              }}
            >
              <p style={{ fontSize: '12px', color: '#6b7088', marginBottom: '4px' }}>Free tickets earned</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e' }}>{user.referralFreeTicketsEarned}</p>
            </div>
            <div
              style={{
                padding: '16px',
                background: user.referralFreeTicketsAvailable > 0 ? 'rgba(22, 163, 74, 0.06)' : '#F7F7FA',
                borderRadius: '12px',
                border: user.referralFreeTicketsAvailable > 0 ? '1px solid rgba(22, 163, 74, 0.2)' : '1px solid transparent',
              }}
            >
              <p style={{ fontSize: '12px', color: '#6b7088', marginBottom: '4px' }}>Free tickets available</p>
              <p
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: user.referralFreeTicketsAvailable > 0 ? '#16A34A' : '#1a1a2e',
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
