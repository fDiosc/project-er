import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { updateScoresSchema, calculateTotalScore } from '@/lib/validations'

// PATCH /api/ers/[id]/scores - Update ER scores
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const body = await request.json()
    const update = updateScoresSchema.parse(body)

    // Fetch current ER to get other scores for total calculation
    const currentER = await prisma.eR.findUnique({
      where: { id: params.id },
      select: {
        strategic: true,
        impact: true,
        technical: true,
        resource: true,
        market: true,
      }
    })

    if (!currentER) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'ER not found' } },
        { status: 404 }
      )
    }

    // Merge updates with current values
    const mergedScores = {
      strategic: update.strategic !== undefined ? update.strategic : currentER.strategic,
      impact: update.impact !== undefined ? update.impact : currentER.impact,
      technical: update.technical !== undefined ? update.technical : currentER.technical,
      resource: update.resource !== undefined ? update.resource : currentER.resource,
      market: update.market !== undefined ? update.market : currentER.market,
    }

    // Calculate new total with merged scores
    const totalCached = calculateTotalScore(mergedScores)

    const er = await prisma.eR.update({
      where: { id: params.id },
      data: {
        ...update,
        totalCached,
      },
      include: {
        company: true,
      }
    })

    // Create audit log
    await prisma.audit.create({
      data: {
        erId: params.id,
        action: 'SCORE_UPDATE',
        payload: { scores: update, totalCached },
      }
    })

    return NextResponse.json({
      scores: {
        strategic: er.strategic,
        impact: er.impact,
        technical: er.technical,
        resource: er.resource,
        market: er.market,
        total: er.totalCached ?? 0
      }
    })
  } catch (error) {
    console.error('Error updating scores:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid score data' } },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'ER not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: { code: 'UPDATE_ERROR', message: 'Failed to update scores' } },
      { status: 500 }
    )
  }
}