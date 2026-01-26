import { Navigation } from '@/components/layout/navigation'
import { ERTable } from '@/components/er-table/er-table'
import { AuthGuard } from '@/components/auth-guard'

export default function Home() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto py-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Enhancement Requests</h1>
              <p className="text-muted-foreground">
                Manage and track enhancement requests with advanced filtering and analytics
              </p>
            </div>
            <ERTable />
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
