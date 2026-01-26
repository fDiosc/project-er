
import { PrismaClient } from '@prisma/client'
import { exec } from 'child_process'

const prisma = new PrismaClient()

async function main() {
    const setting = await prisma.setting.findUnique({ where: { key: 'zendesk_config' } })
    if (!setting) {
        console.log('No config found')
        return
    }
    const config = setting.jsonValue as any
    const { subdomain: rawSubdomain, email, apiToken, viewId } = config
    const subdomain = rawSubdomain?.replace(/^https?:\/\//, '').replace(/\.zendesk\.com$/, '')

    const authString = Buffer.from(`${email}/token:${apiToken}`).toString('base64')
    // Fetch field definition
    const url = `https://${subdomain}.zendesk.com/api/v2/ticket_fields/360001983751.json`
    const cmd = `curl -s -H "Authorization: Basic ${authString}" "${url}"`

    exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
            console.error(error)
            return
        }
        try {
            const data = JSON.parse(stdout)
            const field = data.ticket_field
            if (field) {
                console.log('Field:', field.title)
                console.log('--- Options ---')
                field.custom_field_options.forEach((opt: any) => {
                    console.log(`${opt.name} -> ${opt.value}`)
                })
            } else {
                console.log('Field not found')
            }
        } catch (e) {
            console.error('Failed to parse output', e)
        }
    })
}

main()
