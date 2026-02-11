import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatPrice, formatDateTime } from '@winthiscard/shared';
import {
  ArrowLeft,
  Trophy,
  User,
  Mail,
  Ticket,
  Calendar,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { DeliveryStatusForm } from './delivery-status-form';
import { ReDrawButton } from './redraw-button';

interface WinPageProps {
  params: Promise<{ id: string }>;
}

type DeliveryStatus = 'PENDING' | 'CLAIMED' | 'SHIPPED' | 'DELIVERED';

function getDeliveryStatus(win: {
  claimedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
}): DeliveryStatus {
  if (win.deliveredAt) return 'DELIVERED';
  if (win.shippedAt) return 'SHIPPED';
  if (win.claimedAt) return 'CLAIMED';
  return 'PENDING';
}

function getStatusBadge(status: DeliveryStatus) {
  switch (status) {
    case 'PENDING':
      return (
        <Badge variant="warning" className="text-base">
          <Clock className="mr-1 h-4 w-4" /> Pending Claim
        </Badge>
      );
    case 'CLAIMED':
      return (
        <Badge variant="default" className="text-base">
          <Package className="mr-1 h-4 w-4" /> Claimed
        </Badge>
      );
    case 'SHIPPED':
      return (
        <Badge variant="secondary" className="text-base">
          <Truck className="mr-1 h-4 w-4" /> Shipped
        </Badge>
      );
    case 'DELIVERED':
      return (
        <Badge variant="success" className="text-base">
          <CheckCircle2 className="mr-1 h-4 w-4" /> Delivered
        </Badge>
      );
  }
}

export default async function WinPage({ params }: WinPageProps) {
  const { id } = await params;
  const session = await auth();

  const win = await prisma.win.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          addresses: {
            where: { isDefault: true },
            take: 1,
          },
        },
      },
      competition: {
        select: {
          id: true,
          slug: true,
          title: true,
          prizeValue: true,
          mainImageUrl: true,
        },
      },
    },
  });

  if (!win) {
    notFound();
  }

  const status = getDeliveryStatus(win);
  const defaultAddress = win.user?.addresses[0];

  // Calculate days since win was created (for 14-day warning)
  const daysSinceWin = Math.floor(
    (Date.now() - win.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const showUnclaimedWarning = status === 'PENDING' && daysSinceWin >= 14;
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/wins">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Delivery Management</h1>
            {getStatusBadge(status)}
          </div>
          <p className="text-muted-foreground">{win.competition.title}</p>
        </div>
      </div>

      {/* 14-Day Unclaimed Warning Banner */}
      {showUnclaimedWarning && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Prize Unclaimed for {daysSinceWin} Days</AlertTitle>
          <AlertDescription className="mt-2">
            <p>
              The winner has not claimed their prize within 14 days. According to competition terms,
              you may void this win and run a re-draw to select a new winner.
            </p>
            {isSuperAdmin && (
              <div className="mt-4">
                <ReDrawButton
                  winId={win.id}
                  competitionId={win.competition.id}
                  competitionTitle={win.competition.title}
                />
              </div>
            )}
            {!isSuperAdmin && (
              <p className="mt-2 text-sm">
                Contact a Super Admin to initiate a re-draw.
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Winner Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Winner Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {win.user ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">
                      {win.user.firstName} {win.user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">Winner</p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{win.user.email}</span>
                  </div>
                  {win.user.phone && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{win.user.phone}</span>
                    </div>
                  )}
                </div>

                {defaultAddress && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <MapPin className="h-4 w-4" />
                        <span>Shipping Address</span>
                      </div>
                      <div className="rounded-lg bg-muted p-3 text-sm">
                        {defaultAddress.label && (
                          <p className="font-medium mb-1">{defaultAddress.label}</p>
                        )}
                        <p>{defaultAddress.line1}</p>
                        {defaultAddress.line2 && <p>{defaultAddress.line2}</p>}
                        <p>{defaultAddress.city}{defaultAddress.county && `, ${defaultAddress.county}`}</p>
                        <p>{defaultAddress.postcode}</p>
                        <p>{defaultAddress.country}</p>
                      </div>
                    </div>
                  </>
                )}

                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/users/${win.user.id}`}>
                    View User Profile
                  </Link>
                </Button>
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                User account has been deleted
              </div>
            )}
          </CardContent>
        </Card>

        {/* Competition & Prize Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Competition Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h3 className="font-semibold">{win.competition.title}</h3>
                <p className="text-2xl font-bold text-primary mt-1">
                  {formatPrice(Number(win.competition.prizeValue))}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Ticket className="h-4 w-4" />
                  Winning Ticket
                </span>
                <span className="font-mono font-bold text-lg">#{win.ticketNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Won Date
                </span>
                <span>{formatDateTime(win.createdAt)}</span>
              </div>
            </div>

            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/competitions/${win.competition.id}`}>
                View Competition
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Delivery Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Delivery Status
            </CardTitle>
            <CardDescription>
              Update the delivery status as the prize moves through fulfillment
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Timeline */}
            <div className="relative mb-8">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
              <div className="space-y-6">
                {/* Won */}
                <div className="relative flex items-start gap-4 pl-10">
                  <div className="absolute left-2.5 flex h-3 w-3 items-center justify-center">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Won</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(win.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Claimed */}
                <div className="relative flex items-start gap-4 pl-10">
                  <div className="absolute left-2.5 flex h-3 w-3 items-center justify-center">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        win.claimedAt ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  </div>
                  <div>
                    <p className={`font-medium ${!win.claimedAt ? 'text-muted-foreground' : ''}`}>
                      Claimed
                    </p>
                    {win.claimedAt ? (
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(win.claimedAt)}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Waiting for winner to claim</p>
                    )}
                  </div>
                </div>

                {/* Shipped */}
                <div className="relative flex items-start gap-4 pl-10">
                  <div className="absolute left-2.5 flex h-3 w-3 items-center justify-center">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        win.shippedAt ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${!win.shippedAt ? 'text-muted-foreground' : ''}`}>
                      Shipped
                    </p>
                    {win.shippedAt ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(win.shippedAt)}
                        </p>
                        {win.shippingCarrier && win.trackingNumber && (
                          <div className="mt-2 rounded-lg bg-muted p-3 text-sm">
                            <p>
                              <span className="text-muted-foreground">Carrier:</span>{' '}
                              {win.shippingCarrier}
                            </p>
                            <p>
                              <span className="text-muted-foreground">Tracking:</span>{' '}
                              {win.trackingNumber}
                            </p>
                            {win.trackingUrl && (
                              <a
                                href={win.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline mt-1"
                              >
                                Track Package <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not yet shipped</p>
                    )}
                  </div>
                </div>

                {/* Delivered */}
                <div className="relative flex items-start gap-4 pl-10">
                  <div className="absolute left-2.5 flex h-3 w-3 items-center justify-center">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        win.deliveredAt ? 'bg-green-500' : 'bg-muted'
                      }`}
                    />
                  </div>
                  <div>
                    <p
                      className={`font-medium ${!win.deliveredAt ? 'text-muted-foreground' : 'text-green-600'}`}
                    >
                      Delivered
                    </p>
                    {win.deliveredAt ? (
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(win.deliveredAt)}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Awaiting delivery</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Update Form */}
            <DeliveryStatusForm
              winId={win.id}
              currentStatus={status}
              claimedAt={win.claimedAt}
              shippedAt={win.shippedAt}
              deliveredAt={win.deliveredAt}
              trackingNumber={win.trackingNumber}
              trackingUrl={win.trackingUrl}
              shippingCarrier={win.shippingCarrier}
              notes={win.notes}
            />

            {/* Notes */}
            {win.notes && (
              <>
                <Separator className="my-6" />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                  <p className="text-sm">{win.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
