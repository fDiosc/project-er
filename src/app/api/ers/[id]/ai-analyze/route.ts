import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { analyzeERContext } from '@/lib/openai'

export const dynamic = 'force-dynamic'

const SETTING_KEY = 'zendesk_config'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const er = await prisma.eR.findUnique({
            where: { id },
            include: { company: true }
        })

        if (!er) {
            return NextResponse.json(
                { error: { code: 'NOT_FOUND', message: 'ER not found' } },
                { status: 404 }
            )
        }

        let comments: string[] = []

        if (er.externalId) {
            // Load Zendesk Config for Auth
            const setting = await prisma.setting.findUnique({
                where: { key: SETTING_KEY }
            })

            if (setting) {
                const config = setting.jsonValue as Record<string, string>
                const { subdomain: rawSubdomain, email, apiToken } = config
                const subdomain = rawSubdomain?.replace(/^https?:\/\//, '').replace(/\.zendesk\.com$/, '')
                const authString = Buffer.from(`${email}/token:${apiToken}`).toString('base64')

                // Fetch comments
                const commentsUrl = `https://${subdomain}.zendesk.com/api/v2/tickets/${er.externalId}/comments.json`

                try {
                    // Using system curl to bypass SSL issues as in the sync logic
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const commentsData: any = await new Promise((resolve, reject) => {
                        // eslint-disable-next-line @typescript-eslint/no-require-imports
                        const { exec } = require('child_process');
                        const cmd = `curl -s -H "Authorization: Basic ${authString}" "${commentsUrl}"`;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        exec(cmd, { maxBuffer: 5 * 1024 * 1024 }, (error: any, stdout: string) => {
                            if (error) reject(error);
                            else {
                                try { resolve(JSON.parse(stdout)) } catch (e) { reject(e) }
                            }
                        })
                    })

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    comments = (commentsData.comments || []).map((c: any) => c.plain_body).slice(-5)
                } catch (e) {
                    console.warn(`Failed to fetch Zendesk comments for ER ${id}:`, e)
                }
            }
        }

        console.log(`Analyzing ER ${id} with AI...`)
        const aiResult = await analyzeERContext(er.subject, er.description || '', comments)

        const updated = await prisma.eR.update({
            where: { id },
            data: {
                aiSummary: aiResult.summary,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                aiSuggestedScores: aiResult.scores as any
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any
        })

        return NextResponse.json({
            success: true,
            data: updated
        })

    } catch (error) {
        console.error('AI Analysis error:', error)
        return NextResponse.json(
            { error: { code: 'AI_ERROR', message: (error as Error).message } },
            { status: 500 }
        )
    }
}
