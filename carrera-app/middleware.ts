import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  if (pathname.startsWith('/formulario')) {
    const hasSession = request.cookies.getAll().some((c) => c.name.includes('auth-token') || c.name.startsWith('sb-'))
    if (!hasSession) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (pathname === '/login') {
    const hasSession = request.cookies.getAll().some((c) => c.name.includes('auth-token') || c.name.startsWith('sb-'))
    if (hasSession) {
      return NextResponse.redirect(new URL('/formulario', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/formulario/:path*', '/login'],
}
