import { NextResponse } from 'next/server'

function getSupabaseConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/$/, '')
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
  return { url, anonKey }
}

/** Proxy servidor → Edge Function generar-pdf-email */
export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  if (!auth) {
    return NextResponse.json({ error: 'Sin autorización' }, { status: 401 })
  }
  const { url, anonKey } = getSupabaseConfig()
  if (!url || !anonKey) {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 })
  }
  try {
    const body = await request.json()
    const response = await fetch(`${url}/functions/v1/generar-pdf-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: auth,
      },
      body: JSON.stringify(body),
    })
    const text = await response.text()
    if (!response.ok) {
      return NextResponse.json({ error: text || `http-${response.status}` }, { status: response.status })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error enviando PDF'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
