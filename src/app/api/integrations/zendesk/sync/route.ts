import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ERStatus } from '@prisma/client'
import { analyzeERContext } from '@/lib/openai'

export const dynamic = 'force-dynamic'

const SETTING_KEY = 'zendesk_config'
const JIRA_FIX_VERSION_FIELD_ID = 24247216
const JIRA_STATUS_TEXT_FIELD_ID = 24206703

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({})) // Body might be empty
        const { autoRejectMissing, autoAcceptMapped, runAI } = body
        // 1. Load Config
        const setting = await prisma.setting.findUnique({
            where: { key: SETTING_KEY }
        })

        if (!setting) {
            return NextResponse.json(
                { error: { code: 'CONFIG_ERROR', message: 'Zendesk not configured' } },
                { status: 400 }
            )
        }

        const config = setting.jsonValue as Record<string, string>
        const { subdomain: rawSubdomain, email, apiToken, viewId } = config

        // Sanitize subdomain (remove protocol and .zendesk.com suffix if present)
        const subdomain = rawSubdomain?.replace(/^https?:\/\//, '').replace(/\.zendesk\.com$/, '')

        if (!subdomain || !email || !apiToken || !viewId) {
            return NextResponse.json(
                { error: { code: 'CONFIG_ERROR', message: 'Incomplete configuration' } },
                { status: 400 }
            )
        }

        // 2. Prepare Auth
        const authString = Buffer.from(`${email}/token:${apiToken}`).toString('base64')
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const headers = {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json',
        }

        // 3. Fetch Tickets from View (With Pagination)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allTickets: any[] = []
        let nextPage: string | null = `https://${subdomain}.zendesk.com/api/v2/views/${viewId}/tickets.json?include=organizations`
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allOrganizations: any[] = []
        let pageCount = 0

        while (nextPage) {
            pageCount++
            // WORKAROUND: Use system curl to bypass Node.js SSL/Zscaler issues completely.
            const urlToFetch = nextPage // Capture current value for closure safely if needed, though sequential await is fine

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const responseData: any = await new Promise((resolve, reject) => {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const { exec } = require('child_process');
                const cmd = `curl -s -H "Authorization: Basic ${authString}" "${urlToFetch}"`;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (error: any, stdout: string, stderr: string) => {
                    if (error) {
                        // If one page fails, we might want to log and abort or continue. Aborting is safer for data integrity.
                        reject(new Error(`Curl error on page ${pageCount}: ${error.message}`));
                        return;
                    }
                    try {
                        resolve(JSON.parse(stdout));
                    } catch (e) {
                        // gracefully handle JSON parse errors?
                        reject(new Error(`Failed to parse curl output on page ${pageCount}: ${(e as Error).message}`));
                    }
                });
            });

            if (responseData.tickets) {
                allTickets.push(...responseData.tickets)
            }
            if (responseData.organizations) {
                allOrganizations.push(...responseData.organizations)
            }

            nextPage = responseData.next_page || null

            // Safety break for infinite loops
            if (pageCount > 50) {
                console.warn('Sync loop exceeded 50 pages, forcing break.')
                break
            }
        }

        const tickets = allTickets
        const organizations = allOrganizations

        // Create Organization Map (ID -> Name)
        const orgMap = new Map<number, string>()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        organizations.forEach((org: any) => {
            orgMap.set(org.id, org.name)
        })

        console.log(`Found ${tickets.length} tickets and ${organizations.length} organizations across ${pageCount} pages`)

        // 4. Default Company
        let defaultCompany = await prisma.company.findFirst({
            where: { name: 'Zendesk Import' }
        })

        if (!defaultCompany) {
            defaultCompany = await prisma.company.create({
                data: { name: 'Zendesk Import' }
            })
        }

        const stats = { created: 0, updated: 0, failed: 0, rejected: 0 }

        // 5. Upsert ERs
        for (const ticket of tickets) {
            try {
                const externalId = String(ticket.id)

                // Determine Company
                let companyId = defaultCompany.id
                if (ticket.organization_id) {
                    const orgName = orgMap.get(ticket.organization_id)
                    if (orgName) {
                        const company = await prisma.company.upsert({
                            where: { name: orgName },
                            update: {},
                            create: { name: orgName }
                        })
                        companyId = company.id
                    }
                }

                console.log(`Processing ticket ${ticket.id}...`)

                // Extract JIRA Fields
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const jiraFixVersionField = ticket.custom_fields.find((f: any) => f.id === JIRA_FIX_VERSION_FIELD_ID)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const jiraStatusTextField = ticket.custom_fields.find((f: any) => f.id === JIRA_STATUS_TEXT_FIELD_ID)

                let releaseId: string | null = null
                if (jiraFixVersionField?.value) {
                    const release = await prisma.release.upsert({
                        where: { name: String(jiraFixVersionField.value) },
                        update: {},
                        create: { name: String(jiraFixVersionField.value) }
                    })
                    releaseId = release.id
                }

                let devStatusId: string | null = null
                if (jiraStatusTextField?.value) {
                    const devStatus = await prisma.developmentStatus.upsert({
                        where: { name: String(jiraStatusTextField.value) },
                        update: {},
                        create: { name: String(jiraStatusTextField.value) }
                    })
                    devStatusId = devStatus.id
                }

                const erData = {
                    externalId,
                    subject: ticket.subject,
                    description: ticket.description,
                    companyId,
                    releaseId,
                    devStatusId,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    source: 'ZENDESK' as any,
                    requestedAt: new Date(ticket.created_at),
                    lastSyncAt: new Date(),
                    externalUpdatedAt: new Date(ticket.updated_at),
                    zendeskTicketUrl: `https://${subdomain}.zendesk.com/agent/tickets/${ticket.id}`,
                }

                const existing = await prisma.eR.findFirst({
                    where: { externalId }
                })

                // Determine Status
                let newStatus: ERStatus = 'OPEN'

                if (existing) {
                    newStatus = existing.status as ERStatus

                    // Efficiency Check: Skip metadata update if ticket hasn't changed?
                    // NOTE: We don't skip the whole loop because we want to ensure comments are synced 
                    // if they were missed in a previous sync attempt.
                    const zendeskUpdatedAt = new Date(ticket.updated_at).getTime()
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const localUpdatedAt = (existing as any).externalUpdatedAt ? new Date((existing as any).externalUpdatedAt).getTime() : 0

                    if (zendeskUpdatedAt <= localUpdatedAt) {
                        // Check if we already have synced comments for this ER. 
                        // If we do, THEN we can safely skip.
                        const commentCount = await prisma.comment.count({
                            where: {
                                erId: existing.id,
                                authorId: { startsWith: 'Zendesk' }
                            }
                        })

                        if (commentCount > 0 && existing.releaseId && existing.devStatusId) {
                            console.log(`Ticket ${ticket.id} unchanged, has comments and JIRA fields, skipping...`)
                            continue
                        }
                        console.log(`Ticket ${ticket.id} unchanged but missing comments or JIRA fields, proceeding with sync...`)
                    }
                }

                // 1. Map Status (Solved/Closed -> ACCEPTED)
                if (ticket.status === 'solved' || ticket.status === 'closed') {
                    newStatus = 'ACCEPTED'
                }

                // 2. Auto-accept Mapped Statuses override
                if (autoAcceptMapped) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const statusField = ticket.custom_fields.find((f: any) => f.id === 360001983751)

                    const acceptedTags = [
                        'er_accepted_12mo',
                        'er_accepted_on_roadmap',
                        'er_dev_on_track',
                        '_6__in_development__assigned_to_release_'
                    ]

                    if (statusField && acceptedTags.includes(statusField.value)) {
                        newStatus = 'ACCEPTED'
                    }
                }

                // Sync Full Conversation (Zendesk Comments)
                try {
                    console.log(`Fetching full conversation for ticket ${ticket.id}...`)
                    const commentsUrl = `https://${subdomain}.zendesk.com/api/v2/tickets/${ticket.id}/comments.json`
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const commentsData: any = await new Promise((resolve, reject) => {
                        // eslint-disable-next-line @typescript-eslint/no-require-imports
                        const { exec } = require('child_process');
                        const cmd = `curl -s -H "Authorization: Basic ${authString}" "${commentsUrl}"`;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (error: any, stdout: string) => {
                            if (error) reject(error);
                            else {
                                try { resolve(JSON.parse(stdout)) } catch (e) { reject(e) }
                            }
                        })
                    })

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const zendeskComments = (commentsData.comments || []).filter((c: any) => c.public)
                    console.log(`Found ${zendeskComments.length} public comments for ticket ${ticket.id}`)

                    const er = existing || await prisma.eR.create({
                        data: {
                            ...erData,
                            status: newStatus,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        } as any
                    })

                    // UPSERT comments to avoid duplicates (using body + timestamp as a proxy for uniqueness since we don't store zendesk comment ID)
                    for (const zc of zendeskComments) {
                        const commentAuthor = zc.author_id ? `Zendesk User ${zc.author_id}` : 'Zendesk System'
                        const commentDate = new Date(zc.created_at)

                        // Check if this comment already exists for this ER
                        const existingComment = await prisma.comment.findFirst({
                            where: {
                                erId: er.id,
                                body: zc.plain_body,
                                // Relaxed check: body match is usually enough for the same ER
                            }
                        })

                        if (!existingComment) {
                            await prisma.comment.create({
                                data: {
                                    erId: er.id,
                                    authorId: commentAuthor,
                                    body: zc.plain_body,
                                    createdAt: commentDate
                                }
                            })
                        }
                    }

                    // AI Analysis (using full conversation now)
                    if (runAI) {
                        try {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const aiComments = zendeskComments.map((c: any) => c.plain_body).slice(-10) // More context for AI
                            const aiResult = await analyzeERContext(ticket.subject, ticket.description, aiComments)

                            await prisma.eR.update({
                                where: { id: er.id },
                                data: {
                                    ...erData,
                                    status: newStatus,
                                    aiSummary: aiResult.summary,
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    aiSuggestedScores: aiResult.scores as any
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                } as any
                            })
                        } catch (aiErr) {
                            console.error(`AI analysis failed for ${ticket.id}:`, aiErr)
                        }
                    } else if (existing) {
                        // Update basic data if not running AI
                        await prisma.eR.update({
                            where: { id: existing.id },
                            data: {
                                ...erData,
                                status: newStatus,
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            } as any
                        })
                    }

                    if (existing) stats.updated++; else stats.created++;

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } catch (convErr: any) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    console.error(`Conversation sync failed for ${ticket.id}:`, (convErr as any).message)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    stats.failed++
                }
            } catch (err) {
                console.error(`Failed to process ticket ${ticket.id}:`, err)
                stats.failed++
            }
        }

        // 6. Handle Auto-reject Missing
        if (autoRejectMissing) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const syncedExternalIds = tickets.map((t: any) => String(t.id))

            // A. Standard Auto-Reject for NON-Accepted items
            const result = await prisma.eR.updateMany({
                where: {
                    source: { in: ['ZENDESK', 'CSV'] },
                    NOT: {
                        externalId: { in: syncedExternalIds }
                    },
                    status: {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        notIn: ['REJECTED', 'REJECT', 'ACCEPTED', 'ACCEPT', 'DELIVERED', 'MANUAL_REVIEW'] as any
                    }
                },
                data: {
                    status: 'REJECTED'
                }
            })
            stats.rejected = result.count

            // B. Secondary Sync: Handle Missing ACCEPTED items
            const missingAccepted = await prisma.eR.findMany({
                where: {
                    source: { in: ['ZENDESK', 'CSV'] },
                    NOT: {
                        externalId: { in: syncedExternalIds }
                    },
                    status: {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        in: ['ACCEPTED', 'ACCEPT'] as any
                    }
                }
            })

            console.log(`Found ${missingAccepted.length} missing ACCEPTED tickets. Checking for Delivery...`)

            for (const er of missingAccepted) {
                if (!er.externalId) continue

                try {
                    // Fetch individual ticket to check tags
                    const ticketUrl = `https://${subdomain}.zendesk.com/api/v2/tickets/${er.externalId}.json`
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const ticketData: any = await new Promise((resolve) => {
                        // eslint-disable-next-line @typescript-eslint/no-require-imports
                        const { exec } = require('child_process');
                        const cmd = `curl -s -H "Authorization: Basic ${authString}" "${ticketUrl}"`;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        exec(cmd, { maxBuffer: 1024 * 1024 }, (error: any, stdout: string) => {
                            try { resolve(JSON.parse(stdout)) } catch { resolve({}) }
                        })
                    })

                    const ticket = ticketData.ticket
                    if (!ticket) {
                        console.warn(`Could not fetch ticket ${er.externalId} for secondary sync`)
                        continue
                    }

                    // Check for 'er_released' tag
                    const releasedTag = 'er_released'
                    const isReleased = ticket.tags && ticket.tags.includes(releasedTag)

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let secondaryStatus: any = 'MANUAL_REVIEW'
                    if (isReleased) {
                        secondaryStatus = 'DELIVERED'
                    }

                    await prisma.eR.update({
                        where: { id: er.id },
                        data: {
                            status: secondaryStatus,
                            lastSyncAt: new Date()
                        }
                    })

                    // Count stats (optional reuse of fields or just log)
                    console.log(`Updated ${er.externalId} to ${secondaryStatus}`)

                } catch (secondaryErr) {
                    console.error(`Secondary sync failed for ${er.externalId}`, secondaryErr)
                }
            }
        }

        return NextResponse.json({
            success: true,
            stats,
            message: `Sync complete: ${stats.created} created, ${stats.updated} updated, ${stats.rejected} rejected.`
        })

    } catch (error) {
        console.error('Sync error:', error)
        return NextResponse.json(
            { error: { code: 'SYNC_ERROR', message: 'Internal sync error' } },
            { status: 500 }
        )
    }
}
