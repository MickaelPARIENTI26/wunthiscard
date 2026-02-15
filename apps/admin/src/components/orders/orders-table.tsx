'use client';

import { useState } from 'react';
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
import { formatPrice, formatDateTime } from '@winucard/shared';
import { Search, ChevronLeft, ChevronRight, Eye, Download, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import type { PaymentStatus } from '@winucard/database';

interface OrderWithRelations {
  id: string;
  ticketCount: number;
  totalAmount: number | { toNumber: () => number };
  paymentStatus: PaymentStatus;
  createdAt: Date;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  competition: {
    id: string;
    title: string;
  };
  _count: {
    tickets: number;
  };
}

interface Competition {
  id: string;
  title: string;
}

interface OrdersTableProps {
  orders: OrderWithRelations[];
  competitions: Competition[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

const statusColors: Record<PaymentStatus, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'> = {
  PENDING: 'warning',
  PROCESSING: 'default',
  SUCCEEDED: 'success',
  FAILED: 'destructive',
  REFUNDED: 'outline',
  CANCELLED: 'secondary',
};

export function OrdersTable({ orders, competitions, currentPage, totalPages, totalCount }: OrdersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
      const response = await fetch(`/api/export/orders?${params.toString()}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export complete',
        description: 'Orders have been exported to CSV.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export orders. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const columns: ColumnDef<OrderWithRelations>[] = [
    {
      accessorKey: 'id',
      header: 'Order ID',
      cell: ({ row }) => (
        <Link
          href={`/dashboard/orders/${row.original.id}`}
          className="font-mono text-sm hover:underline"
        >
          {row.original.id.slice(0, 8)}...
        </Link>
      ),
    },
    {
      accessorKey: 'user',
      header: 'Customer',
      cell: ({ row }) => {
        const user = row.original.user;
        if (!user) {
          return (
            <div>
              <span className="font-medium text-muted-foreground italic">Deleted User</span>
            </div>
          );
        }
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
      accessorKey: 'competition',
      header: 'Competition',
      cell: ({ row }) => (
        <Link
          href={`/dashboard/competitions/${row.original.competition.id}`}
          className="hover:underline"
        >
          {row.original.competition.title}
        </Link>
      ),
    },
    {
      accessorKey: 'ticketCount',
      header: 'Tickets',
      cell: ({ row }) => row.original.ticketCount,
    },
    {
      accessorKey: 'totalAmount',
      header: 'Amount',
      cell: ({ row }) => {
        const amount = row.original.totalAmount;
        const numAmount = typeof amount === 'object' && 'toNumber' in amount
          ? amount.toNumber()
          : Number(amount);
        return formatPrice(numAmount);
      },
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={statusColors[row.original.paymentStatus]}>
          {row.original.paymentStatus}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => formatDateTime(row.original.createdAt),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/orders/${row.original.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order ID or email..."
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
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="SUCCEEDED">Succeeded</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={searchParams.get('competition') || 'all'}
          onValueChange={(value) => updateSearchParams('competition', value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter competition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Competitions</SelectItem>
            {competitions.map((comp) => (
              <SelectItem key={comp.id} value={comp.id}>
                {comp.title}
              </SelectItem>
            ))}
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
                    // Don't navigate if clicking on action buttons or links
                    const target = e.target as HTMLElement;
                    if (target.closest('button') || target.closest('a')) {
                      return;
                    }
                    router.push(`/dashboard/orders/${row.original.id}`);
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
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, totalCount)} of{' '}
          {totalCount} orders
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
