import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'

const HARDCODED_USERS = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin'
  },
  {
    username: 'reviewer',
    password: 'review123',
    role: 'reviewer'
  }
]

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      )
    }

    const user = HARDCODED_USERS.find(
      u => u.username === username && u.password === password
    )

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const secret = new TextEncoder().encode(JWT_SECRET)
    const token = await new SignJWT({ 
      username: user.username, 
      role: user.role 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret)

    return NextResponse.json({
      token,
      user: {
        username: user.username,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}