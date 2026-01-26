import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { exec } from 'child_process'

export const dynamic = 'force-dynamic'

const SETTING_KEY = 'zendesk_config'

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params
    const id = params.id

    try {
        // 1. Load Config
        const setting = await prisma.setting.findUnique({
            where: { key: SETTING_KEY }
        })

        if (!setting) {
            return NextResponse.json({ error: 'Zendesk not configured' }, { status: 400 })
        }

        const config = setting.jsonValue as Record<string, string>
        const { subdomain: rawSubdomain, email, apiToken } = config
        const subdomain = rawSubdomain?.replace(/^https?:\/\//, '').replace(/\.zendesk\.com$/, '')
        const authString = Buffer.from(`${email}/token:${apiToken}`).toString('base64')

        // 2. Fetch Ticket
        const ticketUrl = `https://${subdomain}.zendesk.com/api/v2/tickets/${id}.json`
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ticketData: any = await new Promise((resolve, reject) => {
            const cmd = `curl -s -H "Authorization: Basic ${authString}" "${ticketUrl}"`
            exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout) => {
                if (error) reject(error)
                else {
                    try { resolve(JSON.parse(stdout)) } catch (e) { reject(e) }
                }
            })
        })

        // 3. Fetch Comments
        const commentsUrl = `https://${subdomain}.zendesk.com/api/v2/tickets/${id}/comments.json`
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const commentsData: any = await new Promise((resolve, reject) => {
            const cmd = `curl -s -H "Authorization: Basic ${authString}" "${commentsUrl}"`
            exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout) => {
                if (error) reject(error)
                else {
                    try { resolve(JSON.parse(stdout)) } catch (e) { reject(e) }
                }
            })
        })

        return NextResponse.json({
            ticket: ticketData.ticket,
            comments: commentsData.comments,
            debug_info: {
                subdomain,
                ticket_id: id,
                comment_count: commentsData.comments?.length
            }
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return NextResponse.json({ error: (error as any).message }, { status: 500 })
    }
}
