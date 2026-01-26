import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateConsolidatedPRD } from '@/lib/openai'

export async function POST(request: NextRequest) {
    try {
        const { erIds } = await request.json()

        if (!erIds || !Array.isArray(erIds) || erIds.length === 0) {
            return NextResponse.json({ error: 'No ER IDs provided' }, { status: 400 })
        }

        // 1. Fetch all selected ERs
        const ers = await prisma.eR.findMany({
            where: { id: { in: erIds } },
            select: { subject: true, description: true, aiSummary: true }
        })

        if (ers.length === 0) {
            return NextResponse.json({ error: 'No ERs found' }, { status: 404 })
        }

        // 2. Generate Consolidated PRD
        const prd = await generateConsolidatedPRD(
            ers.map(er => ({
                subject: er.subject,
                description: er.description || '',
                aiSummary: er.aiSummary
            }))
        )

        return NextResponse.json(prd)

    } catch (error) {
        console.error('PRD generation error:', error)
        return NextResponse.json(
            { error: 'Failed to generate PRD' },
            { status: 500 }
        )
    }
}
