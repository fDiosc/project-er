import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const SETTING_KEY = 'zendesk_config'

const zendeskConfigSchema = z.object({
    subdomain: z.string().min(1),
    email: z.string().email(),
    apiToken: z.string().optional(), // Optional on update if already exists
    viewId: z.string().min(1),
})

// GET /api/settings/zendesk - Get current config
export async function GET() {
    try {
        const setting = await prisma.setting.findUnique({
            where: { key: SETTING_KEY }
        })

        if (!setting) {
            return NextResponse.json({})
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const config = setting.jsonValue as Record<string, any>
        // Don't return the actual token for security
        return NextResponse.json({
            subdomain: config.subdomain,
            email: config.email,
            viewId: config.viewId,
            hasToken: !!config.apiToken
        })

    } catch (error) {
        console.error('Error fetching Zendesk config:', error)
        return NextResponse.json(
            { error: { code: 'FETCH_ERROR', message: 'Failed to fetch settings' } },
            { status: 500 }
        )
    }
}

// POST /api/settings/zendesk - Save config
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const data = zendeskConfigSchema.parse(body)

        // Check existing config to merge token if not provided
        const existing = await prisma.setting.findUnique({
            where: { key: SETTING_KEY }
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existingConfig = (existing?.jsonValue as Record<string, any>) || {}

        const newConfig = {
            subdomain: data.subdomain,
            email: data.email,
            viewId: data.viewId,
            // Update token if provided, otherwise keep existing
            apiToken: data.apiToken || existingConfig.apiToken
        }

        if (!newConfig.apiToken) {
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: 'API Token is required' } },
                { status: 400 }
            )
        }

        await prisma.setting.upsert({
            where: { key: SETTING_KEY },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            update: { jsonValue: newConfig as any },
            create: {
                key: SETTING_KEY,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                jsonValue: newConfig as any
            }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error saving Zendesk config:', error)
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                { error: { code: 'VALIDATION_ERROR', message: 'Invalid configuration', details: (error as any).errors } },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: { code: 'SAVE_ERROR', message: 'Failed to save settings' } },
            { status: 500 }
        )
    }
}
