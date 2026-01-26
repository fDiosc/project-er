import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { commentSchema } from '@/lib/validations'

// GET /api/ers/[id]/comments - Get ER comments
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const comments = await prisma.comment.findMany({
      where: { erId: params.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch comments' } },
      { status: 500 }
    )
  }
}

// POST /api/ers/[id]/comments - Add comment to ER
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const body = await request.json()
    const data = commentSchema.parse(body)

    const comment = await prisma.comment.create({
      data: {
        erId: params.id,
        body: data.body,
        authorId: data.authorId || 'anonymous',
      }
    })

    // Create audit log
    await prisma.audit.create({
      data: {
        erId: params.id,
        action: 'COMMENT_ADDED',
        actorId: data.authorId,
        payload: { commentId: comment.id },
      }
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid comment data' } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: { code: 'CREATE_ERROR', message: 'Failed to create comment' } },
      { status: 500 }
    )
  }
}