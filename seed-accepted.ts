import { PrismaClient, ERStatus } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    // Find one IN_REVIEW ER
    const er = await prisma.eR.findFirst({
        where: { status: 'IN_REVIEW' }
    })

    if (er) {
        console.log(`Found ER to update: ${er.id} (${er.subject})`)

        // Update to ACCEPTED
        await prisma.eR.update({
            where: { id: er.id },
            data: { status: 'ACCEPTED' } // Explicitly using ACCEPTED
        })
        console.log('Successfully updated ER to ACCEPTED status.')
    } else {
        console.log('No IN_REVIEW ERs found to update.')
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
