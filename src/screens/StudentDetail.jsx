import {
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Lightbulb,
  Monitor,
  UserX,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getRiskLevelConfig } from '../constants/riskLevels'
import { CHART_COLORS, getRiskChartColor, RISK_CHART_COLORS } from '../constants/chartColors'
import { Card, PageLayout, RiskBadge, ErrorState } from '../components/ui'
import { api } from '../api/client'
import { useAsyncData } from '../hooks/useAsyncData'

const FACTOR_CONFIG = [
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck, format: (v) => `${v}%`, barValue: (v) => v, barMax: 100, invert: false },
  { key: 'lmsActivity', label: 'LMS Activity', icon: Monitor, format: (v) => `${v}%`, barValue: (v) => v, barMax: 100, invert: false },
  { key: 'lateAssignments', label: 'Late Assignments', icon: ClipboardList, format: (v) => `${v} late`, barValue: (v) => v, barMax: 10, invert: true },
  { key: 'gpa', label: 'GPA', icon: BookOpen, format: (v) => v.toFixed(2), barValue: (v) => (v / 4) * 100, barMax: 100, invert: false },
]

function getBarStatus(percent, invert) {
  const effective = invert ? 100 - percent : percent
  if (effective >= 75) return 'On track'
  if (effective >= 50) return 'Moderate concern'
  if (effective >= 30) return 'High concern'
  return 'Critical concern'
}

function getBarColor(percent, invert) {
  const effective = invert ? 100 - percent : percent
  if (effective >= 75) return 'bg-risk-low'
  if (effective >= 50) return 'bg-risk-medium'
  if (effective >= 30) return 'bg-risk-high'
  return 'bg-risk-critical'
}

function CircularRiskScore({ score, level }) {
  const config = getRiskLevelConfig(level)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const ringColors = RISK_CHART_COLORS

  return (
    <div className="flex flex-col items-center" role="group" aria-label={`Risk score ${score} out of 100, ${level} risk`}>
      <div className="relative h-36 w-36">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r={radius} fill="none" stroke={CHART_COLORS.grid} strokeWidth="10" />
          <circle cx="60" cy="60" r={radius} fill="none" stroke={ringColors[level] ?? ringColors.Low} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-500" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums text-text-primary">{score}</span>
          <span className="text-xs text-text-muted">/ 100</span>
        </div>
      </div>
      <div className="mt-3"><RiskBadge level={level} /></div>
      <p className={`mt-2 text-xs font-medium ${config.textClass}`}>Risk Score · {level}</p>
    </div>
  )
}

function FactorBar({ factor, student }) {
  const rawValue = student[factor.key]
  const fillPercent = Math.round((factor.barValue(rawValue) / factor.barMax) * 100)
  const barColor = getBarColor(fillPercent, factor.invert)
  const status = getBarStatus(fillPercent, factor.invert)
  const Icon = factor.icon

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-text-muted" aria-hidden="true" />
          <span className="text-sm font-medium text-text-primary">{factor.label}</span>
        </div>
        <span className="text-sm font-semibold tabular-nums text-text-primary">{factor.format(rawValue)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-background">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(fillPercent, 100)}%` }} role="progressbar" aria-valuenow={fillPercent} aria-valuemin={0} aria-valuemax={100} aria-label={factor.label} aria-valuetext={`${factor.format(rawValue)}, ${status}`} />
      </div>
      <p className="mt-1 text-xs text-text-muted">{status}</p>
    </div>
  )
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 shadow-card">
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      <p className="text-sm font-semibold text-primary-600">Risk Score: {payload[0].value}</p>
    </div>
  )
}

function MlPredictionsCard({ mlRisk, mlLoading, mlError, onRetry }) {
  if (mlLoading) {
    return (
      <Card className="mt-6">
        <p className="text-sm text-text-muted">Loading ML predictions...</p>
      </Card>
    )
  }

  if (mlError) {
    return (
      <Card className="mt-6">
        <h2 className="card-title">ML Model Predictions</h2>
        <p className="mt-2 text-sm text-text-secondary">{mlError.message ?? 'Unable to load ML predictions.'}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="btn-secondary mt-3">
            Retry predictions
          </button>
        )}
      </Card>
    )
  }

  if (!mlRisk) return null

  const models = [
    { key: 'academic', title: 'Academic Performance', probKey: 'success_probability', probLabel: 'Success probability' },
    { key: 'dropout', title: 'Dropout Risk', probKey: 'dropout_probability', probLabel: 'Dropout probability' },
    { key: 'engagement', title: 'Engagement-Based Risk', probKey: 'success_probability', probLabel: 'Success probability' },
  ]

  return (
    <Card className="mt-6">
      <h2 className="card-title">ML Model Predictions</h2>
      <p className="mt-0.5 text-sm text-text-secondary">
        {mlRisk.disclaimer ?? 'Live predictions from trained ML models'}
      </p>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {models.map(({ key, title, probKey, probLabel }) => {
          const block = mlRisk[key]
          if (!block?.available) {
            return (
              <div key={key} className="rounded-md border border-border bg-background px-4 py-3">
                <p className="text-sm font-medium text-text-primary">{title}</p>
                <p className="mt-1 text-sm text-text-muted">Unavailable</p>
                <p className="mt-1 text-xs text-text-muted">{block?.error ?? 'Service offline'}</p>
              </div>
            )
          }
          const data = block.data
          const prob = data[probKey] ?? 0
          return (
            <div key={key} className="rounded-md border border-border bg-background px-4 py-3">
              <p className="text-sm font-medium text-text-primary">{title}</p>
              <p className={`mt-1 text-sm font-semibold ${data.risk_label === 'At-Risk' ? 'text-risk-critical' : 'text-risk-low'}`}>
                {data.risk_label}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {probLabel}: {(prob * 100).toFixed(1)}%
              </p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export default function StudentDetail({ studentId, onBack }) {
  const { data: student, loading, error } = useAsyncData(
    () => (studentId ? api.getStudent(studentId) : Promise.resolve(null)),
    [studentId],
  )

  const { data: mlRisk, loading: mlLoading, error: mlError, refetch: refetchMl } = useAsyncData(
    () => (studentId ? api.getMlRisk(studentId) : Promise.resolve(null)),
    [studentId],
  )

  if (loading) {
    return (
      <PageLayout size="wide">
        <div className="animate-skeleton h-8 w-32 rounded-md bg-border/80" />
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout size="wide">
        <button type="button" onClick={onBack} className="btn-ghost -ml-2"><ArrowLeft size={16} aria-hidden="true" /> Back</button>
        <div className="mt-4"><ErrorState error={error} /></div>
      </PageLayout>
    )
  }

  if (!student) {
    return (
      <PageLayout size="wide">
        <button type="button" onClick={onBack} className="btn-ghost -ml-2"><ArrowLeft size={16} aria-hidden="true" /> Back</button>
        <Card className="mt-6 text-center">
          <div className="flex flex-col items-center py-12">
            <UserX size={40} className="text-text-muted" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold text-text-primary">Student not found</h2>
            <p className="mt-1 text-sm text-text-secondary">No student matches ID &ldquo;{studentId}&rdquo;.</p>
          </div>
        </Card>
      </PageLayout>
    )
  }

  const ringColor = getRiskChartColor(student.riskLevel)
  const riskTrend = student.riskTrend ?? []
  const interventions = student.interventions ?? []

  return (
    <PageLayout size="wide">
      <button type="button" onClick={onBack} className="btn-ghost -ml-2"><ArrowLeft size={16} aria-hidden="true" /> Back</button>

      <div className="mt-2">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">{student.name}</h2>
        <p className="mt-1 text-sm text-text-secondary">{student.id} · {student.course}</p>
        <p className="text-sm text-text-muted">{student.department}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center lg:col-span-1">
          <CircularRiskScore score={student.riskScore} level={student.riskLevel} />
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="card-title">Contributing Factors</h2>
          <p className="mt-0.5 text-sm text-text-secondary">Key metrics influencing this student&apos;s risk assessment</p>
          <div className="mt-5 space-y-4">
            {FACTOR_CONFIG.map((factor) => (
              <FactorBar key={factor.key} factor={factor} student={student} />
            ))}
          </div>
        </Card>
      </div>

      <MlPredictionsCard mlRisk={mlRisk} mlLoading={mlLoading} mlError={mlError} onRetry={refetchMl} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="card-title">Risk Score Trend</h2>
          <p className="mt-0.5 text-sm text-text-secondary">Weekly risk score progression this term</p>
          <div className="mt-6 min-w-0 h-56 w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={riskTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis dataKey="weekLabel" tick={{ fontSize: 12, fill: CHART_COLORS.tick }} axisLine={{ stroke: CHART_COLORS.grid }} tickLine={false} />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fontSize: 12, fill: CHART_COLORS.tick }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<TrendTooltip />} cursor={{ stroke: CHART_COLORS.grid, strokeWidth: 1 }} />
                <Line type="monotone" dataKey="riskScore" name="Risk Score" stroke={ringColor} strokeWidth={2.5} dot={{ r: 3, fill: ringColor, strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: ringColor }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Lightbulb size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 className="card-title">Recommended Interventions</h2>
              <p className="mt-0.5 text-sm text-text-secondary">Actions based on {student.riskLevel} risk level</p>
            </div>
          </div>
          <ul className="mt-5 space-y-3">
            {interventions.length === 0 ? (
              <li className="text-sm text-text-muted">No interventions recommended for this risk level.</li>
            ) : (
              interventions.map((action, index) => (
                <li key={action} className="flex gap-3 rounded-md border border-border bg-background px-3 py-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-600">{index + 1}</span>
                  <span className="text-sm text-text-primary">{action}</span>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </PageLayout>
  )
}