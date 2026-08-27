'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Download, ExternalLink } from 'lucide-react'
import ProgressRing from '@/components/ui/ProgressRing'
import StatusBadge from '@/components/ui/StatusBadge'
import Timeline from '@/components/portal/Timeline'
import { api } from '@/lib/api'
import { isAllowedStagingUrl } from '@/lib/site'

export default function ProjectDetailPage() {
  const params = useParams()
  const [project, setProject] = useState(null)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    if (!params?.id) return
    api.portal.project(params.id)
      .then(setProject)
      .catch((err) => setError(err.detail || 'Error al cargar proyecto'))
  }, [params?.id])

  const handleDownload = async (item) => {
    setDownloading(item.id)
    try {
      await api.portal.downloadEntregable(item.id, item.archivo_nombre || item.titulo)
    } catch (err) {
      setError(err.detail || 'Error al descargar el archivo')
    } finally {
      setDownloading(null)
    }
  }

  if (error && !project) return <p className="text-red-300">{error}</p>
  if (!project) return <p className="text-muted">Cargando proyecto...</p>

  const sortedBitacoras = [...(project.bitacoras || [])].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )

  return (
    <div className="space-y-10">
      <div>
        <Link href="/portal" className="text-sm text-muted hover:text-gold-soft">Volver al dashboard</Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="font-serif text-3xl text-bone">{project.nombre}</h1>
            <p className="mt-3 max-w-3xl text-muted">{project.descripcion}</p>
          </div>
          <StatusBadge status={project.estado} />
        </div>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <div className="grid gap-8 xl:grid-cols-[280px_1fr]">
        <div className="card-surface flex flex-col items-center p-8">
          <ProgressRing value={project.progreso} />
          <p className="mt-4 text-sm text-muted">Avance general</p>
          {project.proxima_entrega && (
            <p className="mt-2 text-sm text-gold-soft">Proxima entrega: {project.proxima_entrega}</p>
          )}
        </div>

        <div className="card-surface p-8">
          <h2 className="font-serif text-2xl text-gold-soft">Linea de tiempo</h2>
          <div className="mt-8">
            <Timeline hitos={project.hitos} />
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="card-surface p-8">
          <h2 className="font-serif text-2xl text-gold-soft">Previews</h2>
          <div className="mt-6 space-y-4">
            {project.previews?.length ? project.previews.map((preview) => (
              <div key={preview.id} className="rounded-xl border border-white/5 bg-bg p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-bone">{preview.titulo}</p>
                  {preview.staging_url && (
                    <a href={preview.staging_url} target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-soft">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
                {preview.staging_url && isAllowedStagingUrl(preview.staging_url) && (
                  <iframe
                    src={preview.staging_url}
                    title={preview.titulo}
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    className="mt-4 h-56 w-full rounded-lg border border-white/5 bg-black"
                    loading="lazy"
                  />
                )}
              </div>
            )) : <p className="text-sm text-muted">Sin previews disponibles.</p>}
          </div>
        </section>

        <section className="card-surface p-8">
          <h2 className="font-serif text-2xl text-gold-soft">Entregables</h2>
          <div className="mt-6 space-y-3">
            {project.entregables?.length ? project.entregables.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleDownload(item)}
                disabled={downloading === item.id}
                className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-bg px-4 py-3 text-left transition hover:border-gold/20 disabled:opacity-60"
              >
                <div>
                  <p className="text-bone">{item.titulo}</p>
                  {item.archivo_nombre && <p className="text-xs text-muted">{item.archivo_nombre}</p>}
                  {item.descripcion && <p className="text-xs text-muted">{item.descripcion}</p>}
                </div>
                <Download className={`h-4 w-4 text-gold ${downloading === item.id ? 'animate-pulse' : ''}`} />
              </button>
            )) : <p className="text-sm text-muted">Sin entregables por ahora.</p>}
          </div>
        </section>
      </div>

      <section className="card-surface p-8">
        <h2 className="font-serif text-2xl text-gold-soft">Bitacora de avances</h2>
        <div className="mt-6 space-y-4">
          {sortedBitacoras.length ? sortedBitacoras.map((entry) => (
            <article key={entry.id} className="border-l-2 border-gold/30 pl-4">
              <p className="text-xs text-muted">{new Date(entry.created_at).toLocaleDateString('es-CO')}</p>
              <p className="mt-1 text-bone">{entry.contenido}</p>
            </article>
          )) : <p className="text-sm text-muted">Aun no hay entradas en la bitacora.</p>}
        </div>
      </section>
    </div>
  )
}
