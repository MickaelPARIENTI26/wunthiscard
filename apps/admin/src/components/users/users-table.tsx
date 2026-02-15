'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@winucard/shared';
import { Search, MoreHorizontal, Eye, Ban, ShieldCheck, ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { banUser, unbanUser } from '@/app/dashboard/users/actions';

interface UserWithCounts {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isBanned: boolean;
  emailVerified: Date | null;
  createdAt: Date;
  _count: {
    orders: number;
    tickets: number;
    wins: number;
  };
}

interface UsersTableProps {
  users: UserWithCounts[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export function UsersTable({ users, currentPage, totalPages, totalCount }: UsersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [isExporting, setIsExporting] = useState(false);

  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') {
      params.delete('page');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = () => {
    updateSearchParams('search', search);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const status = searchParams.get('status') || '';
      const params = new URLSearchParams();
      if (status && status !== 'all') {
        params.set('status', status);
      }
      const response = await fetch(`/api/export/users?${params.toString()}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export complete',
        description: 'Users have been exported to CSV.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const columns: ColumnDef<UserWithCounts>[] = [
    {
      accessorKey: 'email',
      header: 'User',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div>
            <Link
              href={`/dashboard/users/${user.id}`}
              className="font-medium hover:underline"
            >
              {user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.email}
            </Link>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <Badge variant={role === 'ADMIN' ? 'default' : 'secondary'}>
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const user = row.original;
        if (user.isBanned) {
          return <Badge variant="destructive">Banned</Badge>;
        }
        if (user.emailVerified) {
          return <Badge variant="success">Verified</Badge>;
        }
        return <Badge variant="outline">Unverified</Badge>;
      },
    },
    {
      accessorKey: '_count.orders',
      header: 'Orders',
      cell: ({ row }) => row.original._count.orders,
    },
    {
      accessorKey: '_count.tickets',
      header: 'Tickets',
      cell: ({ row }) => row.original._count.tickets,
    },
    {
      accessorKey: '_count.wins',
      header: 'Wins',
      cell: ({ row }) => {
        const wins = row.original._count.wins;
        return wins > 0 ? (
          <Badge variant="success">{wins}</Badge>
        ) : (
          '0'
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/users/${user.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user.isBanned ? (
                <DropdownMenuItem
                  onClick={() => {
                    startTransition(async () => {
                      await unbanUser(user.id);
                    });
                  }}
                  disabled={isPending}
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Unban User
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => {
                    startTransition(async () => {
                      await banUser(user.id);
                    });
                  }}
                  disabled={isPending}
                  className="text-destructive"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Ban User
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
        <Select
          value={searchParams.get('status') || 'all'}
          onValueChange={(value) => updateSearchParams('status', value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch}>Search</Button>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={(e) => {
                    // Don't navigate if clicking on action menu or buttons
                    const target = e.target as HTMLElement;
                    if (target.closest('button') || target.closest('[role="menuitem"]') || target.closest('a')) {
                      return;
                    }
                    router.push(`/dashboard/users/${row.original.id}`);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, totalCount)} of{' '}
          {totalCount} users
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateSearchParams('page', String(currentPage - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateSearchParams('page', String(currentPage + 1))}
            disabled={currentPage >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
