import {
  AlertTriangle,
  BookOpen,
  Minus,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, PageLayout, RiskBadge, SectionHeader, StatCard, ErrorState } from '../components/ui'
import { api } from '../api/client'
import { useAsyncData } from '../hooks/useAsyncData'

const BRAND = '#0B6E4F'
const AMBER = '#F79009'
const GRID = '#E4E7EC'
const INK = '#101828'
const TICK = '#98A2B3'

const TREND_ICONS = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
}

const TREND_LABELS = {
  up: 'Improving',
  down: 'Declining',
  flat: 'Stable',
}

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

export default function FacultyDashboard({ user, onSelectStudent, onNavigate }) {
  const { data, loading, error, refetch } = useAsyncData(() => api.getFacultyDashboard(), [])
  const { data: allStudents } = useAsyncData(
    () => api.getStudents({ sortField: 'name', sortDirection: 'asc' }),
    [],
  )

  if (loading) {
    return (
      <PageLayout>
        <div className="animate-skeleton h-8 w-56 rounded-md bg-border/80" />
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
  const term = meta.term
  const courseCount = meta.courseCount
  const assignedCourses = user?.courses ?? []
  const supervisedStudents = allStudents ?? []

  return (
    <PageLayout>
      <SectionHeader
        as="h2"
        title="Faculty Dashboard"
        description={`Welcome back, ${user?.name ?? 'Faculty'} — ${courseCount} section${courseCount !== 1 ? 's' : ''} for ${term}${assignedCourses.length ? `: ${assignedCourses.join(', ')}` : ''}.`}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Enrolled Students"
          value={stats.enrolled}
          subLabel="In your sections"
          icon={Users}
          iconTone="emerald"
          topBorderColor={BRAND}
        />
        <StatCard
          label="Avg Attendance"
          value={`${stats.avgAttendance}%`}
          subLabel="Current term average"
          icon={UserCheck}
          iconTone="emerald"
          topBorderColor={BRAND}
        />
        <StatCard
          label="At-Risk Students"
          value={stats.atRiskCount}
          subLabel="Critical or high risk"
          icon={AlertTriangle}
          iconTone="critical"
          topBorderColor="#D92D20"
          tintBackgroundColor="#FEF6F6"
        />
        <StatCard
          label="Avg GPA"
          value={stats.avgGpa}
          subLabel="Cumulative term average"
          icon={BookOpen}
          iconTone="emerald"
          topBorderColor={BRAND}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 bg-[#F8FAFC]">
          <h2 className="card-title">Weekly Engagement Trend</h2>
          <p className="mt-0.5 text-sm text-text-secondary">
            Attendance and LMS activity over the past 8 weeks
          </p>

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

          <div className="mt-6 min-w-0 h-72 w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND} stopOpacity={0.45} />
                    <stop offset="95%" stopColor={BRAND} stopOpacity={0.04} />
                  </linearGradient>
                  <linearGradient id="lmsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={AMBER} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={AMBER} stopOpacity={0} />
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
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="card-title">Needs Attention First</h2>
          <p className="mt-0.5 text-sm text-text-secondary">Top highest-risk students in your sections</p>

          {topRiskStudents.length === 0 ? (
            <div className="mt-6 rounded-md border border-dashed border-border bg-background px-4 py-8 text-center">
              <p className="text-sm font-medium text-text-primary">No students in your assigned sections</p>
              <p className="mt-1 text-xs text-text-muted">
                {assignedCourses.length === 0
                  ? 'Ask an Academic Admin to assign you to one or more courses.'
                  : 'Students enrolled in your courses will appear here.'}
              </p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {topRiskStudents.map((student, index) => {
                const TrendIcon = TREND_ICONS[student.trend]
                return (
                  <li key={student.id}>
                    <button
                      type="button"
                      onClick={() => onSelectStudent?.(student.id)}
                      className="flex w-full items-start gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-[#F9FAFB] first:pt-0 last:pb-0"
                    >
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                        style={{ backgroundColor: '#E6F4EE', color: '#0B6E4F' }}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-medium text-text-primary">{student.name}</p>
                          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-text-secondary">
                            <TrendIcon size={12} aria-hidden="true" />
                            {TREND_LABELS[student.trend]}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-text-muted">{student.course}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <RiskBadge level={student.riskLevel} score={student.riskScore} />
                          <span className="text-xs text-text-secondary">{student.attendance}% attendance</span>
                        </div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="card-title">My Students</h2>
            <p className="mt-0.5 text-sm text-text-secondary">
              All students under your supervision for {term}
            </p>
          </div>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('my-students')}
              className="btn-secondary shrink-0"
            >
              <Users size={16} aria-hidden="true" />
              Open full roster
            </button>
          )}
        </div>

        {supervisedStudents.length === 0 ? (
          <div className="mt-6 rounded-md border border-dashed border-border bg-background px-4 py-8 text-center">
            <p className="text-sm font-medium text-text-primary">No students in your assigned sections</p>
            <p className="mt-1 text-xs text-text-muted">
              {assignedCourses.length === 0
                ? 'Ask an Academic Admin to assign you to one or more courses.'
                : 'Students enrolled in your courses will appear here.'}
            </p>
          </div>
        ) : (
          <div className="mt-5 -mx-5 min-w-0 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            <table
              className="w-full min-w-[720px] border-collapse text-left text-sm"
              aria-label="Students under your supervision"
            >
              <thead>
                <tr className="border-b border-border bg-[#F9FAFB]">
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-text-secondary">Student</th>
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-text-secondary">Course</th>
                  <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-text-secondary">Attendance</th>
                  <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-text-secondary">GPA</th>
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-text-secondary">Risk</th>
                </tr>
              </thead>
              <tbody>
                {supervisedStudents.map((student, index) => (
                  <tr
                    key={student.id}
                    onClick={() => onSelectStudent?.(student.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelectStudent?.(student.id)
                      }
                    }}
                    tabIndex={0}
                    aria-label={`View details for ${student.name}`}
                    className={[
                      'cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-[#F9FAFB]',
                      index % 2 === 1 ? 'bg-background/70' : 'bg-surface',
                    ].join(' ')}
                  >
                    <td className="px-3 py-3">
                      <p className="font-medium text-text-primary">{student.name}</p>
                      <p className="text-xs text-text-muted">{student.id}</p>
                    </td>
                    <td className="px-3 py-3 text-text-secondary">{student.course}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-text-primary">
                      {student.attendance}%
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-text-primary">
                      {student.gpa.toFixed(2)}
                    </td>
                    <td className="px-3 py-3">
                      <RiskBadge level={student.riskLevel} score={student.riskScore} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-text-muted">
              {supervisedStudents.length} student{supervisedStudents.length !== 1 ? 's' : ''} under your supervision
            </p>
          </div>
        )}
      </Card>
    </PageLayout>
  )
}
