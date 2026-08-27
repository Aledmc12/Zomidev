import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import Button from '@/components/ui/Button'
import FadeIn from '@/components/ui/FadeIn'
import CaseStudyCard from '@/components/public/CaseStudyCard'
import ServiceCard from '@/components/public/ServiceCard'
import { apiFetchOptions, fetchPublicJson, getServerApiUrl } from '@/lib/fetch'

async function getHomeData() {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const opts = { ...apiFetchOptions(), signal: controller.signal }
    const [servicesRes, portfolioRes] = await Promise.all([
      fetch(getServerApiUrl('/public/services'), opts),
      fetch(getServerApiUrl('/public/portfolio?featured=true'), opts),
    ])
    clearTimeout(timer)
    if (!servicesRes.ok && !portfolioRes.ok) {
      throw new Error('API unavailable')
    }
    const services = servicesRes.ok ? await servicesRes.json() : []
    const portfolio = portfolioRes.ok ? await portfolioRes.json() : []
    return { services: services.slice(0, 3), portfolio, error: false }
  } catch {
    const services = (await fetchPublicJson('/public/services')) || []
    const portfolio = (await fetchPublicJson('/public/portfolio?featured=true')) || []
    return {
      services: services.slice(0, 3),
      portfolio,
      error: !services.length && !portfolio.length,
    }
  }
}

export default async function HomePage() {
  const { services, portfolio, error } = await getHomeData()

  return (
    <>
      <section className="relative overflow-hidden section-padding">
        <div className="container-narrow">
          {error && (
            <p role="alert" className="mb-6 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              No pudimos cargar el contenido dinamico. Verifica que el backend este activo e intenta recargar.
            </p>
          )}
          <div className="flex flex-col items-center text-center">
            <Logo variant="wide" size={72} animated />
            <FadeIn className="mt-8 flex flex-col items-center text-center">
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted md:text-lg">
                Estudio de desarrollo de software. Productos digitales a medida con precision, calma y cuidado en cada entrega.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Button href="/contacto">Iniciar proyecto</Button>
                <Button href="/login" variant="secondary">Portal de clientes</Button>
              </div>
            </FadeIn>
          </div>
        </div>
        <div className="gold-line container-narrow mt-20" />
      </section>

      <section className="section-padding">
        <div className="container-narrow">
          <FadeIn>
            <h2 className="font-serif text-3xl text-gold-soft md:text-4xl">Servicios</h2>
            <p className="mt-4 max-w-2xl text-muted">Soluciones tecnicas disenadas para escalar con tu negocio.</p>
          </FadeIn>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {services.map((service, index) => (
              <FadeIn key={service.id} delay={index * 0.08}>
                <ServiceCard service={service} />
              </FadeIn>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/servicios" className="text-sm tracking-wide text-gold hover:text-gold-soft">
              Ver todos los servicios
            </Link>
          </div>
        </div>
      </section>

      {portfolio.length > 0 && (
        <section className="section-padding bg-bg-secondary/30">
          <div className="container-narrow">
            <FadeIn>
              <h2 className="font-serif text-3xl text-gold-soft md:text-4xl">Casos de exito</h2>
              <p className="mt-4 max-w-2xl text-muted">Proyectos reales donde la tecnologia y el diseno convergen.</p>
            </FadeIn>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {portfolio.map((item, index) => (
                <FadeIn key={item.id} delay={index * 0.08}>
                  <CaseStudyCard item={item} />
                </FadeIn>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Button href="/portafolio" variant="secondary">Explorar portafolio</Button>
            </div>
          </div>
        </section>
      )}

      <section className="section-padding">
        <div className="container-narrow">
          <FadeIn>
            <p className="text-sm uppercase tracking-[0.25em] text-gold">Aliados</p>
            <h2 className="mt-4 font-serif text-3xl text-gold-soft md:text-4xl">Carrera Arango</h2>
            <p className="mt-4 max-w-2xl text-muted">
              Colaboramos con aliados estrategicos que comparten nuestra vision de calidad y excelencia tecnica.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-narrow card-surface p-10 text-center md:p-16">
          <FadeIn>
            <h2 className="font-serif text-3xl text-bone md:text-4xl">Tu proyecto, con visibilidad total</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted">
              Accede al portal de clientes para seguir el avance, revisar entregables y comunicarte con nuestro equipo en tiempo real.
            </p>
            <div className="mt-8">
              <Button href="/login">Acceder al portal</Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  )
}
