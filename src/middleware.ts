import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

const publicPaths = ['/login', '/api/auth/login', '/api/auth/verify']
const protectedApiPaths = ['/api/ers', '/api/companies', '/api/import', '/api/export']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') ||
                request.cookies.get('auth_token')?.value ||
                request.nextUrl.searchParams.get('token')

  // Only protect API routes in middleware, let client handle page redirects
  if (!token && pathname.startsWith('/api')) {
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 }
    )
  }

  if (token) {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET)
      const { payload } = await jwtVerify(token, secret)
      
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('authorization', `Bearer ${token}`)
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (error) {
      if (pathname.startsWith('/api')) {
        return NextResponse.json(
          { message: 'Invalid or expired token' },
          { status: 401 }
        )
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
}