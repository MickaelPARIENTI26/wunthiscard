import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Ticket } from 'lucide-react';

async function getReferralStats() {
  const [totalReferrals, freeTicketsData, topReferrers] = await Promise.all([
    prisma.user.count({ where: { referredById: { not: null } } }),
    prisma.user.aggregate({ _sum: { referralFreeTicketsEarned: true } }),
    prisma.user.findMany({
      where: { referrals: { some: {} } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        referralCode: true,
        referralFreeTicketsEarned: true,
        referralFreeTicketsAvailable: true,
        referralTotalTickets: true,
        _count: { select: { referrals: true } },
      },
      orderBy: { referrals: { _count: 'desc' } },
      take: 20,
    }),
  ]);

  return {
    totalReferrals,
    totalFreeTicketsDistributed: freeTicketsData._sum.referralFreeTicketsEarned ?? 0,
    topReferrers: topReferrers.map((u) => ({
      id: u.id,
      name: [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Unknown',
      email: u.email,
      referralCode: u.referralCode,
      referralCount: u._count.referrals,
      freeTicketsEarned: u.referralFreeTicketsEarned,
      freeTicketsAvailable: u.referralFreeTicketsAvailable,
      totalTicketsFromReferees: u.referralTotalTickets,
    })),
  };
}

export default async function ReferralsPage() {
  const stats = await getReferralStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Referrals</h1>
        <p className="text-muted-foreground">
          Overview of the referral system and top referrers
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Users who joined via referral link</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Free Tickets Distributed</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFreeTicketsDistributed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Earned through referral rewards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Referrers</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.topReferrers.length}</div>
            <p className="text-xs text-muted-foreground">Users who have referred at least one person</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Referrers</CardTitle>
          <CardDescription>Users ranked by number of successful referrals</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.topReferrers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referrals yet</p>
          ) : (
            <div className="space-y-4">
              {stats.topReferrers.map((referrer, index) => (
                <div
                  key={referrer.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium leading-none">{referrer.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{referrer.email}</p>
                      {referrer.referralCode && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Code: <span className="font-mono">{referrer.referralCode}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {referrer.referralCount} referral{referrer.referralCount !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {referrer.freeTicketsEarned} free ticket{referrer.freeTicketsEarned !== 1 ? 's' : ''} earned
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {referrer.freeTicketsAvailable} available
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
