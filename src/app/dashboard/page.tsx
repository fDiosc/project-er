import { Navigation } from '@/components/layout/navigation'
import { Dashboard } from '@/components/dashboard/dashboard'
import { QueryProvider } from '@/components/providers/query-provider'
import { AuthGuard } from '@/components/auth-guard'

export default function DashboardPage() {
  return (
    <QueryProvider>
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <Navigation />
          <main className="container mx-auto py-6">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                  Overview of Enhancement Requests with key metrics and analytics
                </p>
              </div>
              <Dashboard />
            </div>
          </main>
        </div>
      </AuthGuard>
    </QueryProvider>
  )
}