import { NextResponse } from 'next/server'

const BACKEND = (process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:8001').replace(/\/$/, '')

function rewriteSetCookie(cookie) {
  return cookie
    .replace(/Domain=[^;]+;?\s*/gi, '')
    .replace(/Path=[^;]+;?\s*/gi, 'Path=/; ')
}

async function proxyRequest(request, pathSegments) {
  const path = pathSegments.join('/')
  const search = request.nextUrl.search
  const targetUrl = `${BACKEND}/api/v1/${path}${search}`

  const headers = new Headers()
  const contentType = request.headers.get('content-type')
  if (contentType) headers.set('Content-Type', contentType)
  headers.set('X-Requested-With', 'XMLHttpRequest')

  const cookie = request.headers.get('cookie')
  if (cookie) headers.set('Cookie', cookie)

  const auth = request.headers.get('authorization')
  if (auth) headers.set('Authorization', auth)

  const init = {
    method: request.method,
    headers,
    cache: 'no-store',
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (contentType?.includes('multipart/form-data')) {
      init.body = await request.arrayBuffer()
    } else {
      init.body = await request.text()
    }
  }

  const backendRes = await fetch(targetUrl, init)
  const responseHeaders = new Headers()

  const setCookies = typeof backendRes.headers.getSetCookie === 'function'
    ? backendRes.headers.getSetCookie()
    : []

  if (setCookies.length) {
    setCookies.forEach((c) => responseHeaders.append('Set-Cookie', rewriteSetCookie(c)))
  } else {
    const single = backendRes.headers.get('set-cookie')
    if (single) responseHeaders.append('Set-Cookie', rewriteSetCookie(single))
  }

  const resContentType = backendRes.headers.get('content-type')
  if (resContentType) responseHeaders.set('Content-Type', resContentType)

  if (backendRes.status === 204) {
    return new NextResponse(null, { status: 204, headers: responseHeaders })
  }

  const body = await backendRes.arrayBuffer()
  return new NextResponse(body, { status: backendRes.status, headers: responseHeaders })
}

export async function GET(request, context) {
  const params = await context.params
  return proxyRequest(request, params.path)
}

export async function POST(request, context) {
  const params = await context.params
  return proxyRequest(request, params.path)
}

export async function PATCH(request, context) {
  const params = await context.params
  return proxyRequest(request, params.path)
}

export async function PUT(request, context) {
  const params = await context.params
  return proxyRequest(request, params.path)
}

export async function DELETE(request, context) {
  const params = await context.params
  return proxyRequest(request, params.path)
}
