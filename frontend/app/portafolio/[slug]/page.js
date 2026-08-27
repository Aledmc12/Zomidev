import Link from 'next/link'
import FadeIn from '@/components/ui/FadeIn'
import Button from '@/components/ui/Button'
import JsonLd from '@/components/seo/JsonLd'
import { fetchPublicJson } from '@/lib/fetch'
import { siteConfig } from '@/lib/site'

async function getPortfolioItem(slug) {
  return fetchPublicJson(`/public/portfolio/${slug}`)
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const item = await getPortfolioItem(slug)
  if (!item) return { title: 'Proyecto' }
  return {
    title: item.titulo,
    description: item.resumen,
    openGraph: {
      title: item.titulo,
      description: item.resumen,
      images: item.imagen_url ? [{ url: item.imagen_url }] : undefined,
    },
  }
}

export default async function PortafolioDetailPage({ params }) {
  const { slug } = await params
  const item = await getPortfolioItem(slug)

  if (!item) {
    return (
      <section className="section-padding text-center">
        <p className="text-muted">Proyecto no encontrado.</p>
        <div className="mt-6">
          <Button href="/portafolio" variant="secondary">Volver al portafolio</Button>
        </div>
      </section>
    )
  }

  const sections = [
    { title: 'Problema', content: item.problema },
    { title: 'Solucion', content: item.solucion },
    { title: 'Stack', content: item.stack },
    { title: 'Resultado', content: item.resultado },
  ]

  return (
    <section className="section-padding">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: item.titulo,
          description: item.resumen,
          url: `${siteConfig.url.replace(/\/$/, '')}/portafolio/${slug}`,
          creator: { '@type': 'Organization', name: siteConfig.name },
        }}
      />
      <div className="container-narrow">
        <FadeIn>
          <Link href="/portafolio" className="text-sm text-muted hover:text-gold-soft">Volver al portafolio</Link>
          <h1 className="mt-6 font-serif text-4xl text-bone md:text-5xl">{item.titulo}</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">{item.resumen}</p>
          {item.url_externa && (
            <a href={item.url_externa} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm text-gold hover:text-gold-soft">
              Visitar sitio en vivo
            </a>
          )}
        </FadeIn>

        <div className="gold-line my-12" />

        <div className="space-y-10">
          {sections.map((section, index) => (
            <FadeIn key={section.title} delay={index * 0.05}>
              <div className="card-surface p-8">
                <h2 className="font-serif text-2xl text-gold-soft">{section.title}</h2>
                <p className="mt-4 leading-relaxed text-muted">{section.content}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
