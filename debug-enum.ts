import { PrismaClient, ERStatus } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('ERStatus Enum Definition:', ERStatus)

    // also try to create a dummy accepted ER to prove it works? No, don't mutate DB without asking.
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
