'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import FormError from '@/components/ui/FormError'
import PasswordInput from '@/components/ui/PasswordInput'
import PageSkeleton from '@/components/ui/PageSkeleton'

export default function AdminClientsPage() {
  const [clients, setClients] = useState([])
  const [form, setForm] = useState({ nombre: '', email: '', password: '', empresa: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const loadClients = () => {
    setLoading(true)
    setError('')
    api.admin.clients()
      .then(setClients)
      .catch((err) => setError(err.detail || 'No se pudieron cargar los clientes.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadClients() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    try {
      await api.admin.createClient({ ...form, rol: 'client' })
      setForm({ nombre: '', email: '', password: '', empresa: '' })
      setMessage('Cliente creado correctamente.')
      loadClients()
    } catch (err) {
      setError(err.detail || 'Error al crear cliente')
    }
  }

  if (loading && !clients.length) return <PageSkeleton />

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl text-bone">Clientes</h1>
        <p className="mt-2 text-muted">Usuarios con acceso al portal</p>
      </div>

      <form onSubmit={handleSubmit} className="card-surface grid gap-4 p-6 md:grid-cols-2">
        <div>
          <label htmlFor="nombre" className="mb-2 block text-sm text-muted">Nombre</label>
          <input id="nombre" type="text" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-bone outline-none" />
        </div>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm text-muted">Email</label>
          <input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-bone outline-none" />
        </div>
        <PasswordInput
          id="password"
          label="Contrasena"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          hint="Minimo 10 caracteres con mayuscula, minuscula, numero y simbolo."
        />
        <div>
          <label htmlFor="empresa" className="mb-2 block text-sm text-muted">Empresa</label>
          <input id="empresa" type="text" value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} className="w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-bone outline-none" />
        </div>
        <div className="md:col-span-2">
          <button type="submit" className="rounded-full bg-gold px-6 py-3 text-sm text-bg">Crear cliente</button>
        </div>
      </form>

      <FormError message={error} />
      {error && <button type="button" onClick={loadClients} className="text-sm text-gold">Reintentar</button>}
      {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}

      <div className="grid gap-4">
        {clients.map((client) => (
          <article key={client.id} className="card-surface p-5">
            <p className="text-bone">{client.nombre}</p>
            <p className="text-sm text-muted">{client.email}</p>
            {client.empresa && <p className="text-sm text-gold/80">{client.empresa}</p>}
          </article>
        ))}
      </div>
    </div>
  )
}
