'use client';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Entry {
  id: string;
  ticketNumber: number;
  status: string;
  user: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  competition: {
    title: string;
  };
}

interface RecentFreeEntriesProps {
  entries: Entry[];
}

export function RecentFreeEntries({ entries }: RecentFreeEntriesProps) {
  if (entries.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No free entries assigned yet
      </p>
    );
  }

  return (
    <div className="max-h-[400px] overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Competition</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>
                <Badge variant="outline">#{entry.ticketNumber}</Badge>
              </TableCell>
              <TableCell className="text-sm">
                {entry.user ? (
                  <span title={entry.user.email}>
                    {entry.user.firstName && entry.user.lastName
                      ? `${entry.user.firstName} ${entry.user.lastName}`
                      : entry.user.email}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Unknown</span>
                )}
              </TableCell>
              <TableCell className="text-sm max-w-[150px] truncate">
                {entry.competition.title}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {entry.status.replace('_', ' ')}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
