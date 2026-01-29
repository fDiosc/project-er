'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  BarChart3,
  List,
  Settings,
  Plus,
  Filter,
  Upload,
  Download,
  LogOut,
  User,
  Layers,
  Brain,
  TrendingUp
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CSVImportDialog } from '../import/csv-import-dialog'
import { CreateERDialog } from '../er-table/create-er-dialog'
import { useAuth } from '@/components/auth-provider'

const navigation = [
  { name: 'ER List', href: '/', icon: List },
  { name: 'AI Reports', href: '/ai-analysis', icon: Brain },
  { name: 'Clusters', href: '/clusters', icon: Layers },
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  // { name: 'Smart Dashboard', href: '/smart-dashboard', icon: TrendingUp },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [createEROpen, setCreateEROpen] = useState(false)
  const { user, logout } = useAuth()

  const handleExportCSV = () => {
    // Construct export URL with current filters (if any)
    const exportUrl = '/api/export/csv'

    // Create a temporary link and trigger download
    const link = document.createElement('a')
    link.href = exportUrl
    link.download = `ers-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="border-b print:hidden">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">ER Review</h2>
        </div>

        <nav className="mx-6 flex items-center space-x-4 lg:space-x-6">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary',
                  pathname === item.href
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search ERs..."
              className="w-64 pl-8"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setCreateEROpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New ER
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4 mr-2" />
                {user?.username}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CSVImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
      <CreateERDialog
        open={createEROpen}
        onOpenChange={setCreateEROpen}
      />
    </div>
  )
}