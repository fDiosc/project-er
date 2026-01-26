import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { scoreWeightsSchema, DEFAULT_SCORE_WEIGHTS } from '@/lib/validations'

const WEIGHTS_KEY = 'score_weights'

// GET /api/settings/weights - Get score weights
export async function GET(request: NextRequest) {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: WEIGHTS_KEY }
    })

    const weights = setting
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (setting.jsonValue as any)
      : DEFAULT_SCORE_WEIGHTS

    return NextResponse.json(weights)
  } catch (error) {
    console.error('Error fetching weights:', error)
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch score weights' } },
      { status: 500 }
    )
  }
}

// PATCH /api/settings/weights - Update score weights
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const weights = scoreWeightsSchema.parse(body)

    const setting = await prisma.setting.upsert({
      where: { key: WEIGHTS_KEY },
      update: {
        jsonValue: weights
      },
      create: {
        key: WEIGHTS_KEY,
        jsonValue: weights
      }
    })

    // TODO: Trigger background recomputation of all ER totals
    // This could be done with a job queue in production
    console.log('Score weights updated, should recompute all totals')

    return NextResponse.json(weights)
  } catch (error) {
    console.error('Error updating weights:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid weights data' } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: { code: 'UPDATE_ERROR', message: 'Failed to update score weights' } },
      { status: 500 }
    )
  }
}