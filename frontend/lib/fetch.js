/** Opciones de fetch para contenido dinámico desde la API */
import { getBackendUrl } from '@/lib/site'

export function apiFetchOptions() {
  if (process.env.NODE_ENV === 'development') {
    return { cache: 'no-store' }
  }
  return { next: { revalidate: 60 } }
}

export function getServerApiUrl(path) {
  return `${getBackendUrl()}/api/v1${path}`
}

export async function fetchPublicJson(path, { timeoutMs = 5000 } = {}) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(getServerApiUrl(path), {
      ...apiFetchOptions(),
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
