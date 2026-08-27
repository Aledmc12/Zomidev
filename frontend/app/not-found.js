import Button from '@/components/ui/Button'

export default function NotFound() {
  return (
    <section className="section-padding">
      <div className="container-narrow text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-gold">404</p>
        <h1 className="mt-4 font-serif text-4xl text-bone md:text-5xl">Pagina no encontrada</h1>
        <p className="mx-auto mt-6 max-w-md text-muted">
          La pagina que buscas no existe o fue movida. Explora el sitio o contactanos para iniciar tu proyecto.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button href="/">Volver al inicio</Button>
          <Button href="/contacto" variant="secondary">Contacto</Button>
        </div>
      </div>
    </section>
  )
}
