import {
  AlertTriangle,
  BookOpen,
  GraduationCap,
  Layers,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, PageLayout, StatCard, ErrorState } from '../components/ui'
import { ROLES } from '../constants/roles'
import { CHART_COLORS, RISK_CHART_COLORS } from '../constants/chartColors'
import { api } from '../api/client'
import { useAsyncData } from '../hooks/useAsyncData'

const BRAND = '#0B6E4F'
const AMBER = '#F79009'
const CRITICAL = '#D92D20'
const GOLD = '#EAB308'
const LOW = '#0B6E4F'
const GRID = '#E4E7EC'
const TICK = '#98A2B3'

const PIE_COLORS = {
  Critical: CRITICAL,
  High: AMBER,
  Medium: GOLD,
  Low: LOW,
}

const CLUSTER_THEMES = [
  { test: /high achiever/i, tint: 'rgba(16, 185, 129, 0.12)', accent: '#059669', bar: '#10B981' },
  { test: /disengaged|withdrawal/i, tint: 'rgba(239, 68, 68, 0.1)', accent: '#DC2626', bar: '#EF4444' },
  { test: /struggling|repeat/i, tint: 'rgba(245, 158, 11, 0.12)', accent: '#D97706', bar: '#F59E0B' },
  { test: /moderate|mixed/i, tint: 'rgba(14, 116, 144, 0.1)', accent: '#0E7490', bar: '#06B6D4' },
]

function clusterTheme(label) {
  return CLUSTER_THEMES.find((theme) => theme.test.test(label)) ?? CLUSTER_THEMES[3]
}

function shortenDepartment(name) {
  return name
    .replace('Computer Science', 'CS')
    .replace('Mathematics', 'Math')
    .replace('Psychology', 'Psych')
    .replace('Biology', 'Bio')
    .replace('English', 'Eng')
}

function ChartCard({ icon: Icon, title, description, children, iconClass = 'bg-primary-50 text-primary-700' }) {
  return (
    <Card className="overflow-hidden">
      <div className="mb-5 flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon size={18} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="card-title">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-text-secondary">{description}</p> : null}
        </div>
      </div>
      {children}
    </Card>
  )
}

function RetentionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-card">
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      <p className="text-sm font-semibold text-primary-600">{payload[0].value}%</p>
    </div>
  )
}

function RiskPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-card">
      <p className="text-sm font-semibold" style={{ color: item.payload.color }}>
        {item.name}
      </p>
      <p className="text-xs text-text-secondary">{item.value} students</p>
    </div>
  )
}

function DepartmentTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-card">
      <p className="mb-1 text-xs font-medium text-text-secondary">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}%
        </p>
      ))}
    </div>
  )
}

function DonutCenter({ viewBox, value, caption }) {
  const cx = viewBox?.cx ?? 0
  const cy = viewBox?.cy ?? 0
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-0.35em" fill="#101828" fontSize="22" fontWeight="800">
        {value}
      </tspan>
      <tspan x={cx} dy="1.45em" fill="#98A2B3" fontSize="11" fontWeight="600">
        {caption}
      </tspan>
    </text>
  )
}

function ClusterAnalysisCard() {
  const { data, loading, error } = useAsyncData(() => api.getMlClusterSummary(), [])

  if (loading) {
    return (
      <Card className="mt-6">
        <div className="animate-skeleton h-8 w-56 rounded-md bg-border/80" />
      </Card>
    )
  }

  if (error || !data?.available || !data.data) {
    return (
      <Card className="mt-6">
        <h2 className="card-title">Behavioral Cluster Analysis</h2>
        <p className="mt-2 text-sm text-text-secondary">
          {error?.message ?? data?.error ?? 'Cluster analytics service is offline.'}
        </p>
      </Card>
    )
  }

  const clusterData = data.data

  return (
    <Card className="mt-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
          <Layers size={18} aria-hidden="true" />
        </div>
        <div>
          <h2 className="card-title">Behavioral Cluster Analysis</h2>
          <p className="mt-0.5 text-sm text-text-secondary">
            {clusterData.source === 'platform'
              ? `${clusterData.total_students.toLocaleString()} students in the current term, grouped by engagement and performance patterns`
              : `Benchmark of ${clusterData.total_students.toLocaleString()} students from the training population, segmented by engagement/performance patterns (K-Means, k=4)`}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {clusterData.clusters.map((cluster) => {
          const theme = clusterTheme(cluster.label)
          const passRate = cluster.outcome_distribution.Pass ?? 0
          return (
            <div
              key={cluster.cluster_id}
              className="relative overflow-hidden rounded-2xl border p-5"
              style={{
                background: theme.tint,
                borderColor: `${theme.accent}33`,
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: theme.accent }}>
                Cluster {cluster.cluster_id + 1}
              </p>
              <p className="mt-1.5 text-sm font-semibold leading-snug text-text-primary">{cluster.label}</p>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-text-primary">
                {cluster.percentage}
                <span className="ml-0.5 text-lg font-bold text-text-muted">%</span>
              </p>
              <p className="mt-1 text-xs text-text-muted">{cluster.student_count.toLocaleString()} students</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/70">
                <div className="h-full rounded-full" style={{ width: `${passRate}%`, backgroundColor: theme.bar }} />
              </div>
              <p className="mt-2 text-xs text-text-secondary">
                Pass {passRate.toFixed(0)}% · Withdrawn {(cluster.outcome_distribution.Withdrawn ?? 0).toFixed(0)}%
              </p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function reportsBriefing(role, department) {
  if (role === ROLES.DIRECTOR) {
    return {
      eyebrow: 'Director briefing',
      title: 'University Reports',
      blurb: 'Institution-wide student success, retention, and risk composition',
      studentLabel: 'University Students',
      studentSub: 'Enrolled institution-wide',
      riskTitle: 'Institution-Wide Risk Distribution',
      deptTitle: 'Risk Composition by Department',
      deptDescription: 'Share of enrollment at each risk level across departments',
    }
  }
  if (role === ROLES.ADMIN || role === ROLES.STAFF) {
    return {
      eyebrow: 'Academic briefing',
      title: 'Institutional Reports',
      blurb: 'Institution-wide student success, retention, and risk composition',
      studentLabel: 'University Students',
      studentSub: 'Enrolled institution-wide',
      riskTitle: 'Institution-Wide Risk Distribution',
      deptTitle: 'Risk Composition by Department',
      deptDescription: 'Share of enrollment at each risk level across departments',
    }
  }
  if (role === ROLES.DEPARTMENT_HEAD) {
    return {
      eyebrow: 'Department briefing',
      title: 'Department Reports',
      blurb: `${department ?? 'Department'} student success, retention, and risk composition`,
      studentLabel: 'Department Students',
      studentSub: department ? `In ${department}` : 'In your department',
      riskTitle: 'Department Risk Distribution',
      deptTitle: 'Department Risk Composition',
      deptDescription: department
        ? `Risk-level breakdown for ${department} (% of department enrollment)`
        : 'Risk-level breakdown for your department',
    }
  }
  return {
    eyebrow: 'Faculty briefing',
    title: 'Class Reports',
    blurb: 'Student success, retention, and risk composition for your courses',
    studentLabel: 'My Students',
    studentSub: 'Students in your courses',
    riskTitle: 'Risk Distribution in Your Courses',
    deptTitle: 'Risk Composition by Department',
    deptDescription: 'Share of enrollment at each risk level across departments',
  }
}

function DirectorReportsHero({
  term,
  retention,
  retentionDelta,
  atRiskShare,
  totalStudents,
  eyebrow = 'Director briefing',
  title = 'University Reports',
  blurb = 'Institution-wide student success, retention, and risk composition',
}) {
  const deltaLabel =
    retentionDelta == null
      ? 'vs prior term'
      : `${retentionDelta > 0 ? '+' : ''}${retentionDelta.toFixed(1)} pts vs prior term`

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 text-white shadow-[0_18px_40px_rgba(11,110,79,0.22)] sm:p-7"
      style={{
        background: 'linear-gradient(135deg, #0B6E4F 0%, #0F766E 52%, #155E75 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(165,243,252,0.5) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
            {eyebrow}
          </p>
          <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80">
            {blurb} for {term}.
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {term}
        </span>
      </div>

      <div className="relative z-10 mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">Retention</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">{retention}%</p>
          <p className="mt-0.5 text-xs text-white/70">{deltaLabel}</p>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">At-risk share</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">{atRiskShare}%</p>
          <p className="mt-0.5 text-xs text-white/70">Critical + high risk</p>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">Population</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">{totalStudents.toLocaleString()}</p>
          <p className="mt-0.5 text-xs text-white/70">Students in this briefing</p>
        </div>
      </div>
    </div>
  )
}

export default function InstitutionalReports({ user }) {
  const copy = reportsBriefing(user?.role, user?.department)
  const { data, loading, error } = useAsyncData(() => api.getReports(), [])

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
        <ErrorState error={error} />
      </PageLayout>
    )
  }

  const { stats, retentionRates, riskDistribution, departmentRisk, meta } = data
  const departmentData = departmentRisk.map((row) => ({
    ...row,
    shortName: shortenDepartment(row.department),
  }))
  const riskChartData = riskDistribution.map((entry) => ({
    ...entry,
    color: PIE_COLORS[entry.name] ?? BRAND,
  }))
  const totalRiskStudents = riskChartData.reduce((sum, row) => sum + row.value, 0)
  const atRiskCount = riskChartData
    .filter((row) => row.name === 'Critical' || row.name === 'High')
    .reduce((sum, row) => sum + row.value, 0)
  const atRiskShare = totalRiskStudents > 0 ? Math.round((atRiskCount / totalRiskStudents) * 100) : 0
  const previousRetention = retentionRates[retentionRates.length - 2]?.retentionRate
  const retentionDelta =
    previousRetention == null ? null : Number((stats.latestRetention - previousRetention).toFixed(1))

  return (
    <PageLayout>
      <DirectorReportsHero
        term={meta.term}
        retention={stats.latestRetention}
        retentionDelta={retentionDelta}
        atRiskShare={atRiskShare}
        totalStudents={stats.totalStudents}
        eyebrow={copy.eyebrow}
        title={copy.title}
        blurb={copy.blurb}
      />

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={copy.studentLabel}
          value={stats.totalStudents.toLocaleString()}
          subLabel={copy.studentSub}
          icon={Users}
          kpiTheme="students"
          vivid
          shape="circle"
        />
        <StatCard
          label="Retention Rate"
          value={`${stats.latestRetention}%`}
          subLabel={`Current term (${meta.term})`}
          icon={GraduationCap}
          kpiTheme="attendance"
          vivid
          shape="circle"
        />
        <StatCard
          label="Critical Risk"
          value={stats.criticalRiskCount}
          subLabel="Students needing intervention"
          note="Priority for academic support."
          icon={AlertTriangle}
          kpiTheme="risk"
          vivid
          shape="circle"
        />
        <StatCard
          label="Courses Tracked"
          value={stats.coursesTracked}
          subLabel="Unique courses monitored"
          icon={BookOpen}
          kpiTheme="departments"
          vivid
          shape="circle"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          icon={TrendingUp}
          title="Retention Rate by Term"
          description="Undergraduate cohort retention across six terms"
        >
          <div className="min-w-0 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={retentionRates} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="retentionFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BRAND} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={BRAND} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="term" tick={{ fontSize: 11, fill: TICK }} axisLine={{ stroke: GRID }} tickLine={false} />
                <YAxis
                  domain={[80, 95]}
                  ticks={[80, 85, 90, 95]}
                  tick={{ fontSize: 12, fill: TICK }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<RetentionTooltip />} cursor={{ stroke: GRID, strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="retentionRate"
                  name="Retention Rate"
                  stroke={BRAND}
                  strokeWidth={2.6}
                  fill="url(#retentionFill)"
                  dot={{ r: 4, fill: BRAND, strokeWidth: 0 }}
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: BRAND }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          icon={AlertTriangle}
          title={copy.riskTitle}
          description={`${totalRiskStudents.toLocaleString()} students by risk level`}
          iconClass="bg-risk-critical-bg text-risk-critical"
        >
          <div className="grid min-h-72 grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_11rem]">
            <div className="min-w-0 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={96}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {riskChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                    <Label
                      content={<DonutCenter value={totalRiskStudents.toLocaleString()} caption="students" />}
                      position="center"
                    />
                  </Pie>
                  <Tooltip content={<RiskPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-2.5">
              {[
                { label: 'Critical', color: CRITICAL },
                { label: 'High', color: AMBER },
                { label: 'Medium', color: GOLD },
                { label: 'Low', color: LOW },
              ].map((item) => {
                const entry = riskChartData.find((row) => row.name === item.label) ?? { value: 0 }
                const pct = totalRiskStudents > 0 ? Math.round((entry.value / totalRiskStudents) * 100) : 0
                return (
                  <li key={item.label} className="flex items-center justify-between gap-3 rounded-lg bg-background px-3 py-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
                      {item.label}
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-text-secondary">
                      {entry.value} · {pct}%
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </ChartCard>
      </div>

      <div className="mt-6">
        <ChartCard
          icon={BookOpen}
          title={copy.deptTitle}
          description={copy.deptDescription}
        >
          <div className="min-w-0 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentData}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                barCategoryGap={14}
              >
                <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} horizontal />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: CHART_COLORS.tick }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis
                  type="category"
                  dataKey="shortName"
                  width={72}
                  tick={{ fontSize: 12, fill: '#475467', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<DepartmentTooltip />} cursor={{ fill: 'rgb(100 116 139 / 0.06)' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" />
                <Bar dataKey="critical" name="Critical" stackId="risk" fill={RISK_CHART_COLORS.Critical} />
                <Bar dataKey="high" name="High" stackId="risk" fill={RISK_CHART_COLORS.High} />
                <Bar dataKey="medium" name="Medium" stackId="risk" fill={GOLD} />
                <Bar
                  dataKey="low"
                  name="Low"
                  stackId="risk"
                  fill={RISK_CHART_COLORS.Low}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ClusterAnalysisCard />
    </PageLayout>
  )
}
