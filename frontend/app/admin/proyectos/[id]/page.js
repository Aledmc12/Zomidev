'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import ProgressBar from '@/components/ui/ProgressBar'
import AdminTimelineEditor from '@/components/admin/AdminTimelineEditor'
import { api } from '@/lib/api'

export default function AdminProjectDetailPage() {
  const params = useParams()
  const [project, setProject] = useState(null)
  const [progreso, setProgreso] = useState(0)
  const [bitacora, setBitacora] = useState('')
  const [hitoForm, setHitoForm] = useState({ titulo: '', estado: 'pendiente' })
  const [entregableForm, setEntregableForm] = useState({ titulo: '', descripcion: '', file: null })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [savingHitoId, setSavingHitoId] = useState(null)
  const debounceTimers = useRef({})

  const loadProject = () => {
    if (!params?.id) return
    api.admin.project(params.id).then((data) => {
      setProject(data)
      setProgreso(data.progreso)
    })
  }

  useEffect(loadProject, [params?.id])

  useEffect(() => () => {
    Object.values(debounceTimers.current).forEach(clearTimeout)
  }, [])

  const updateProgress = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.admin.updateProject(params.id, { progreso: Number(progreso) })
      setMessage('Progreso actualizado.')
      loadProject()
    } catch (err) {
      setError(err.detail || 'Error al actualizar')
    }
  }

  const addBitacora = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.admin.createBitacora(params.id, { contenido: bitacora })
      setBitacora('')
      setMessage('Bitacora registrada.')
      loadProject()
    } catch (err) {
      setError(err.detail || 'Error al registrar bitacora')
    }
  }

  const addHito = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const nextOrden = project.hitos?.length
        ? Math.max(...project.hitos.map((h) => h.orden)) + 1
        : 0
      await api.admin.createHito(params.id, { ...hitoForm, orden: nextOrden })
      setHitoForm({ titulo: '', estado: 'pendiente' })
      setMessage('Hito creado.')
      loadProject()
    } catch (err) {
      setError(err.detail || 'Error al crear hito')
    }
  }

  const updateHito = async (hitoId, data, { debounce: useDebounce = false } = {}) => {
    if (!project) return

    const applyLocal = () => {
      setProject((prev) => ({
        ...prev,
        hitos: prev.hitos.map((h) => (h.id === hitoId ? { ...h, ...data } : h)),
      }))
    }

    if (useDebounce) {
      applyLocal()
      clearTimeout(debounceTimers.current[hitoId])
      debounceTimers.current[hitoId] = setTimeout(async () => {
        setSavingHitoId(hitoId)
        try {
          await api.admin.updateHito(hitoId, data)
          setMessage('Hito actualizado.')
        } catch (err) {
          setError(err.detail || 'Error al actualizar hito')
          loadProject()
        } finally {
          setSavingHitoId(null)
        }
      }, 600)
      return
    }

    applyLocal()
    setSavingHitoId(hitoId)
    setError('')
    try {
      await api.admin.updateHito(hitoId, data)
      setMessage('Hito actualizado.')
      loadProject()
    } catch (err) {
      setError(err.detail || 'Error al actualizar hito')
      loadProject()
    } finally {
      setSavingHitoId(null)
    }
  }

  const moveHito = async (hitoId, direction) => {
    if (!project?.hitos?.length) return
    const sorted = [...project.hitos].sort((a, b) => a.orden - b.orden)
    const index = sorted.findIndex((h) => h.id === hitoId)
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= sorted.length) return

    const current = sorted[index]
    const other = sorted[swapIndex]

    setSavingHitoId(hitoId)
    setError('')
    try {
      await Promise.all([
        api.admin.updateHito(current.id, { orden: other.orden }),
        api.admin.updateHito(other.id, { orden: current.orden }),
      ])
      setMessage('Orden actualizado.')
      loadProject()
    } catch (err) {
      setError(err.detail || 'Error al reordenar hitos')
    } finally {
      setSavingHitoId(null)
    }
  }

  const deleteHito = async (hitoId) => {
    if (!confirm('Eliminar este hito?')) return
    setSavingHitoId(hitoId)
    setError('')
    try {
      await api.admin.deleteHito(hitoId)
      setMessage('Hito eliminado.')
      loadProject()
    } catch (err) {
      setError(err.detail || 'Error al eliminar hito')
    } finally {
      setSavingHitoId(null)
    }
  }

  const uploadEntregable = async (e) => {
    e.preventDefault()
    if (!entregableForm.file) {
      setError('Selecciona un archivo para subir.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('titulo', entregableForm.titulo)
      if (entregableForm.descripcion) formData.append('descripcion', entregableForm.descripcion)
      formData.append('archivo', entregableForm.file)
      await api.admin.uploadEntregable(params.id, formData)
      setEntregableForm({ titulo: '', descripcion: '', file: null })
      setMessage('Entregable subido correctamente.')
      loadProject()
    } catch (err) {
      setError(err.detail || 'Error al subir entregable')
    } finally {
      setUploading(false)
    }
  }

  if (!project) return <p className="text-muted">Cargando proyecto...</p>

  const sortedBitacoras = [...(project.bitacoras || [])].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin/proyectos" className="text-sm text-muted hover:text-gold-soft">Volver a proyectos</Link>
        <h1 className="mt-4 font-serif text-3xl text-bone">{project.nombre}</h1>
      </div>

      {message && <p className="text-sm text-emerald-300">{message}</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}

      <form onSubmit={updateProgress} className="card-surface space-y-4 p-6">
        <h2 className="font-serif text-xl text-gold-soft">Actualizar progreso</h2>
        <ProgressBar value={progreso} showLabel={false} />
        <input
          type="range"
          min="0"
          max="100"
          value={progreso}
          onChange={(e) => setProgreso(Number(e.target.value))}
          className="w-full accent-gold"
        />
        <button type="submit" className="rounded-full bg-gold px-6 py-2 text-sm text-bg">Guardar progreso</button>
      </form>

      <section className="card-surface space-y-6 p-6">
        <div>
          <h2 className="font-serif text-xl text-gold-soft">Linea de tiempo</h2>
          <p className="mt-2 text-sm text-muted">
            Edita titulos, cambia estados y reordena con las flechas. El cliente ve los cambios al instante.
          </p>
        </div>
        <AdminTimelineEditor
          hitos={project.hitos}
          onUpdate={updateHito}
          onMove={moveHito}
          onDelete={deleteHito}
          savingId={savingHitoId}
        />
      </section>

      <form onSubmit={addHito} className="card-surface grid gap-4 p-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm text-muted">Nuevo hito</label>
          <input
            required
            placeholder="Titulo del hito"
            value={hitoForm.titulo}
            onChange={(e) => setHitoForm({ ...hitoForm, titulo: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-bone outline-none"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm text-muted">Estado inicial</label>
          <select
            value={hitoForm.estado}
            onChange={(e) => setHitoForm({ ...hitoForm, estado: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-bone outline-none"
          >
            <option value="pendiente">Pendiente</option>
            <option value="en_curso">En curso</option>
            <option value="completado">Completado</option>
          </select>
        </div>
        <div className="md:col-span-3">
          <button type="submit" className="rounded-full border border-gold/40 px-6 py-2 text-sm text-gold-soft">Agregar hito</button>
        </div>
      </form>

      <form onSubmit={addBitacora} className="card-surface space-y-4 p-6">
        <h2 className="font-serif text-xl text-gold-soft">Nueva entrada de bitacora</h2>
        <textarea
          rows={3}
          required
          value={bitacora}
          onChange={(e) => setBitacora(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-bone outline-none"
          placeholder="Actualizacion del 17 jul: se implemento el login"
        />
        <button type="submit" className="rounded-full border border-gold/40 px-6 py-2 text-sm text-gold-soft">Publicar avance</button>
      </form>

      <form onSubmit={uploadEntregable} className="card-surface space-y-4 p-6">
        <h2 className="font-serif text-xl text-gold-soft">Subir entregable</h2>
        <input
          required
          placeholder="Titulo del entregable"
          value={entregableForm.titulo}
          onChange={(e) => setEntregableForm({ ...entregableForm, titulo: e.target.value })}
          className="w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-bone outline-none"
        />
        <input
          placeholder="Descripcion (opcional)"
          value={entregableForm.descripcion}
          onChange={(e) => setEntregableForm({ ...entregableForm, descripcion: e.target.value })}
          className="w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-bone outline-none"
        />
        <input
          type="file"
          required
          onChange={(e) => setEntregableForm({ ...entregableForm, file: e.target.files?.[0] || null })}
          className="w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-gold/20 file:px-4 file:py-2 file:text-gold-soft"
        />
        <button
          type="submit"
          disabled={uploading}
          className="rounded-full border border-gold/40 px-6 py-2 text-sm text-gold-soft disabled:opacity-60"
        >
          {uploading ? 'Subiendo...' : 'Subir archivo'}
        </button>
      </form>

      {project.entregables?.length > 0 && (
        <section className="card-surface p-6">
          <h2 className="font-serif text-xl text-gold-soft">Entregables actuales</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {project.entregables.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 border-b border-white/5 pb-2">
                <span className="text-bone">{item.titulo}</span>
                <span>{item.archivo_nombre || item.archivo_url}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card-surface p-6">
        <h2 className="font-serif text-xl text-gold-soft">Bitacora reciente</h2>
        <div className="mt-6 space-y-4">
          {sortedBitacoras.length ? sortedBitacoras.slice(0, 5).map((entry) => (
            <article key={entry.id} className="border-l-2 border-gold/30 pl-4">
              <p className="text-xs text-muted">{new Date(entry.created_at).toLocaleDateString('es-CO')}</p>
              <p className="mt-1 text-bone">{entry.contenido}</p>
            </article>
          )) : <p className="text-sm text-muted">Sin entradas aun.</p>}
        </div>
      </section>
    </div>
  )
}
