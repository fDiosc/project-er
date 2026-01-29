import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createERSchema, erFiltersSchema, calculateTotalScore } from '@/lib/validations'
import type { ERDto, PaginatedResponse } from '@/types'

// GET /api/ers - List ERs with filters, pagination, sorting
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Helper to extract multi-select filters (handling both key and key[])
    const getMulti = (key: string) => {
      const values = [...searchParams.getAll(key), ...searchParams.getAll(`${key}[]`)]
      if (values.length === 0) return undefined
      return values.length === 1 ? values[0] : values
    }

    const query = {
      ...Object.fromEntries(searchParams.entries()),
      companyId: getMulti('companyId'),
      status: getMulti('status'),
      releaseId: getMulti('releaseId'),
      devStatusId: getMulti('devStatusId'),
    }

    const filters = erFiltersSchema.parse(query)

    // Build where clause
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
      where.companyId = Array.isArray(filters.companyId) ? { in: filters.companyId } : filters.companyId
    }

    if (filters.status) {
      where.status = Array.isArray(filters.status) ? { in: filters.status } : filters.status
    }

    if (filters.releaseId) {
      where.releaseId = Array.isArray(filters.releaseId) ? { in: filters.releaseId } : filters.releaseId
    }

    if (filters.devStatusId) {
      where.devStatusId = Array.isArray(filters.devStatusId) ? { in: filters.devStatusId } : filters.devStatusId
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
        const dir = isDesc ? 'desc' : 'asc'

        // Handle nested relation sorting
        if (field === 'company_name' || field === 'company.name') {
          orderBy.push({ company: { name: dir } })
        } else if (field === 'release_name' || field === 'release.name') {
          orderBy.push({ release: { name: dir } })
        } else if (field === 'devStatus_name' || field === 'devStatus.name') {
          orderBy.push({ devStatus: { name: dir } })
        } else {
          orderBy.push({ [field]: dir })
        }
      }
    } else {
      orderBy.push({ updatedAt: 'desc' })
    }

    // Calculate pagination
    const skip = (filters.page - 1) * filters.pageSize

    // Execute queries
    const [ers, total] = await Promise.all([
      prisma.eR.findMany({
        where,
        include: {
          company: true,
          release: true,
          devStatus: true,
          tags: {
            include: {
              tag: true
            }
          },
          _count: {
            select: {
              comments: true
            }
          }
        } as any,
        orderBy,
        skip,
        take: filters.pageSize,
      }),
      prisma.eR.count({ where })
    ])

    // Transform to DTOs
    const items: ERDto[] = (ers as any[]).map(er => ({
      id: er.id,
      externalId: er.externalId ?? undefined,
      subject: er.subject,
      company: {
        id: er.company.id,
        name: er.company.name
      },
      status: er.status,
      priorityLabel: er.priorityLabel ?? undefined,
      submittedPriority: er.submittedPriority ?? undefined,
      sentiment: er.sentiment ?? undefined,
      committedVersion: er.committedVersion ?? undefined,
      releaseId: er.releaseId ?? undefined,
      devStatusId: er.devStatusId ?? undefined,
      release: er.release ? { id: er.release.id, name: er.release.name } : undefined,
      devStatus: er.devStatus ? { id: er.devStatus.id, name: er.devStatus.name } : undefined,
      requestedAt: er.requestedAt?.toISOString(),
      updatedAtCsv: er.updatedAtCsv?.toISOString(),
      scores: {
        strategic: er.strategic ?? undefined,
        impact: er.impact ?? undefined,
        technical: er.technical ?? undefined,
        resource: er.resource ?? undefined,
        market: er.market ?? undefined,
        total: er.totalCached || calculateTotalScore({
          strategic: er.strategic,
          impact: er.impact,
          technical: er.technical,
          resource: er.resource,
          market: er.market,
        })
      },
      overview: er.overview ?? undefined,
      description: er.description ?? undefined,
      createdAt: er.createdAt.toISOString(),
      updatedAt: er.updatedAt.toISOString(),
    }))

    const response: PaginatedResponse<ERDto> = {
      items,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(total / filters.pageSize),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching ERs:', error)
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch ERs' } },
      { status: 500 }
    )
  }
}

// POST /api/ers - Create new ER
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createERSchema.parse(body)

    // Calculate total score
    const totalCached = calculateTotalScore({
      strategic: data.strategic,
      impact: data.impact,
      technical: data.technical,
      resource: data.resource,
      market: data.market,
    })

    const er = await prisma.eR.create({
      data: {
        ...data,
        totalCached,
      },
      include: {
        company: true,
        release: true,
        devStatus: true,
        tags: {
          include: {
            tag: true
          }
        },
      } as any
    })

    // Transform to DTO
    const response: ERDto = {
      id: er.id,
      externalId: er.externalId ?? undefined,
      subject: er.subject,
      company: {
        id: (er as any).company.id,
        name: (er as any).company.name
      },
      status: er.status,
      priorityLabel: er.priorityLabel ?? undefined,
      submittedPriority: er.submittedPriority ?? undefined,
      sentiment: er.sentiment ?? undefined,
      committedVersion: er.committedVersion ?? undefined,
      releaseId: er.releaseId ?? undefined,
      devStatusId: er.devStatusId ?? undefined,
      release: (er as any).release ? { id: (er as any).release.id, name: (er as any).release.name } : undefined,
      devStatus: (er as any).devStatus ? { id: (er as any).devStatus.id, name: (er as any).devStatus.name } : undefined,
      requestedAt: er.requestedAt?.toISOString(),
      updatedAtCsv: er.updatedAtCsv?.toISOString(),
      scores: {
        strategic: er.strategic ?? undefined,
        impact: er.impact ?? undefined,
        technical: er.technical ?? undefined,
        resource: er.resource ?? undefined,
        market: er.market ?? undefined,
        total: er.totalCached ?? 0
      },
      overview: er.overview ?? undefined,
      description: er.description ?? undefined,
      createdAt: er.createdAt.toISOString(),
      updatedAt: er.updatedAt.toISOString(),
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating ER:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input data' } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: { code: 'CREATE_ERROR', message: 'Failed to create ER' } },
      { status: 500 }
    )
  }
}