'use client'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function AdminEntregablesEditor({
  entregables = [],
  onMove,
  savingId,
}) {
  const sorted = [...entregables].sort((a, b) => a.orden - b.orden)

  if (!sorted.length) {
    return <p className="text-sm text-muted">No hay entregables aun. Sube el primero abajo.</p>
  }

  return (
    <ol className="space-y-3">
      {sorted.map((item, index) => (
        <li
          key={item.id}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-bg px-4 py-3"
        >
          <div className="flex flex-col gap-1">
            <button
              type="button"
              disabled={index === 0 || savingId === item.id}
              onClick={() => onMove(item.id, 'up')}
              className="rounded border border-white/10 p-1 text-muted transition hover:border-gold/30 hover:text-gold disabled:opacity-30"
              aria-label="Subir entregable"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={index === sorted.length - 1 || savingId === item.id}
              onClick={() => onMove(item.id, 'down')}
              className="rounded border border-white/10 p-1 text-muted transition hover:border-gold/30 hover:text-gold disabled:opacity-30"
              aria-label="Bajar entregable"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-bone">{item.titulo}</p>
            <p className="truncate text-xs text-muted">
              {item.archivo_nombre || item.archivo_url}
              {item.descripcion ? ` — ${item.descripcion}` : ''}
            </p>
          </div>
          <span className="text-xs text-muted">#{index + 1}</span>
        </li>
      ))}
    </ol>
  )
}
