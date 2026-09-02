import { NextResponse } from 'next/server'

function getWebhookUrl() {
  return (process.env.SHEETS_WEBHOOK_URL || process.env.NEXT_PUBLIC_SHEETS_WEBHOOK_URL || '').trim()
}

type SheetsScriptResponse = {
  ok?: boolean
  error?: string
  reason?: string
  message?: string
  result?: string
  savedRow?: unknown[]
}

/** El script real de Carrera responde con ok:true o savedRow; otros URLs dan falso positivo. */
function isSheetsScriptSuccess(scriptResult: SheetsScriptResponse | null): boolean {
  if (!scriptResult) return false
  if (scriptResult.ok === true) return true
  if (Array.isArray(scriptResult.savedRow)) return true
  return false
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
    const raw = await response.text()
    let scriptResult: SheetsScriptResponse | null = null
    try {
      scriptResult = raw ? (JSON.parse(raw) as SheetsScriptResponse) : null
    } catch {
      /* respuesta no JSON */
    }

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, reason: `http-${response.status}`, detail: raw.slice(0, 200) },
        { status: 502 },
      )
    }

    if (scriptResult && scriptResult.ok === false) {
      return NextResponse.json(
        {
          ok: false,
          reason: scriptResult.error || scriptResult.reason || scriptResult.message || 'script-error',
        },
        { status: 502 },
      )
    }

    if (!isSheetsScriptSuccess(scriptResult)) {
      return NextResponse.json(
        {
          ok: false,
          reason: 'script-unexpected-response',
          detail:
            'Revisa NEXT_PUBLIC_SHEETS_WEBHOOK_URL en el servidor (debe ser el mismo script que la app móvil).',
          script: scriptResult ?? raw.slice(0, 200),
        },
        { status: 502 },
      )
    }

    return NextResponse.json({ ok: true, script: scriptResult ?? undefined })
  } catch (e) {
    const reason = e instanceof Error ? e.message : 'fetch-error'
    return NextResponse.json({ ok: false, reason }, { status: 502 })
  }
}
