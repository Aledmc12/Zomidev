'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function PortalNotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.portal.notifications()
      .then(setNotifications)
      .catch((err) => setError(err.detail || 'Error al cargar notificaciones'))
  }, [])

  const markRead = async (id) => {
    try {
      const updated = await api.portal.markNotificationRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)))
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-bone">Notificaciones</h1>
        <p className="mt-2 text-muted">Avisos sobre avances y entregables</p>
      </div>

      {error && <p className="text-red-300">{error}</p>}

      <div className="space-y-4">
        {notifications.length ? notifications.map((notif) => (
          <article
            key={notif.id}
            className={`card-surface p-5 ${notif.leida ? 'opacity-70' : 'border-gold/20'}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl text-bone">{notif.titulo}</h2>
                <p className="mt-2 text-sm text-muted">{notif.mensaje}</p>
                <p className="mt-2 text-xs text-muted">{new Date(notif.created_at).toLocaleString('es-CO')}</p>
              </div>
              <div className="flex gap-3">
                {notif.enlace && (
                  <Link href={notif.enlace} className="text-sm text-gold hover:text-gold-soft">
                    Ver detalle
                  </Link>
                )}
                {!notif.leida && (
                  <button onClick={() => markRead(notif.id)} className="text-sm text-muted hover:text-bone">
                    Marcar leida
                  </button>
                )}
              </div>
            </div>
          </article>
        )) : <p className="text-muted">No hay notificaciones.</p>}
      </div>
    </div>
  )
}
