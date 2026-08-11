import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronRight, CircleMinus, UserX, Users } from 'lucide-react'
import { Card, PageLayout, RiskBadge, SectionHeader, StatCard, ErrorState } from '../components/ui'
import { api } from '../api/client'
import { useAsyncData } from '../hooks/useAsyncData'

function FacultyCard({ member, expanded, onToggle, onSelectFaculty }) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full flex-col gap-3 rounded-lg px-1 py-4 text-left transition-colors hover:bg-[#F9FAFB] focus-visible:bg-[#F9FAFB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-600 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {expanded ? (
            <ChevronDown size={16} className="mt-1 shrink-0 text-text-muted" aria-hidden="true" />
          ) : (
            <ChevronRight size={16} className="mt-1 shrink-0 text-text-muted" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <p className="font-medium text-text-primary">{member.name}</p>
            <p className="text-sm text-text-secondary">{member.email}</p>
            <p className="mt-0.5 text-xs text-text-muted">
              {member.courses.length} course{member.courses.length !== 1 ? 's' : ''} ·{' '}
              {member.studentCount} student{member.studentCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 pl-7 sm:pl-0">
          {member.avgRiskScore != null ? (
            <RiskBadge level={member.avgClassRiskLevel} score={member.avgRiskScore} />
          ) : (
            <RiskBadge level="Low" />
          )}
          <span className="text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">{member.atRiskCount}</span> at-risk
          </span>
        </div>
      </button>

      {expanded && (
        <div className="mb-4 ml-7 rounded-md border border-border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Courses taught</p>
          <ul className="mt-2 space-y-1">
            {member.courses.map((course) => (
              <li key={course} className="text-sm text-text-primary">{course}</li>
            ))}
          </ul>

          {member.sectionStudents.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Students in sections</p>
              <ul className="mt-2 space-y-2">
                {member.sectionStudents.map((student) => (
                  <li key={student.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-text-primary">{student.name}</span>
                    <RiskBadge level={student.riskLevel} score={student.riskScore} />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-text-secondary">
              <CircleMinus size={14} className="text-text-muted" aria-hidden="true" />
              No enrolled students this term.
            </p>
          )}

          {member.studentCount > 0 && (
            <button type="button" onClick={() => onSelectFaculty?.(member.id)} className="btn-secondary mt-4">
              View students in Risk Alerts
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function FacultyOverview({ user, onSelectFaculty }) {
  const [expandedId, setExpandedId] = useState(null)
  const department = user?.department ?? 'Department'
  const { data, loading, error } = useAsyncData(() => api.getFacultyOverview(), [])

  if (loading) {
    return (
      <PageLayout>
        <div className="animate-skeleton h-8 w-56 rounded-md bg-border/80" />
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout>
        <ErrorState error={error} />
      </PageLayout>
    )
  }

  if (!data?.faculty?.length) {
    return (
      <PageLayout>
        <SectionHeader as="h2" title="Faculty Overview" description={`Class performance across faculty in ${department}.`} />
        <Card className="mt-6 text-center">
          <div className="flex flex-col items-center py-12">
            <UserX size={40} className="text-text-muted" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold text-text-primary">No faculty found</h3>
            <p className="mt-1 text-sm text-text-secondary">There are no faculty records for {department}.</p>
          </div>
        </Card>
      </PageLayout>
    )
  }

  const { faculty, summary } = data

  return (
    <PageLayout>
      <SectionHeader
        as="h2"
        title="Faculty Overview"
        description={`Class performance across faculty in ${department}. Sorted by at-risk student count.`}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Faculty in Department"
          value={summary.totalFaculty}
          subLabel={department}
          icon={Users}
          iconTone="emerald"
          topBorderColor="#0B6E4F"
          neutralTrendLabel="No change"
        />
        <StatCard
          label="Avg Class Risk"
          value={summary.avgDepartmentRisk || '—'}
          subLabel={summary.avgDepartmentRisk ? `${summary.avgDepartmentRiskLevel} department average` : 'No active sections'}
          icon={AlertTriangle}
          iconTone="amber"
          topBorderColor="#F79009"
          tintBackgroundColor="#FFFAEB"
        />
        <StatCard
          label="Faculty w/ Critical"
          value={summary.facultyWithCritical}
          subLabel="At least one Critical student"
          icon={AlertTriangle}
          iconTone="critical"
          topBorderColor="#D92D20"
          tintBackgroundColor="#FEF6F6"
        />
      </div>

      <Card className="mt-6 hidden md:block">
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <caption className="sr-only">Faculty class performance sorted by at-risk student count</caption>
            <thead>
              <tr className="border-b border-border bg-[#F9FAFB]">
                <th className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-text-secondary">Faculty</th>
                <th className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-text-secondary">Courses</th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-text-secondary">Students</th>
                <th className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-text-secondary">Avg class risk</th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-text-secondary">At-risk</th>
                <th className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-text-secondary"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {faculty.map((member) => {
                const isExpanded = expandedId === member.id
                return (
                  <tr key={member.id} className="cursor-pointer border-b border-border transition-colors hover:bg-[#F9FAFB] last:border-b-0">
                    <td className="px-3 py-3 align-top">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : member.id)}
                        aria-expanded={isExpanded}
                        className="text-left font-medium text-text-primary hover:text-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                      >
                        {member.name}
                      </button>
                      <p className="text-xs text-text-muted">{member.email}</p>
                      {isExpanded && (
                        <div className="mt-3 rounded-md border border-border bg-background p-3">
                          <ul className="space-y-1 text-xs text-text-secondary">
                            {member.sectionStudents.map((s) => (
                              <li key={s.id} className="flex justify-between gap-2">
                                <span>{s.name}</span>
                                <RiskBadge level={s.riskLevel} />
                              </li>
                            ))}
                            {member.sectionStudents.length === 0 && (
                              <li className="inline-flex items-center gap-1.5 text-text-secondary">
                                <CircleMinus size={14} className="text-text-muted" aria-hidden="true" />
                                No enrolled students
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top text-text-secondary">
                      <ul className="space-y-0.5">{member.courses.map((c) => <li key={c}>{c}</li>)}</ul>
                    </td>
                    <td className="px-3 py-3 text-right align-top tabular-nums text-text-primary">{member.studentCount}</td>
                    <td className="px-3 py-3 align-top">
                      {member.avgRiskScore != null ? (
                        <RiskBadge level={member.avgClassRiskLevel} score={member.avgRiskScore} />
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
                          <CircleMinus size={14} className="text-text-muted" aria-hidden="true" />
                          No data
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right align-top tabular-nums font-semibold text-text-primary">{member.atRiskCount}</td>
                    <td className="px-3 py-3 align-top">
                      {member.studentCount > 0 && (
                        <button type="button" onClick={() => onSelectFaculty?.(member.id)} className="btn-ghost text-primary-600">
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6 md:hidden">
        {faculty.map((member) => (
          <FacultyCard
            key={member.id}
            member={member}
            expanded={expandedId === member.id}
            onToggle={() => setExpandedId(expandedId === member.id ? null : member.id)}
            onSelectFaculty={onSelectFaculty}
          />
        ))}
      </Card>
    </PageLayout>
  )
}
