'use client'

import ErrorBoundaryContent from '@/components/ui/ErrorBoundaryContent'

export default function GlobalError({ error, reset }) {
  return (
    <html lang="es">
      <body style={{ background: '#0a0a0b', color: '#e8e6e3', fontFamily: 'system-ui, sans-serif' }}>
        <ErrorBoundaryContent error={error} reset={reset} title="Error del sistema" />
      </body>
    </html>
  )
}
