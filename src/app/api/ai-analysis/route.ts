import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateCustomAnalysis } from '@/lib/openai'
import { ERStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
    try {
        const { erIds, prompt } = await request.json()

        if (!erIds || !Array.isArray(erIds) || erIds.length === 0) {
            return NextResponse.json(
                { error: { code: 'INVALID_INPUT', message: 'No ERs selected' } },
                { status: 400 }
            )
        }

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json(
                { error: { code: 'INVALID_INPUT', message: 'Prompt is required' } },
                { status: 400 }
            )
        }

        const ers = await prisma.eR.findMany({
            where: { id: { in: erIds } },
            select: {
                id: true,
                subject: true,
                description: true,
                aiSummary: true
            }
        })

        if (ers.length === 0) {
            return NextResponse.json(
                { error: { code: 'NOT_FOUND', message: 'Selected ERs not found' } },
                { status: 404 }
            )
        }

        const aiResult = await generateCustomAnalysis(
            prompt,
            ers.map(er => ({
                ...er,
                description: er.description || ''
            }))
        )

        const analysisReport = await prisma.aIAnalysisReport.create({
            data: {
                title: aiResult.title,
                prompt: prompt,
                report: aiResult.report,
                ers: {
                    connect: erIds.map(id => ({ id }))
                }
            }
        })

        return NextResponse.json({
            success: true,
            id: analysisReport.id,
            title: analysisReport.title
        })

    } catch (error) {
        console.error('AI Analysis error:', error)
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to generate AI analysis' } },
            { status: 500 }
        )
    }
}

export async function GET() {
    try {
        const reports = await prisma.aIAnalysisReport.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                createdAt: true,
                ers: {
                    select: {
                        id: true
                    }
                }
            }
        })

        return NextResponse.json({
            items: reports.map((r: any) => ({
                ...r,
                erCount: r.ers.length
            }))
        })
    } catch (error) {
        console.error('Fetch AI reports error:', error)
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch AI reports' } },
            { status: 500 }
        )
    }
}
