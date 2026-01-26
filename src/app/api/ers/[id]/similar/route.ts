import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { findSimilarERs } from '@/lib/openai'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params

        // 1. Fetch Target ER
        const targetER = await prisma.eR.findUnique({
            where: { id },
            select: { id: true, subject: true, description: true, aiSummary: true }
        })

        if (!targetER) {
            return NextResponse.json({ error: 'ER not found' }, { status: 404 })
        }

        // 2. Fetch Backlog (potential candidates)
        const backlog = await prisma.eR.findMany({
            where: {
                id: { not: id },
                status: { in: ['OPEN', 'IN_REVIEW'] }
            },
            select: {
                id: true,
                subject: true,
                description: true,
                aiSummary: true,
                externalId: true,
                zendeskTicketUrl: true
            },
            take: 100
        })

        if (backlog.length === 0) {
            return NextResponse.json({ similarERs: [] })
        }

        // 3. AI Similarity Search
        const aiResult = await findSimilarERs(
            {
                id: targetER.id,
                subject: targetER.subject,
                description: targetER.description || '',
                aiSummary: targetER.aiSummary
            },
            backlog.map(er => ({
                id: er.id,
                subject: er.subject,
                description: er.description || '',
                aiSummary: er.aiSummary
            }))
        )

        // 4. Enrich results with metadata
        const enrichedSimilarERs = aiResult.similarERs.map(sim => {
            const match = backlog.find(b => b.id === sim.id)
            return {
                ...sim,
                externalId: match?.externalId,
                zendeskTicketUrl: match?.zendeskTicketUrl
            }
        })

        return NextResponse.json({ similarERs: enrichedSimilarERs })

    } catch (error) {
        console.error('Similarity search error:', error)
        return NextResponse.json(
            { error: 'Failed to search for similar ERs' },
            { status: 500 }
        )
    }
}
