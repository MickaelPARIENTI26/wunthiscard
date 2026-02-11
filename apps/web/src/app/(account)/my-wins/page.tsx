import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Package, Truck, CheckCircle, ExternalLink } from 'lucide-react';

export const metadata = {
  title: 'My Wins | WinThisCard',
  description: 'View all your competition wins and delivery status',
};

type DeliveryStatus = 'claimed' | 'shipped' | 'delivered' | 'pending';

function getDeliveryStatus(win: {
  claimedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
}): DeliveryStatus {
  if (win.deliveredAt) return 'delivered';
  if (win.shippedAt) return 'shipped';
  if (win.claimedAt) return 'claimed';
  return 'pending';
}

function getDeliveryBadge(status: DeliveryStatus) {
  const statusConfig: Record<
    DeliveryStatus,
    { label: string; variant: 'default' | 'secondary' | 'success' | 'warning'; icon: typeof Package }
  > = {
    pending: { label: 'Pending Claim', variant: 'warning', icon: Trophy },
    claimed: { label: 'Claimed', variant: 'default', icon: Package },
    shipped: { label: 'Shipped', variant: 'secondary', icon: Truck },
    delivered: { label: 'Delivered', variant: 'success', icon: CheckCircle },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default async function MyWinsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/my-wins');
  }

  const wins = await prisma.win.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      competition: {
        select: {
          id: true,
          slug: true,
          title: true,
          mainImageUrl: true,
          prizeValue: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">My Wins</h1>
        <p className="mt-1 text-muted-foreground">
          View all your competition wins
        </p>
      </div>

      {wins.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No wins yet</h3>
            <p className="mb-6 max-w-sm text-muted-foreground">
              No wins yet - keep trying! Every ticket is a chance to win amazing collectibles.
            </p>
            <Button asChild>
              <Link href="/competitions">Browse Competitions</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {wins.map((win) => {
            const deliveryStatus = getDeliveryStatus(win);

            return (
              <Card key={win.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* Competition image */}
                    <div className="relative aspect-video w-full sm:aspect-square sm:w-40">
                      <Image
                        src={win.competition.mainImageUrl}
                        alt={win.competition.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 160px"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Trophy className="h-10 w-10 text-yellow-400" />
                      </div>
                    </div>

                    {/* Win details */}
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {getDeliveryBadge(deliveryStatus)}
                        </div>
                        <Link
                          href={`/competitions/${win.competition.slug}`}
                          className="text-lg font-semibold hover:underline"
                        >
                          {win.competition.title}
                        </Link>
                        <div className="mt-2 grid gap-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Prize Value:</span>
                            <span className="font-semibold text-primary">
                              {Number(win.competition.prizeValue).toLocaleString('en-GB', {
                                style: 'currency',
                                currency: 'GBP',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Winning Ticket:</span>
                            <span className="inline-flex items-center justify-center rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary">
                              #{win.ticketNumber}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Won On:</span>
                            <span>{formatDate(win.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Tracking info */}
                      {win.shippedAt && win.trackingNumber && (
                        <div className="mt-4 rounded-lg bg-muted p-3">
                          <p className="mb-1 text-sm font-medium">Tracking Information</p>
                          <div className="flex flex-col gap-1 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Carrier:</span>
                              <span>{win.shippingCarrier ?? 'Royal Mail'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Tracking:</span>
                              {win.trackingUrl ? (
                                <a
                                  href={win.trackingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:underline"
                                >
                                  {win.trackingNumber}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                <span>{win.trackingNumber}</span>
                              )}
                            </div>
                            {win.shippedAt && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Shipped:</span>
                                <span>{formatDate(win.shippedAt)}</span>
                              </div>
                            )}
                            {win.deliveredAt && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Delivered:</span>
                                <span>{formatDate(win.deliveredAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
