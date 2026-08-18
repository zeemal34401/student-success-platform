import { AlertTriangle, BookOpen, Building2, GraduationCap, Landmark, Users } from 'lucide-react'
import { PageLayout, StatCard, ErrorState } from '../components/ui'
import { api } from '../api/client'
import { useAsyncData } from '../hooks/useAsyncData'

const INK = '#1A365D'
const GOLD = '#C6A15B'
const PAPER = '#F7F4EE'
const ATTEND = '#0B6E4F'
const GPA = '#1D4ED8'
const RISK_OK = '#176455'
const RISK_WATCH = '#B54708'
const RISK_HIGH = '#B42318'

function riskTone(share) {
  if ((share ?? 0) >= 25) return { color: RISK_HIGH, label: 'Elevated' }
  if ((share ?? 0) >= 12) return { color: RISK_WATCH, label: 'Watch' }
  return { color: RISK_OK, label: 'Stable' }
}

function Meter({ label, display, percent, color }) {
  const width = Math.max(0, Math.min(100, percent ?? 0))
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">{label}</span>
        <span className="text-xs font-semibold tabular-nums text-text-primary">{display}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full" style={{ background: '#E8E2D6' }}>
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${width}%`, background: color }}
        />
      </div>
    </div>
  )
}

function HighlightTile({ eyebrow, title, value, hint }) {
  return (
    <div
      className="rounded-xl border px-4 py-3.5"
      style={{ borderColor: 'rgba(198, 161, 91, 0.35)', background: PAPER }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: GOLD }}>
        {eyebrow}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-text-primary">{title}</p>
      <p className="mt-1 text-lg font-bold tabular-nums tracking-tight" style={{ color: INK }}>
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-text-muted">{hint}</p> : null}
    </div>
  )
}

export default function AcademicAdminDashboard() {
  const { data, loading, error } = useAsyncData(() => api.getAcademicAdminDashboard(), [])

  if (loading) {
    return (
      <PageLayout>
        <div className="animate-skeleton h-36 rounded-2xl bg-border/80" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-skeleton h-40 rounded-2xl bg-border/80" />
          ))}
        </div>
        <div className="animate-skeleton mt-6 h-80 rounded-2xl bg-border/80" />
      </PageLayout>
    )
  }

  if (error || !data) {
    return (
      <PageLayout>
        <ErrorState error={error} />
      </PageLayout>
    )
  }

  const { stats, departmentComparison, meta } = data
  const departments = [...(departmentComparison ?? [])].sort((a, b) =>
    a.department.localeCompare(b.department),
  )
  const withStudents = departments.filter((row) => (row.sampleEnrolled ?? 0) > 0)
  const bestAttendance = [...withStudents].sort((a, b) => b.avgAttendance - a.avgAttendance)[0]
  const bestGpa = [...withStudents].sort((a, b) => b.avgGpa - a.avgGpa)[0]
  const mostExposed = [...withStudents].sort(
    (a, b) => (b.riskShare ?? 0) - (a.riskShare ?? 0) || b.atRiskCount - a.atRiskCount,
  )[0]
  const riskShare =
    stats.enrolled > 0 ? Math.round((stats.atRiskCount / stats.enrolled) * 100) : 0

  return (
    <PageLayout>
      <header
        className="relative overflow-hidden rounded-2xl px-6 py-6 text-white sm:px-8"
        style={{ background: `linear-gradient(135deg, ${INK} 0%, #234E78 58%, #1A365D 100%)` }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent 0, transparent 47px, rgba(198,161,91,0.45) 47px, rgba(198,161,91,0.45) 48px)',
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(198,161,91,0.28) 0%, transparent 68%)' }}
          aria-hidden="true"
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/65">
              <Landmark size={13} aria-hidden="true" />
              Academic administration
            </p>
            <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Academic Overview
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">
              Term standing across departments — enrollment, instruction, and risk exposure in one view.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: GOLD, color: INK }}
            >
              {meta.term}
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
              {stats.departmentCount ?? departments.length} departments
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
              {riskShare}% at risk
            </span>
          </div>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Students Tracked"
          value={stats.enrolled}
          subLabel="Across all departments"
          icon={Users}
          kpiTheme="students"
        />
        <StatCard
          label="Faculty"
          value={stats.facultyCount}
          subLabel="Active instructors"
          icon={GraduationCap}
          kpiTheme="accounts"
        />
        <StatCard
          label="Courses"
          value={stats.courseCount}
          subLabel="Assigned this term"
          icon={BookOpen}
          kpiTheme="departments"
        />
        <StatCard
          label="High-Risk Students"
          value={stats.atRiskCount}
          subLabel="Critical or high risk"
          note="Critical intervention needed."
          icon={AlertTriangle}
          kpiTheme="risk"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <HighlightTile
          eyebrow="Strongest attendance"
          title={bestAttendance?.department ?? '—'}
          value={bestAttendance ? `${bestAttendance.avgAttendance}%` : '—'}
          hint="Department average this term"
        />
        <HighlightTile
          eyebrow="Highest GPA"
          title={bestGpa?.department ?? '—'}
          value={bestGpa ? Number(bestGpa.avgGpa).toFixed(2) : '—'}
          hint="Mean grade point average"
        />
        <HighlightTile
          eyebrow="Highest risk share"
          title={mostExposed?.department ?? '—'}
          value={mostExposed ? `${mostExposed.riskShare}%` : '—'}
          hint={mostExposed ? `${mostExposed.atRiskCount} students at risk` : 'No exposure recorded'}
        />
      </div>

      <section
        className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-card"
        style={{ borderColor: 'rgba(26, 54, 93, 0.12)' }}
      >
        <div
          className="flex flex-col gap-1 border-b px-6 py-5 sm:flex-row sm:items-end sm:justify-between"
          style={{ borderColor: 'rgba(26, 54, 93, 0.1)', background: PAPER }}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: GOLD }}>
              Comparative ledger
            </p>
            <h3 className="mt-1 font-heading text-xl font-bold tracking-tight" style={{ color: INK }}>
              Department Performance
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              Attendance, GPA, and risk share for every department this term.
            </p>
          </div>
          <p className="text-xs text-text-muted">
            Avg attendance {stats.avgAttendance}% · GPA {stats.avgGpa}
          </p>
        </div>

        <ul className="divide-y divide-border">
          {departments.map((row, index) => {
            const tone = riskTone(row.riskShare)
            return (
              <li key={row.department} className="px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 items-start gap-3 lg:w-[240px] lg:shrink-0">
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums"
                      style={{ background: INK, color: GOLD }}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-semibold text-text-primary">
                        <Building2 size={14} className="shrink-0 text-text-muted" aria-hidden="true" />
                        <span className="truncate">{row.department}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {row.sampleEnrolled} students · {row.atRiskCount} at risk
                        {row.criticalCount ? ` · ${row.criticalCount} critical` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
                    <Meter
                      label="Attendance"
                      display={`${row.avgAttendance}%`}
                      percent={row.avgAttendance}
                      color={ATTEND}
                    />
                    <Meter
                      label="GPA"
                      display={Number(row.avgGpa).toFixed(2)}
                      percent={(Number(row.avgGpa) / 4) * 100}
                      color={GPA}
                    />
                    <Meter
                      label="Risk share"
                      display={`${row.riskShare}%`}
                      percent={row.riskShare}
                      color={tone.color}
                    />
                  </div>

                  <span
                    className="inline-flex w-fit shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
                    style={{
                      color: tone.color,
                      background: `${tone.color}14`,
                      border: `1px solid ${tone.color}33`,
                    }}
                  >
                    {tone.label}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </PageLayout>
  )
}
