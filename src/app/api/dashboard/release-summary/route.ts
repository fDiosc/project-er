import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ERStatus } from '@prisma/client'
import type { ReleaseSummary } from '@/types'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const releaseId = searchParams.get('releaseId')

        if (!releaseId) {
            return NextResponse.json(
                { error: { code: 'MISSING_RELEASE_ID', message: 'Release ID is required' } },
                { status: 400 }
            )
        }

        const release = await prisma.release.findUnique({
            where: { id: releaseId }
        })

        if (!release) {
            return NextResponse.json(
                { error: { code: 'NOT_FOUND', message: 'Release not found' } },
                { status: 404 }
            )
        }

        // Get all ERs for this release
        const ers = await prisma.eR.findMany({
            where: { releaseId },
            include: {
                company: true,
                devStatus: true,
            },
            orderBy: { updatedAt: 'desc' }
        })

        // Grouping logic for JIRA statuses
        const COMPLETED_STATUSES = ['Done', 'Merged', 'Closed', 'Delivered']
        const IN_PROGRESS_STATUSES = ['In Progress', 'Code Review', 'In Review', 'In QA Review', 'QA', 'Testing']

        const byStatus = {
            open: 0,
            inProgress: 0,
            completed: 0
        }

        const customerMap = new Map<string, { id: string; name: string; itemCount: number }>()

        const items = ers.map(er => {
            const devStatusName = er.devStatus?.name || 'Open'

            let mappedStatus: 'open' | 'inProgress' | 'completed' = 'open'
            if (COMPLETED_STATUSES.includes(devStatusName) || er.status === ERStatus.DELIVERED) {
                mappedStatus = 'completed'
            } else if (IN_PROGRESS_STATUSES.includes(devStatusName)) {
                mappedStatus = 'inProgress'
            }

            byStatus[mappedStatus]++

            // Update customer stats
            if (!customerMap.has(er.company.id)) {
                customerMap.set(er.company.id, {
                    id: er.company.id,
                    name: er.company.name,
                    itemCount: 0
                })
            }
            customerMap.get(er.company.id)!.itemCount++

            return {
                id: er.id,
                subject: er.subject,
                companyName: er.company.name,
                devStatus: devStatusName,
                status: er.status
            }
        })

        const customers = Array.from(customerMap.values())
            .sort((a, b) => b.itemCount - a.itemCount)

        const summary: ReleaseSummary = {
            releaseId: release.id,
            releaseName: release.name,
            totalERs: ers.length,
            byStatus,
            customers,
            items
        }

        return NextResponse.json(summary)
    } catch (error) {
        console.error('Error fetching release summary:', error)
        return NextResponse.json(
            { error: { code: 'FETCH_ERROR', message: 'Failed to fetch release summary' } },
            { status: 500 }
        )
    }
}
