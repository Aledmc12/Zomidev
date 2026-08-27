'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import FormError from '@/components/ui/FormError'
import PageSkeleton from '@/components/ui/PageSkeleton'

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    setError('')
    api.admin.projects()
      .then(setProjects)
      .catch((err) => setError(err.detail || 'No se pudieron cargar los proyectos.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return <PageSkeleton />

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-bone">Proyectos</h1>
        <p className="mt-2 text-muted">Gestiona el avance y contenido de cada proyecto</p>
      </div>

      <FormError message={error} />
      {error && <button type="button" onClick={load} className="text-sm text-gold">Reintentar</button>}

      <div className="grid gap-4">
        {projects.map((project) => (
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
        ))}
      </div>
    </div>
  )
}
