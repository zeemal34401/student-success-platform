import { AlertTriangle, ArrowRight, BookOpen, Users } from 'lucide-react'

function riskTone(criticalCount, atRiskCount) {
  if (criticalCount > 0) return 'critical'
  if (atRiskCount > 0) return 'watch'
  return 'stable'
}

const TONE_STYLES = {
  critical: {
    ring: 'border-risk-critical/30 bg-risk-critical-bg/40',
    bar: 'bg-risk-critical',
    label: 'Needs urgent review',
  },
  watch: {
    ring: 'border-risk-high/25 bg-risk-high-bg/30',
    bar: 'bg-risk-high',
    label: 'Students need follow-up',
  },
  stable: {
    ring: 'border-primary-200/50 bg-primary-50/40',
    bar: 'bg-primary-500',
    label: 'Section on track',
  },
}

export default function FacultyCourseCard({ course, enrolled, atRiskCount, criticalCount, onOpen }) {
  const tone = riskTone(criticalCount, atRiskCount)
  const styles = TONE_STYLES[tone]
  const riskPct = enrolled > 0 ? Math.round((atRiskCount / enrolled) * 100) : 0

  return (
    <button
      type="button"
      onClick={() => onOpen?.(course)}
      className={['faculty-course-card group w-full text-left', styles.ring].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 text-primary-700 shadow-sm ring-1 ring-border/60">
            <BookOpen size={20} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-text-primary">{course}</p>
            <p className="mt-0.5 text-xs font-medium text-text-secondary">{styles.label}</p>
          </div>
        </div>
        <span className="faculty-course-arrow inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-primary-700 ring-1 ring-border/60">
          <ArrowRight size={16} aria-hidden="true" />
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="faculty-stat-pill">
          <Users size={13} aria-hidden="true" />
          {enrolled} enrolled
        </span>
        <span className="faculty-stat-pill">
          <AlertTriangle size={13} aria-hidden="true" />
          {atRiskCount} at risk
        </span>
        {criticalCount > 0 ? (
          <span className="faculty-stat-pill faculty-stat-pill-critical">{criticalCount} critical</span>
        ) : null}
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-text-muted">
          <span>At-risk share</span>
          <span>{riskPct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/70 ring-1 ring-border/40">
          <div
            className={`h-full rounded-full transition-all duration-500 ${styles.bar}`}
            style={{ width: `${Math.max(riskPct, enrolled ? 8 : 0)}%` }}
          />
        </div>
      </div>
    </button>
  )
}
