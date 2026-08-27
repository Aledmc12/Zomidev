import Link from 'next/link'
import FadeIn from '@/components/ui/FadeIn'
import { siteConfig } from '@/lib/site'

export const metadata = {
  title: 'Terminos de servicio',
  description: `Terminos de uso del sitio y portal de clientes de ${siteConfig.name}.`,
}

export default function TerminosPage() {
  return (
    <section className="section-padding">
      <div className="container-narrow max-w-3xl">
        <FadeIn>
          <h1 className="font-serif text-4xl text-bone">Terminos de servicio</h1>
          <p className="mt-4 text-sm text-muted">Ultima actualizacion: julio 2026</p>

          <div className="mt-10 space-y-6 text-muted">
            <section>
              <h2 className="font-serif text-xl text-gold-soft">1. Aceptacion</h2>
              <p>Al usar {siteConfig.name}.com o el portal de clientes, aceptas estos terminos.</p>
            </section>
            <section>
              <h2 className="font-serif text-xl text-gold-soft">2. Portal de clientes</h2>
              <p>El acceso es personal e intransferible. Eres responsable de mantener la confidencialidad de tus credenciales.</p>
            </section>
            <section>
              <h2 className="font-serif text-xl text-gold-soft">3. Propiedad intelectual</h2>
              <p>El contenido del sitio, codigo y materiales entregables se rigen por los acuerdos comerciales especificos de cada proyecto.</p>
            </section>
            <section>
              <h2 className="font-serif text-xl text-gold-soft">4. Limitacion de responsabilidad</h2>
              <p>{siteConfig.name} no garantiza disponibilidad ininterrumpida del servicio. Los tiempos de respuesta comercial se acuerdan por proyecto.</p>
            </section>
            <section>
              <h2 className="font-serif text-xl text-gold-soft">5. Contacto</h2>
              <p>Para consultas legales: aledmc@zomidev.com</p>
            </section>
          </div>

          <p className="mt-10 text-sm">
            <Link href="/politica-de-privacidad" className="text-gold hover:text-gold-soft">Politica de privacidad</Link>
          </p>
        </FadeIn>
      </div>
    </section>
  )
}
