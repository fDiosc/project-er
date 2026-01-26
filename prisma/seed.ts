import { PrismaClient, ERStatus } from '@prisma/client'
import { calculateTotalScore } from '../src/lib/validations'

const prisma = new PrismaClient()

const companies = [
  'Allstate Insurance',
  'Progressive Corporation',
  'State Farm',
  'GEICO',
  'Liberty Mutual',
  'Farmers Insurance',
  'USAA',
  'Travelers Companies',
]

const erSubjects = [
  'Mobile app performance optimization',
  'Claims processing automation',
  'Customer portal redesign',
  'Payment gateway integration',
  'Document upload improvements',
  'Real-time notifications system',
  'Multi-language support',
  'Advanced reporting dashboard',
  'API rate limiting implementation',
  'Security vulnerability fixes',
  'Database migration tools',
  'User authentication enhancement',
  'Third-party integrations',
  'Performance monitoring tools',
  'Backup and recovery system',
]

const sentiments = ['Positive', 'Neutral', 'Negative', 'Mixed']
const priorities = ['High', 'Medium', 'Low', 'Critical']

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomScore(): number {
  return Math.floor(Math.random() * 6) // 0-5
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.audit.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.eRTag.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.eR.deleteMany()
  await prisma.company.deleteMany()

  // Create companies
  console.log('Creating companies...')
  const createdCompanies = []
  for (const companyName of companies) {
    const company = await prisma.company.create({
      data: { name: companyName }
    })
    createdCompanies.push(company)
  }

  // Create tags
  console.log('Creating tags...')
  const tags = ['Enhancement', 'Bug Fix', 'Feature Request', 'Performance', 'Security', 'UI/UX', 'Integration']
  const createdTags = []
  for (const tagLabel of tags) {
    const tag = await prisma.tag.create({
      data: { label: tagLabel }
    })
    createdTags.push(tag)
  }

  // Create ERs
  console.log('Creating ERs...')
  const startDate = new Date('2024-01-01')
  const endDate = new Date()

  for (let i = 1; i <= 50; i++) {
    const company = randomChoice(createdCompanies)
    const subject = randomChoice(erSubjects)

    // Generate scores
    const strategic = randomScore()
    const impact = randomScore()
    const technical = randomScore()
    const resource = randomScore()
    const market = randomScore()

    const totalCached = calculateTotalScore({
      strategic,
      impact,
      technical,
      resource,
      market,
    })

    const requestedAt = randomDate(startDate, endDate)
    const updatedAtCsv = randomDate(requestedAt, endDate)

    const er = await prisma.eR.create({
      data: {
        externalId: `ER-${String(i).padStart(4, '0')}`,
        subject: `${subject} for ${company.name}`,
        overview: `This enhancement request aims to improve ${subject.toLowerCase()} to better serve our customers and improve operational efficiency.`,
        description: `Detailed description for ${subject.toLowerCase()}. This request involves significant development work and will require coordination across multiple teams. The expected outcome is improved user experience and system performance.`,
        companyId: company.id,
        status: randomChoice([ERStatus.OPEN, ERStatus.IN_REVIEW, ERStatus.ACCEPTED, ERStatus.REJECTED]),
        priorityLabel: randomChoice(priorities),
        submittedPriority: randomChoice(priorities),
        sentiment: randomChoice(sentiments),
        requestedAt,
        updatedAtCsv,
        strategic,
        impact,
        technical,
        resource,
        market,
        totalCached,
        externalStatus: randomChoice(['New', 'Open', 'In Progress', 'Closed']),
        externalStatusAlt: randomChoice(['Active', 'Pending', 'Complete']),
        externalRequestStatus: randomChoice(['Submitted', 'Under Review', 'Approved', 'Rejected']),
      }
    })

    // Add random tags
    const numTags = Math.floor(Math.random() * 3) + 1 // 1-3 tags
    const selectedTags: any[] = []
    while (selectedTags.length < numTags) {
      const tag = randomChoice(createdTags)
      if (!selectedTags.includes(tag)) {
        selectedTags.push(tag)
        await prisma.eRTag.create({
          data: {
            erId: er.id,
            tagId: tag.id,
          }
        })
      }
    }

    // Add random comments
    const numComments = Math.floor(Math.random() * 4) // 0-3 comments
    for (let j = 0; j < numComments; j++) {
      await prisma.comment.create({
        data: {
          erId: er.id,
          body: `This is a sample comment ${j + 1} for ER ${er.externalId}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
          authorId: `user-${Math.floor(Math.random() * 5) + 1}`,
        }
      })
    }

    // Add audit entry for creation
    await prisma.audit.create({
      data: {
        erId: er.id,
        action: 'CREATE',
        actorId: `user-${Math.floor(Math.random() * 5) + 1}`,
        payload: {
          status: er.status,
          totalScore: totalCached,
        },
      }
    })

    if (i % 10 === 0) {
      console.log(`Created ${i} ERs...`)
    }
  }

  // Create default settings
  console.log('Creating default settings...')
  await prisma.setting.create({
    data: {
      key: 'score_weights',
      jsonValue: {
        strategic: 1.0,
        impact: 1.0,
        market: 1.0,
        technical: -1.0,
        resource: -1.0,
      }
    }
  })

  console.log('✅ Seeding completed successfully!')

  // Print summary
  const erCount = await prisma.eR.count()
  const companyCount = await prisma.company.count()
  const tagCount = await prisma.tag.count()

  console.log('\n📊 Database summary:')
  console.log(`- ${companyCount} companies`)
  console.log(`- ${erCount} ERs`)
  console.log(`- ${tagCount} tags`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })