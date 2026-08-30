'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, requestAccountDeletion } from '@/lib/services/auth.service'
import { clearLocalFormularios } from '@/lib/services/formularios.service'

export default function AppMenu() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleLogout = async () => {
    await signOut()
    router.replace('/login')
  }

  const handleDelete = async () => {
    if (!confirm('¿Solicitar eliminación de cuenta? Se borrarán datos locales.')) return
    setBusy(true)
    try {
      await requestAccountDeletion('Solicitud desde web app')
      await clearLocalFormularios()
      await signOut()
      router.replace('/login')
      alert('Solicitud registrada. Cuenta en proceso de eliminación (30 días).')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error')
    } finally {
      setBusy(false)
      setOpen(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-white/95 shadow-md md:right-6 md:top-6"
        aria-label="Menú"
      >
        ☰
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] bg-black/20" onClick={() => setOpen(false)}>
          <div
            className="absolute right-3 top-16 min-w-[200px] overflow-hidden rounded-xl bg-white shadow-lg md:right-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="block w-full px-5 py-3 text-left hover:bg-gray-50" onClick={handleLogout}>
              Cerrar sesión
            </button>
            <hr />
            <button
              type="button"
              disabled={busy}
              className="block w-full px-5 py-3 text-left text-red-700 hover:bg-red-50 disabled:opacity-50"
              onClick={handleDelete}
            >
              {busy ? 'Procesando...' : 'Eliminar cuenta'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
