'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { apiRequest } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Brain, ArrowLeft, Calendar, FileText, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Markdown from 'react-markdown'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { Navigation } from '@/components/layout/navigation'
import { AuthGuard } from '@/components/auth-guard'
import { List, ChevronRight } from 'lucide-react'

async function fetchReport(id: string) {
    const response = await apiRequest(`/api/ai-analysis/${id}`)
    if (!response.ok) throw new Error('Report not found')
    return response.json()
}

export default function AIReportDetailPage() {
    const { id } = useParams()
    const router = useRouter()

    const { data: report, isLoading, error } = useQuery({
        queryKey: ['ai-report', id],
        queryFn: () => fetchReport(id as string),
    })

    if (error) {
        return (
            <div className="container mx-auto p-6 flex flex-col items-center justify-center h-[50vh]">
                <p className="text-destructive font-bold">Error loading report</p>
                <Button variant="link" onClick={() => router.back()}>Go back</Button>
            </div>
        )
    }

    return (
        <AuthGuard>
            <div className="min-h-screen bg-background">
                <Navigation />
                <main className="container mx-auto py-6">
                    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
                        <Link href="/" className="hover:text-foreground transition-colors flex items-center">
                            <List className="h-4 w-4 mr-1" />
                            ER List
                        </Link>
                        <ChevronRight className="h-4 w-4" />
                        <Link href="/ai-analysis" className="hover:text-foreground transition-colors flex items-center">
                            <Brain className="h-4 w-4 mr-1" />
                            AI Reports
                        </Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-foreground font-medium truncate max-w-[300px]">
                            {isLoading ? 'Loading report...' : report?.title}
                        </span>
                    </nav>

                    <div className="space-y-6 max-w-5xl">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-primary font-medium animate-in fade-in slide-in-from-left-4">
                                    <Brain className="h-5 w-5" />
                                    AI Strategic Analysis
                                </div>
                                {isLoading ? (
                                    <Skeleton className="h-10 w-96 mt-2" />
                                ) : (
                                    <h1 className="text-4xl font-bold tracking-tight">{report?.title}</h1>
                                )}
                                <div className="flex items-center gap-4 text-muted-foreground text-sm mt-2">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="h-4 w-4" />
                                        {report && formatDate(report.createdAt)}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <FileText className="h-4 w-4" />
                                        {report?.ers?.length} ERs processed
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                <Card className="border-none shadow-none bg-transparent">
                                    <CardHeader className="px-0 pt-0">
                                        <CardTitle className="text-xl">Executive Analysis</CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-0 prose prose-slate max-w-none dark:prose-invert">
                                        {isLoading ? (
                                            <div className="space-y-4">
                                                <Skeleton className="h-4 w-full" />
                                                <Skeleton className="h-4 w-[90%]" />
                                                <Skeleton className="h-4 w-full" />
                                                <Skeleton className="h-4 w-[85%]" />
                                                <Skeleton className="h-24 w-full" />
                                            </div>
                                        ) : (
                                            <div className="rounded-xl bg-muted/30 p-8 border leading-relaxed overflow-auto max-h-[600px]">
                                                <article className="prose prose-slate dark:prose-invert max-w-none prose-pre:bg-muted/50 prose-pre:p-4 prose-pre:rounded-lg">
                                                    <Markdown>
                                                        {report?.report}
                                                    </Markdown>
                                                </article>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">The Prompt</CardTitle>
                                        <CardDescription>The question that generated this analysis</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <blockquote className="border-l-4 border-primary/30 pl-4 py-2 italic text-muted-foreground bg-muted/20 rounded-r-md">
                                            "{report?.prompt}"
                                        </blockquote>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="lg:col-span-1 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            Included ERs
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y">
                                            {isLoading ? (
                                                [1, 2, 3].map(i => (
                                                    <div key={i} className="p-4"><Skeleton className="h-12 w-full" /></div>
                                                ))
                                            ) : (
                                                report?.ers?.map((er: any) => (
                                                    <Link
                                                        key={er.id}
                                                        href={`/?erId=${er.id}`}
                                                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
                                                    >
                                                        <div className="flex flex-col min-w-0 mr-2">
                                                            <span className="text-sm font-medium truncate">{er.subject}</span>
                                                            <span className="text-xs text-muted-foreground">{er.company?.name}</span>
                                                        </div>
                                                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </Link>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    )
}
