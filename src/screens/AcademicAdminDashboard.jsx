import { AlertTriangle, BookOpen, Building2, GraduationCap, Users } from 'lucide-react'
import { Card, PageLayout, RiskBadge, SectionHeader, StatCard, ErrorState } from '../components/ui'
import { api } from '../api/client'
import { useAsyncData } from '../hooks/useAsyncData'

const BRAND = '#0B6E4F'
const CRITICAL = '#D92D20'

export default function AcademicAdminDashboard({ onSelectStudent }) {
  const { data, loading, error } = useAsyncData(() => api.getAcademicAdminDashboard(), [])

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

  const { stats, departmentComparison, facultyCourseStats, topRiskStudents, meta } = data

  return (
    <PageLayout size="wide">
      <SectionHeader
        as="h2"
        title="Academic Overview"
        description={`Cross-department academic performance and faculty/course statistics for ${meta.term}.`}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Students Tracked"
          value={stats.enrolled}
          subLabel="Across all departments"
          icon={Users}
          iconTone="emerald"
          topBorderColor={BRAND}
        />
        <StatCard
          label="Faculty"
          value={stats.facultyCount}
          subLabel="Active instructors"
          icon={GraduationCap}
          iconTone="emerald"
          topBorderColor={BRAND}
        />
        <StatCard
          label="Courses"
          value={stats.courseCount}
          subLabel="Assigned this term"
          icon={BookOpen}
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
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="card-title">Department Performance</h2>
          <p className="mt-0.5 text-sm text-text-secondary">Risk and attendance by department</p>
          <ul className="mt-4 divide-y divide-border">
            {departmentComparison.map((row) => (
              <li key={row.department} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium text-text-primary">
                    <Building2 size={14} className="shrink-0 text-text-muted" aria-hidden="true" />
                    {row.department}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {row.sampleEnrolled} students · {row.avgAttendance}% attendance · GPA {row.avgGpa}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-text-primary">{row.atRiskCount} at risk</p>
                  <p className="text-xs text-text-muted">{row.criticalCount} critical</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="card-title">Priority Risk Cases</h2>
          <p className="mt-0.5 text-sm text-text-secondary">Students needing academic follow-up</p>
          <ul className="mt-4 divide-y divide-border">
            {topRiskStudents.map((student) => (
              <li key={student.id}>
                <button
                  type="button"
                  onClick={() => onSelectStudent?.(student.id)}
                  className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-[#F9FAFB]"
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
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="card-title">Faculty & Course Statistics</h2>
        <p className="mt-0.5 text-sm text-text-secondary">
          Instructor load, assigned courses, and at-risk students in their sections
        </p>
        <div className="mt-4 -mx-1 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-[#F9FAFB]">
                <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-text-secondary">Faculty</th>
                <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-text-secondary">Department</th>
                <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-text-secondary">Courses</th>
                <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-text-secondary">Students</th>
                <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-text-secondary">At risk</th>
              </tr>
            </thead>
            <tbody>
              {facultyCourseStats.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-b-0 hover:bg-[#F9FAFB]">
                  <td className="px-3 py-3">
                    <p className="font-medium text-text-primary">{row.name}</p>
                    <p className="text-xs text-text-muted">{row.email}</p>
                  </td>
                  <td className="px-3 py-3 text-text-secondary">{row.department}</td>
                  <td className="px-3 py-3 text-text-secondary">
                    {row.courses.length ? row.courses.join(', ') : '—'}
                  </td>
                  <td className="px-3 py-3 text-text-secondary">{row.studentCount}</td>
                  <td className="px-3 py-3 font-medium text-text-primary">{row.atRiskCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageLayout>
  )
}
