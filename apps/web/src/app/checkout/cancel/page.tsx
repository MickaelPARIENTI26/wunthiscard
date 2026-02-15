import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { XCircle, ArrowLeft, Home, HelpCircle } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { releaseTicketsFromRedis } from '@/lib/redis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Checkout Cancelled - WinUCard',
  description: 'Your checkout was cancelled',
};

interface PageProps {
  searchParams: Promise<{ order_id?: string }>;
}

async function getOrderAndRelease(orderId: string, userId: string) {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        competition: {
          select: {
            id: true,
            slug: true,
            title: true,
          },
        },
      },
    });

    if (!order) return null;

    // If order is still PENDING, release the reserved tickets
    if (order.paymentStatus === 'PENDING') {
      // Get ticket numbers from Stripe session metadata
      // For now, release all Redis locks for this user/competition
      await releaseTicketsFromRedis(order.competitionId, userId);

      // Update order status to CANCELLED
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'CANCELLED' },
      });

      // Release database reservations
      await prisma.ticket.updateMany({
        where: {
          competitionId: order.competitionId,
          userId,
          status: 'RESERVED',
        },
        data: {
          status: 'AVAILABLE',
          userId: null,
          reservedUntil: null,
        },
      });

      // Log the cancellation
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CHECKOUT_CANCELLED',
          entity: 'order',
          entityId: order.id,
          metadata: {
            orderNumber: order.orderNumber,
            reason: 'user_cancelled',
          },
        },
      });
    }

    return order;
  } catch (error) {
    console.error('Error handling order cancellation:', error);
    return null;
  }
}

export default async function CheckoutCancelPage({ searchParams }: PageProps) {
  const session = await auth();
  const { order_id: orderId } = await searchParams;

  if (!session?.user) {
    redirect('/login');
  }

  let order = null;
  if (orderId) {
    order = await getOrderAndRelease(orderId, session.user.id);
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-lg">
          {/* Cancel Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <XCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Checkout Cancelled</h1>
            <p className="mt-2 text-muted-foreground">
              Your payment was not completed. No charges have been made.
            </p>
          </div>

          {/* Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">What happened?</CardTitle>
              <CardDescription>
                The checkout process was cancelled before payment was completed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="font-medium mb-2">Your tickets are no longer reserved</h4>
                <p className="text-sm text-muted-foreground">
                  The tickets you selected have been released back into the pool.
                  You can start a new purchase at any time.
                </p>
              </div>

              {order && (
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">You were purchasing tickets for:</p>
                  <p className="font-medium">{order.competition.title}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            {order ? (
              <Button asChild size="lg" className="w-full">
                <Link href={`/competitions/${order.competition.slug}/tickets`}>
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Try Again
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="w-full">
                <Link href="/competitions">
                  Browse Competitions
                </Link>
              </Button>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/help">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Get Help
                </Link>
              </Button>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Having trouble completing your purchase?{' '}
              <Link href="/contact" className="underline hover:text-foreground">
                Contact our support team
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
