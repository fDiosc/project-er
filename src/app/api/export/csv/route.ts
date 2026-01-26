import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { erFiltersSchema } from '@/lib/validations'

// GET /api/export/csv - Export ERs as CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())

    // Use the same filter logic as the ER list
    const filters = erFiltersSchema.parse({
      ...query,
      page: 1,
      pageSize: 10000, // Export all matching records
    })

    // Build where clause (same as ER list API)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (filters.q) {
      where.OR = [
        { subject: { contains: filters.q } },
        { overview: { contains: filters.q } },
        { description: { contains: filters.q } },
        { externalId: { contains: filters.q } },
        { id: { contains: filters.q } },
      ]
    }

    if (filters.companyId) {
      where.companyId = filters.companyId
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.minTotal !== undefined || filters.maxTotal !== undefined) {
      where.totalCached = {}
      if (filters.minTotal !== undefined) {
        where.totalCached.gte = filters.minTotal
      }
      if (filters.maxTotal !== undefined) {
        where.totalCached.lte = filters.maxTotal
      }
    }

    // Build sort
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderBy: any = []
    if (filters.sort) {
      const sorts = filters.sort.split(',')
      for (const sort of sorts) {
        const isDesc = sort.startsWith('-')
        const field = isDesc ? sort.slice(1) : sort
        orderBy.push({ [field]: isDesc ? 'desc' : 'asc' })
      }
    } else {
      orderBy.push({ updatedAt: 'desc' })
    }

    // Fetch ERs
    const ers = await prisma.eR.findMany({
      where,
      include: {
        company: true,
        tags: {
          include: {
            tag: true
          }
        },
      },
      orderBy,
    })

    // Convert to CSV format
    const csvHeaders = [
      'ID',
      'Status',
      'Requested',
      'ER - Priority',
      'Subject',
      'Request Status',
      'Organization',
      'Updated',
      'Submitted Priority',
      'RequestOverview',
      'ER',
      'Sentiment',
      'Committed Version',
      'Strategic',
      'Impact',
      'Technical',
      'Resource',
      'Market',
      'Total',
      'Tags',
      'Created At',
      'Updated At'
    ]

    const csvRows = ers.map(er => {
      const tags = er.tags.map(t => t.tag.label).join('; ')

      return [
        er.externalId || '',
        er.status.replace('_', ' '),
        er.requestedAt ? er.requestedAt.toISOString().split('T')[0] : '',
        er.priorityLabel || '',
        `"${(er.subject || '').replace(/"/g, '""')}"`, // Escape quotes
        er.externalRequestStatus || '',
        er.company.name,
        er.updatedAtCsv ? er.updatedAtCsv.toISOString().split('T')[0] : '',
        er.submittedPriority || '',
        `"${(er.overview || '').replace(/"/g, '""')}"`,
        `"${(er.description || '').replace(/"/g, '""')}"`,
        er.sentiment || '',
        er.committedVersion || '',
        er.strategic || '',
        er.impact || '',
        er.technical || '',
        er.resource || '',
        er.market || '',
        er.totalCached || 0,
        `"${tags.replace(/"/g, '""')}"`,
        er.createdAt.toISOString().split('T')[0],
        er.updatedAt.toISOString().split('T')[0]
      ].join(',')
    })

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n')

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `ers-export-${timestamp}.csv`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error) {
    console.error('CSV export error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'EXPORT_ERROR',
          message: 'Failed to export CSV',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    )
  }
}