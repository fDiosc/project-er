'use client'

import { AuthGuard } from '@/components/auth-guard'
import { Navigation } from '@/components/layout/navigation'
import { ZendeskConfigForm } from '@/components/settings/zendesk-config-form'

export default function SettingsPage() {
    return (
        <AuthGuard>
            <div className="min-h-screen bg-background">
                <Navigation />
                <main className="container mx-auto py-6 space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                        <p className="text-muted-foreground">
                            Manage application settings and integrations.
                        </p>
                    </div>

                    <div className="grid gap-6">
                        <ZendeskConfigForm />
                    </div>
                </main>
            </div>
        </AuthGuard>
    )
}
