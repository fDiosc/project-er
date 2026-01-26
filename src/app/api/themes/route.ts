import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateTotalScore } from '@/lib/validations'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { title, description, requirements, erIds, suggestedScores } = body

        if (!erIds || !Array.isArray(erIds) || erIds.length === 0) {
            return NextResponse.json({ error: 'No ER IDs provided' }, { status: 400 })
        }

        // Use a transaction to ensure all updates succeed or fail together
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the Theme
            const theme = await tx.eRTheme.create({
                data: {
                    title,
                    description,
                    requirements: requirements as any,
                    suggestedScores: suggestedScores as any,
                }
            })

            // 2. Update all ERs
            const totalScore = calculateTotalScore({
                strategic: suggestedScores.strategic,
                impact: suggestedScores.impact,
                market: suggestedScores.market,
                technical: suggestedScores.technical,
                resource: suggestedScores.resource,
            })

            await tx.eR.updateMany({
                where: { id: { in: erIds } },
                data: {
                    themeId: theme.id,
                    status: 'ACCEPT',
                    strategic: suggestedScores.strategic,
                    impact: suggestedScores.impact,
                    market: suggestedScores.market,
                    technical: suggestedScores.technical,
                    resource: suggestedScores.resource,
                    totalCached: totalScore,
                }
            })

            // 3. Create Audit entries for each ER
            for (const erId of erIds) {
                await tx.audit.create({
                    data: {
                        erId,
                        action: 'CONSOLIDATED_INTO_THEME',
                        payload: {
                            themeId: theme.id,
                            themeTitle: title,
                            status: 'ACCEPT',
                            scores: suggestedScores
                        }
                    }
                })
            }

            return theme
        })

        return NextResponse.json(result)

    } catch (error) {
        console.error('Theme creation error:', error)
        return NextResponse.json(
            { error: 'Failed to create theme and update ERs' },
            { status: 500 }
        )
    }
}

export async function GET() {
    try {
        const themes = await prisma.eRTheme.findMany({
            include: {
                _count: {
                    select: { ers: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        return NextResponse.json(themes)
    } catch (error) {
        console.error('Fetch themes error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch themes' },
            { status: 500 }
        )
    }
}
