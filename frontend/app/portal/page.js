'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, CheckSquare, FolderOpen, TrendingUp } from 'lucide-react'
import ProgressBar from '@/components/ui/ProgressBar'
import StatusBadge from '@/components/ui/StatusBadge'
import { api } from '@/lib/api'

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card-surface p-6">
      <div className="mb-4 inline-flex rounded-full border border-gold/20 p-2 text-gold">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-serif text-3xl text-bone">{value}</p>
    </div>
  )
}

export default function PortalDashboardPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.portal.dashboard()
      .then(setData)
      .catch((err) => setError(err.detail || 'Error al cargar dashboard'))
  }, [])

  if (error) return <p className="text-red-300">{error}</p>
  if (!data) return <p className="text-muted">Cargando dashboard...</p>

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl text-bone">Dashboard</h1>
        <p className="mt-2 text-muted">Resumen de tus proyectos activos</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FolderOpen} label="Proyectos activos" value={data.proyectos_activos} />
        <StatCard icon={Calendar} label="Proxima entrega" value={data.proxima_entrega || 'Por definir'} />
        <StatCard icon={CheckSquare} label="Tareas pendientes" value={data.tareas_pendientes} />
        <StatCard icon={TrendingUp} label="Progreso general" value={`${data.progreso_general}%`} />
      </div>

      <div>
        <h2 className="mb-6 font-serif text-2xl text-gold-soft">Tus proyectos</h2>
        <div className="grid gap-6">
          {data.proyectos.map((project) => (
            <Link key={project.id} href={`/portal/proyectos/${project.id}`} className="card-surface block p-6 transition hover:border-gold/20">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-serif text-xl text-bone">{project.nombre}</h3>
                <StatusBadge status={project.estado} />
              </div>
              <p className="mb-6 text-sm text-muted">{project.descripcion}</p>
              <ProgressBar value={project.progreso} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
