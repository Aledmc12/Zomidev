import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/** Solo cabeceras de seguridad. Auth vía Supabase en localStorage (cliente). */
export function middleware(_request: NextRequest) {
  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/|api/).*)'],
}
