'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function PortalMessagesPage() {
  const [messages, setMessages] = useState([])
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState({ proyecto_id: '', contenido: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([api.portal.messages(), api.portal.projects()])
      .then(([msgs, projs]) => {
        setMessages(msgs)
        setProjects(projs)
        if (projs[0]) setForm((f) => ({ ...f, proyecto_id: projs[0].id }))
      })
      .catch((err) => setError(err.detail || 'Error al cargar mensajes'))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const msg = await api.portal.sendMessage(form)
      setMessages((prev) => [msg, ...prev])
      setForm((f) => ({ ...f, contenido: '' }))
    } catch (err) {
      setError(err.detail || 'No se pudo enviar el mensaje')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-bone">Mensajes</h1>
        <p className="mt-2 text-muted">Canal de comunicacion con el equipo ZomiDev</p>
      </div>

      <form onSubmit={handleSubmit} className="card-surface space-y-4 p-6">
        <div>
          <label htmlFor="proyecto" className="mb-2 block text-sm text-muted">Proyecto</label>
          <select
            id="proyecto"
            value={form.proyecto_id}
            onChange={(e) => setForm({ ...form, proyecto_id: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-bone outline-none"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="contenido" className="mb-2 block text-sm text-muted">Mensaje</label>
          <textarea
            id="contenido"
            required
            rows={4}
            value={form.contenido}
            onChange={(e) => setForm({ ...form, contenido: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-bone outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-bg transition hover:bg-gold-soft disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar mensaje'}
        </button>
      </form>

      {error && <p className="text-red-300">{error}</p>}

      <div className="space-y-4">
        {messages.map((msg) => (
          <article key={msg.id} className="card-surface p-5">
            <div className="mb-2 flex items-center justify-between gap-4 text-xs text-muted">
              <span>{msg.autor_nombre} · {msg.autor_rol}</span>
              <span>{new Date(msg.created_at).toLocaleString('es-CO')}</span>
            </div>
            <p className="text-bone">{msg.contenido}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
