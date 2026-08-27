import { siteConfig } from '@/lib/site'
import { fetchPublicJson } from '@/lib/fetch'

export default async function sitemap() {
  const base = siteConfig.url.replace(/\/$/, '')
  const now = new Date()

  const staticRoutes = [
    { path: '', priority: 1, changeFrequency: 'weekly' },
    { path: '/servicios', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/portafolio', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/nosotros', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/contacto', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/politica-de-privacidad', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/terminos', priority: 0.3, changeFrequency: 'yearly' },
  ]

  const portfolio = (await fetchPublicJson('/public/portfolio', { timeoutMs: 3000 })) || []

  const entries = staticRoutes.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }))

  portfolio.forEach((item) => {
    entries.push({
      url: `${base}/portafolio/${item.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    })
  })

  return entries
}
