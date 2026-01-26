'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import {
  MessageSquare,
  History,
  Settings,
  Building2,
  Calendar,
  Sparkles,
  Tag,
  Activity,
  Check,
  ChevronsUpDown,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

import { ERDto, ERStatus, Comment, Release, DevelopmentStatus } from '@/types'
import { formatDateTime, cn } from '@/lib/utils'
import { get, patch, post } from '@/lib/api'
import { SimilarityTab } from './similarity-tab'

interface ERDetailDialogProps {
  erId: string | null
  onClose: () => void
}

async function fetchER(id: string): Promise<ERDto> {
  return get(`/api/ers/${id}`)
}

async function fetchComments(id: string): Promise<Comment[]> {
  return get(`/api/ers/${id}/comments`)
}

async function updateER(id: string, data: Partial<ERDto>): Promise<ERDto> {
  return patch(`/api/ers/${id}`, data)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateScores(id: string, scores: any): Promise<any> {
  return patch(`/api/ers/${id}/scores`, scores)
}

async function addComment(id: string, body: string): Promise<Comment> {
  return post(`/api/ers/${id}/comments`, { body, authorId: 'current-user' })
}

const statusColors = {
  [ERStatus.OPEN]: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
  [ERStatus.IN_REVIEW]: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  [ERStatus.ACCEPTED]: 'bg-green-100 text-green-800 hover:bg-green-200',
  [ERStatus.REJECTED]: 'bg-red-100 text-red-800 hover:bg-red-200',
  [ERStatus.ACCEPT]: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
  [ERStatus.REJECT]: 'bg-rose-100 text-rose-800 hover:bg-rose-200',
  [ERStatus.DELIVERED]: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  [ERStatus.MANUAL_REVIEW]: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
}

export function ERDetailDialog({ erId, onClose }: ERDetailDialogProps) {
  const [newComment, setNewComment] = useState('')
  const [activeTab, setActiveTab] = useState('story')
  const [showSimilarityTab, setShowSimilarityTab] = useState(false)

  const [openRelease, setOpenRelease] = useState(false)
  const [openDevStatus, setOpenDevStatus] = useState(false)
  const [searchRelease, setSearchRelease] = useState("")
  const [searchDevStatus, setSearchDevStatus] = useState("")

  const queryClient = useQueryClient()

  const { data: er, isLoading } = useQuery({
    queryKey: ['er', erId],
    queryFn: () => fetchER(erId!),
    enabled: !!erId,
  })

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', erId],
    queryFn: () => fetchComments(erId!),
    enabled: !!erId,
  })

  const { data: releases = [] } = useQuery<Release[]>({
    queryKey: ['releases'],
    queryFn: () => get('/api/releases'),
    enabled: !!erId,
  })

  const { data: devStatuses = [] } = useQuery<DevelopmentStatus[]>({
    queryKey: ['dev-statuses'],
    queryFn: () => get('/api/dev-statuses'),
    enabled: !!erId,
  })

  const updateERMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ERDto> }) =>
      updateER(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['er', erId] })
      queryClient.invalidateQueries({ queryKey: ['ers'] })
      toast.success('ER updated successfully')
    },
    onError: () => {
      toast.error('Failed to update ER')
    }
  })

  const createReleaseMutation = useMutation({
    mutationFn: (name: string) => post('/api/releases', { name }),
    onSuccess: (newRelease: Release) => {
      toast.success(`Release "${newRelease.name}" created`)
      queryClient.setQueryData(['releases'], (old: Release[] | undefined) => {
        const updated = old ? [...old, newRelease] : [newRelease]
        return updated.sort((a, b) => a.name.localeCompare(b.name))
      })
      if (erId) {
        updateERMutation.mutate({ id: erId, data: { releaseId: newRelease.id } })
      }
      setOpenRelease(false)
      setSearchRelease("")
    }
  })

  const createDevStatusMutation = useMutation({
    mutationFn: (name: string) => post('/api/dev-statuses', { name }),
    onSuccess: (newStatus: DevelopmentStatus) => {
      toast.success(`Status "${newStatus.name}" created`)
      queryClient.setQueryData(['dev-statuses'], (old: DevelopmentStatus[] | undefined) => {
        const updated = old ? [...old, newStatus] : [newStatus]
        return updated.sort((a, b) => a.name.localeCompare(b.name))
      })
      if (erId) {
        updateERMutation.mutate({ id: erId, data: { devStatusId: newStatus.id } })
      }
      setOpenDevStatus(false)
      setSearchDevStatus("")
    }
  })

  const filteredReleases = useMemo(() => {
    if (!searchRelease) return releases
    const lowerSearch = searchRelease.toLowerCase()
    return releases.filter(r => r.name.toLowerCase().includes(lowerSearch))
  }, [releases, searchRelease])

  const filteredDevStatuses = useMemo(() => {
    if (!searchDevStatus) return devStatuses
    const lowerSearch = searchDevStatus.toLowerCase()
    return devStatuses.filter(s => s.name.toLowerCase().includes(lowerSearch))
  }, [devStatuses, searchDevStatus])

  const updateScoresMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: ({ id, scores }: { id: string; scores: any }) =>
      updateScores(id, scores),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['er', erId] })
      queryClient.invalidateQueries({ queryKey: ['ers'] })
      toast.success('Scores updated successfully')
    },
    onError: () => {
      toast.error('Failed to update scores')
    }
  })

  const addCommentMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      addComment(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', erId] })
      setNewComment('')
      toast.success('Comment added successfully')
    },
    onError: () => {
      toast.error('Failed to add comment')
    }
  })

  const aiAnalyzeMutation = useMutation({
    mutationFn: (id: string) => post(`/api/ers/${id}/ai-analyze`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['er', erId] })
      toast.success('AI Analysis updated')
    },
    onError: () => {
      toast.error('AI Analysis failed')
    }
  })

  const handleAIAnalyze = () => {
    if (erId) {
      aiAnalyzeMutation.mutate(erId)
    }
  }

  const handleStatusChange = (status: ERStatus) => {
    if (erId) {
      updateERMutation.mutate({ id: erId, data: { status } })
    }
  }

  const handleScoreChange = (scoreType: string, value: number[]) => {
    if (erId) {
      const scores = { [scoreType]: value[0] }
      updateScoresMutation.mutate({ id: erId, scores })
    }
  }

  const handleApplyAIScores = () => {
    if (erId && er?.aiSuggestedScores) {
      updateScoresMutation.mutate({ id: erId, scores: er.aiSuggestedScores })
    }
  }

  const handleAddComment = () => {
    if (erId && newComment.trim()) {
      addCommentMutation.mutate({ id: erId, body: newComment.trim() })
    }
  }

  if (!erId) return null

  return (
    <Dialog open={!!erId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[80vw] w-[80vw] max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <DialogTitle className="sr-only">Loading Details</DialogTitle>
            <div className="animate-pulse flex space-x-2 items-center text-muted-foreground">
              <div className="h-4 w-4 bg-slate-200 rounded-full animate-bounce"></div>
              <span>Loading ER details...</span>
            </div>
          </div>
        ) : !er ? (
          <div className="flex items-center justify-center h-64 text-destructive">
            <DialogTitle className="sr-only">Error</DialogTitle>
            <div>ER not found or error loading record.</div>
          </div>
        ) : (
          <div className="space-y-6">
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-grow">
                  <DialogTitle className="text-2xl font-bold tracking-tight">{er.subject}</DialogTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`${statusColors[er.status]} font-semibold`}
                    >
                      {er.status.replace('_', ' ')}
                    </Badge>
                    {er.externalId && (
                      <Badge variant="outline" className="font-mono">
                        ID: {er.externalId}
                      </Badge>
                    )}
                    {er.release && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 gap-1">
                        <Tag className="h-3 w-3" />
                        {er.release.name}
                      </Badge>
                    )}
                    {er.devStatus && (
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 gap-1">
                        <Activity className="h-3 w-3" />
                        {er.devStatus.name}
                      </Badge>
                    )}
                    {er.themeId && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 gap-1 font-bold">
                        <Sparkles className="h-3 w-3" />
                        Part of Cluster
                      </Badge>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground ml-2">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {er.company.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Updated {formatDateTime(new Date(er.updatedAt))}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 pt-1">
                  <Select value={er.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-40 border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ERStatus.OPEN}>Open</SelectItem>
                      <SelectItem value={ERStatus.IN_REVIEW}>In Review</SelectItem>
                      <SelectItem value={ERStatus.ACCEPT}>Accept</SelectItem>
                      <SelectItem value={ERStatus.ACCEPTED}>Accepted</SelectItem>
                      <SelectItem value={ERStatus.REJECT}>Reject</SelectItem>
                      <SelectItem value={ERStatus.REJECTED}>Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full flex justify-start border-b rounded-none bg-transparent h-auto p-0 mb-6 sticky top-[-24px] bg-white z-10">
                <TabsTrigger value="story" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">Ticket Story</TabsTrigger>
                <TabsTrigger value="scores" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">Scoring</TabsTrigger>
                <TabsTrigger value="comments" className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Comments
                  {comments.length > 0 && (
                    <span className="ml-2 bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {comments.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">
                  <History className="h-4 w-4 mr-2" />
                  History
                </TabsTrigger>
                <TabsTrigger value="meta" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">
                  <Settings className="h-4 w-4 mr-2" />
                  Meta
                </TabsTrigger>
                {(showSimilarityTab || er.themeId) && (
                  <TabsTrigger value="similarity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 text-purple-600 font-bold">
                    <Sparkles className="h-4 w-4 mr-2" />
                    {er.themeId ? 'Cluster Vision' : 'Similarity'}
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="story" className="space-y-6 mt-0">
                <div className="grid gap-6">
                  {er.aiSummary && (
                    <div className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-xl shadow-sm">
                      <div className="flex items-center space-x-2 mb-3">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-bold text-purple-900 uppercase tracking-widest text-[10px]">AI Executive Summary</span>
                      </div>
                      <p className="text-lg text-purple-950 font-medium italic leading-relaxed">
                        &quot;{er.aiSummary}&quot;
                      </p>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                      <Label className="text-xs uppercase text-muted-foreground font-bold tracking-tighter">Full Conversation Thread</Label>
                      <div className="h-px flex-grow bg-slate-100"></div>
                    </div>

                    <div className="space-y-4">
                      {/* Initial Message (Description) */}
                      {er.description && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="text-[10px] uppercase">Initial Request</Badge>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase">
                              {er.requestedAt ? formatDateTime(new Date(er.requestedAt)) : 'Original Date'}
                            </span>
                          </div>
                          <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans">
                            {er.description}
                          </div>
                        </div>
                      )}

                      {/* Synced Zendesk Comments (Conversation History) */}
                      {comments
                        .filter(c => {
                          const isZendesk = c.authorId?.startsWith('Zendesk');
                          // If this comment is identical to the description, we might want to skip it to avoid redundancy,
                          // but usually it's better to show the full thread if unsure.
                          return isZendesk;
                        })
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) // Chronological for the story
                        .map((comment) => (
                          <div key={comment.id} className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm transition-hover hover:border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                  {(comment.authorId || 'Z').charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs font-bold text-slate-700">
                                  {comment.authorId}
                                </span>
                              </div>
                              <span className="text-[10px] text-muted-foreground font-medium uppercase">
                                {formatDateTime(new Date(comment.createdAt))}
                              </span>
                            </div>
                            <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed font-sans">
                              {comment.body}
                            </div>
                          </div>
                        ))}

                      {!er.description && comments.filter(c => c.authorId?.startsWith('Zendesk')).length === 0 && (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-muted-foreground">
                          <p className="italic">No conversation details available for this ticket.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {er.externalId && (
                  <div className="flex justify-start pt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleAIAnalyze}
                      disabled={aiAnalyzeMutation.isPending}
                      className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
                    >
                      <Sparkles className={`h-4 w-4 mr-2 ${aiAnalyzeMutation.isPending ? 'animate-spin' : ''}`} />
                      {aiAnalyzeMutation.isPending ? 'Generating New Insights...' : 'Refresh AI Analysis'}
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setShowSimilarityTab(true)
                        setActiveTab('similarity')
                      }}
                      className="bg-purple-600 text-white hover:bg-purple-700 shadow-md ml-auto"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Find Similar ERs
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="scores" className="space-y-6 mt-0">
                <Card className="border-2">
                  <CardHeader className="bg-slate-50/50 border-b">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <div className="flex items-center gap-4">
                        Prioritization Scoring
                        {er.aiSuggestedScores && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleApplyAIScores}
                            disabled={updateScoresMutation.isPending}
                            className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                          >
                            <Sparkles className="h-3 w-3 mr-2" />
                            Apply AI Suggested Scores
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        <Badge variant="default" className="text-xl px-4 py-1.5 font-bold shadow-lg">
                          Score: {er.scores.total}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground mt-1 uppercase">Calculated Priority</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8 pt-8 px-8">
                    {[
                      { key: 'strategic', label: 'Strategic Alignment', desc: 'Alignment with long-term business goals.', value: er.scores.strategic },
                      { key: 'impact', label: 'Business Impact', desc: 'Direct value to customers and retention.', value: er.scores.impact },
                      { key: 'market', label: 'Market Potential', desc: 'New revenue opportunities or sales potential.', value: er.scores.market },
                      { key: 'technical', label: 'Technical Feasibility', desc: 'Ease of implementation (5 is easiest).', value: er.scores.technical },
                      { key: 'resource', label: 'Developer Effort', desc: 'Resource intensity (Inverted in total)', value: er.scores.resource },
                    ].map(({ key, label, desc, value }) => (
                      <div key={key} className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-bold">{label}</Label>
                            <p className="text-[11px] text-muted-foreground leading-none">{desc}</p>
                          </div>
                          <span className="text-lg font-bold text-primary tabular-nums">
                            {value ?? 0}<span className="text-slate-300 font-normal text-sm ml-1">/ 5</span>
                          </span>
                        </div>
                        <Slider
                          value={[value ?? 0]}
                          onValueChange={(newValue) => handleScoreChange(key, newValue)}
                          max={5}
                          min={0}
                          step={1}
                          className="w-full"
                        />
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {er.aiSuggestedScores && (er.aiSuggestedScores as any)[key] !== undefined && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full font-semibold shadow-sm animate-in fade-in slide-in-from-left-2 transition-all">
                              <Sparkles className="h-3 w-3" />
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              AI Suggested: {(er.aiSuggestedScores as any)[key]}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="mt-8 p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-2 shadow-inner">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase">
                        <Settings className="h-3 w-3" /> Formula Logic
                      </div>
                      <p className="text-[11px] text-amber-800 leading-tight">
                        <strong>Total = Strategic + Impact + Market + Technical + (5 - Resource Effort)</strong>
                      </p>
                      <p className="text-[10px] text-amber-700/80 italic leading-tight">
                        Note: Resource requirements are automatically inverted so that high-effort items (5) contribute 0 to the final priority score.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comments" className="space-y-6 mt-0">
                <Card className="border-2 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Internal Discussion</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <Textarea
                        placeholder="Share your thoughts on this ER..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[100px] border-2 focus-visible:ring-primary/20 transition-all resize-none p-4"
                      />
                      <div className="absolute bottom-2 right-2">
                        <Button
                          size="sm"
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || addCommentMutation.isPending}
                          className="px-6 shadow-md"
                        >
                          {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                  {comments.map((comment) => (
                    <div key={comment.id} className="relative pl-4 border-l-2 border-slate-100 py-1 transition-colors hover:border-slate-200 group">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                            {(comment.authorId || 'A').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold">
                            {comment.authorId || 'Anonymous User'}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase">
                          {formatDateTime(new Date(comment.createdAt))}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed bg-white p-3 rounded-lg border group-hover:shadow-sm transition-shadow">
                        {comment.body}
                      </p>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <div className="text-center py-16 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                      <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-400 font-medium italic">
                        Be the first to start the conversation.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-6 mt-0">
                <Card className="border-2 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-24 text-muted-foreground text-center">
                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                      <History className="h-6 w-6 text-slate-300" />
                    </div>
                    <CardTitle className="text-lg text-slate-400 mb-1">Timeline Locked</CardTitle>
                    <p className="text-sm max-w-xs px-6">
                      Detailed event tracking and status history visualization will be available in the next release.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="meta" className="space-y-6 mt-0">
                <Card className="border-2">
                  <CardHeader className="bg-slate-50/50 border-b">
                    <CardTitle className="text-lg">Technical & Contextual Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-8 px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
                      {/* Committed Release Editable Field */}
                      <div className="space-y-1.5 border-b border-slate-50 pb-2">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground/70 tracking-widest leading-none">
                          <Tag className="h-3 w-3" /> Committed Release
                        </div>
                        <Popover open={openRelease} onOpenChange={setOpenRelease}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-auto p-0 font-semibold text-sm hover:bg-transparent justify-start w-full text-left"
                            >
                              {er.release?.name || <span className="text-slate-300 font-normal italic">Select release...</span>}
                              <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0" align="start">
                            <Command shouldFilter={false}>
                              <CommandInput
                                placeholder="Search/Create release..."
                                value={searchRelease}
                                onValueChange={setSearchRelease}
                              />
                              <CommandList>
                                <CommandGroup>
                                  {filteredReleases.map((release) => (
                                    <CommandItem
                                      key={release.id}
                                      onSelect={() => {
                                        updateERMutation.mutate({ id: erId, data: { releaseId: release.id } })
                                        setOpenRelease(false)
                                      }}
                                    >
                                      <Check className={cn("mr-2 h-4 w-4", er.releaseId === release.id ? "opacity-100" : "opacity-0")} />
                                      {release.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                                {filteredReleases.length === 0 && searchRelease && (
                                  <CommandEmpty>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full text-xs"
                                      onClick={() => createReleaseMutation.mutate(searchRelease)}
                                      disabled={createReleaseMutation.isPending}
                                    >
                                      {createReleaseMutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                      Create "{searchRelease}"
                                    </Button>
                                  </CommandEmpty>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Development Status Editable Field */}
                      <div className="space-y-1.5 border-b border-slate-50 pb-2">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground/70 tracking-widest leading-none">
                          <Activity className="h-3 w-3" /> Development Status
                        </div>
                        <Popover open={openDevStatus} onOpenChange={setOpenDevStatus}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-auto p-0 font-semibold text-sm hover:bg-transparent justify-start w-full text-left"
                            >
                              {er.devStatus?.name || <span className="text-slate-300 font-normal italic">Select status...</span>}
                              <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0" align="start">
                            <Command shouldFilter={false}>
                              <CommandInput
                                placeholder="Search/Create status..."
                                value={searchDevStatus}
                                onValueChange={setSearchDevStatus}
                              />
                              <CommandList>
                                <CommandGroup>
                                  {filteredDevStatuses.map((status) => (
                                    <CommandItem
                                      key={status.id}
                                      onSelect={() => {
                                        updateERMutation.mutate({ id: erId, data: { devStatusId: status.id } })
                                        setOpenDevStatus(false)
                                      }}
                                    >
                                      <Check className={cn("mr-2 h-4 w-4", er.devStatusId === status.id ? "opacity-100" : "opacity-0")} />
                                      {status.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                                {filteredDevStatuses.length === 0 && searchDevStatus && (
                                  <CommandEmpty>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full text-xs"
                                      onClick={() => createDevStatusMutation.mutate(searchDevStatus)}
                                      disabled={createDevStatusMutation.isPending}
                                    >
                                      {createDevStatusMutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                      Create "{searchDevStatus}"
                                    </Button>
                                  </CommandEmpty>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {[
                        { label: 'External Reference ID', value: er.externalId, icon: <Badge variant="outline" className="h-4 px-1.5 text-[8px]">ID</Badge> },
                        { label: 'Committed Version', value: er.committedVersion, icon: <Tag className="h-3 w-3" /> },
                        { label: 'Original Request Date', value: er.requestedAt ? formatDateTime(new Date(er.requestedAt)) : null, icon: <Calendar className="h-3 w-3" /> },
                        { label: 'Latest External Sync', value: er.updatedAtCsv ? formatDateTime(new Date(er.updatedAtCsv)) : null, icon: <History className="h-3 w-3" /> },
                        { label: 'Initial Submission Priority', value: er.submittedPriority, icon: <Settings className="h-3 w-3" /> },
                        { label: 'System Creation Date', value: formatDateTime(new Date(er.createdAt)), icon: <Calendar className="h-3 w-3" /> },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1.5 border-b border-slate-50 pb-2">
                          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground/70 tracking-widest leading-none">
                            {item.icon} {item.label}
                          </div>
                          <p className="text-sm font-semibold truncate text-slate-900 leading-none">
                            {item.value || (
                              <span className="text-slate-300 font-normal italic">Data unavailable</span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="similarity" className="mt-0">
                <SimilarityTab
                  erId={erId}
                  targetExternalId={er.externalId}
                  themeId={er.themeId}
                  onConsolidated={() => {
                    setActiveTab('story')
                    setShowSimilarityTab(false)
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog >
  )
}