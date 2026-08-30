'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/services/auth.service'
import FormVehiculo from '@/components/form/FormVehiculo'
import AppMenu from '@/components/layout/AppMenu'

export default function FormularioPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    getCurrentUser()
      .then((u) => {
        if (!u) router.replace('/login')
        else setReady(true)
      })
      .catch(() => router.replace('/login'))
  }, [router])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Cargando...
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <AppMenu />
      <FormVehiculo />
    </div>
  )
}
