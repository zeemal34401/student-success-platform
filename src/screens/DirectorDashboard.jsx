import { AlertTriangle, ArrowRight, Building2, CircleMinus, UserCheck, Users } from 'lucide-react'
import { Card, PageLayout, RiskBadge, SectionHeader, StatCard, ErrorState } from '../components/ui'
import { api } from '../api/client'
import { useAsyncData } from '../hooks/useAsyncData'

const BRAND = '#0B6E4F'
const CRITICAL = '#D92D20'

export default function DirectorDashboard({ user, onSelectStudent, onSelectDepartment }) {
  const { data, loading, error } = useAsyncData(() => api.getDirectorDashboard(), [])

  if (loading) {
    return (
      <PageLayout>
        <div className="animate-skeleton h-8 w-64 rounded-md bg-border/80" />
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

  const { stats, departmentComparison, topRiskStudents, meta } = data

  return (
    <PageLayout size="wide">
      <SectionHeader
        as="h2"
        title="Executive Dashboard"
        description={`University-wide academic performance for ${meta.term}. Department comparison and high-risk oversight.`}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="University Students"
          value={stats.enrolled}
          subLabel="All departments"
          icon={Users}
          iconTone="emerald"
          topBorderColor={BRAND}
        />
        <StatCard
          label="Avg Attendance"
          value={`${stats.avgAttendance}%`}
          subLabel="Institution average"
          icon={UserCheck}
          iconTone="emerald"
          topBorderColor={BRAND}
        />
        <StatCard
          label="High-Risk Students"
          value={stats.highRiskCount}
          subLabel="Critical or high risk"
          icon={AlertTriangle}
          iconTone="critical"
          topBorderColor={CRITICAL}
          tintBackgroundColor="#FEF6F6"
        />
        <StatCard
          label="Departments"
          value={stats.departmentCount}
          subLabel="Compared this term"
          icon={Building2}
          iconTone="emerald"
          topBorderColor={BRAND}
        />
      </div>

      <Card className="mt-6">
        <h2 className="card-title">Department Comparison</h2>
        <p className="mt-0.5 text-sm text-text-secondary">
          Click View to see which students are critical or high risk in that department
        </p>
        <div className="mt-4 -mx-1 overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-[#F9FAFB]">
                <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-text-secondary">Department</th>
                <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-text-secondary">Students</th>
                <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-text-secondary">At risk</th>
                <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-text-secondary">Critical</th>
                <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-text-secondary">Attendance</th>
                <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-text-secondary">Avg GPA</th>
                <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-text-secondary">Risk share</th>
                <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-text-secondary">
                  <span className="sr-only">View high-risk students</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {departmentComparison.map((row) => (
                <tr key={row.department} className="border-b border-border last:border-b-0 hover:bg-[#F9FAFB]">
                  <td className="px-3 py-3 font-medium text-text-primary">{row.department}</td>
                  <td className="px-3 py-3 text-text-secondary">{row.enrolled}</td>
                  <td className="px-3 py-3 text-text-secondary">{row.atRiskCount}</td>
                  <td className="px-3 py-3 font-medium text-risk-critical">{row.criticalCount}</td>
                  <td className="px-3 py-3 text-text-secondary">{row.avgAttendance}%</td>
                  <td className="px-3 py-3 text-text-secondary">{row.avgGpa}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-risk-critical"
                          style={{ width: `${Math.min(row.riskShare, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-muted">{row.riskShare}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectDepartment?.(row.department)}
                      className="btn-secondary inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs"
                      aria-label={`View high-risk students in ${row.department}`}
                    >
                      View
                      <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="card-title">High-Risk Students</h2>
        <p className="mt-0.5 text-sm text-text-secondary">
          Priority cases requiring institutional attention
        </p>
        {topRiskStudents.length === 0 ? (
          <div className="mt-6 flex flex-col items-center py-10 text-center">
            <CircleMinus size={20} className="text-text-muted" aria-hidden="true" />
            <p className="mt-3 text-sm text-text-secondary">No high-risk students in the current roster sample.</p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {topRiskStudents.map((student) => (
              <li key={student.id}>
                <button
                  type="button"
                  onClick={() => onSelectStudent?.(student.id)}
                  className="flex w-full items-center justify-between gap-3 px-1 py-3 text-left transition-colors hover:bg-[#F9FAFB]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text-primary">{student.name}</p>
                    <p className="truncate text-xs text-text-muted">
                      {student.department} · {student.course}
                    </p>
                  </div>
                  <RiskBadge level={student.riskLevel} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PageLayout>
  )
}
