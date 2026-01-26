
import { PrismaClient } from '@prisma/client'
import { exec } from 'child_process'

const prisma = new PrismaClient()
const SETTING_KEY = 'zendesk_config'

async function main() {
    console.log('--- Test: Secondary Sync (Delivered) ---')

    // 1. Setup Data: Ensure ER #1431540 exists as ACCEPTED
    const targetId = '1431540'
    console.log(`Seeding/Resetting ER #${targetId} to ACCEPTED...`)

    const existing = await prisma.eR.findFirst({ where: { externalId: targetId } })
    if (existing) {
        await prisma.eR.update({
            where: { id: existing.id },
            data: { status: 'ACCEPTED', source: 'ZENDESK' }
        })
        console.log(`Updated existing ER ${existing.id}`)
    } else {
        const company = await prisma.company.findFirst()
        if (!company) throw new Error('No company found to link ER')

        await prisma.eR.create({
            data: {
                subject: 'Test Delivered Logic',
                companyId: company.id,
                status: 'ACCEPTED',
                source: 'ZENDESK',
                externalId: targetId
            }
        })
        console.log(`Created new ER with externalId ${targetId}`)
    }

    // 2. Fetch Logic (Mocking the sync route's secondary phase)
    const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } })
    const config = setting?.jsonValue as any
    const { subdomain: rawSubdomain, email, apiToken } = config
    const subdomain = rawSubdomain?.replace(/^https?:\/\//, '').replace(/\.zendesk\.com$/, '')
    const authString = Buffer.from(`${email}/token:${apiToken}`).toString('base64')

    console.log(`Checking ticket #${targetId} against Zendesk...`)

    try {
        const ticketUrl = `https://${subdomain}.zendesk.com/api/v2/tickets/${targetId}.json`
        const ticketData: any = await new Promise((resolve) => {
            const cmd = `curl -s -H "Authorization: Basic ${authString}" "${ticketUrl}"`;
            exec(cmd, { maxBuffer: 1024 * 1024 }, (error: any, stdout: string) => {
                try { resolve(JSON.parse(stdout)) } catch { resolve({}) }
            })
        })

        const ticket = ticketData.ticket
        if (ticket) {
            const releasedTag = 'er_released'
            const isReleased = ticket.tags && ticket.tags.includes(releasedTag)
            console.log(`[DEBUG] Ticket Tags: ${ticket.tags}`)
            console.log(`[DEBUG] Is Released? ${isReleased}`)

            let secondaryStatus = 'MANUAL_REVIEW'
            if (isReleased) {
                secondaryStatus = 'DELIVERED'
            }

            console.log(`Logic Result: Status should become ${secondaryStatus}`)

            // Verify against expected
            if (secondaryStatus === 'DELIVERED') {
                console.log('SUCCESS: Logic correctly identified DELIVERED status.')
            } else {
                console.error('FAILURE: Logic did NOT match expected DELIVERED status.')
            }
        } else {
            console.error('Failed to fetch ticket from Zendesk.')
        }

    } catch (e) {
        console.error(e)
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
