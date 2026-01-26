import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ERStatus } from '@prisma/client'
import type { DashboardSummary } from '@/types'

// GET /api/dashboard/summary - Get dashboard summary data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const since = searchParams.get('since')
    const until = searchParams.get('until')

    // Build base where clause for filters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (companyId) {
      where.companyId = companyId
    }
    if (since || until) {
      where.createdAt = {}
      if (since) {
        where.createdAt.gte = new Date(since)
      }
      if (until) {
        where.createdAt.lte = new Date(until)
      }
    }

    // Get total count
    const totalER = await prisma.eR.count({ where })

    // Get counts by status
    const statusCounts = await prisma.eR.groupBy({
      by: ['status'],
      where,
      _count: true
    })

    const byStatus: Record<ERStatus, number> = {
      [ERStatus.OPEN]: 0,
      [ERStatus.IN_REVIEW]: 0,
      [ERStatus.ACCEPTED]: 0,
      [ERStatus.REJECTED]: 0,
      [ERStatus.DELIVERED]: 0,
      [ERStatus.MANUAL_REVIEW]: 0,
      [ERStatus.ACCEPT]: 0,
      [ERStatus.REJECT]: 0
    }

    statusCounts.forEach(item => {
      byStatus[item.status] = item._count
    })

    // Normalize counts
    const acceptedCount = (byStatus[ERStatus.ACCEPTED] || 0) + (byStatus[ERStatus.ACCEPT] || 0)
    const rejectedCount = (byStatus[ERStatus.REJECTED] || 0) + (byStatus[ERStatus.REJECT] || 0)

    // Update the main keys for UI consumption (UI usually checks ACCEPTED/REJECTED)
    byStatus[ERStatus.ACCEPTED] = acceptedCount
    byStatus[ERStatus.REJECTED] = rejectedCount

    // Calculate acceptance rate
    const acceptedRate = totalER > 0
      ? Math.round((acceptedCount / totalER) * 100 * 100) / 100
      : 0

    // Get average scores
    const avgScoreOverall = await prisma.eR.aggregate({
      where,
      _avg: { totalCached: true }
    })

    const avgScoreAccepted = await prisma.eR.aggregate({
      where: { ...where, status: { in: [ERStatus.ACCEPTED, ERStatus.ACCEPT] } },
      _avg: { totalCached: true }
    })

    const avgScoreRejected = await prisma.eR.aggregate({
      where: { ...where, status: { in: [ERStatus.REJECTED, ERStatus.REJECT] } },
      _avg: { totalCached: true }
    })

    // Get company breakdown
    const companyStats = await prisma.eR.groupBy({
      by: ['companyId', 'status'],
      where,
      _count: true,
    })

    // Get company names
    const companyIds = [...new Set(companyStats.map(s => s.companyId))]
    const companies = await prisma.company.findMany({
      where: { id: { in: companyIds } }
    })

    const companyMap = new Map(companies.map(c => [c.id, c.name]))

    // Process company stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const companyStatsMap = new Map<string, any>()
    companyStats.forEach(stat => {
      const companyName = companyMap.get(stat.companyId) || 'Unknown'
      if (!companyStatsMap.has(companyName)) {
        companyStatsMap.set(companyName, {
          company: companyName,
          total: 0,
          accepted: 0,
          rejected: 0,
          inReview: 0,
          open: 0
        })
      }
      const company = companyStatsMap.get(companyName)
      company.total += stat._count

      const s = stat.status
      if (s === ERStatus.ACCEPTED || s === ERStatus.ACCEPT) {
        company.accepted += stat._count
      } else if (s === ERStatus.REJECTED || s === ERStatus.REJECT) {
        company.rejected += stat._count
      } else if (s === ERStatus.IN_REVIEW) {
        company.inReview += stat._count
      } else if (s === ERStatus.OPEN) {
        company.open += stat._count
      }
    })

    const byCompany = Array.from(companyStatsMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10) // Top 10 companies

    // Get trend data (simplified - use ER creation dates)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get ERs created in the last 30 days
    const recentERs = await prisma.eR.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      },
      select: {
        createdAt: true,
        status: true
      }
    })

    // Process trend data by day
    const trendMap = new Map<string, { date: string; created: number; accepted: number; rejected: number }>()

    recentERs.forEach(er => {
      const date = er.createdAt.toISOString().split('T')[0]
      if (!trendMap.has(date)) {
        trendMap.set(date, { date, created: 0, accepted: 0, rejected: 0 })
      }
      const trend = trendMap.get(date)!

      trend.created += 1

      // Count by current status (note: this is current status, not historical)
      if (er.status === ERStatus.ACCEPTED || er.status === ERStatus.ACCEPT) {
        trend.accepted += 1
      } else if (er.status === ERStatus.REJECTED || er.status === ERStatus.REJECT) {
        trend.rejected += 1
      }
    })

    const trendDaily = Array.from(trendMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))

    // Get score distribution
    const scoreDistribution = await prisma.eR.groupBy({
      by: ['totalCached'],
      where,
      _count: true
    })

    const scoreBuckets: Record<string, number> = {
      '0-5': 0,
      '6-10': 0,
      '11-15': 0,
      '16+': 0
    }

    scoreDistribution.forEach(item => {
      const score = item.totalCached || 0
      if (score <= 5) {
        scoreBuckets['0-5'] += item._count
      } else if (score <= 10) {
        scoreBuckets['6-10'] += item._count
      } else if (score <= 15) {
        scoreBuckets['11-15'] += item._count
      } else {
        scoreBuckets['16+'] += item._count
      }
    })

    const summary: DashboardSummary = {
      totalER,
      byStatus,
      acceptedRate,
      avgScore: {
        overall: Math.round((avgScoreOverall._avg.totalCached || 0) * 100) / 100,
        accepted: Math.round((avgScoreAccepted._avg.totalCached || 0) * 100) / 100,
        rejected: Math.round((avgScoreRejected._avg.totalCached || 0) * 100) / 100,
      },
      byCompany,
      trendDaily,
      scoreBuckets,
      avgDaysToDecision: 0,
      bySource: { CSV: 0, ZENDESK: 0 },
      topTags: [],
      topERs: []
    }

    // --- New Metrics Calculation ---

    // 1. Avg Days to Decision (Accepted or Rejected)
    const closedERs = await prisma.eR.findMany({
      where: {
        ...where,
        status: { in: [ERStatus.ACCEPTED, ERStatus.REJECTED, ERStatus.ACCEPT, ERStatus.REJECT] }
      },
      select: { createdAt: true, updatedAt: true }
    })

    if (closedERs.length > 0) {
      const totalDays = closedERs.reduce((sum, er) => {
        const diffTime = Math.abs(er.updatedAt.getTime() - er.createdAt.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return sum + diffDays
      }, 0)
      summary.avgDaysToDecision = Math.round((totalDays / closedERs.length) * 10) / 10
    }

    // 2. By Source
    const sourceGroup = await prisma.eR.groupBy({
      by: ['source'],
      where,
      _count: true
    })
    sourceGroup.forEach(g => {
      summary.bySource[g.source] = g._count
    })

    // 3. Top Tags
    // Prisma doesn't support deep relation grouping easily, so we fetch tags for filtered ERs
    // Optimized: Fetch only tag IDs and count manually if dataset is small, or use raw query for large sets.
    // For now, let's use a raw query for efficiency since we have filters.
    // However, keeping it simple with Prisma for safety:

    // Fetch all tags usage
    const erIds = await prisma.eR.findMany({
      where,
      select: { id: true }
    })

    if (erIds.length > 0) {
      const tagCounts = await prisma.eRTag.groupBy({
        by: ['tagId'],
        where: { erId: { in: erIds.map(e => e.id) } },
        _count: true,
        orderBy: { _count: { tagId: 'desc' } }, // this order strictly doesn't sort by count, just valid
        take: 10
      })

      // We need to fetch Tag names
      const tagIds = tagCounts.map(tc => tc.tagId)
      const tags = await prisma.tag.findMany({
        where: { id: { in: tagIds } }
      })
      const tagMap = new Map(tags.map(t => [t.id, t.label]))

      summary.topTags = tagCounts
        .map(tc => ({
          tag: tagMap.get(tc.tagId) || 'Unknown',
          count: tc._count
        }))
        .sort((a, b) => b.count - a.count)
    }

    // 4. Top ERs (High Score, In Review or Open)
    const topErsRaw = await prisma.eR.findMany({
      where: {
        ...where,
        status: { in: [ERStatus.IN_REVIEW, ERStatus.OPEN] }
      },
      orderBy: { totalCached: 'desc' },
      take: 5,
      include: { company: true }
    })

    summary.topERs = topErsRaw.map(er => ({
      id: er.id,
      subject: er.subject,
      company: er.company.name,
      totalScore: er.totalCached || 0,
      status: er.status
    }))

    // 5. Score Inflation Detection
    const scoreAggs = await prisma.eR.aggregate({
      where: { ...where, totalCached: { gt: 0 } },
      _avg: {
        strategic: true,
        impact: true,
        market: true,
        technical: true,
        resource: true
      }
    })

    summary.scoreInflation = {
      strategic: Math.round((scoreAggs._avg.strategic || 0) * 10) / 10,
      impact: Math.round((scoreAggs._avg.impact || 0) * 10) / 10,
      market: Math.round((scoreAggs._avg.market || 0) * 10) / 10,
      technical: Math.round((scoreAggs._avg.technical || 0) * 10) / 10,
      resource: Math.round((scoreAggs._avg.resource || 0) * 10) / 10,
    }

    // 6. Neglected High-Score ERs (Score > 15, Open/In-Review, > 30 days old)
    const thirtyDaysAgoForNeglect = new Date()
    thirtyDaysAgoForNeglect.setDate(thirtyDaysAgoForNeglect.getDate() - 30)

    const neglectedErsRaw = await prisma.eR.findMany({
      where: {
        ...where,
        status: { in: [ERStatus.OPEN, ERStatus.IN_REVIEW] },
        totalCached: { gt: 15 },
        createdAt: { lt: thirtyDaysAgoForNeglect }
      },
      orderBy: { totalCached: 'desc' },
      take: 5,
      include: { company: true }
    })

    summary.neglectedHighScores = neglectedErsRaw.map(er => ({
      id: er.id,
      subject: er.subject,
      company: er.company.name,
      totalScore: er.totalCached || 0,
      daysOld: Math.floor((new Date().getTime() - er.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    }))

    // 7. Top Drivers of Rejection (Tags on Rejected ERs)
    const rejectedErIds = await prisma.eR.findMany({
      where: {
        ...where,
        status: { in: [ERStatus.REJECTED, ERStatus.REJECT] }
      },
      select: { id: true }
    })

    if (rejectedErIds.length > 0) {
      const rejectTagCounts = await prisma.eRTag.groupBy({
        by: ['tagId'],
        where: { erId: { in: rejectedErIds.map(e => e.id) } },
        _count: true,
        orderBy: { _count: { tagId: 'desc' } },
        take: 5
      })

      const rejectTagIds = rejectTagCounts.map(tc => tc.tagId)
      const rejectTags = await prisma.tag.findMany({
        where: { id: { in: rejectTagIds } }
      })
      const rejectTagMap = new Map(rejectTags.map(t => [t.id, t.label]))

      summary.rejectionDrivers = rejectTagCounts.map(tc => ({
        tag: rejectTagMap.get(tc.tagId) || 'Unknown',
        count: tc._count
      })).sort((a, b) => b.count - a.count)
    }

    // --- End New Metrics ---

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error fetching dashboard summary:', error)
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch dashboard summary' } },
      { status: 500 }
    )
  }
}