import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const stats = await prisma.eR.groupBy({
        by: ['status'],
        _count: true
    })
    console.log('Status Distribution:', stats)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
