import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params

        const report = await prisma.aIAnalysisReport.findUnique({
            where: { id },
            include: {
                ers: {
                    select: {
                        id: true,
                        subject: true,
                        company: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        })

        if (!report) {
            return NextResponse.json(
                { error: { code: 'NOT_FOUND', message: 'Report not found' } },
                { status: 404 }
            )
        }

        return NextResponse.json(report)
    } catch (error) {
        console.error('Fetch AI report detail error:', error)
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch report details' } },
            { status: 500 }
        )
    }
}
