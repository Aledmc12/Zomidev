import { siteConfig } from '@/lib/site'

export default function robots() {
  const base = siteConfig.url.replace(/\/$/, '')
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/portal/', '/login'],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
