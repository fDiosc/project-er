import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateConsolidatedPRD } from '@/lib/openai'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params

        const theme = await prisma.eRTheme.findUnique({
            where: { id },
            include: {
                ers: {
                    select: {
                        id: true,
                        externalId: true,
                        subject: true,
                        status: true,
                        company: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        })

        if (!theme) {
            return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
        }

        return NextResponse.json(theme)
    } catch (error) {
        console.error('Fetch theme error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch theme details' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id: themeId } = params
        const { erIds, action = 'add' } = await request.json()

        if (action === 'add') {
            if (!erIds || !Array.isArray(erIds)) {
                return NextResponse.json({ error: 'erIds is required and must be an array' }, { status: 400 })
            }
            // Simply link ERs to theme, set status to ACCEPT if not already
            await prisma.eR.updateMany({
                where: { id: { in: erIds } },
                data: {
                    themeId,
                    status: 'ACCEPT'
                }
            })
            // Return updated theme data without regeneration
            const theme = await prisma.eRTheme.findUnique({ where: { id: themeId } })
            return NextResponse.json(theme)
        }

        if (action === 'remove') {
            if (!erIds || !Array.isArray(erIds)) {
                return NextResponse.json({ error: 'erIds is required and must be an array' }, { status: 400 })
            }
            // Unlink ERs from theme, PRESERVE their status
            await prisma.eR.updateMany({
                where: { id: { in: erIds } },
                data: {
                    themeId: null
                    // Status is NOT changed
                }
            })
            // Return updated theme data without regeneration
            const theme = await prisma.eRTheme.findUnique({ where: { id: themeId } })
            return NextResponse.json(theme)
        }

        if (action === 'regenerate') {
            // Fetch ALL ERs currently in this theme to recalculate PRD
            const allErs = await prisma.eR.findMany({
                where: { themeId },
                select: {
                    subject: true,
                    description: true,
                    aiSummary: true
                }
            })

            if (allErs.length === 0) {
                return NextResponse.json(
                    { error: 'Cannot regenerate PRD for empty cluster' },
                    { status: 400 }
                )
            }

            // Generate updated consolidated PRD
            const updatedPRD = await generateConsolidatedPRD(allErs.map(er => ({
                ...er,
                description: er.description || ''
            })))

            // Update theme with new content and scores
            // FIXED: Use 'description' instead of 'summary'
            const theme = await prisma.eRTheme.update({
                where: { id: themeId },
                data: {
                    title: updatedPRD.title,
                    description: updatedPRD.summary, // Map AI 'summary' to DB 'description'
                    requirements: updatedPRD.requirements as any,
                    suggestedScores: { // Update structured scores as JSON
                        strategic: updatedPRD.suggestedScores.strategic,
                        impact: updatedPRD.suggestedScores.impact,
                        market: updatedPRD.suggestedScores.market,
                        technical: updatedPRD.suggestedScores.technical,
                        resource: updatedPRD.suggestedScores.resource
                    }
                }
            })
            return NextResponse.json(theme)
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (error) {
        console.error('Manual ER update error:', error)
        return NextResponse.json(
            { error: 'Failed to update theme ERs' },
            { status: 500 }
        )
    }
}
