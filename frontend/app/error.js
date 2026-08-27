'use client'

import ErrorBoundaryContent from '@/components/ui/ErrorBoundaryContent'

export default function Error({ error, reset }) {
  return <ErrorBoundaryContent error={error} reset={reset} />
}
