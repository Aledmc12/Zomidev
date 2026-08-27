const styles = {
  pendiente: 'border-muted/40 text-muted bg-muted/10',
  en_curso: 'border-gold/40 text-gold-soft bg-gold/10',
  completado: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10',
  activo: 'border-gold/40 text-gold-soft bg-gold/10',
  pausado: 'border-muted/40 text-muted bg-muted/10',
  finalizado: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10',
}

const labels = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  completado: 'Completado',
  activo: 'Activo',
  pausado: 'Pausado',
  finalizado: 'Finalizado',
}

export default function StatusBadge({ status }) {
  const style = styles[status] || styles.pendiente
  const label = labels[status] || status

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide ${style}`}>
      {label}
    </span>
  )
}
