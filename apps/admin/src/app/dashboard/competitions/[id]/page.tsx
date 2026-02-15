import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatPrice, formatDate, formatDateTime, calculateProgress } from '@winucard/shared';
import { COMPETITION_CATEGORIES, COMPETITION_STATUSES } from '@winucard/shared';
import { Pencil, ArrowLeft, Dices } from 'lucide-react';
import { auth } from '@/lib/auth';
import type { CompetitionStatus } from '@winucard/database';
import { CancelCompetitionDialog } from './cancel-competition-dialog';

interface CompetitionPageProps {
  params: Promise<{ id: string }>;
}

const statusColors: Record<CompetitionStatus, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'> = {
  DRAFT: 'secondary',
  UPCOMING: 'default',
  ACTIVE: 'success',
  SOLD_OUT: 'warning',
  DRAWING: 'default',
  COMPLETED: 'outline',
  CANCELLED: 'destructive',
};

export default async function CompetitionPage({ params }: CompetitionPageProps) {
  const session = await auth();
  const { id } = await params;

  const competition = await prisma.competition.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          tickets: true,
          orders: { where: { paymentStatus: 'SUCCEEDED' } },
        },
      },
      wins: {
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      },
    },
  });

  if (!competition) {
    notFound();
  }

  const soldTickets = await prisma.ticket.count({
    where: { competitionId: id, status: 'SOLD' },
  });

  const totalRevenue = await prisma.order.aggregate({
    where: { competitionId: id, paymentStatus: 'SUCCEEDED' },
    _sum: { totalAmount: true },
  });

  const progress = calculateProgress(soldTickets, competition.totalTickets);
  const questionChoices = competition.questionChoices as string[];

  // Check if eligible for draw
  const drawDatePassed = new Date(competition.drawDate) <= new Date();
  const canDraw =
    session?.user?.role === 'SUPER_ADMIN' &&
    competition.status !== 'COMPLETED' &&
    competition.status !== 'CANCELLED' &&
    competition.status !== 'DRAFT' &&
    competition.status !== 'UPCOMING' &&
    competition.wins.length === 0 &&
    soldTickets > 0 &&
    (competition.status === 'SOLD_OUT' || drawDatePassed);

  // Check if eligible for cancellation (SUPER_ADMIN only, not completed/cancelled, no winner)
  const canCancel =
    session?.user?.role === 'SUPER_ADMIN' &&
    competition.status !== 'COMPLETED' &&
    competition.status !== 'CANCELLED' &&
    competition.wins.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/competitions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{competition.title}</h1>
              <Badge variant={statusColors[competition.status]}>
                {COMPETITION_STATUSES[competition.status].label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {COMPETITION_CATEGORIES[competition.category]}
              {competition.subcategory && ` • ${competition.subcategory}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canDraw && (
            <Button asChild variant="default">
              <Link href={`/dashboard/competitions/${id}/draw`}>
                <Dices className="mr-2 h-4 w-4" />
                Execute Draw
              </Link>
            </Button>
          )}
          <Button asChild variant={canDraw ? 'outline' : 'default'}>
            <Link href={`/dashboard/competitions/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          {canCancel && (
            <CancelCompetitionDialog
              competitionId={id}
              competitionTitle={competition.title}
              orderCount={competition._count.orders}
              totalRevenue={Number(totalRevenue._sum.totalAmount ?? 0)}
            />
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Prize Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(Number(competition.prizeValue))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(Number(totalRevenue._sum.totalAmount ?? 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {competition._count.orders} orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {soldTickets} / {competition.totalTickets}
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Competition Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Price</p>
                <p className="font-medium">{formatPrice(Number(competition.ticketPrice))}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Max Per User</p>
                <p className="font-medium">{competition.maxTicketsPerUser} tickets</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sale Start</p>
                <p className="font-medium">
                  {competition.saleStartDate ? formatDateTime(competition.saleStartDate) : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Draw Date</p>
                <p className="font-medium">{formatDateTime(competition.drawDate)}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-1">Short Description</p>
              <p>{competition.descriptionShort}</p>
            </div>
            {competition.subtitle && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Subtitle</p>
                <p>{competition.subtitle}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authentication & Grading</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {competition.certificationNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">Certification #</p>
                  <p className="font-medium">{competition.certificationNumber}</p>
                </div>
              )}
              {competition.grade && (
                <div>
                  <p className="text-sm text-muted-foreground">Grade</p>
                  <p className="font-medium">{competition.grade}</p>
                </div>
              )}
              {competition.condition && (
                <div>
                  <p className="text-sm text-muted-foreground">Condition</p>
                  <p className="font-medium">{competition.condition}</p>
                </div>
              )}
            </div>
            {competition.provenance && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Provenance</p>
                  <p>{competition.provenance}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skill Question (QCM)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Question</p>
              <p className="font-medium">{competition.questionText}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Choices</p>
              <div className="space-y-2">
                {questionChoices.map((choice, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 rounded-md border p-2 ${
                      index === competition.questionAnswer
                        ? 'border-green-500 bg-green-50 dark:bg-green-950'
                        : ''
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span>{choice}</span>
                    {index === competition.questionAnswer && (
                      <Badge variant="success" className="ml-auto">
                        Correct
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO & URLs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Slug</p>
              <code className="rounded bg-muted px-2 py-1 text-sm">
                /competitions/{competition.slug}
              </code>
            </div>
            {competition.metaTitle && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Meta Title</p>
                <p>{competition.metaTitle}</p>
              </div>
            )}
            {competition.metaDescription && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Meta Description</p>
                <p className="text-sm">{competition.metaDescription}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {competition.wins.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Winner</CardTitle>
          </CardHeader>
          <CardContent>
            {competition.wins.map((win) => (
              <div key={win.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {win.user ? `${win.user.firstName} ${win.user.lastName}` : 'Deleted User'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {win.user?.email ?? 'Account deleted'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Ticket #{win.ticketNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    Won on {formatDate(win.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
