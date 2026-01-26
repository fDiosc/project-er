'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts'
import {
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Timer,
  Tag,
  Database
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { DashboardSummary } from '@/types'
import { apiRequest } from '@/lib/api'

async function fetchDashboardData(): Promise<DashboardSummary> {
  const response = await apiRequest('/api/dashboard/summary')
  if (!response.ok) throw new Error('Failed to fetch dashboard data')
  return response.json()
}

const statusColors = {
  OPEN: '#64748b',
  IN_REVIEW: '#f59e0b',
  ACCEPTED: '#22c55e',
  REJECTED: '#ef4444',
  ACCEPT: '#22c55e',
  REJECT: '#ef4444',
}

const sourceColors = {
  CSV: '#8b5cf6',
  ZENDESK: '#059669'
}

export function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: fetchDashboardData,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="mx-auto h-12 w-12 mb-4" />
            <p>Failed to load dashboard data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Prepare chart data
  const statusData = Object.entries(data.byStatus)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      status: status.replace('_', ' '),
      count,
      fill: statusColors[status as keyof typeof statusColors] || '#94a3b8'
    }))

  const companyData = data.byCompany.slice(0, 10).map(company => ({
    name: company.company.length > 15 ? company.company.substring(0, 15) + '...' : company.company,
    full_name: company.company,
    total: Number(company.total) || 0,
    accepted: Number(company.accepted) || 0,
    rejected: Number(company.rejected) || 0,
    inReview: Number(company.inReview) || 0,
    open: Number(company.open) || 0,
  }))

  const trendData = data.trendDaily.slice(-14) // Last 14 days

  const scoreBucketsData = Object.entries(data.scoreBuckets).map(([bucket, count]) => ({
    bucket,
    count,
    fill: bucket === '16+' ? '#22c55e' : bucket === '11-15' ? '#3b82f6' : bucket === '6-10' ? '#f59e0b' : '#ef4444'
  }))

  const sourceData = Object.entries(data.bySource || { CSV: 0, ZENDESK: 0 }).map(([source, count]) => ({
    source,
    count,
    fill: sourceColors[source as keyof typeof sourceColors] || '#64748b'
  }))

  const tagData = (data.topTags || []).map(t => ({
    name: t.tag,
    count: t.count
  }))

  const inflationData = data.scoreInflation ? [
    { subject: 'Strategic', A: data.scoreInflation.strategic, fullMark: 5 },
    { subject: 'Impact', A: data.scoreInflation.impact, fullMark: 5 },
    { subject: 'Market', A: data.scoreInflation.market, fullMark: 5 },
    { subject: 'Technical', A: data.scoreInflation.technical, fullMark: 5 },
    { subject: 'Resource', A: data.scoreInflation.resource, fullMark: 5 },
  ] : []

  const rejectionDriverData = (data.rejectionDrivers || []).map(d => ({
    name: d.tag,
    count: d.count
  }))

  return (
    <div className="space-y-6">
      {/* KPI Cards Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ERs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalER.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.byStatus.ACCEPTED}</div>
            <p className="text-xs text-muted-foreground">
              {data.acceptedRate.toFixed(1)}% rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.avgScore.overall.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Accepted: {data.avgScore.accepted.toFixed(1)} | Rej: {data.avgScore.rejected.toFixed(1)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time to Decision</CardTitle>
            <Timer className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.avgDaysToDecision || 0}</div>
            <p className="text-xs text-muted-foreground">
              Days (avg)
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Row 2: Charts */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Source Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4" /> Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {sourceData.reduce((acc, curr) => acc + curr.count, 0) > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      label={({ source, percent }) => `${source} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tag Cloud (Bar Chart) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="w-4 h-4" /> Top Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {tagData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={tagData} margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No tags found</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Company & Trend */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Company Breakdown */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] overflow-auto">
              {companyData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead className="text-right text-green-600">Accepted</TableHead>
                      <TableHead className="text-right text-orange-500">Review</TableHead>
                      <TableHead className="text-right text-slate-500">Open</TableHead>
                      <TableHead className="text-right text-red-500">Rejected</TableHead>
                      <TableHead className="text-right font-bold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyData.map((company) => (
                      <TableRow key={company.full_name}>
                        <TableCell className="font-medium">
                          <div className="truncate max-w-[120px]" title={company.full_name}>
                            {company.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{company.accepted}</TableCell>
                        <TableCell className="text-right">{company.inReview}</TableCell>
                        <TableCell className="text-right">{company.open}</TableCell>
                        <TableCell className="text-right">{company.rejected}</TableCell>
                        <TableCell className="text-right font-bold">{company.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No company data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trend Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Activity Trend (14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(str) => {
                      const date = new Date(str);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="created" stroke="#3b82f6" strokeWidth={2} name="Created" dot={false} />
                    <Line type="monotone" dataKey="accepted" stroke="#22c55e" strokeWidth={2} name="Accepted" dot={false} />
                    <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} name="Rejected" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No trend data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Strategic Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Score Inflation Detection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              Score Inflation Detection
            </CardTitle>
            <p className="text-xs text-muted-foreground italic">Are we over-rating dimensions? (Scale 0-5)</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {inflationData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={inflationData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} />
                    <Radar
                      name="Avg Score"
                      dataKey="A"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rejection Drivers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              Top Rejection Drivers
            </CardTitle>
            <p className="text-xs text-muted-foreground italic">Primary reasons/tags associated with rejected items</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {rejectionDriverData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={rejectionDriverData} margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No recent rejections recorded</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Neglected High-Priority Items */}
      {(data.neglectedHighScores && data.neglectedHighScores.length > 0) && (
        <Card className="border-red-200 bg-red-50/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Clock className="w-5 h-5" />
              Neglected Strategic Opportunities
            </CardTitle>
            <p className="text-xs text-red-600 font-medium">High Score items (&gt;15) languishing in review for 30+ days</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.neglectedHighScores.map((er) => (
                <div key={er.id} className="flex items-center justify-between p-3 rounded-md bg-white border border-red-100 shadow-sm">
                  <div className="flex flex-col">
                    <Link href={`/?q=${er.id}`} className="font-bold text-sm text-red-900 hover:underline">
                      {er.subject}
                    </Link>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5 font-bold uppercase tracking-tight">
                      <span>{er.company}</span>
                      <span>•</span>
                      <span className="text-red-600">{er.daysOld} DAYS UNTOUCHED</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-muted-foreground leading-none">SCORE</span>
                    <span className="text-xl font-black text-red-600 leading-tight">{er.totalScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Priority Items */}
      {(data.topERs && data.topERs.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              High Priority Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topERs.map((er, i) => (
                <div key={er.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <Link href={`/?q=${er.id}`} className="font-medium hover:underline">
                        {er.subject}
                      </Link>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span>{er.company}</span>
                        <span>•</span>
                        <Badge variant="outline" className={
                          er.status === 'IN_REVIEW' ? 'border-yellow-500 text-yellow-600' : 'border-slate-500'
                        }>
                          {er.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Score</div>
                    <div className="text-2xl font-bold">{er.totalScore}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}