import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { message: 'Token is required' },
        { status: 400 }
      )
    }

    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    return NextResponse.json({
      valid: true,
      user: {
        username: payload.username as string,
        role: payload.role as string
      }
    })

  } catch {
    return NextResponse.json(
      { valid: false, message: 'Invalid or expired token' },
      { status: 401 }
    )
  }
}