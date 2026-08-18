import { AlertTriangle, Building2, UserCheck, Users } from 'lucide-react'
import { PageLayout, SectionHeader, ErrorState, StatCard } from '../components/ui'
import { api } from '../api/client'
import { useAsyncData } from '../hooks/useAsyncData'

export default function DirectorDashboard() {
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

  const { stats, meta } = data

  return (
    <PageLayout>
      <SectionHeader
        as="h2"
        title="Executive Dashboard"
        description={`University-wide academic performance for ${meta.term}. Open Academic Insights to compare departments and drill into faculty, courses, and students.`}
        action={
          <span className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-text-secondary">
            {meta.term}
          </span>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="University Students"
          value={stats.enrolled}
          subLabel="All departments"
          icon={Users}
          kpiTheme="students"
        />
        <StatCard
          label="Avg Attendance"
          value={`${stats.avgAttendance}%`}
          subLabel="Institution average"
          icon={UserCheck}
          kpiTheme="attendance"
        />
        <StatCard
          label="High-Risk Students"
          value={stats.highRiskCount}
          subLabel="Critical or high risk"
          note="Critical intervention needed."
          icon={AlertTriangle}
          kpiTheme="risk"
        />
        <StatCard
          label="Departments"
          value={stats.departmentCount}
          subLabel="Compared this term"
          icon={Building2}
          kpiTheme="departments"
        />
      </div>
    </PageLayout>
  )
}
