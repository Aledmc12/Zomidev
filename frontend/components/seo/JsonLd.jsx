import { siteConfig } from '@/lib/site'

export default function JsonLd({ data }) {
  if (!data) return null

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    slogan: siteConfig.slogan,
    description: siteConfig.description,
    logo: `${siteConfig.url.replace(/\/$/, '')}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      url: `${siteConfig.url.replace(/\/$/, '')}/contacto`,
    },
  }

  return <JsonLd data={schema} />
}
