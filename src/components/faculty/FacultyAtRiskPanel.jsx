import { AlertTriangle, ArrowRight, ChevronRight } from 'lucide-react'
import { RiskBadge } from '../ui'

export default function FacultyAtRiskPanel({ students = [], onSelectStudent, onViewAll }) {
  return (
    <section className="faculty-panel h-full">
      <div className="flex items-start justify-between gap-3 border-b border-border/70 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-risk-high" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-text-primary">Students needing attention</h3>
          </div>
          <p className="mt-0.5 text-xs text-text-secondary">Highest risk in your sections</p>
        </div>
        {onViewAll ? (
          <button type="button" onClick={onViewAll} className="btn-ghost px-2 py-1 text-xs">
            View all
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {students.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-medium text-text-primary">No critical alerts right now</p>
          <p className="mt-1 text-xs text-text-secondary">Your roster looks stable this week.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border/70">
          {students.map((student) => (
            <li key={student.id}>
              <button
                type="button"
                onClick={() => onSelectStudent?.(student.id)}
                className="faculty-at-risk-row group flex w-full items-center gap-3 px-5 py-3.5 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-sm font-bold tabular-nums text-text-primary ring-2 ring-border">
                  {student.riskScore}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary group-hover:text-primary-700">
                    {student.name}
                  </p>
                  <p className="truncate text-xs text-text-muted">{student.course}</p>
                </div>
                <div className="hidden shrink-0 sm:block">
                  <RiskBadge level={student.riskLevel} />
                </div>
                <ArrowRight
                  size={16}
                  className="shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600"
                  aria-hidden="true"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
