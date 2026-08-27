'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import FormError from '@/components/ui/FormError'
import PageSkeleton from '@/components/ui/PageSkeleton'

function StatCard({ label, value }) {
  return (
    <div className="card-surface p-6">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-serif text-3xl text-bone">{value}</p>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [projects, setProjects] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    setError('')
    Promise.all([api.admin.stats(), api.admin.projects()])
      .then(([s, p]) => {
        setStats(s)
        setProjects(p.slice(0, 5))
      })
      .catch((err) => setError(err.detail || 'No se pudo cargar el dashboard.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return <PageSkeleton />

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl text-bone">Dashboard admin</h1>
        <p className="mt-2 text-muted">Vision general del estudio</p>
      </div>

      <FormError message={error} />
      {error && (
        <button type="button" onClick={load} className="text-sm text-gold hover:text-gold-soft">Reintentar</button>
      )}

      {stats && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Clientes" value={stats.total_clientes} />
          <StatCard label="Proyectos" value={stats.total_proyectos} />
          <StatCard label="Activos" value={stats.proyectos_activos} />
          <StatCard label="Mensajes sin leer" value={stats.mensajes_sin_leer} />
        </div>
      )}

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-2xl text-gold-soft">Proyectos recientes</h2>
          <Link href="/admin/proyectos" className="text-sm text-gold hover:text-gold-soft">Ver todos</Link>
        </div>
        <div className="space-y-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/admin/proyectos/${project.id}`} className="card-surface block p-5 hover:border-gold/20">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-bone">{project.nombre}</p>
                  <p className="text-sm text-muted">{project.progreso}% completado</p>
                </div>
                <span className="text-sm text-gold-soft">{project.estado}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
