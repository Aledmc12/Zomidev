import Link from 'next/link'
import FadeIn from '@/components/ui/FadeIn'
import Button from '@/components/ui/Button'

export const metadata = { title: 'Preguntas frecuentes' }

const faqs = [
  {
    q: 'Como inicio un proyecto con ZomiDev?',
    a: 'Completa el formulario de contacto con tu idea. Te respondemos con alcance, tiempos y propuesta tecnica.',
  },
  {
    q: 'Como accedo al portal de clientes?',
    a: 'Tras firmar el proyecto recibes credenciales por email. Tambien puedes usar recuperar contrasena si las olvidaste.',
  },
  {
    q: 'Que puedo ver en el portal?',
    a: 'Avance del proyecto, linea de tiempo, entregables, mensajes con el equipo y notificaciones de cambios.',
  },
  {
    q: 'Como se calcula el progreso?',
    a: 'El porcentaje se actualiza automaticamente segun los hitos completados en la linea de tiempo.',
  },
  {
    q: 'Donde puedo revisar la politica de datos?',
    a: 'En nuestra pagina de politica de privacidad, conforme a la legislacion colombiana de Habeas Data.',
  },
]

export default function FaqPage() {
  return (
    <section className="section-padding">
      <div className="container-narrow max-w-3xl">
        <FadeIn>
          <p className="text-sm uppercase tracking-[0.25em] text-gold">FAQ</p>
          <h1 className="mt-4 font-serif text-4xl text-bone">Preguntas frecuentes</h1>
        </FadeIn>
        <div className="mt-12 space-y-6">
          {faqs.map((item, i) => (
            <FadeIn key={item.q} delay={i * 0.05}>
              <article className="card-surface p-6">
                <h2 className="font-serif text-lg text-gold-soft">{item.q}</h2>
                <p className="mt-3 text-muted">{item.a}</p>
              </article>
            </FadeIn>
          ))}
        </div>
        <FadeIn className="mt-12 text-center">
          <p className="text-muted">No encontraste lo que buscabas?</p>
          <Button href="/contacto" className="mt-4">Contactanos</Button>
        </FadeIn>
      </div>
    </section>
  )
}
