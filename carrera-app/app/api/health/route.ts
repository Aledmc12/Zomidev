import { NextResponse } from 'next/server'

function getWebhookUrl() {
  return (process.env.SHEETS_WEBHOOK_URL || process.env.NEXT_PUBLIC_SHEETS_WEBHOOK_URL || '').trim()
}

export async function GET() {
  const sheetsUrl = getWebhookUrl()
  return NextResponse.json({
    status: 'ok',
    service: 'carrera-app',
    sheetsWebhookConfigured: Boolean(sheetsUrl),
  })
}
