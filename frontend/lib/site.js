export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'ZomiDev',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  domain: 'zomidev.com',
  slogan: 'El lujo del detalle.',
  description: 'Estudio de desarrollo de software. El lujo del detalle en cada producto digital.',
}

export function getApiBase() {
  if (typeof window !== 'undefined') {
    return '/api/v1'
  }
  const backend = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:8001'
  return `${backend.replace(/\/$/, '')}/api/v1`
}

export function getBackendUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:8001').replace(/\/$/, '')
}

export function assertApiConfigured() {
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL must be set in production')
  }
}

export function isAllowedStagingUrl(url) {
  if (!url) return false
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    const host = parsed.hostname
    return host === 'zomidev.com' || host.endsWith('.zomidev.com') || host.endsWith('.vercel.app') || host === 'localhost'
  } catch {
    return false
  }
}
