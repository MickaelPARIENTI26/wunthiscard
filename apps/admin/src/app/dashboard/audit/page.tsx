import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@winucard/shared';
import { Shield, FileText, User, Activity } from 'lucide-react';

export const metadata = {
  title: 'Audit Log | Admin',
};

// Map actions to badge variants
function getActionBadge(action: string) {
  if (action.includes('DELETE') || action.includes('CANCELLED') || action.includes('VOIDED')) {
    return 'destructive';
  }
  if (action.includes('CREATE') || action.includes('SUCCESS')) {
    return 'success';
  }
  if (action.includes('FAILED') || action.includes('ERROR')) {
    return 'destructive';
  }
  return 'secondary';
}

interface SearchParams {
  page?: string;
  action?: string;
  entity?: string;
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();

  // Only SUPER_ADMIN can access audit logs
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const perPage = 50;
  const skip = (page - 1) * perPage;

  const where = {
    ...(params.action && { action: { contains: params.action, mode: 'insensitive' as const } }),
    ...(params.entity && { entity: { equals: params.entity } }),
  };

  const [logs, totalCount, uniqueActions, _uniqueEntities] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' },
    }),
    prisma.auditLog.findMany({
      select: { entity: true },
      distinct: ['entity'],
      orderBy: { entity: 'asc' },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / perPage);

  // Get stats
  const [todayCount, weekCount] = await Promise.all([
    prisma.auditLog.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.auditLog.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">
            Track all administrative actions and system events
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weekCount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueActions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
          </CardTitle>
          <CardDescription>
            Showing {skip + 1} to {Math.min(skip + perPage, totalCount)} of {totalCount} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No audit log entries found.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadge(log.action)}>
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{log.entity}</span>
                          {log.entityId && (
                            <span className="font-mono text-xs text-muted-foreground">
                              ({log.entityId.slice(0, 8)}...)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.user ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {log.user.firstName} {log.user.lastName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.metadata && typeof log.metadata === 'object' ? (
                          <pre className="text-xs bg-muted p-2 rounded max-w-xs overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2).slice(0, 100)}
                            {JSON.stringify(log.metadata).length > 100 && '...'}
                          </pre>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <a
                    href={`?page=${page - 1}${params.action ? `&action=${params.action}` : ''}${params.entity ? `&entity=${params.entity}` : ''}`}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border hover:bg-muted"
                  >
                    Previous
                  </a>
                )}
                {page < totalPages && (
                  <a
                    href={`?page=${page + 1}${params.action ? `&action=${params.action}` : ''}${params.entity ? `&entity=${params.entity}` : ''}`}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border hover:bg-muted"
                  >
                    Next
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
