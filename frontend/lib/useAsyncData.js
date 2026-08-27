'use client'

import { useCallback, useEffect, useState } from 'react'

export function useAsyncData(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await fetcher()
      setData(result)
    } catch (err) {
      setError(err?.detail || 'No se pudo cargar la informacion.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => {
    reload()
  }, [reload])

  return { data, error, loading, reload }
}
