'use client'

import ErrorBoundaryContent from '@/components/ui/ErrorBoundaryContent'

export default function AdminError({ error, reset }) {
  return (
    <div className="p-8">
      <ErrorBoundaryContent error={error} reset={reset} title="Error en el panel admin" />
    </div>
  )
}
