'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import FormError from '@/components/ui/FormError'
import PageSkeleton from '@/components/ui/PageSkeleton'

const EMPTY_FORM = {
  cliente_id: '',
  nombre: '',
  descripcion: '',
  progreso: 0,
  estado: 'activo',
  staging_url: '',
  proxima_entrega: '',
}

export default function AdminProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const load = () => {
    setLoading(true)
    setError('')
    Promise.all([api.admin.projects(), api.admin.clients()])
      .then(([projectList, clientList]) => {
        setProjects(projectList)
        setClients(clientList)
      })
      .catch((err) => setError(err.detail || 'No se pudieron cargar los proyectos.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCreating(true)
    setMessage('')
    setError('')
    try {
      const payload = {
        cliente_id: form.cliente_id,
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        progreso: Number(form.progreso),
        estado: form.estado,
        staging_url: form.staging_url.trim() || null,
        proxima_entrega: form.proxima_entrega || null,
      }
      const project = await api.admin.createProject(payload)
      setForm(EMPTY_FORM)
      setShowForm(false)
      setMessage('Proyecto creado. El cliente ya puede verlo en su portal.')
      router.push(`/admin/proyectos/${project.id}`)
    } catch (err) {
      setError(err.detail || 'Error al crear proyecto')
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <PageSkeleton />

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-bone">Proyectos</h1>
          <p className="mt-2 text-muted">Crea proyectos y gestiona lo que ve cada cliente</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-gold px-6 py-3 text-sm text-bg"
        >
          {showForm ? 'Cancelar' : 'Nuevo proyecto'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card-surface grid gap-4 p-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="cliente_id" className="mb-2 block text-sm text-muted">Cliente</label>
            {clients.length ? (
              <select
                id="cliente_id"
                required
                value={form.cliente_id}
                onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-bone outline-none"
              >
                <option value="">Selecciona un cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.nombre}{client.empresa ? ` — ${client.empresa}` : ''} ({client.email})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-muted">
                Primero crea un cliente en{' '}
                <Link href="/admin/clientes" className="text-gold hover:text-gold-soft">Clientes</Link>.
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="nombre" className="mb-2 block text-sm text-muted">Nombre del proyecto</label>
            <input
              id="nombre"
              type="text"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-bone outline-none"
              placeholder="Portal corporativo Empresa X"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="descripcion" className="mb-2 block text-sm text-muted">Descripcion</label>
            <textarea
              id="descripcion"
              rows={3}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-bone outline-none"
              placeholder="Breve resumen del alcance"
            />
          </div>

          <div>
            <label htmlFor="estado" className="mb-2 block text-sm text-muted">Estado</label>
            <select
              id="estado"
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-bone outline-none"
            >
              <option value="activo">Activo</option>
              <option value="pausado">Pausado</option>
              <option value="completado">Completado</option>
            </select>
          </div>

          <div>
            <label htmlFor="proxima_entrega" className="mb-2 block text-sm text-muted">Proxima entrega</label>
            <input
              id="proxima_entrega"
              type="date"
              value={form.proxima_entrega}
              onChange={(e) => setForm({ ...form, proxima_entrega: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-bone outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="staging_url" className="mb-2 block text-sm text-muted">URL staging (opcional)</label>
            <input
              id="staging_url"
              type="url"
              value={form.staging_url}
              onChange={(e) => setForm({ ...form, staging_url: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-bone outline-none"
              placeholder="https://staging.ejemplo.com"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={creating || !clients.length}
              className="rounded-full bg-gold px-6 py-3 text-sm text-bg disabled:opacity-60"
            >
              {creating ? 'Creando...' : 'Crear proyecto'}
            </button>
          </div>
        </form>
      )}

      <FormError message={error} />
      {error && <button type="button" onClick={load} className="text-sm text-gold">Reintentar</button>}
      {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}

      <div className="grid gap-4">
        {projects.length ? projects.map((project) => (
          <Link key={project.id} href={`/admin/proyectos/${project.id}`} className="card-surface block p-6 hover:border-gold/20">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl text-bone">{project.nombre}</h2>
                <p className="mt-1 text-sm text-muted">{project.descripcion}</p>
              </div>
              <div className="text-right">
                <p className="font-serif text-2xl text-gold-soft">{project.progreso}%</p>
                <p className="text-xs uppercase tracking-wider text-muted">{project.estado}</p>
              </div>
            </div>
          </Link>
        )) : (
          <p className="text-sm text-muted">No hay proyectos aun. Crea el primero con el boton de arriba.</p>
        )}
      </div>
    </div>
  )
}
