'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { apiRequest } from '@/lib/api'
import { ReleaseSummary, ERStatus } from '@/types'
import { Loader2, Users, CheckCircle2, Circle, Clock } from 'lucide-react'

async function fetchReleaseSummary(releaseId: string): Promise<ReleaseSummary> {
    const response = await apiRequest(`/api/dashboard/release-summary?releaseId=${releaseId}`)
    if (!response.ok) throw new Error('Failed to fetch release summary')
    return response.json()
}

async function fetchReleases() {
    const response = await apiRequest('/api/releases')
    if (!response.ok) throw new Error('Failed to fetch releases')
    return response.json()
}

export function ReleaseOverview() {
    const [selectedReleaseId, setSelectedReleaseId] = useState<string>('')

    const { data: releases } = useQuery({
        queryKey: ['releases'],
        queryFn: fetchReleases
    })

    const { data: summary, isLoading } = useQuery({
        queryKey: ['release-summary', selectedReleaseId],
        queryFn: () => fetchReleaseSummary(selectedReleaseId),
        enabled: !!selectedReleaseId
    })

    const completionRate = summary
        ? Math.round((summary.byStatus.completed / summary.totalERs) * 100)
        : 0

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="w-[300px] print:hidden">
                    <Select value={selectedReleaseId} onValueChange={setSelectedReleaseId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a Release" />
                        </SelectTrigger>
                        <SelectContent>
                            {releases?.map((r: any) => (
                                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {summary && (
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-sm text-muted-foreground">Release Completion</div>
                            <div className="text-2xl font-bold">{completionRate}%</div>
                        </div>
                        <div className="w-[200px]">
                            <Progress value={completionRate} className="h-3" />
                        </div>
                    </div>
                )}
            </div>

            {!selectedReleaseId ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                    <Clock className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                    <h3 className="text-lg font-medium">No Release Selected</h3>
                    <p className="text-muted-foreground">Please select a release to view specific metrics and commitments.</p>
                </Card>
            ) : isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : summary ? (
                <div className="space-y-6">
                    {/* Release KPIs */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Committed</p>
                                        <h3 className="text-2xl font-bold">{summary.totalERs}</h3>
                                    </div>
                                    <div className="p-2 bg-blue-100 rounded-full">
                                        <Clock className="w-5 h-5 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                                        <h3 className="text-2xl font-bold">{summary.byStatus.inProgress}</h3>
                                    </div>
                                    <div className="p-2 bg-orange-100 rounded-full">
                                        <Loader2 className="w-5 h-5 text-orange-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Completed</p>
                                        <h3 className="text-2xl font-bold">{summary.byStatus.completed}</h3>
                                    </div>
                                    <div className="p-2 bg-green-100 rounded-full">
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Customer Commitments */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Customer Commitments
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Customer</TableHead>
                                            <TableHead className="text-right">Items</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {summary.customers.map((c) => (
                                            <TableRow key={c.id}>
                                                <TableCell className="font-medium">{c.name}</TableCell>
                                                <TableCell className="text-right">{c.itemCount}</TableCell>
                                            </TableRow>
                                        ))}
                                        {summary.customers.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center text-muted-foreground p-8">
                                                    No customer data found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Status Breakdown Detail */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Commitment Status Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <Circle className="w-3 h-3 fill-slate-400 text-slate-400" /> Open
                                        </span>
                                        <span className="font-medium">{summary.byStatus.open}</span>
                                    </div>
                                    <Progress value={(summary.byStatus.open / summary.totalERs) * 100} className="h-2 bg-slate-100" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <Circle className="w-3 h-3 fill-orange-500 text-orange-500" /> In Progress
                                        </span>
                                        <span className="font-medium">{summary.byStatus.inProgress}</span>
                                    </div>
                                    <Progress value={(summary.byStatus.inProgress / summary.totalERs) * 100} className="h-2 bg-orange-100" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <Circle className="w-3 h-3 fill-green-600 text-green-600" /> Completed
                                        </span>
                                        <span className="font-medium">{summary.byStatus.completed}</span>
                                    </div>
                                    <Progress value={(summary.byStatus.completed / summary.totalERs) * 100} className="h-2 bg-green-100" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Committed Items List */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Committed Items Detail</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>JIRA Status</TableHead>
                                        <TableHead>ER Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {summary.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium max-w-[400px] truncate" title={item.subject}>
                                                {item.subject}
                                            </TableCell>
                                            <TableCell>{item.companyName}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-normal">
                                                    {item.devStatus}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-normal">
                                                    {item.status.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {summary.items.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground p-8">
                                                No committed items found for this release
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            ) : null}
        </div>
    )
}
