import { Mail, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FreeEntryNoticeProps {
  competitionTitle: string;
  className?: string;
}

export function FreeEntryNotice({ competitionTitle, className }: FreeEntryNoticeProps) {
  return (
    <Card className={cn('border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30', className)}>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
          <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100">Free Entry Route</h4>
          <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
            You can enter this competition for free by post. Send a handwritten letter including:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-300">
            <li>- Your full name and email address</li>
            <li>- Competition: &ldquo;{competitionTitle}&rdquo;</li>
            <li>- Your chosen ticket number(s)</li>
            <li>- Answer to the skill question</li>
          </ul>
          <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
            Post to our registered address (see{' '}
            <Link
              href="/competition-rules"
              className="inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:text-blue-900 dark:hover:text-blue-100"
            >
              Competition Rules
              <ExternalLink className="h-3 w-3" />
            </Link>
            ).
          </p>
          <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
            Free entries have equal chance of winning as paid entries.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
