'use client'

import React from 'react'
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    AreaChart,
    Area
} from 'recharts'
import {
    Artifact,
    ArtifactType,
    ChartData,
    TableData,
    ScorecardMetric
} from '@/types/intelligent-dashboard'
import {
    ArrowUp,
    ArrowDown,
    Minus,
    Download,
    Lightbulb,
    AlertTriangle,
    CheckCircle,
    TrendingUp,
    MessageSquarePlus
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Props {
    artifact: Artifact
    onSuggestionClick?: (question: string) => void
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export const ArtifactRenderer: React.FC<Props> = ({ artifact, onSuggestionClick }) => {
    const [isMounted, setIsMounted] = React.useState(false)

    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    const renderHeader = () => (
        <div className="mb-6 flex justify-between items-start">
            <div>
                <h3 className="text-xl font-bold tracking-tight">{artifact.title}</h3>
                {artifact.description && <p className="text-sm text-muted-foreground mt-1">{artifact.description}</p>}
            </div>
            <button className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                <Download size={18} />
            </button>
        </div>
    )

    const renderInsights = () => {
        if (!artifact.insights || artifact.insights.length === 0) return null

        return (
            <div className="mt-6 pt-6 border-t">
                <div className="flex items-center mb-4">
                    <Lightbulb className="text-amber-500 mr-2" size={20} />
                    <h4 className="font-semibold">Strategic Insights</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {artifact.insights.map((insight, idx) => (
                        <div key={idx} className={cn(
                            "p-4 rounded-lg border-l-4 shadow-sm",
                            insight.type === 'warning' ? 'bg-orange-50/50 border-orange-400' :
                                insight.type === 'opportunity' ? 'bg-blue-50/50 border-blue-400' :
                                    'bg-emerald-50/50 border-emerald-400'
                        )}>
                            <div className="flex items-start justify-between mb-2">
                                <h5 className={cn(
                                    "font-bold",
                                    insight.type === 'warning' ? 'text-orange-900' :
                                        insight.type === 'opportunity' ? 'text-blue-900' :
                                            'text-emerald-900'
                                )}>{insight.title}</h5>
                            </div>
                            <p className="text-sm text-muted-foreground leading-snug">{insight.description}</p>
                            <div className="mt-3 flex items-center text-[10px] font-black uppercase tracking-wider">
                                {insight.type === 'warning' && <><AlertTriangle size={14} className="mr-1 text-orange-600" /> Attention Required</>}
                                {insight.type === 'opportunity' && <><TrendingUp size={14} className="mr-1 text-blue-600" /> Opportunity</>}
                                {insight.type === 'action' && <><CheckCircle size={14} className="mr-1 text-emerald-600" /> Action</>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const renderFollowUps = () => {
        if (!artifact.followUpQuestions || artifact.followUpQuestions.length === 0) return null

        return (
            <div className="mt-6 pt-4 border-t">
                <div className="flex items-center mb-3 text-muted-foreground">
                    <MessageSquarePlus className="mr-2" size={18} />
                    <h4 className="font-bold text-xs uppercase tracking-tight">Suggested Next Steps</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                    {artifact.followUpQuestions.map((question, idx) => (
                        <button
                            key={idx}
                            onClick={() => onSuggestionClick?.(question)}
                            className="text-left px-3 py-1.5 bg-muted/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 border rounded-md text-xs font-medium transition-all"
                        >
                            {question}
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    const renderContent = () => {
        if (!isMounted) return <div className="h-[350px] flex items-center justify-center text-muted-foreground">Loading visualization...</div>

        if (artifact.type === ArtifactType.CHART) {
            const data = artifact.data as ChartData
            const hasLabels = data?.labels && data.labels.length > 0
            const hasDatasets = Array.isArray(data?.datasets) && data.datasets.length > 0

            if (!hasLabels || !hasDatasets) {
                return (
                    <div className="h-[350px] flex flex-col items-center justify-center border rounded border-dashed text-muted-foreground p-8 text-center">
                        <p className="font-bold mb-2">Insufficient data for chart</p>
                        <p className="text-xs max-w-xs">
                            The AI was unable to map the database results to a chart.
                            {!hasLabels && " (Missing labels)"}
                            {!hasDatasets && " (Missing datasets)"}
                        </p>
                    </div>
                )
            }

            const chartData = data.labels.map((label, index) => {
                const obj: any = { name: label }
                data.datasets.forEach(ds => {
                    if (ds && ds.label) {
                        const val = ds.data?.[index]
                        obj[ds.label] = (typeof val === 'number') ? val : 0
                    }
                })
                return obj
            })

            const keys = data.datasets.map(ds => ds?.label).filter(Boolean) as string[]
            if (keys.length === 0) return <div className="h-[350px] flex items-center justify-center border rounded border-dashed text-muted-foreground">No datasets available</div>

            return (
                <div className="flex-1 min-h-[300px] w-full">
                    <ResponsiveContainer width="100%" height={350}>
                        {artifact.chartType === 'line' ? (
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                                {keys.map((key, i) => (
                                    <Line
                                        key={key}
                                        type="monotone"
                                        dataKey={key}
                                        stroke={COLORS[i % COLORS.length]}
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                        activeDot={{ r: 6 }}
                                    />
                                ))}
                            </LineChart>
                        ) : artifact.chartType === 'pie' ? (
                            <PieChart>
                                <Tooltip />
                                <Legend />
                                <Pie
                                    data={chartData}
                                    dataKey={keys[0]}
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    fill="#8884d8"
                                    label
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        ) : artifact.chartType === 'area' ? (
                            <AreaChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                                <YAxis stroke="#64748b" fontSize={10} />
                                <Tooltip />
                                <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                                {keys.map((key, i) => (
                                    <Area
                                        key={key}
                                        type="monotone"
                                        dataKey={key}
                                        fill={COLORS[i % COLORS.length]}
                                        stroke={COLORS[i % COLORS.length]}
                                        fillOpacity={0.2}
                                        strokeWidth={2}
                                    />
                                ))}
                            </AreaChart>
                        ) : (
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                                {keys.map((key, i) => (
                                    <Bar
                                        key={key}
                                        dataKey={key}
                                        fill={COLORS[i % COLORS.length]}
                                        radius={[4, 4, 0, 0]}
                                    />
                                ))}
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>
            )
        }

        if (artifact.type === ArtifactType.SCORECARD) {
            const metrics = artifact.data as ScorecardMetric[]
            if (!Array.isArray(metrics)) {
                return <div className="h-[200px] flex items-center justify-center border rounded border-dashed text-muted-foreground">Malformed scorecard data</div>
            }
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {metrics.map((metric, idx) => (
                        <Card key={idx} className="bg-muted/30 border-none shadow-none">
                            <CardContent className="p-4">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{metric.label}</p>
                                <div className="flex items-baseline justify-between">
                                    <h4 className="text-2xl font-black">{metric.value}</h4>
                                    {metric.change !== undefined && (
                                        <Badge variant={metric.trend === 'up' ? 'default' : metric.trend === 'down' ? 'destructive' : 'outline'} className="text-[10px]">
                                            {metric.trend === 'up' && <ArrowUp size={10} className="mr-1" />}
                                            {metric.trend === 'down' && <ArrowDown size={10} className="mr-1" />}
                                            {metric.changeLabel || `${(metric.change * 100).toFixed(1)}%`}
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )
        }

        if (artifact.type === ArtifactType.TABLE) {
            const tableData = artifact.data as TableData
            return (
                <div className="overflow-auto max-h-[400px] border rounded-lg">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0">
                            <tr>
                                {tableData.columns.map((col, i) => (
                                    <th key={i} className="px-4 py-3 font-bold tracking-tight">
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {tableData.rows.map((row, rowIdx) => (
                                <tr key={rowIdx} className="hover:bg-muted/30 transition-colors">
                                    {tableData.columns.map((col, colIdx) => (
                                        <td key={`${rowIdx}-${colIdx}`} className="px-4 py-3 truncate max-w-[200px]">
                                            {row[col.field]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )
        }
        return null
    }

    return (
        <Card className="w-full h-full shadow-lg border-primary/10 overflow-hidden">
            <CardContent className="p-6">
                {renderHeader()}
                {renderContent()}
                {renderInsights()}
                {renderFollowUps()}
            </CardContent>
        </Card>
    )
}

