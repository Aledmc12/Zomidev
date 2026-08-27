import StatusBadge from '@/components/ui/StatusBadge'

export default function Timeline({ hitos = [] }) {
  if (!hitos.length) {
    return <p className="text-sm text-muted">La linea de tiempo se publicara proximamente.</p>
  }

  return (
    <ol className="relative space-y-8 border-l border-gold/20 pl-8">
      {hitos.map((hito) => (
        <li key={hito.id} className="relative">
          <span className="absolute -left-[2.05rem] top-1 h-3 w-3 rounded-full border border-gold bg-bg" />
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-serif text-lg text-bone">{hito.titulo}</h3>
            <StatusBadge status={hito.estado} />
          </div>
          {hito.descripcion && <p className="mt-2 text-sm text-muted">{hito.descripcion}</p>}
          {(hito.fecha_inicio || hito.fecha_fin) && (
            <p className="mt-2 text-xs text-gold/80">
              {hito.fecha_inicio || '—'} {hito.fecha_fin ? `→ ${hito.fecha_fin}` : ''}
            </p>
          )}
        </li>
      ))}
    </ol>
  )
}
