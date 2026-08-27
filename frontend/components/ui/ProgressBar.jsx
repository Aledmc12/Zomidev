export default function ProgressBar({ value = 0, size = 'md', showLabel = true }) {
  const clamped = Math.max(0, Math.min(100, value))
  const height = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2'

  return (
    <div className="w-full">
      {showLabel && (
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted">Progreso</span>
          <span className="font-medium text-gold-soft">{clamped}%</span>
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-full bg-white/5 ${height}`}>
        <div
          className={`${height} rounded-full bg-gradient-to-r from-gold/70 to-gold-soft transition-all duration-700 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
