import {
  AlertTriangle,
  BookOpen,
  GraduationCap,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, PageLayout, SectionHeader, StatCard, ErrorState } from '../components/ui'
import { ROLES } from '../constants/roles'
import { CHART_COLORS, RISK_CHART_COLORS } from '../constants/chartColors'
import { api } from '../api/client'
import { useAsyncData } from '../hooks/useAsyncData'

const RISK_COLORS = RISK_CHART_COLORS

const BRAND = '#0B6E4F'
const AMBER = '#F79009'
const CRITICAL = '#D92D20'
const GOLD = '#F0B100'
const LOW = '#0B6E4F'
const GRID = '#E4E7EC'
const TICK = '#98A2B3'

function shortenDepartment(name) {
  return name
    .replace('Computer Science', 'CS')
    .replace('Mathematics', 'Math')
    .replace('Psychology', 'Psych')
    .replace('Biology', 'Bio')
    .replace('English', 'Eng')
}

function RetentionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 shadow-card">
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      <p className="text-sm font-semibold text-primary-600">{payload[0].value}%</p>
    </div>
  )
}

function RiskPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 shadow-card">
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
    <div className="rounded-md border border-border bg-surface px-3 py-2 shadow-card">
      <p className="mb-1 text-xs font-medium text-text-secondary">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}%
        </p>
      ))}
    </div>
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

  if (error) {
    return (
      <Card className="mt-6">
        <h2 className="card-title">Behavioral Cluster Analysis</h2>
        <p className="mt-2 text-sm text-text-secondary">{error.message ?? 'Cluster analytics unavailable.'}</p>
      </Card>
    )
  }

  if (!data?.available || !data.data) {
    return (
      <Card className="mt-6">
        <h2 className="card-title">Behavioral Cluster Analysis</h2>
        <p className="mt-2 text-sm text-text-secondary">{data?.error ?? 'Cluster analytics service is offline.'}</p>
      </Card>
    )
  }

  const clusterData = data.data

  return (
    <Card className="mt-6">
      <h2 className="card-title">Behavioral Cluster Analysis</h2>
      <p className="mt-0.5 text-sm text-text-secondary">
        Reference benchmark: {clusterData.total_students.toLocaleString()} students from training population, segmented by engagement/performance patterns (K-Means, k=4)
      </p>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {clusterData.clusters.map((c) => (
          <div
            key={c.cluster_id}
            className="rounded-[12px] border border-border bg-surface p-6 shadow-card"
          >
            <p className="text-sm font-medium text-text-primary">{c.label}</p>
            <p className="mt-1 text-xl font-bold text-text-primary">{c.percentage}%</p>
            <p className="text-xs text-text-muted">{c.student_count.toLocaleString()} students</p>
            <p className="mt-2 text-xs text-text-secondary">
              Pass: {c.outcome_distribution.Pass?.toFixed(0)}% · Withdrawn: {c.outcome_distribution.Withdrawn?.toFixed(0)}%
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function InstitutionalReports({ user }) {
  const isDeptScope = user?.role === ROLES.DEPARTMENT_HEAD
  const department = user?.department
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
  const departmentData = departmentRisk.map((d) => ({
    ...d,
    shortName: shortenDepartment(d.department),
  }))
  const PIE_COLORS = {
    Critical: CRITICAL,
    High: AMBER,
    Medium: GOLD,
    Low: LOW,
  }

  const riskChartData = riskDistribution.map((entry) => ({
    ...entry,
    color: PIE_COLORS[entry.name] ?? BRAND,
  }))
  const totalRiskStudents = riskChartData.reduce((sum, d) => sum + d.value, 0)

  return (
    <PageLayout>
      <SectionHeader
        as="h2"
        title={isDeptScope ? 'Department Reports' : 'Institutional Reports'}
        description={
          isDeptScope
            ? `${department} metrics, retention benchmark, and risk distribution for your department only.`
            : 'Institution-wide student success metrics, retention trends, and risk distribution across departments.'
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={isDeptScope ? 'Department Students' : 'Total Students'}
          value={stats.totalStudents.toLocaleString()}
          subLabel={isDeptScope ? `In ${department}` : 'Enrolled institution-wide'}
          icon={Users}
          iconTone="emerald"
          topBorderColor={BRAND}
        />
        <StatCard
          label="Retention Rate"
          value={`${stats.latestRetention}%`}
          subLabel={`Current term (${meta.term})`}
          icon={GraduationCap}
          iconTone="emerald"
          topBorderColor={BRAND}
        />
        <StatCard
          label="Critical Risk"
          value={stats.criticalRiskCount}
          subLabel="Students at critical risk"
          icon={AlertTriangle}
          iconTone="amber"
          topBorderColor={CRITICAL}
          tintBackgroundColor="#FEF6F6"
        />
        <StatCard
          label="Courses Tracked"
          value={stats.coursesTracked}
          subLabel="Unique courses monitored"
          icon={BookOpen}
          iconTone="emerald"
          topBorderColor={BRAND}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="bg-[#F8FAFC]">
          <h2 className="card-title">Retention Rate by Term</h2>
          <p className="mt-0.5 text-sm text-text-secondary">
            {isDeptScope
              ? 'Institution retention benchmark (undergraduate cohort)'
              : 'Undergraduate cohort retention over 6 terms'}
          </p>
          <div className="mt-6 min-w-0 h-64 w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={retentionRates} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="term" tick={{ fontSize: 11, fill: TICK }} axisLine={{ stroke: GRID }} tickLine={false} />
                <YAxis
                  domain={[80, 95]}
                  ticks={[80, 85, 90, 95]}
                  tick={{ fontSize: 12, fill: TICK }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<RetentionTooltip />} cursor={{ stroke: GRID, strokeWidth: 1 }} />
                <Line
                  type="monotone"
                  dataKey="retentionRate"
                  name="Retention Rate"
                  stroke={BRAND}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: BRAND, strokeWidth: 0 }}
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: BRAND }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-[#F8FAFC]">
          <h2 className="card-title">
            {isDeptScope ? 'Department Risk Distribution' : 'Institution-Wide Risk Distribution'}
          </h2>
          <p className="mt-0.5 text-sm text-text-secondary">{totalRiskStudents.toLocaleString()} students by risk level</p>
          <div className="mt-4 min-w-0 h-64 w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" nameKey="name">
                  {riskChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<RiskPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2">
            {[
              { label: 'Critical', color: CRITICAL },
              { label: 'High', color: AMBER },
              { label: 'Medium', color: GOLD },
              { label: 'Low', color: LOW },
            ].map((item) => {
              const entry = riskChartData.find((d) => d.name === item.label) ?? { value: 0 }
              const pct = totalRiskStudents > 0 ? Math.round((entry.value / totalRiskStudents) * 100) : 0

              return (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
                  <span className="text-sm font-medium" style={{ color: '#101828' }}>
                    {item.label}
                  </span>
                  <span className="text-xs" style={{ color: '#475467' }}>
                    {pct}%
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="card-title">
          {isDeptScope ? 'Department Risk Composition' : 'Risk Composition by Department'}
        </h2>
        <p className="mt-0.5 text-sm text-text-secondary">
          {isDeptScope
            ? `Risk-level breakdown for ${department} (% of department enrollment)`
            : 'Stacked risk-level breakdown across 5 departments (% of department enrollment)'}
        </p>
        <div className="mt-6 min-w-0 h-80 w-full overflow-x-auto">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={departmentData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
              <XAxis dataKey="shortName" tick={{ fontSize: 12, fill: CHART_COLORS.tick }} axisLine={{ stroke: CHART_COLORS.grid }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: CHART_COLORS.tick }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<DepartmentTooltip />} cursor={{ fill: 'rgb(100 116 139 / 0.06)' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              <Bar dataKey="critical" name="Critical" stackId="risk" fill={RISK_COLORS.Critical} />
              <Bar dataKey="high" name="High" stackId="risk" fill={RISK_COLORS.High} />
              <Bar dataKey="medium" name="Medium" stackId="risk" fill={RISK_COLORS.Medium} />
              <Bar dataKey="low" name="Low" stackId="risk" fill={RISK_COLORS.Low} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <ClusterAnalysisCard />
    </PageLayout>
  )
}
