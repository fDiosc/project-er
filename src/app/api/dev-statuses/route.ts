import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const devStatusSchema = z.object({
    name: z.string().min(1).max(255),
})

export async function GET(request: NextRequest) {
    try {
        const statuses = await prisma.developmentStatus.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: {
                        ers: true
                    }
                }
            }
        })

        return NextResponse.json(statuses)
    } catch (error) {
        console.error('Error fetching dev statuses:', error)
        return NextResponse.json(
            { error: { code: 'FETCH_ERROR', message: 'Failed to fetch dev statuses' } },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const data = devStatusSchema.parse(body)

        const status = await prisma.developmentStatus.create({
            data: {
                name: data.name
            },
            include: {
                _count: {
                    select: {
                        ers: true
                    }
                }
            }
        })

        return NextResponse.json(status, { status: 201 })
    } catch (error) {
        console.error('Error creating dev status:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: 'Invalid status data' } },
                { status: 400 }
            )
        }

        if (error instanceof Error && error.message.includes('Unique constraint')) {
            return NextResponse.json(
                { error: { code: 'DUPLICATE_ERROR', message: 'Status with this name already exists' } },
                { status: 409 }
            )
        }

        return NextResponse.json(
            { error: { code: 'CREATE_ERROR', message: 'Failed to create dev status' } },
            { status: 500 }
        )
    }
}
