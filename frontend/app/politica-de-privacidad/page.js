import Link from 'next/link'
import FadeIn from '@/components/ui/FadeIn'
import { siteConfig } from '@/lib/site'

export const metadata = {
  title: 'Politica de privacidad',
  description: `Politica de privacidad y tratamiento de datos de ${siteConfig.name}.`,
}

export default function PoliticaPrivacidadPage() {
  return (
    <section className="section-padding">
      <div className="container-narrow max-w-3xl prose prose-invert">
        <FadeIn>
          <h1 className="font-serif text-4xl text-bone">Politica de privacidad</h1>
          <p className="mt-4 text-sm text-muted">Ultima actualizacion: julio 2026</p>

          <div className="mt-10 space-y-6 text-muted">
            <section>
              <h2 className="font-serif text-xl text-gold-soft">1. Responsable del tratamiento</h2>
              <p>{siteConfig.name} ({siteConfig.domain}) es responsable del tratamiento de los datos personales recolectados a traves de este sitio web y portal de clientes, conforme a la Ley 1581 de 2012 (Habeas Data Colombia).</p>
            </section>
            <section>
              <h2 className="font-serif text-xl text-gold-soft">2. Datos que recolectamos</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Formulario de contacto: nombre, email, empresa (opcional), asunto y mensaje.</li>
                <li>Portal de clientes: credenciales de acceso, datos de perfil y comunicaciones del proyecto.</li>
                <li>Datos tecnicos: cookies de sesion necesarias para autenticacion (httpOnly).</li>
              </ul>
            </section>
            <section>
              <h2 className="font-serif text-xl text-gold-soft">3. Finalidad</h2>
              <p>Atender solicitudes comerciales, gestionar proyectos de clientes, comunicar avances y mantener la seguridad del portal.</p>
            </section>
            <section>
              <h2 className="font-serif text-xl text-gold-soft">4. Derechos del titular</h2>
              <p>Puedes solicitar acceso, actualizacion, rectificacion o supresion de tus datos escribiendo a aledmc@zomidev.com.</p>
            </section>
            <section>
              <h2 className="font-serif text-xl text-gold-soft">5. Conservacion y seguridad</h2>
              <p>Conservamos los datos el tiempo necesario para la relacion comercial. Aplicamos cifrado en transito (HTTPS), cookies httpOnly y controles de acceso por rol.</p>
            </section>
          </div>

          <p className="mt-10 text-sm">
            <Link href="/contacto" className="text-gold hover:text-gold-soft">Contacto</Link>
            {' · '}
            <Link href="/terminos" className="text-gold hover:text-gold-soft">Terminos de servicio</Link>
          </p>
        </FadeIn>
      </div>
    </section>
  )
}
