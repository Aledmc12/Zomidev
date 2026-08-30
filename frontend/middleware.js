import { NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/', '/servicios', '/portafolio', '/nosotros', '/contacto', '/login', '/olvide-contrasena', '/recuperar-contrasena', '/politica-de-privacidad', '/terminos', '/faq']

function isAccessTokenUsable(token) {
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp && payload.exp * 1000 <= Date.now()) return false
    return true
  } catch {
    return false
  }
}

function clearAuthCookies(response) {
  for (const key of ['access_token', 'refresh_token', 'zomidev_role']) {
    response.cookies.set(key, '', { path: '/', maxAge: 0 })
  }
}

export function middleware(request) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('access_token')?.value
  const role = request.cookies.get('zomidev_role')?.value
  const hasValidAccess = isAccessTokenUsable(accessToken)

  const isAdminRoute = pathname.startsWith('/admin')
  const isPortalRoute = pathname.startsWith('/portal')

  if (isAdminRoute || isPortalRoute) {
    if (!hasValidAccess) {
      const login = new URL('/login', request.url)
      login.searchParams.set('redirect', pathname)
      const response = NextResponse.redirect(login)
      if (accessToken && !hasValidAccess) clearAuthCookies(response)
      return response
    }
    if (isAdminRoute && role !== 'admin') {
      return NextResponse.redirect(new URL('/portal', request.url))
    }
  }

  if (pathname === '/login' && hasValidAccess) {
    const dest = role === 'admin' ? '/admin' : '/portal'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  if (pathname === '/login' && accessToken && !hasValidAccess) {
    const response = NextResponse.next()
    clearAuthCookies(response)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*', '/login'],
}
