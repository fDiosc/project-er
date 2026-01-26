import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CloudDownload, Settings2 } from 'lucide-react'
import { post } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

export function ZendeskSyncButton() {
    const [isSyncing, setIsSyncing] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [autoReject, setAutoReject] = useState(false)
    const [autoAccept, setAutoAccept] = useState(false)
    const [runAI, setRunAI] = useState(false)
    const queryClient = useQueryClient()

    const handleSync = async () => {
        setIsSyncing(true)
        try {
            // Trigger sync
            const result = await post('/api/integrations/zendesk/sync', {
                autoRejectMissing: autoReject,
                autoAcceptMapped: autoAccept,
                runAI: runAI
            })

            if (result.success) {
                toast.success(result.message || 'Zendesk sync completed successfully')
                // Invalidate ER list to refresh data
                queryClient.invalidateQueries({ queryKey: ['ers'] })
                setIsOpen(false)
            } else {
                toast.error(result.message || 'Sync failed')
            }
        } catch (error) {
            console.error('Sync failed:', error)
            toast.error('Failed to sync with Zendesk. Check console for details.')
        } finally {
            setIsSyncing(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <CloudDownload className="mr-2 h-4 w-4" />
                    Sync Zendesk
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Sync with Zendesk</DialogTitle>
                    <DialogDescription>
                        Configuration options for the synchronization process.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="auto-reject"
                            checked={autoReject}
                            onCheckedChange={(checked) => setAutoReject(!!checked)}
                        />
                        <Label htmlFor="auto-reject" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Auto-reject missing tickets
                        </Label>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                        If checked, tickets previously synced but no longer present in the target Zendesk View will be marked as REJECTED.
                    </p>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="auto-accept"
                            checked={autoAccept}
                            onCheckedChange={(checked) => setAutoAccept(!!checked)}
                        />
                        <Label htmlFor="auto-accept" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Auto-accept mapped statuses
                        </Label>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                        If checked, tickets with specific Zendesk statuses will be marked as ACCEPTED.
                    </p>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="run-ai"
                            checked={runAI}
                            onCheckedChange={(checked) => setRunAI(!!checked)}
                        />
                        <Label htmlFor="run-ai" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Run AI Context Enrichment
                        </Label>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                        Uses GPT-5.2 to summarize ticket comments and suggest prioritization scores.
                    </p>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSync} disabled={isSyncing}>
                        {isSyncing ? (
                            <>
                                <CloudDownload className="mr-2 h-4 w-4 animate-pulse" />
                                Syncing...
                            </>
                        ) : (
                            'Start Sync'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
