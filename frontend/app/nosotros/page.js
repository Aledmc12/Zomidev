import FadeIn from '@/components/ui/FadeIn'
import { fetchPublicJson } from '@/lib/fetch'

export const metadata = { title: 'Nosotros' }

export default async function NosotrosPage() {
  const sections = (await fetchPublicJson('/public/about')) || []

  return (
    <section className="section-padding">
      <div className="container-narrow">
        <FadeIn>
          <p className="text-sm uppercase tracking-[0.25em] text-gold">Nosotros</p>
          <h1 className="mt-4 font-serif text-4xl text-bone md:text-5xl">El estudio detras de ZomiDev</h1>
        </FadeIn>

        <div className="mt-14 space-y-8">
          {sections.map((section, index) => (
            <FadeIn key={section.id} delay={index * 0.06}>
              <article className="card-surface p-8">
                <h2 className="font-serif text-2xl text-gold-soft">{section.titulo}</h2>
                <p className="mt-4 leading-relaxed text-muted">{section.contenido}</p>
              </article>
            </FadeIn>
          ))}
        </div>

        <FadeIn className="mt-16">
          <p className="text-sm uppercase tracking-[0.25em] text-gold">Aliados</p>
          <h2 className="mt-4 font-serif text-3xl text-bone">Carrera Arango</h2>
          <p className="mt-4 max-w-2xl text-muted">
            Colaboramos con aliados estrategicos que comparten nuestra vision de calidad y excelencia tecnica.
          </p>
        </FadeIn>
      </div>
    </section>
  )
}
