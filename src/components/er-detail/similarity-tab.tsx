'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Loader2, CheckCircle2, ChevronRight, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { get, post } from '@/lib/api'
import { SimilarERResponse, ConsolidatedPRDResponse } from '@/lib/openai'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface SimilarityTabProps {
    erId: string
    targetExternalId?: string | null
    themeId?: string | null
    onConsolidated: () => void
}

export function SimilarityTab({ erId, targetExternalId, themeId, onConsolidated }: SimilarityTabProps) {
    const queryClient = useQueryClient()
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [prd, setPrd] = useState<ConsolidatedPRDResponse | null>(null)
    const [candidates, setCandidates] = useState<SimilarERResponse['similarERs']>([])
    const [isSearching, setIsSearching] = useState(false)

    // Step 0: Fetch theme if exists
    const { data: themeData, isLoading: isLoadingTheme } = useQuery({
        queryKey: ['theme', themeId],
        queryFn: () => get(`/api/themes/${themeId}`),
        enabled: !!themeId,
    })

    // If theme exists, sync it to the locally shared prd state for rendering
    if (themeData && !prd) {
        setPrd({
            title: themeData.title,
            summary: themeData.description,
            requirements: themeData.requirements,
            suggestedScores: themeData.suggestedScores
        })
    }

    // Step 1: Find Similar
    const findSimilar = async () => {
        setIsSearching(true)
        try {
            const data: SimilarERResponse = await get(`/api/ers/${erId}/similar`)
            setCandidates(data.similarERs)
            if (data.similarERs.length === 0) {
                toast.info('No similar ERs found in the backlog.')
            } else {
                toast.success(`${data.similarERs.length} candidates found.`)
            }
        } catch (error) {
            toast.error('Error searching for similar ERs')
        } finally {
            setIsSearching(false)
        }
    }

    // Step 2: Generate PRD
    const generatePrdMutation = useMutation({
        mutationFn: (ids: string[]) => post('/api/ers/generate-prd', { erIds: [erId, ...ids] }),
        onSuccess: (data: ConsolidatedPRDResponse) => {
            setPrd(data)
            toast.success('PRD generated successfully!')
        },
        onError: () => toast.error('Error generating PRD')
    })

    // Step 3: Approve & Save
    const approveMutation = useMutation({
        mutationFn: (data: any) => post('/api/themes', data),
        onSuccess: () => {
            toast.success('Consolidation complete and ERs updated!')
            queryClient.invalidateQueries({ queryKey: ['er', erId] })
            queryClient.invalidateQueries({ queryKey: ['ers'] })
            onConsolidated()
        },
        onError: () => toast.error('Error saving consolidation')
    })

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleGeneratePRD = () => {
        if (selectedIds.length === 0) {
            toast.warning('Please select at least one ER to consolidate.')
            return
        }
        generatePrdMutation.mutate(selectedIds)
    }

    const handleApprove = () => {
        if (!prd) return
        approveMutation.mutate({
            title: prd.title,
            description: prd.summary,
            requirements: prd.requirements,
            erIds: [erId, ...selectedIds],
            suggestedScores: prd.suggestedScores
        })
    }

    if (isLoadingTheme) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        )
    }

    if (!themeId && candidates.length === 0 && !isSearching) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                    <Sparkles className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                    <h3 className="font-semibold text-lg">Find Similar ERs</h3>
                    <p className="text-sm text-muted-foreground max-w-sm px-4">
                        The AI will scan the backlog to find requests with direct technical and functional intersection to this ER.
                    </p>
                </div>
                <Button onClick={findSimilar} className="bg-purple-600 hover:bg-purple-700">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Find Similar
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {!prd ? (
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                Candidates for Consolidation
                            </h3>
                            <Badge variant="outline">{candidates.length} found</Badge>
                        </div>

                        <ScrollArea className="h-[350px] pr-4">
                            <div className="space-y-3">
                                {candidates.map((cand) => (
                                    <div
                                        key={cand.id}
                                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${selectedIds.includes(cand.id)
                                            ? 'border-purple-500 bg-purple-50/30'
                                            : 'border-slate-100 hover:border-slate-200'
                                            }`}
                                        onClick={() => toggleSelection(cand.id)}
                                    >
                                        <Checkbox
                                            checked={selectedIds.includes(cand.id)}
                                            onCheckedChange={() => toggleSelection(cand.id)}
                                            className="mt-1"
                                        />
                                        <div className="space-y-2 flex-grow">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-sm leading-none">{cand.subject}</h4>
                                                    {cand.externalId && (
                                                        <a
                                                            href={`/?erId=${cand.id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="transition-transform hover:scale-105"
                                                        >
                                                            <Badge variant="outline" className="text-[10px] font-mono cursor-pointer hover:bg-slate-100">
                                                                ID: {cand.externalId}
                                                            </Badge>
                                                        </a>
                                                    )}
                                                </div>
                                                <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-700 border-none shrink-0">
                                                    {cand.similarityScore}% similar
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed italic">
                                                &quot;{cand.functionalReasoning}&quot;
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={handleGeneratePRD}
                                disabled={selectedIds.length === 0 || generatePrdMutation.isPending}
                                className="bg-purple-600 hover:bg-purple-700 min-w-[200px]"
                            >
                                {generatePrdMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Synthesizing Requirements...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Generate Consolidated PRD
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <Card className="border-2 shadow-lg overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-bold text-slate-900">{prd.title}</CardTitle>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight mr-2">
                                        {themeId ? 'Mirrored Tickets:' : 'Selected Candidates:'}
                                    </span>
                                    {themeId && themeData?.ers ? (
                                        themeData.ers.map((e: any) => (
                                            <a
                                                key={e.id}
                                                href={`/?erId=${e.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Badge variant="secondary" className="bg-slate-200 text-primary font-mono text-[10px] hover:bg-slate-300">
                                                    ID: {e.externalId || e.id}
                                                </Badge>
                                            </a>
                                        ))
                                    ) : (
                                        selectedIds.map(id => {
                                            const cand = candidates.find(c => c.id === id)
                                            return cand?.externalId ? (
                                                <Badge key={id} variant="secondary" className="bg-slate-200 text-slate-700 font-mono text-[10px]">
                                                    ID: {cand.externalId}
                                                </Badge>
                                            ) : null
                                        })
                                    )}
                                </div>
                            </div>
                            {!themeId && (
                                <Button variant="ghost" size="sm" onClick={() => setPrd(null)} className="text-muted-foreground">
                                    Discard and Go Back
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold uppercase text-purple-600 mb-2">Overview</h4>
                                    <p className="text-sm text-slate-700 leading-relaxed font-medium italic">&quot;{prd.summary}&quot;</p>
                                </div>
                                <Separator />
                                <div>
                                    <h4 className="text-xs font-bold uppercase text-blue-600 mb-4">Functional Intersection</h4>
                                    <div className="grid gap-4">
                                        {prd.requirements.map((req, i) => (
                                            <div key={i} className="flex gap-4 p-4 bg-slate-50/50 rounded-lg border">
                                                <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                    {i + 1}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm">{req.title}</span>
                                                        <Badge variant="outline" className={`text-[9px] ${req.priority === 'MUST' ? 'border-red-200 bg-red-50 text-red-700' : 'border-blue-200 bg-blue-50 text-blue-700'
                                                            }`}>
                                                            {req.priority}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-slate-600">{req.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <Separator />
                                <div className="p-4 bg-green-50/50 border border-green-100 rounded-xl">
                                    <h4 className="text-xs font-bold uppercase text-green-700 mb-3 flex items-center gap-2">
                                        <Sparkles className="h-3 w-3" /> Approved Group Scores
                                    </h4>
                                    <div className="flex flex-wrap gap-4">
                                        {(prd.suggestedScores || (prd as any).scores) && typeof (prd.suggestedScores || (prd as any).scores) === 'object' ?
                                            Object.entries(prd.suggestedScores || (prd as any).scores).map(([key, val]) => {
                                                const labelMap: Record<string, string> = {
                                                    strategic: 'Strategic',
                                                    impact: 'Impact',
                                                    market: 'Market',
                                                    technical: 'Technical',
                                                    resource: 'Resource'
                                                }
                                                return (
                                                    <div key={key} className="flex flex-col">
                                                        <span className="text-[10px] text-green-600 uppercase font-bold">{labelMap[key.toLowerCase()] || key}</span>
                                                        <span className="text-lg font-bold text-green-900">{val as number}/5</span>
                                                    </div>
                                                )
                                            }) : (
                                                <p className="text-xs text-green-600 italic">Scores not available for this group.</p>
                                            )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {!themeId && (
                        <div className="flex flex-col items-center gap-4 text-center pb-6">
                            <p className="text-xs text-muted-foreground">
                                Upon approval, this ER and the <strong>{selectedIds.length} candidate(s)</strong> will be marked as <strong>ACCEPT</strong> <br />
                                and receive the suggested scores above.
                            </p>
                            <Button
                                onClick={handleApprove}
                                disabled={approveMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 h-14 px-12 text-lg font-bold shadow-xl min-w-[300px]"
                            >
                                {approveMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                                        Finalizing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-5 w-5 mr-3" />
                                        Approve Consolidation
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
