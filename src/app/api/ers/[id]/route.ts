import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { updateERSchema, calculateTotalScore } from '@/lib/validations'
import type { ERDto } from '@/types'

// GET /api/ers/[id] - Get single ER
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const er = await prisma.eR.findUnique({
      where: { id: params.id },
      include: {
        company: true,
        release: true,
        devStatus: true,
        tags: {
          include: {
            tag: true
          }
        },
        comments: {
          orderBy: { createdAt: 'desc' }
        },
        audits: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      } as any
    })

    if (!er) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'ER not found' } },
        { status: 404 }
      )
    }

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      source: er.source as any,
      lastSyncAt: er.lastSyncAt?.toISOString(),
      externalUpdatedAt: er.externalUpdatedAt?.toISOString(),
      zendeskTicketUrl: er.zendeskTicketUrl ?? undefined,
      aiSummary: er.aiSummary ?? undefined,
      aiSuggestedScores: er.aiSuggestedScores as any,
      themeId: er.themeId ?? undefined,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching ER:', error)
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch ER' } },
      { status: 500 }
    )
  }
}

// PATCH /api/ers/[id] - Update ER
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const body = await request.json()
    const data = updateERSchema.parse(body)

    const er = await prisma.eR.update({
      where: { id: params.id },
      data,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      source: er.source as any,
      lastSyncAt: er.lastSyncAt?.toISOString(),
      externalUpdatedAt: er.externalUpdatedAt?.toISOString(),
      zendeskTicketUrl: er.zendeskTicketUrl ?? undefined,
      aiSummary: er.aiSummary ?? undefined,
      aiSuggestedScores: er.aiSuggestedScores as any,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating ER:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input data' } },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'ER not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: { code: 'UPDATE_ERROR', message: 'Failed to update ER' } },
      { status: 500 }
    )
  }
}

// DELETE /api/ers/[id] - Delete ER
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    await prisma.eR.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting ER:', error)

    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'ER not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: { code: 'DELETE_ERROR', message: 'Failed to delete ER' } },
      { status: 500 }
    )
  }
}