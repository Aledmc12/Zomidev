import FadeIn from '@/components/ui/FadeIn'
import CaseStudyCard from '@/components/public/CaseStudyCard'
import { fetchPublicJson } from '@/lib/fetch'

export const metadata = { title: 'Portafolio' }

export default async function PortafolioPage() {
  const items = (await fetchPublicJson('/public/portfolio')) || []

  return (
    <section className="section-padding">
      <div className="container-narrow">
        <FadeIn>
          <p className="text-sm uppercase tracking-[0.25em] text-gold">Portafolio</p>
          <h1 className="mt-4 font-serif text-4xl text-bone md:text-5xl">Casos de exito</h1>
          <p className="mt-6 max-w-2xl text-muted">
            Proyectos donde resolvemos problemas reales con arquitectura solida y experiencia cuidada.
          </p>
        </FadeIn>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {items.map((item, index) => (
            <FadeIn key={item.id} delay={index * 0.06}>
              <CaseStudyCard item={item} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
