import { NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/', '/servicios', '/portafolio', '/nosotros', '/contacto', '/login', '/olvide-contrasena', '/recuperar-contrasena', '/politica-de-privacidad', '/terminos', '/faq']

export function middleware(request) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('access_token')?.value
  const role = request.cookies.get('zomidev_role')?.value

  const isAdminRoute = pathname.startsWith('/admin')
  const isPortalRoute = pathname.startsWith('/portal')

  if (isAdminRoute || isPortalRoute) {
    if (!accessToken) {
      const login = new URL('/login', request.url)
      login.searchParams.set('redirect', pathname)
      return NextResponse.redirect(login)
    }
    if (isAdminRoute && role !== 'admin') {
      return NextResponse.redirect(new URL('/portal', request.url))
    }
    if (isPortalRoute && role === 'admin' && !pathname.startsWith('/portal')) {
      // admin can access portal too
    }
  }

  if (pathname === '/login' && accessToken) {
    const dest = role === 'admin' ? '/admin' : '/portal'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*', '/login'],
}
