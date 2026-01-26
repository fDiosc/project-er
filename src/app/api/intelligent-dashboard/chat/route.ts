import { NextRequest, NextResponse } from 'next/server'
import { processDashboardQuery } from '@/lib/ai-intelligent-dashboard'

export async function POST(request: NextRequest) {
    try {
        const { message, history } = await request.json()

        if (!message) {
            return NextResponse.json(
                { error: { code: 'INVALID_INPUT', message: 'Message is required' } },
                { status: 400 }
            )
        }

        const result = await processDashboardQuery(message, history || [])

        return NextResponse.json(result)

    } catch (error) {
        console.error('Intelligent Dashboard API error:', error)
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to process dashboard query' } },
            { status: 500 }
        )
    }
}
