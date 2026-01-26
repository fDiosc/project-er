import { prisma } from './db'
import { ERStatus } from '@prisma/client'

export const dashboardTools = {
    /**
     * Get distribution of ERs by status
     */
    async getStatusDistribution() {
        const counts = await prisma.eR.groupBy({
            by: ['status'],
            _count: true
        })
        return counts.map(c => ({ status: c.status, count: c._count }))
    },

    /**
     * Get distribution of ERs by source
     */
    async getSourceDistribution() {
        const counts = await prisma.eR.groupBy({
            by: ['source'],
            _count: true
        })
        return counts.map(c => ({ source: c.source, count: c._count }))
    },

    /**
     * Get top companies by ER count and their status breakdown
     */
    async getCompanyMetrics(limit = 10) {
        const stats = await prisma.eR.groupBy({
            by: ['companyId', 'status'],
            _count: true,
        })

        const companyIds = [...new Set(stats.map(s => s.companyId))]
        const companies = await prisma.company.findMany({
            where: { id: { in: companyIds } }
        })
        const companyMap = new Map(companies.map(c => [c.id, c.name]))

        const result: Record<string, any> = {}
        stats.forEach(stat => {
            const name = companyMap.get(stat.companyId) || 'Unknown'
            if (!result[name]) {
                result[name] = { name, total: 0, accepted: 0, rejected: 0, inReview: 0, open: 0 }
            }
            result[name].total += stat._count
            if (stat.status === 'ACCEPTED' || stat.status === 'ACCEPT') result[name].accepted += stat._count
            else if (stat.status === 'REJECTED' || stat.status === 'REJECT') result[name].rejected += stat._count
            else if (stat.status === 'IN_REVIEW') result[name].inReview += stat._count
            else if (stat.status === 'OPEN') result[name].open += stat._count
        })

        return Object.values(result)
            .sort((a: any, b: any) => b.total - a.total)
            .slice(0, limit)
    },

    /**
     * Get activity trends (creation/acceptance) for the last N days
     */
    async getActivityTrends(days = 30) {
        const since = new Date()
        since.setDate(since.getDate() - days)

        const ers = await prisma.eR.findMany({
            where: { createdAt: { gte: since } },
            select: { createdAt: true, status: true }
        })

        const trendMap = new Map<string, any>()
        ers.forEach(er => {
            const date = er.createdAt.toISOString().split('T')[0]
            if (!trendMap.has(date)) {
                trendMap.set(date, { date, created: 0, accepted: 0, rejected: 0 })
            }
            const t = trendMap.get(date)
            t.created++
            if (er.status === 'ACCEPTED' || er.status === 'ACCEPT') t.accepted++
            if (er.status === 'REJECTED' || er.status === 'REJECT') t.rejected++
        })

        return Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date))
    },

    /**
     * Search for specific ERs or filter by criteria
     */
    async searchERs(query?: string, status?: ERStatus, limit = 5) {
        const where: any = {}
        if (query) {
            where.OR = [
                { subject: { contains: query } },
                { overview: { contains: query } }
            ]
        }
        if (status) where.status = status

        const ers = await prisma.eR.findMany({
            where,
            take: limit,
            orderBy: { totalCached: 'desc' },
            include: { company: true }
        })

        return ers.map(er => ({
            id: er.id,
            subject: er.subject,
            company: er.company.name,
            status: er.status,
            score: er.totalCached
        }))
    },

    /**
     * Get average scores by dimension
     */
    async getScoreAverages() {
        const aggs = await prisma.eR.aggregate({
            where: { totalCached: { gt: 0 } },
            _avg: {
                strategic: true,
                impact: true,
                market: true,
                technical: true,
                resource: true
            }
        })
        return {
            strategic: aggs._avg.strategic || 0,
            impact: aggs._avg.impact || 0,
            market: aggs._avg.market || 0,
            technical: aggs._avg.technical || 0,
            resource: aggs._avg.resource || 0
        }
    }
}
