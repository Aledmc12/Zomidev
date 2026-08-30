import { NextResponse } from 'next/server'

function getWebhookUrl() {
  return (process.env.SHEETS_WEBHOOK_URL || process.env.NEXT_PUBLIC_SHEETS_WEBHOOK_URL || '').trim()
}

/** Proxy servidor → Google Sheets (evita CORS del navegador). */
export async function POST(request: Request) {
  const url = getWebhookUrl()
  if (!url) {
    return NextResponse.json({ ok: false, reason: 'no-webhook' }, { status: 503 })
  }
  try {
    const body = await request.json()
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      redirect: 'follow',
    })
    if (!response.ok) {
      return NextResponse.json({ ok: false, reason: `http-${response.status}` }, { status: 502 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    const reason = e instanceof Error ? e.message : 'fetch-error'
    return NextResponse.json({ ok: false, reason }, { status: 502 })
  }
}
