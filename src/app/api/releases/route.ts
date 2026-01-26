import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const releaseSchema = z.object({
    name: z.string().min(1).max(255),
})

export async function GET(request: NextRequest) {
    try {
        const releases = await prisma.release.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: {
                        ers: true
                    }
                }
            }
        })

        return NextResponse.json(releases)
    } catch (error) {
        console.error('Error fetching releases:', error)
        return NextResponse.json(
            { error: { code: 'FETCH_ERROR', message: 'Failed to fetch releases' } },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const data = releaseSchema.parse(body)

        const release = await prisma.release.create({
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

        return NextResponse.json(release, { status: 201 })
    } catch (error) {
        console.error('Error creating release:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: 'Invalid release data' } },
                { status: 400 }
            )
        }

        if (error instanceof Error && error.message.includes('Unique constraint')) {
            return NextResponse.json(
                { error: { code: 'DUPLICATE_ERROR', message: 'Release with this name already exists' } },
                { status: 409 }
            )
        }

        return NextResponse.json(
            { error: { code: 'CREATE_ERROR', message: 'Failed to create release' } },
            { status: 500 }
        )
    }
}
