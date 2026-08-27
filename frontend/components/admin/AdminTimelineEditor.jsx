'use client'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_curso', label: 'En curso' },
  { value: 'completado', label: 'Completado' },
]

export default function AdminTimelineEditor({ hitos = [], onUpdate, onMove, onDelete, savingId }) {
  const sorted = [...hitos].sort((a, b) => a.orden - b.orden)

  if (!sorted.length) {
    return <p className="text-sm text-muted">No hay hitos aun. Agrega el primero abajo.</p>
  }

  return (
    <ol className="space-y-4">
      {sorted.map((hito, index) => (
        <li key={hito.id} className="rounded-xl border border-white/10 bg-bg p-4">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex flex-col gap-1">
              <button
                type="button"
                disabled={index === 0 || savingId === hito.id}
                onClick={() => onMove(hito.id, 'up')}
                className="rounded border border-white/10 p-1 text-muted transition hover:border-gold/30 hover:text-gold disabled:opacity-30"
                aria-label="Subir hito"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={index === sorted.length - 1 || savingId === hito.id}
                onClick={() => onMove(hito.id, 'down')}
                className="rounded border border-white/10 p-1 text-muted transition hover:border-gold/30 hover:text-gold disabled:opacity-30"
                aria-label="Bajar hito"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <input
                value={hito.titulo}
                onChange={(e) => onUpdate(hito.id, { titulo: e.target.value }, { debounce: true })}
                className="w-full rounded-lg border border-white/10 bg-bg-secondary px-3 py-2 text-bone outline-none focus:border-gold/40"
              />
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={hito.estado}
                  onChange={(e) => onUpdate(hito.id, { estado: e.target.value })}
                  disabled={savingId === hito.id}
                  className="rounded-lg border border-white/10 bg-bg-secondary px-3 py-2 text-sm text-bone outline-none focus:border-gold/40"
                >
                  {ESTADOS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <StatusBadge status={hito.estado} />
                {savingId === hito.id && <span className="text-xs text-muted">Guardando...</span>}
              </div>
              {hito.descripcion && (
                <p className="text-sm text-muted">{hito.descripcion}</p>
              )}
            </div>

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(hito.id)}
                disabled={savingId === hito.id}
                className="rounded border border-red-400/20 p-2 text-red-300 transition hover:border-red-400/50 disabled:opacity-30"
                aria-label={`Eliminar hito ${hito.titulo}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
