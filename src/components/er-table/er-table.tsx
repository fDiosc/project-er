'use client'

import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, Search, RefreshCw, Filter, Brain } from 'lucide-react'
import { AIAnalysisModal } from './ai-analysis-modal'

import { columns } from './columns'
import { ERDetailDialog } from '../er-detail/er-detail-dialog'
import { ZendeskSyncButton } from './zendesk-sync-button'
import { ERFilters, PaginatedResponse, ERDto } from '@/types'
import { apiRequest } from '@/lib/api'
import { ERStatus } from '@prisma/client'

async function fetchERs(filters: ERFilters): Promise<PaginatedResponse<ERDto>> {
  const searchParams = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'ALL') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(`${key}[]`, v))
      } else {
        searchParams.append(key, String(value))
      }
    }
  })

  const response = await apiRequest(`/api/ers?${searchParams}`)
  if (!response.ok) {
    throw new Error('Failed to fetch ERs')
  }
  return response.json()
}

interface ERTableProps {
  initialFilters?: Partial<ERFilters>
}

export function ERTable({ initialFilters = {} }: ERTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedERId, setSelectedERId] = useState<string | null>(null)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  // Sync URL erId with selectedERId state
  useEffect(() => {
    const erIdFromUrl = searchParams.get('erId')
    if (erIdFromUrl && erIdFromUrl !== selectedERId) {
      setSelectedERId(erIdFromUrl)
    }
  }, [searchParams, selectedERId])

  const handleOpenDialog = (id: string) => {
    setSelectedERId(id)
    const params = new URLSearchParams(searchParams.toString())
    params.set('erId', id)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleCloseDialog = () => {
    setSelectedERId(null)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('erId')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // Build filters from state
  const filters: ERFilters = {
    q: globalFilter || undefined,
    status: statusFilter === 'ALL' ? undefined : (statusFilter as ERStatus),
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    sort: sorting.length > 0
      ? sorting.map(s => `${s.desc ? '-' : ''}${s.id}`).join(',')
      : undefined,
    ...initialFilters,
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ers', filters],
    queryFn: () => fetchERs(filters),
  })

  const table = useReactTable({
    data: data?.items || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getRowId: (row) => row.id,
    pageCount: data?.totalPages || 0,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  })

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive mb-2">Error loading ERs</p>
          <p className="text-sm text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ERs..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-8"
            />
          </div>

          {Object.keys(rowSelection).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-primary text-primary hover:bg-primary/5"
              onClick={() => setAiModalOpen(true)}
            >
              <Brain className="h-4 w-4" />
              IA Analysis ({Object.keys(rowSelection).length})
            </Button>
          )}

          <div className="w-[180px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                <SelectItem value="ACCEPT">Accept</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="MANUAL_REVIEW">Manual Review</SelectItem>
                <SelectItem value="REJECT">Reject</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {data && (
            <Badge variant="secondary">
              {data.total} ERs
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <ZendeskSyncButton />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Loading ERs...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleOpenDialog(row.original.id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No ERs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {data && (
            <>
              Showing {Math.min(pagination.pageIndex * pagination.pageSize + 1, data.total)} to{' '}
              {Math.min((pagination.pageIndex + 1) * pagination.pageSize, data.total)} of{' '}
              {data.total} results
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      <ERDetailDialog
        erId={selectedERId}
        onClose={handleCloseDialog}
      />

      <AIAnalysisModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        selectedIds={table.getSelectedRowModel().rows.map(row => row.id)}
      />
    </div>
  )
}