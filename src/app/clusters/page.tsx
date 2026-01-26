'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Navigation } from '@/components/layout/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Layers,
    Search,
    Calendar,
    ChevronRight,
    FileText,
    Users,
    Loader2,
    AlertCircle,
    Sparkles,
    Plus,
    X,
    Check,
    Trash2
} from 'lucide-react'
import { get, patch } from '@/lib/api'
import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface Theme {
    id: string
    title: string
    description: string
    createdAt: string
    requirements: any[]
    suggestedScores: any
    ers: Array<{
        id: string
        externalId: string
        subject: string
        status: string
        company?: { name: string }
    }>
    _count: {
        ers: number
    }
}

interface ER {
    id: string
    externalId: string
    subject: string
    status: string
    company: { name: string }
    themeId?: string | null
}

export default function ClustersPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null)
    const [isAddingER, setIsAddingER] = useState(false)
    const [erSearchTerm, setErSearchTerm] = useState('')
    const [selectedERIds, setSelectedERIds] = useState<string[]>([])

    const queryClient = useQueryClient()

    const { data: themes = [], isLoading, error } = useQuery<Theme[]>({
        queryKey: ['themes'],
        queryFn: () => get('/api/themes'),
    })

    const { data: themeDetails, isLoading: isLoadingDetails } = useQuery<Theme>({
        queryKey: ['theme', selectedThemeId],
        queryFn: () => get(`/api/themes/${selectedThemeId}`),
        enabled: !!selectedThemeId,
    })

    const { data: availableERsData, isLoading: isLoadingERs } = useQuery<{ items: ER[] }>({
        queryKey: ['available-ers', erSearchTerm],
        queryFn: () => get(`/api/ers?q=${erSearchTerm}&pageSize=50`),
        enabled: isAddingER,
    })

    const availableERs = availableERsData?.items || []

    const updateClusterMutation = useMutation({
        mutationFn: ({ erIds, action }: { erIds: string[], action: 'add' | 'remove' | 'regenerate' }) =>
            patch(`/api/themes/${selectedThemeId}`, { erIds, action }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['themes'] })
            queryClient.invalidateQueries({ queryKey: ['theme', selectedThemeId] })
            setIsAddingER(false)
            setSelectedERIds([])
            setErSearchTerm('')
        }
    })

    const filteredThemes = themes.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const formatDate = (dateStr: string) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        }).format(new Date(dateStr))
    }

    const unassignedERs = availableERs.filter(er => !er.themeId)

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-blue-100 text-blue-700'
            case 'IN_REVIEW': return 'bg-yellow-100 text-yellow-700'
            case 'ACCEPTED': return 'bg-green-100 text-green-700'
            case 'ACCEPT': return 'bg-green-100 text-green-700'
            case 'REJECTED': return 'bg-red-100 text-red-700'
            case 'REJECT': return 'bg-red-100 text-red-700'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <Layers className="h-8 w-8 text-purple-600" />
                            Requirement Clusters
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage and track all consolidated enhancement requests and their PRDs.
                        </p>
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search clusters..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
                        <p className="text-muted-foreground mt-4 font-medium">Loading clusters...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-100 p-8 rounded-2xl flex flex-col items-center text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                        <h3 className="text-lg font-bold text-red-900">Failed to load clusters</h3>
                        <p className="text-red-700 mt-2">There was an error connecting to the server. Please try again later.</p>
                        <Button variant="outline" className="mt-6 border-red-200 text-red-700 hover:bg-red-100" onClick={() => window.location.reload()}>
                            Retry Connection
                        </Button>
                    </div>
                ) : filteredThemes.length === 0 ? (
                    <div className="bg-white border-2 border-dashed p-20 rounded-2xl flex flex-col items-center text-center">
                        <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
                            <Layers className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">No clusters found</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm">
                            {searchTerm
                                ? `No clusters match "${searchTerm}". Try a different search term.`
                                : "You haven't consolidated any ERs yet. Start by clustering similar requests in the ER List."}
                        </p>
                        {!searchTerm && (
                            <Button asChild className="mt-8 bg-purple-600 hover:bg-purple-700">
                                <a href="/">Go to ER List</a>
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredThemes.map((theme) => (
                            <Card
                                key={theme.id}
                                className="group hover:border-purple-300 transition-all cursor-pointer shadow-sm hover:shadow-md"
                                onClick={() => setSelectedThemeId(theme.id)}
                            >
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-none font-bold uppercase text-[9px]">
                                            Accepted
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(theme.createdAt)}
                                        </span>
                                    </div>
                                    <CardTitle className="text-lg font-bold group-hover:text-purple-600 transition-colors line-clamp-2">
                                        {theme.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-slate-600 line-clamp-3 italic min-h-[60px]">
                                        &quot;{theme.description || 'No description provided.'}&quot;
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                <Users className="h-3.5 w-3.5 text-purple-500" />
                                                {theme._count.ers} ERs
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                <FileText className="h-3.5 w-3.5 text-blue-500" />
                                                PRD Ready
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="text-purple-600 group-hover:bg-purple-50">
                                            View Details
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <Dialog open={!!selectedThemeId} onOpenChange={(open) => {
                    if (!open) {
                        setSelectedThemeId(null)
                        setIsAddingER(false)
                        setSelectedERIds([])
                    }
                }}>
                    <DialogContent className="sm:max-w-[80vw] w-[95vw] md:w-[80vw] max-h-[90vh] overflow-y-auto">
                        {isLoadingDetails ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <DialogTitle className="sr-only">Loading Cluster details...</DialogTitle>
                                <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
                                <p className="text-muted-foreground mt-4 font-medium">Loading details...</p>
                            </div>
                        ) : themeDetails ? (
                            <>
                                <DialogHeader>
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 pr-8">
                                        <div className="space-y-1">
                                            <DialogTitle className="text-2xl font-bold">{themeDetails.title}</DialogTitle>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                onClick={() => {
                                                    if (confirm('This will analyze all ERs in this cluster and regenerate the PRD and scores. This may take a moment. Continue?')) {
                                                        updateClusterMutation.mutate({ erIds: [], action: 'regenerate' })
                                                    }
                                                }}
                                                variant="secondary"
                                                className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                                                disabled={updateClusterMutation.isPending}
                                            >
                                                {updateClusterMutation.isPending && updateClusterMutation.variables?.action === 'regenerate' ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Sparkles className="h-4 w-4 mr-2" />
                                                )}
                                                Regenerate Analysis
                                            </Button>

                                            <Button
                                                onClick={() => setIsAddingER(!isAddingER)}
                                                variant={isAddingER ? "outline" : "default"}
                                                className={isAddingER ? "" : "bg-purple-600 hover:bg-purple-700"}
                                            >
                                                {isAddingER ? (
                                                    <><X className="h-4 w-4 mr-2" /> Cancel</>
                                                ) : (
                                                    <><Plus className="h-4 w-4 mr-2" /> Add ER</>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </DialogHeader>

                                {isAddingER && (
                                    <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 space-y-4 animate-in fade-in duration-300">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-bold text-purple-900 flex items-center gap-2">
                                                <Plus className="h-4 w-4" /> Add ERs to Cluster
                                            </h3>
                                            {selectedERIds.length > 0 && (
                                                <Button
                                                    size="sm"
                                                    className="bg-purple-600 hover:bg-purple-700"
                                                    onClick={() => updateClusterMutation.mutate({ erIds: selectedERIds, action: 'add' })}
                                                    disabled={updateClusterMutation.isPending}
                                                >
                                                    {updateClusterMutation.isPending ? (
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    ) : (
                                                        <Check className="h-4 w-4 mr-2" />
                                                    )}
                                                    Confirm Addition ({selectedERIds.length})
                                                </Button>
                                            )}
                                        </div>

                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search open ERs by subject, ID, or company..."
                                                className="pl-10 bg-white"
                                                value={erSearchTerm}
                                                onChange={(e) => setErSearchTerm(e.target.value)}
                                            />
                                        </div>

                                        <ScrollArea className="h-[200px] bg-white rounded-md border">
                                            {isLoadingERs ? (
                                                <div className="flex items-center justify-center h-full">
                                                    <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                                                </div>
                                            ) : unassignedERs.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                                                    <p className="text-sm">No available ERs found.</p>
                                                </div>
                                            ) : (
                                                <div className="p-2 space-y-1">
                                                    {unassignedERs.map(er => (
                                                        <div
                                                            key={er.id}
                                                            className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-md transition-colors cursor-pointer group"
                                                            onClick={() => {
                                                                setSelectedERIds(prev =>
                                                                    prev.includes(er.id)
                                                                        ? prev.filter(id => id !== er.id)
                                                                        : [...prev, er.id]
                                                                )
                                                            }}
                                                        >
                                                            <Checkbox
                                                                checked={selectedERIds.includes(er.id)}
                                                                onCheckedChange={() => { }} // Handled by div onClick
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-baseline gap-2">
                                                                    <span className="text-xs font-mono text-slate-400 shrink-0">#{er.externalId || er.id.substring(0, 8)}</span>
                                                                    <Badge variant="outline" className={`text-[9px] ${getStatusColor(er.status)}`}>
                                                                        {er.status}
                                                                    </Badge>
                                                                    <span className="text-sm font-semibold truncate text-slate-700">{er.subject}</span>
                                                                </div>
                                                                <div className="text-[10px] text-muted-foreground font-medium">{er.company.name}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </div>
                                )}

                                <div>
                                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Consolidated Tickets</h4>
                                    <div className="border rounded-md overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-slate-50">
                                                <TableRow>
                                                    <TableHead className="w-[100px]">ID</TableHead>
                                                    <TableHead>Subject</TableHead>
                                                    <TableHead className="w-[120px]">Status</TableHead>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {themeDetails.ers?.map(er => (
                                                    <TableRow key={er.id}>
                                                        <TableCell className="font-mono text-xs">
                                                            <a href={`/?erId=${er.id}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                                {er.externalId || er.id.substring(0, 8)}
                                                            </a>
                                                        </TableCell>
                                                        <TableCell className="text-sm font-medium">{er.subject}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary" className={`text-[10px] font-bold ${getStatusColor(er.status)}`}>
                                                                {er.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                                onClick={() => {
                                                                    if (confirm('Are you sure you want to remove this ER from the cluster? It will be unlinked but its status will remain unchanged.')) {
                                                                        updateClusterMutation.mutate({ erIds: [er.id], action: 'remove' })
                                                                    }
                                                                }}
                                                                disabled={updateClusterMutation.isPending}
                                                            >
                                                                {updateClusterMutation.isPending ? (
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="h-3 w-3" />
                                                                )}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                <div className="pt-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-xs font-bold uppercase text-purple-600 mb-2">Cluster Overview</h4>
                                                <p className="text-sm text-slate-700 leading-relaxed font-medium italic bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                    &quot;{themeDetails.description}&quot;
                                                </p>
                                            </div>

                                            <Separator />

                                            <div>
                                                <h4 className="text-xs font-bold uppercase text-blue-600 mb-4 flex items-center gap-2">
                                                    <FileText className="h-3 w-3" /> Functional Intersection
                                                </h4>
                                                <div className="grid gap-3">
                                                    {themeDetails.requirements?.map((req: any, i: number) => (
                                                        <div key={i} className="flex gap-4 p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                                                            <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                                {i + 1}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-sm text-slate-800">{req.title}</span>
                                                                    <Badge variant="outline" className={`text-[9px] font-bold ${req.priority === 'MUST' ? 'border-red-200 bg-red-50 text-red-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                                                                        {req.priority}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-xs text-slate-600 leading-relaxed">{req.description}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="p-6 bg-green-50/50 border border-green-100 rounded-2xl shadow-sm">
                                                <h4 className="text-xs font-bold uppercase text-green-700 mb-4 flex items-center gap-2 border-b border-green-100 pb-2">
                                                    <Sparkles className="h-3.5 w-3.5" /> AI-Consolidated Scores
                                                </h4>
                                                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                                    {(themeDetails.suggestedScores || (themeDetails as any).scores) && typeof (themeDetails.suggestedScores || (themeDetails as any).scores) === 'object' ?
                                                        Object.entries(themeDetails.suggestedScores || (themeDetails as any).scores).map(([key, val]) => {
                                                            const labelMap: Record<string, string> = {
                                                                strategic: 'Strategic Alignment',
                                                                impact: 'Customer Impact',
                                                                market: 'Market Potential',
                                                                technical: 'Feasibility',
                                                                resource: 'Execution Effort'
                                                            }
                                                            const score = val as number
                                                            return (
                                                                <div key={key} className="flex flex-col">
                                                                    <span className="text-[10px] text-green-600 uppercase font-bold tracking-wider mb-1">{labelMap[key.toLowerCase()] || key}</span>
                                                                    <div className="flex items-baseline gap-1">
                                                                        <span className="text-2xl font-black text-green-900">{score}</span>
                                                                        <span className="text-xs text-green-600/60 font-medium">/ 5</span>
                                                                    </div>
                                                                    <div className="w-full bg-green-200/50 h-1.5 rounded-full mt-2 overflow-hidden">
                                                                        <div
                                                                            className="bg-green-600 h-full transition-all duration-1000"
                                                                            style={{ width: `${(score / 5) * 100}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )
                                                        }) : (
                                                            <p className="text-xs text-green-600 italic">Scores not available for this cluster.</p>
                                                        )}
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                                <h4 className="text-xs font-bold uppercase text-slate-500 mb-4">Cluster Metadata</h4>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-baseline">
                                                        <span className="text-[10px] text-slate-400 uppercase font-bold">Cluster ID</span>
                                                        <span className="text-xs font-mono text-slate-600">{themeDetails.id}</span>
                                                    </div>
                                                    <div className="flex justify-between items-baseline">
                                                        <span className="text-[10px] text-slate-400 uppercase font-bold">Consolidated On</span>
                                                        <span className="text-xs text-slate-600 font-medium">{formatDate(themeDetails.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    )
}
