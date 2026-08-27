import FadeIn from '@/components/ui/FadeIn'
import ServiceCard from '@/components/public/ServiceCard'
import { fetchPublicJson } from '@/lib/fetch'

export const metadata = { title: 'Servicios' }

export default async function ServiciosPage() {
  const services = (await fetchPublicJson('/public/services')) || []

  return (
    <section className="section-padding">
      <div className="container-narrow">
        <FadeIn>
          <p className="text-sm uppercase tracking-[0.25em] text-gold">Servicios</p>
          <h1 className="mt-4 font-serif text-4xl text-bone md:text-5xl">Lo que construimos</h1>
          <p className="mt-6 max-w-2xl text-muted">
            Desde la idea hasta el mantenimiento, acompanamos cada fase con metodologia clara y entregas medibles.
          </p>
        </FadeIn>

        {!services.length && (
          <p role="alert" className="mt-8 text-sm text-red-200">No pudimos cargar los servicios. Intenta mas tarde.</p>
        )}

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {services.map((service, index) => (
            <FadeIn key={service.id} delay={index * 0.06}>
              <ServiceCard service={service} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
