'use client'

import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function ErrorBoundaryContent({ error, reset, title = 'Algo salio mal' }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-serif text-3xl text-bone">{title}</h1>
      <p className="mt-3 max-w-md text-muted">
        {error?.message || 'Ocurrio un error inesperado. Puedes reintentar o volver al inicio.'}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Button onClick={reset}>Reintentar</Button>
        <Button href="/" variant="secondary">Volver al inicio</Button>
        <Button href="/contacto" variant="secondary">Contactar soporte</Button>
      </div>
    </div>
  )
}
