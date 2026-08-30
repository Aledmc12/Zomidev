export function getSupabaseUrl() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
}

export function getSupabaseAnonKey() {
  return (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
}

export function getSheetsWebhookUrl() {
  return (process.env.NEXT_PUBLIC_SHEETS_WEBHOOK_URL || '').trim()
}

export function getPdfFunctionUrl() {
  const url = getSupabaseUrl()
  return url ? `${url.replace(/\/$/, '')}/functions/v1/generar-pdf-email` : ''
}

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001').replace(/\/$/, '')
}
