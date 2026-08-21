function toneForValue(value, invert = false) {
  const effective = invert ? 100 - value : value
  if (effective >= 75) return 'bg-risk-low'
  if (effective >= 50) return 'bg-risk-medium'
  if (effective >= 30) return 'bg-risk-high'
  return 'bg-risk-critical'
}

export default function FacultyMetricBar({ value, max = 100, invert = false, label }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)))
  const tonePct = invert ? 100 - pct : pct

  return (
    <div className="min-w-[88px]">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums text-text-primary">{label ?? value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-background ring-1 ring-border/60">
        <div
          className={`h-full rounded-full transition-all duration-500 ${toneForValue(tonePct, false)}`}
          style={{ width: `${Math.max(invert ? pct : tonePct, 4)}%` }}
        />
      </div>
    </div>
  )
}
