import { AlertTriangle, ArrowRight, BookOpen, UserCheck, Users } from 'lucide-react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, PageLayout, StatCard, ErrorState } from '../components/ui'
import { FacultyAtRiskPanel, FacultyHero } from '../components/faculty'
import { api } from '../api/client'
import { useAsyncData } from '../hooks/useAsyncData'

const BRAND = '#0B6E4F'
const AMBER = '#F79009'
const GRID = '#E4E7EC'
const INK = '#101828'
const TICK = '#98A2B3'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2.5 shadow-card">
      <p className="mb-1.5 text-xs font-medium text-text-secondary">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}%
        </p>
      ))}
    </div>
  )
}

export default function FacultyDashboard({ user, onNavigate, onSelectStudent, onOpenStudents }) {
  const { data, loading, error, refetch } = useAsyncData(() => api.getFacultyDashboard(), [])

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
        <ErrorState error={error} onRetry={refetch} />
      </PageLayout>
    )
  }

  const { stats, engagementTrend, topRiskStudents, meta } = data
  const { term, courseCount } = meta

  return (
    <PageLayout>
      <FacultyHero
        name={user?.name}
        term={term}
        courseCount={courseCount}
        enrolled={stats.enrolled}
        atRiskCount={stats.atRiskCount}
        department={user?.department}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          className="faculty-stat-action rounded-2xl text-left"
          onClick={() => onOpenStudents?.({})}
        >
          <StatCard
            label="Enrolled Students"
            value={stats.enrolled}
            subLabel="Across your sections"
            icon={Users}
            kpiTheme="students"
          />
        </button>
        <button
          type="button"
          className="faculty-stat-action rounded-2xl text-left"
          onClick={() => onNavigate?.('reports')}
        >
          <StatCard
            label="Avg Attendance"
            value={`${stats.avgAttendance}%`}
            subLabel="Current term average"
            icon={UserCheck}
            kpiTheme="attendance"
          />
        </button>
        <button
          type="button"
          className="faculty-stat-action rounded-2xl text-left"
          onClick={() => onOpenStudents?.({ riskFilter: 'Critical' })}
        >
          <StatCard
            label="At-Risk Students"
            value={stats.atRiskCount}
            subLabel="Critical or high risk"
            note={stats.atRiskCount > 0 ? 'Tap to review roster' : 'No urgent alerts'}
            icon={AlertTriangle}
            kpiTheme="risk"
          />
        </button>
        <button
          type="button"
          className="faculty-stat-action rounded-2xl text-left"
          onClick={() => onNavigate?.('reports')}
        >
          <StatCard
            label="Avg GPA"
            value={stats.avgGpa}
            subLabel="Cumulative term average"
            icon={BookOpen}
            kpiTheme="departments"
          />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="card-title">Weekly Engagement Trend</h2>
              <p className="mt-0.5 text-sm text-text-secondary">
                Attendance and LMS activity across your sections
              </p>
            </div>
            <button type="button" onClick={() => onNavigate?.('reports')} className="btn-secondary">
              Open class reports
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: BRAND }} aria-hidden="true" />
              <span className="text-sm font-medium" style={{ color: INK }}>Attendance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: AMBER }} aria-hidden="true" />
              <span className="text-sm font-medium" style={{ color: INK }}>LMS Activity</span>
            </div>
          </div>

          <div className="mt-6 h-80 min-w-0 w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={engagementTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND} stopOpacity={0.45} />
                    <stop offset="95%" stopColor={BRAND} stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="weekLabel" tick={{ fontSize: 12, fill: TICK }} axisLine={{ stroke: GRID }} tickLine={false} />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fontSize: 12, fill: TICK }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: GRID, strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="attendance"
                  name="Attendance"
                  stroke={BRAND}
                  strokeWidth={2.5}
                  fill="url(#attendanceGradient)"
                  dot={{ r: 3, fill: BRAND, strokeWidth: 0 }}
                  activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2, fill: BRAND }}
                />
                <Line
                  type="monotone"
                  dataKey="lmsActivity"
                  name="LMS Activity"
                  stroke={AMBER}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: AMBER, strokeWidth: 0 }}
                  activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2, fill: AMBER }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <FacultyAtRiskPanel
          students={topRiskStudents}
          onSelectStudent={onSelectStudent}
          onViewAll={() => onOpenStudents?.({ riskFilter: 'Critical' })}
        />
      </div>
    </PageLayout>
  )
}
