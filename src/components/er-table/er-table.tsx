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
import { Badge } from '@/components/ui/badge'
import { ChevronDown, Search, RefreshCw, Filter, Brain } from 'lucide-react'
import { AIAnalysisModal } from './ai-analysis-modal'

import { columns } from './columns'
import { ERDetailDialog } from '../er-detail/er-detail-dialog'
import { ZendeskSyncButton } from './zendesk-sync-button'
import { DataTableFacetedFilter } from './data-table-faceted-filter'
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
  const [statusFilter, setStatusFilter] = useState<ERStatus[]>([])
  const [selectedERId, setSelectedERId] = useState<string | null>(null)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [companyFilter, setCompanyFilter] = useState<string[]>([])
  const [releaseFilter, setReleaseFilter] = useState<string[]>([])
  const [devStatusFilter, setDevStatusFilter] = useState<string[]>([])
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
    status: statusFilter.length > 0 ? statusFilter : undefined,
    companyId: companyFilter.length > 0 ? companyFilter : undefined,
    releaseId: releaseFilter.length > 0 ? releaseFilter : undefined,
    devStatusId: devStatusFilter.length > 0 ? devStatusFilter : undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    sort: sorting.length > 0
      ? sorting.map(s => `${s.desc ? '-' : ''}${s.id}`).join(',')
      : undefined,
    ...initialFilters,
  }

  // Fetch filter options
  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await apiRequest('/api/companies')
      return res.json()
    }
  })

  const { data: releases } = useQuery({
    queryKey: ['releases'],
    queryFn: async () => {
      const res = await apiRequest('/api/releases')
      return res.json()
    }
  })

  const { data: devStatuses } = useQuery({
    queryKey: ['dev-statuses'],
    queryFn: async () => {
      const res = await apiRequest('/api/dev-statuses')
      return res.json()
    }
  })

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
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ERs..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-8 h-9"
            />
          </div>

          <DataTableFacetedFilter
            title="Status"
            selectedValues={statusFilter}
            onSelect={(values) => setStatusFilter(values as ERStatus[])}
            options={[
              { label: 'Open', value: 'OPEN' },
              { label: 'In Review', value: 'IN_REVIEW' },
              { label: 'Accept', value: 'ACCEPT' },
              { label: 'Accepted', value: 'ACCEPTED' },
              { label: 'Delivered', value: 'DELIVERED' },
              { label: 'Manual Review', value: 'MANUAL_REVIEW' },
              { label: 'Reject', value: 'REJECT' },
              { label: 'Rejected', value: 'REJECTED' },
            ]}
          />

          <DataTableFacetedFilter
            title="Company"
            selectedValues={companyFilter}
            onSelect={setCompanyFilter}
            options={companies?.map((c: any) => ({ label: c.name, value: c.id })) || []}
          />

          <DataTableFacetedFilter
            title="Release"
            selectedValues={releaseFilter}
            onSelect={setReleaseFilter}
            options={releases?.map((r: any) => ({ label: r.name, value: r.id })) || []}
          />

          <DataTableFacetedFilter
            title="JIRA Status"
            selectedValues={devStatusFilter}
            onSelect={setDevStatusFilter}
            options={devStatuses?.map((s: any) => ({ label: s.name, value: s.id })) || []}
          />

          {Object.keys(rowSelection).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 border-primary text-primary hover:bg-primary/5"
              onClick={() => setAiModalOpen(true)}
            >
              <Brain className="h-4 w-4" />
              IA Analysis ({Object.keys(rowSelection).length})
            </Button>
          )}

          {data && (
            <Badge variant="secondary" className="h-9 px-3">
              {data.total} ERs
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Any items that should be on the left below the filters */}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="h-9"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <ZendeskSyncButton />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
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