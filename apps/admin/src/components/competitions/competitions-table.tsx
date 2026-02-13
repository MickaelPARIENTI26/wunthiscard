'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatPrice, formatDate, calculateProgress } from '@winthiscard/shared';
import { COMPETITION_CATEGORIES, COMPETITION_STATUSES } from '@winthiscard/shared';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Eye,
  ArrowUpDown,
  Dices,
  Star,
} from 'lucide-react';
import type { CompetitionCategory, CompetitionStatus } from '@winthiscard/database';
import { deleteCompetition, duplicateCompetition, updateCompetitionStatus } from '@/app/dashboard/competitions/actions';

interface Competition {
  id: string;
  slug: string;
  title: string;
  category: CompetitionCategory;
  status: CompetitionStatus;
  isFeatured: boolean;
  prizeValue: { toString(): string };
  ticketPrice: { toString(): string };
  totalTickets: number;
  drawDate: Date;
  createdAt: Date;
  _count: {
    tickets: number;
    orders: number;
  };
}

interface CompetitionsTableProps {
  data: Competition[];
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

const columns: ColumnDef<Competition>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Title
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.title}</span>
          {row.original.isFeatured && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500 text-black">
              <Star className="h-3 w-3" fill="currentColor" />
              FEATURED
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {COMPETITION_CATEGORIES[row.original.category]}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={statusColors[row.original.status]}>
        {COMPETITION_STATUSES[row.original.status].label}
      </Badge>
    ),
    filterFn: (row, id, value) => {
      return value === 'all' || row.getValue(id) === value;
    },
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => COMPETITION_CATEGORIES[row.original.category],
    filterFn: (row, id, value) => {
      return value === 'all' || row.getValue(id) === value;
    },
  },
  {
    accessorKey: 'prizeValue',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Prize Value
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => formatPrice(Number(row.original.prizeValue)),
  },
  {
    accessorKey: 'ticketPrice',
    header: 'Ticket Price',
    cell: ({ row }) => formatPrice(Number(row.original.ticketPrice)),
  },
  {
    id: 'progress',
    header: 'Tickets Sold',
    cell: ({ row }) => {
      const sold = row.original._count.tickets;
      const total = row.original.totalTickets;
      const progress = calculateProgress(sold, total);
      return (
        <div className="w-24">
          <div className="flex justify-between text-xs mb-1">
            <span>{sold}</span>
            <span className="text-muted-foreground">/ {total}</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'drawDate',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Draw Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => formatDate(row.original.drawDate),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const competition = row.original;
      const canDelete = competition.status === 'DRAFT';
      const canPublish = competition.status === 'DRAFT';
      const canActivate = competition.status === 'UPCOMING';

      // Can draw if: SOLD_OUT or (ACTIVE/SOLD_OUT and draw date has passed)
      const drawDatePassed = new Date(competition.drawDate) <= new Date();
      const canDraw =
        competition.status !== 'COMPLETED' &&
        competition.status !== 'CANCELLED' &&
        competition.status !== 'DRAFT' &&
        competition.status !== 'UPCOMING' &&
        (competition.status === 'SOLD_OUT' || drawDatePassed);

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/competitions/${competition.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/competitions/${competition.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => duplicateCompetition(competition.id)}
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {canDraw && (
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/competitions/${competition.id}/draw`}>
                  <Dices className="mr-2 h-4 w-4" />
                  Execute Draw
                </Link>
              </DropdownMenuItem>
            )}
            {canPublish && (
              <DropdownMenuItem
                onClick={() => updateCompetitionStatus(competition.id, 'UPCOMING')}
              >
                Publish (Upcoming)
              </DropdownMenuItem>
            )}
            {canActivate && (
              <DropdownMenuItem
                onClick={() => updateCompetitionStatus(competition.id, 'ACTIVE')}
              >
                Activate
              </DropdownMenuItem>
            )}
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => deleteCompetition(competition.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function CompetitionsTable({ data }: CompetitionsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search competitions..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={(table.getColumn('status')?.getFilterValue() as string) ?? 'all'}
          onValueChange={(value) =>
            table.getColumn('status')?.setFilterValue(value === 'all' ? '' : value)
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(COMPETITION_STATUSES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={(table.getColumn('category')?.getFilterValue() as string) ?? 'all'}
          onValueChange={(value) =>
            table.getColumn('category')?.setFilterValue(value === 'all' ? '' : value)
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(COMPETITION_CATEGORIES).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                <TableRow key={row.id}>
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
                  No competitions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}{' '}
          to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{' '}
          of {table.getFilteredRowModel().rows.length} results
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
