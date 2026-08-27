import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import { siteConfig } from '@/lib/site'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-bg-secondary/40">
      <div className="container-wide section-padding !py-16">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="mb-4 flex items-center">
              <Logo variant="wide" size={30} />
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              {siteConfig.slogan} Estudio de desarrollo de software a medida.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-serif text-lg text-gold-soft">Enlaces</h3>
            <div className="flex flex-col gap-2 text-sm text-muted">
              <Link href="/servicios" className="hover:text-bone">Servicios</Link>
              <Link href="/portafolio" className="hover:text-bone">Portafolio</Link>
              <Link href="/nosotros" className="hover:text-bone">Nosotros</Link>
              <Link href="/contacto" className="hover:text-bone">Contacto</Link>
              <Link href="/faq" className="hover:text-bone">FAQ</Link>
              <Link href="/login" className="hover:text-bone">Portal de clientes</Link>
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-serif text-lg text-gold-soft">Legal</h3>
            <div className="flex flex-col gap-2 text-sm text-muted">
              <Link href="/politica-de-privacidad" className="hover:text-bone">Politica de privacidad</Link>
              <Link href="/terminos" className="hover:text-bone">Terminos de servicio</Link>
            </div>
          </div>
        </div>

        <div className="gold-line my-10" />
        <p className="text-center text-xs tracking-wide text-muted">
          {new Date().getFullYear()} {siteConfig.name}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
