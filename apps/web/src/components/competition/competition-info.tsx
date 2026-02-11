import { Award, Shield, FileCheck, Calendar, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface CompetitionInfoProps {
  // Authentication details
  certificationNumber?: string | null;
  grade?: string | null;
  condition?: string | null;
  provenance?: string | null;
  // Draw information
  drawDate: Date;
  actualDrawDate?: Date | null;
  drawProofUrl?: string | null;
  winningTicketNumber?: number | null;
  winnerDisplayName?: string | null;
  status: string;
  className?: string;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

export function CompetitionInfo({
  certificationNumber,
  grade,
  condition,
  provenance,
  drawDate,
  actualDrawDate,
  drawProofUrl,
  winningTicketNumber,
  winnerDisplayName,
  status,
  className,
}: CompetitionInfoProps) {
  const hasAuthenticationInfo = certificationNumber || grade || condition || provenance;
  const isCompleted = status === 'COMPLETED';
  const drawDateObj = typeof drawDate === 'string' ? new Date(drawDate) : drawDate;
  const actualDrawDateObj = actualDrawDate
    ? typeof actualDrawDate === 'string'
      ? new Date(actualDrawDate)
      : actualDrawDate
    : null;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Authentication / Grading Section */}
      {hasAuthenticationInfo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-primary" />
              Authentication Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {certificationNumber && (
              <div className="flex items-start justify-between gap-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <FileCheck className="h-4 w-4" />
                  Certification Number
                </span>
                <span className="font-mono font-medium">{certificationNumber}</span>
              </div>
            )}

            {grade && (
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Award className="h-4 w-4" />
                  Grade
                </span>
                <Badge variant="secondary" className="font-bold">
                  {grade}
                </Badge>
              </div>
            )}

            {condition && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground">Condition</span>
                  <p className="mt-1">{condition}</p>
                </div>
              </>
            )}

            {provenance && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground">Provenance</span>
                  <p className="mt-1">{provenance}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Draw Information Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5 text-primary" />
            Draw Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          {/* Draw Date */}
          <div className="flex items-start justify-between gap-2">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {isCompleted ? 'Draw Date' : 'Scheduled Draw'}
            </span>
            <span className="text-right font-medium">
              {isCompleted && actualDrawDateObj
                ? formatDateTime(actualDrawDateObj)
                : formatDate(drawDateObj)}
            </span>
          </div>

          {/* Competition Status */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Status</span>
            <Badge
              variant={
                status === 'ACTIVE'
                  ? 'success'
                  : status === 'COMPLETED'
                    ? 'secondary'
                    : status === 'UPCOMING'
                      ? 'default'
                      : 'outline'
              }
            >
              {status === 'ACTIVE'
                ? 'Live'
                : status === 'COMPLETED'
                  ? 'Completed'
                  : status === 'UPCOMING'
                    ? 'Coming Soon'
                    : status === 'SOLD_OUT'
                      ? 'Sold Out'
                      : status}
            </Badge>
          </div>

          {/* Completed Competition Details */}
          {isCompleted && winningTicketNumber && (
            <>
              <Separator />
              <div className="rounded-lg bg-primary/5 p-4">
                <p className="mb-2 text-center text-sm font-medium text-muted-foreground">
                  Winning Ticket
                </p>
                <p className="text-center text-3xl font-bold text-primary">
                  #{winningTicketNumber}
                </p>
                {winnerDisplayName && (
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    Won by {winnerDisplayName}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Draw Proof Link */}
          {isCompleted && drawProofUrl && (
            <div className="mt-2">
              <a
                href={drawProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
              >
                Watch the live draw video
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          )}

          {/* Draw Method Info */}
          {!isCompleted && (
            <>
              <Separator />
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                <p>
                  The winning ticket will be selected using a certified Random Number Generator
                  (RNG) under independent supervision. The draw may be livestreamed and recorded
                  for transparency.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
