import { AlertTriangle, BookOpen, CircleMinus, UserCheck, Users } from 'lucide-react'
import { Card, PageLayout, RiskBadge, SectionHeader, StatCard, ErrorState } from '../components/ui'
import { api } from '../api/client'
import { useAsyncData } from '../hooks/useAsyncData'

const BRAND = '#0B6E4F'
const CRITICAL = '#D92D20'

export default function DepartmentDashboard({ user }) {
  const { data, loading, error } = useAsyncData(() => api.getDepartmentDashboard(), [])

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

  const { stats, facultySummary, topRiskStudents, meta } = data
  const department = meta.department ?? user?.department ?? 'Department'
  const term = meta.term

  return (
    <PageLayout>
      <SectionHeader
        as="h2"
        title="Department Dashboard"
        description={`${department} overview for ${term} — scoped to your department only.`}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Department Students"
          value={stats.enrolled}
          subLabel={`Enrolled in ${department}`}
          icon={Users}
          iconTone="emerald"
          topBorderColor={BRAND}
        />
        <StatCard
          label="Avg Attendance"
          value={`${stats.avgAttendance}%`}
          subLabel="Department average"
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
          topBorderColor={CRITICAL}
          tintBackgroundColor="#FEF6F6"
        />
        <StatCard
          label="Avg GPA"
          value={stats.avgGpa}
          subLabel="Department average"
          icon={BookOpen}
          iconTone="emerald"
          topBorderColor={BRAND}
          neutralTrendLabel="No change"
        />
      </div>

      <Card className="mt-6">
        <h2 className="card-title">Faculty Risk Overview</h2>
        <p className="mt-0.5 text-sm text-text-secondary">
          Average class risk level per faculty member in {department}
        </p>

        <ul className="mt-4 divide-y divide-border">
          {facultySummary.map((member) => (
            <li key={member.id} className="flex flex-col gap-3 rounded-lg px-2 py-4 transition-colors hover:bg-[#F9FAFB] first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-text-primary">{member.name}</p>
                <p className="text-sm text-text-secondary">{member.email}</p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {member.courses.length} course{member.courses.length !== 1 ? 's' : ''}
                  {member.studentCount > 0
                    ? ` · ${member.studentCount} monitored student${member.studentCount !== 1 ? 's' : ''}`
                    : ' · No monitored students this term'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {member.avgRiskScore != null ? (
                  <>
                    <span className="text-sm font-semibold tabular-nums text-text-primary">
                      Avg risk {member.avgRiskScore}
                    </span>
                    <RiskBadge level={member.riskLevel} score={member.avgRiskScore} />
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
                    <CircleMinus size={14} className="text-text-muted" aria-hidden="true" />
                    No risk data
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {topRiskStudents.length > 0 && (
        <Card className="mt-6">
          <h2 className="card-title">Highest-Risk Students</h2>
          <p className="mt-0.5 text-sm text-text-secondary">Top at-risk students in {department}</p>
          <ul className="mt-4 divide-y divide-border">
            {topRiskStudents.map((student) => (
              <li key={student.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">{student.name}</p>
                  <p className="text-xs text-text-muted">{student.course}</p>
                </div>
                <RiskBadge level={student.riskLevel} score={student.riskScore} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </PageLayout>
  )
}
