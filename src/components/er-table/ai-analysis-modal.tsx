'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Brain, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { apiRequest } from '@/lib/api'

interface AIAnalysisModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedIds: string[]
}

export function AIAnalysisModal({ open, onOpenChange, selectedIds }: AIAnalysisModalProps) {
    const [prompt, setPrompt] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleAnalyze = async () => {
        if (!prompt.trim()) {
            toast.error('Please enter a prompt for the analysis')
            return
        }

        setIsLoading(true)
        try {
            const response = await apiRequest('/api/ai-analysis', {
                method: 'POST',
                body: JSON.stringify({
                    erIds: selectedIds,
                    prompt: prompt,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to generate analysis')
            }

            toast.success('Analysis generated successfully!')
            onOpenChange(false)
            setPrompt('')
            router.push(`/ai-analysis/${data.id}`)
        } catch (error) {
            console.error('AI Analysis failed:', error)
            toast.error(error instanceof Error ? error.message : 'Something went wrong')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        AI Custom Analysis
                    </DialogTitle>
                    <DialogDescription>
                        Selected {selectedIds.length} ERs. Tell the AI what you want to analyze or find in these requests.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea
                        placeholder="e.g., What are the common functional requirements for analytics in these ERs? Who are the main stakeholders?"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[150px] resize-none"
                        disabled={isLoading}
                    />
                </div>
                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAnalyze}
                        disabled={isLoading || !prompt.trim()}
                        className="gap-2"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Brain className="h-4 w-4" />
                        )}
                        Analyze with AI
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
