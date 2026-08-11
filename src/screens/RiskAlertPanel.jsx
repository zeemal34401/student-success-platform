import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  BookOpen,
  Building2,
  Search,
  SearchX,
  X,
} from 'lucide-react'
import { Card, PageLayout, RiskBadge, RiskScoreIndicator, SectionHeader, ErrorState } from '../components/ui'
import { api } from '../api/client'
import { ROLES } from '../constants/roles'
import { useAsyncData } from '../hooks/useAsyncData'

const RISK_FILTERS = ['All', 'Critical', 'High', 'Medium', 'Low']
const HIGH_RISK_LEVELS = new Set(['Critical', 'High'])

const COLUMNS = [
  { key: 'name', label: 'Student', sortable: true },
  { key: 'course', label: 'Course / Subject', sortable: true },
  { key: 'department', label: 'Department', sortable: true },
  { key: 'instructorName', label: 'Instructor', sortable: true },
  { key: 'attendance', label: 'Attendance', sortable: true, align: 'right' },
  { key: 'gpa', label: 'GPA', sortable: true, align: 'right' },
  { key: 'lmsActivity', label: 'LMS Activity', sortable: true, align: 'right' },
  { key: 'lateAssignments', label: 'Late', sortable: true, align: 'right' },
  { key: 'riskScore', label: 'Risk Score', sortable: true, align: 'right' },
  { key: 'riskLevel', label: 'Risk Level', sortable: true },
]

function SortIcon({ column, sortField, sortDirection }) {
  if (column !== sortField) {
    return <ArrowUpDown size={14} className="text-text-muted" aria-hidden="true" />
  }
  return sortDirection === 'asc' ? (
    <ArrowUp size={14} className="text-primary-600" aria-hidden="true" />
  ) : (
    <ArrowDown size={14} className="text-primary-600" aria-hidden="true" />
  )
}

function groupByDepartment(students) {
  const map = new Map()
  for (const student of students) {
    const dept = student.department || 'Unassigned'
    if (!map.has(dept)) map.set(dept, [])
    map.get(dept).push(student)
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([department, members]) => {
      const byCourse = new Map()
      for (const student of members) {
        const course = student.course || 'Unassigned course'
        if (!byCourse.has(course)) byCourse.set(course, [])
        byCourse.get(course).push(student)
      }

      const courses = [...byCourse.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([course, courseStudents]) => ({
          course,
          students: [...courseStudents].sort((a, b) => b.riskScore - a.riskScore),
        }))

      return {
        department,
        students: members,
        courses,
        criticalCount: members.filter((s) => s.riskLevel === 'Critical').length,
        highCount: members.filter((s) => s.riskLevel === 'High').length,
      }
    })
}

export default function RiskAlertPanel({
  user,
  facultyId,
  departmentFilter,
  onClearFacultyFilter,
  onClearDepartmentFilter,
  onSelectStudent,
}) {
  const isDirectorView = user?.role === ROLES.DIRECTOR || user?.role === ROLES.ADMIN || user?.role === ROLES.STAFF
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState(() => (isDirectorView ? 'Critical' : 'All'))
  const [sortField, setSortField] = useState('riskScore')
  const [sortDirection, setSortDirection] = useState('desc')
  const [facultyFilter, setFacultyFilter] = useState(null)

  // When opening from Executive Dashboard, show Critical + High together
  const [includeHighWithCritical, setIncludeHighWithCritical] = useState(Boolean(departmentFilter) && isDirectorView)

  const queryKey = `${facultyId ?? ''}-${departmentFilter ?? ''}-${search}-${riskFilter}-${sortField}-${sortDirection}-${includeHighWithCritical}`

  const { data: students, loading, error, refetch } = useAsyncData(
    () =>
      api.getStudents({
        facultyId: facultyId ?? undefined,
        department: departmentFilter ?? undefined,
        search: search || undefined,
        // Fetch broader set when combining Critical+High client-side
        riskLevel:
          includeHighWithCritical && (riskFilter === 'Critical' || riskFilter === 'High')
            ? undefined
            : riskFilter !== 'All'
              ? riskFilter
              : undefined,
        sortField,
        sortDirection,
      }),
    [queryKey],
  )

  useEffect(() => {
    if (!facultyId) {
      setFacultyFilter(null)
      return
    }
    api.getFacultyMember(facultyId).then(setFacultyFilter).catch(() => setFacultyFilter(null))
  }, [facultyId])

  useEffect(() => {
    setSearch('')
    if (departmentFilter && isDirectorView) {
      setRiskFilter('Critical')
      setIncludeHighWithCritical(true)
    }
  }, [facultyId, departmentFilter, isDirectorView])

  const scopedStudents = students ?? []

  const filteredStudents = useMemo(() => {
    let list = scopedStudents

    if (includeHighWithCritical && (riskFilter === 'Critical' || riskFilter === 'High')) {
      list = list.filter((s) => HIGH_RISK_LEVELS.has(s.riskLevel))
      if (riskFilter === 'Critical') {
        // Keep both Critical and High when drilled from department
        // but if user explicitly picked Critical only after clearing combo, respect that via includeHighWithCritical
      }
    }

    if (includeHighWithCritical) {
      list = list.filter((s) => HIGH_RISK_LEVELS.has(s.riskLevel))
    }

    return list
  }, [scopedStudents, includeHighWithCritical, riskFilter])

  const departmentGroups = useMemo(
    () => (isDirectorView ? groupByDepartment(filteredStudents) : []),
    [filteredStudents, isDirectorView],
  )

  const scopeLabel = facultyFilter
    ? `${facultyFilter.name}'s sections`
    : departmentFilter
      ? `${departmentFilter} department`
      : user?.role === ROLES.FACULTY
        ? 'your sections'
        : user?.role === ROLES.DEPARTMENT_HEAD
          ? `${user.department} department`
          : 'the institution'

  function handleSort(key) {
    if (sortField === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortField(key)
    setSortDirection(key === 'name' || key === 'course' || key === 'department' ? 'asc' : 'desc')
  }

  function handleClearFilters() {
    setSearch('')
    setRiskFilter(isDirectorView ? 'Critical' : 'All')
    setIncludeHighWithCritical(isDirectorView)
    onClearFacultyFilter?.()
    onClearDepartmentFilter?.()
  }

  function handleRiskFilter(level) {
    setRiskFilter(level)
    setIncludeHighWithCritical(false)
  }

  const hasActiveFilters =
    search.trim() !== '' ||
    (riskFilter !== 'All' && !(isDirectorView && includeHighWithCritical)) ||
    Boolean(facultyFilter) ||
    Boolean(departmentFilter)

  const pageTitle = user?.role === ROLES.DIRECTOR ? 'High-Risk Students' : 'Risk Alert Panel'
  const pageDescription = isDirectorView
    ? `Students arranged by department and course in ${scopeLabel}.`
    : `Search and filter students in ${scopeLabel}. Click a row to view details.`

  if (error) {
    return (
      <PageLayout>
        <ErrorState error={error} onRetry={refetch} />
      </PageLayout>
    )
  }

  return (
    <PageLayout size={isDirectorView ? 'wide' : undefined}>
      <SectionHeader as="h2" title={pageTitle} description={pageDescription} />

      {facultyFilter && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary-200 bg-primary-50 px-4 py-3">
          <p className="text-sm text-text-primary">
            Showing students in <span className="font-medium">{facultyFilter.name}</span>&apos;s sections
          </p>
          <button type="button" onClick={onClearFacultyFilter} className="btn-ghost inline-flex items-center gap-1 text-primary-700">
            <X size={14} aria-hidden="true" />
            Clear faculty filter
          </button>
        </div>
      )}

      {departmentFilter && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary-200 bg-primary-50 px-4 py-3">
          <p className="text-sm text-text-primary">
            Showing high-risk students in <span className="font-medium">{departmentFilter}</span>
            {includeHighWithCritical ? ' (Critical & High)' : ''}
          </p>
          <button
            type="button"
            onClick={onClearDepartmentFilter}
            className="btn-ghost inline-flex items-center gap-1 text-primary-700"
          >
            <X size={14} aria-hidden="true" />
            Clear department filter
          </button>
        </div>
      )}

      <Card className="mt-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md min-w-0 flex-1">
            <label htmlFor="risk-search" className="sr-only">Search students by name or course</label>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            <input
              id="risk-search"
              type="search"
              placeholder="Search by name or course…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field py-2 pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {isDirectorView && (
              <button
                type="button"
                onClick={() => {
                  setIncludeHighWithCritical(true)
                  setRiskFilter('Critical')
                }}
                aria-pressed={includeHighWithCritical}
                className={['filter-pill', includeHighWithCritical ? 'filter-pill-active' : 'filter-pill-inactive'].join(' ')}
              >
                Critical + High
              </button>
            )}
            {RISK_FILTERS.map((level) => {
              const selected = !includeHighWithCritical && riskFilter === level
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleRiskFilter(level)}
                  aria-pressed={selected}
                  className={['filter-pill', selected ? 'filter-pill-active' : 'filter-pill-inactive'].join(' ')}
                >
                  {level}
                </button>
              )
            })}
          </div>
        </div>

        {loading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-skeleton h-12 w-full rounded-md bg-border/80" />
            ))}
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <SearchX size={22} aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-text-primary">No students found</h3>
            <p className="mt-1 max-w-sm text-sm text-text-secondary">
              {hasActiveFilters
                ? 'No students match your current search or filter. Try adjusting your criteria.'
                : 'There are no students to display.'}
            </p>
            {hasActiveFilters && (
              <button type="button" onClick={handleClearFilters} className="btn-primary mt-4">
                Clear filters
              </button>
            )}
          </div>
        ) : isDirectorView ? (
          <div className="mt-6 space-y-5">
            {departmentGroups.map((group) => (
              <section
                key={group.department}
                className="overflow-hidden rounded-xl border border-border bg-background"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-[#F9FAFB] px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Building2 size={16} className="shrink-0 text-primary-600" aria-hidden="true" />
                    <h3 className="truncate text-sm font-semibold text-text-primary">{group.department}</h3>
                  </div>
                  <p className="text-xs text-text-muted">
                    {group.students.length} student{group.students.length !== 1 ? 's' : ''}
                    {group.criticalCount > 0 ? ` · ${group.criticalCount} critical` : ''}
                    {group.highCount > 0 ? ` · ${group.highCount} high` : ''}
                  </p>
                </div>

                <div className="divide-y divide-border">
                  {group.courses.map((courseGroup) => (
                    <div key={`${group.department}-${courseGroup.course}`} className="px-4 py-3">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        <BookOpen size={14} className="text-text-muted" aria-hidden="true" />
                        <span>{courseGroup.course}</span>
                        <span className="font-normal normal-case text-text-muted">
                          · {courseGroup.students.length} student{courseGroup.students.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <ul className="space-y-2">
                        {courseGroup.students.map((student) => (
                          <li key={student.id}>
                            <button
                              type="button"
                              onClick={() => onSelectStudent?.(student.id)}
                              className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:border-primary-200 hover:bg-primary-50/40"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-text-primary">{student.name}</p>
                                <p className="mt-0.5 truncate text-xs text-text-muted">
                                  {student.id}
                                  {student.instructorName ? ` · Instructor: ${student.instructorName}` : ''}
                                  {' · '}
                                  Attendance {student.attendance}% · GPA {student.gpa.toFixed(1)}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <RiskScoreIndicator score={student.riskScore} level={student.riskLevel} />
                                <RiskBadge level={student.riskLevel} />
                                <ArrowRight size={14} className="text-text-muted" aria-hidden="true" />
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <p className="text-xs text-text-muted">
              Showing {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} across{' '}
              {departmentGroups.length} department{departmentGroups.length !== 1 ? 's' : ''}
            </p>
          </div>
        ) : (
          <div className="mt-6 -mx-5 min-w-0 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[960px] border-collapse text-left text-sm" aria-label="Student risk levels">
              <caption className="sr-only">Students sorted by risk score with attendance, GPA, and risk level</caption>
              <thead>
                <tr className="border-b border-border bg-[#F9FAFB]">
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      className={[
                        'whitespace-nowrap px-3 py-3 text-xs font-medium uppercase tracking-wide text-text-secondary',
                        col.align === 'right' ? 'text-right' : 'text-left',
                      ].join(' ')}
                    >
                      {col.sortable ? (
                        <button
                          type="button"
                          onClick={() => handleSort(col.key)}
                          className={[
                            'inline-flex items-center gap-1 transition-all duration-150 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 rounded-sm',
                            col.align === 'right' ? 'ml-auto' : '',
                          ].join(' ')}
                        >
                          {col.label}
                          <SortIcon column={col.key} sortField={sortField} sortDirection={sortDirection} />
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
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
                    aria-label={`View details for ${student.name}, ${student.riskLevel} risk`}
                    className={[
                      'cursor-pointer border-b border-border transition-all duration-150 last:border-b-0',
                      'hover:bg-[#F9FAFB] focus-visible:bg-[#F9FAFB]',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-600',
                      index % 2 === 1 ? 'bg-background/70' : 'bg-surface',
                    ].join(' ')}
                  >
                    <td className="px-3 py-3">
                      <p className="font-medium text-text-primary">{student.name}</p>
                      <p className="text-xs text-text-muted">{student.id}</p>
                    </td>
                    <td className="px-3 py-3 text-text-secondary">{student.course}</td>
                    <td className="px-3 py-3 text-text-secondary">{student.department}</td>
                    <td className="px-3 py-3 text-text-secondary">{student.instructorName ?? '—'}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-text-primary">{student.attendance}%</td>
                    <td className="px-3 py-3 text-right tabular-nums text-text-primary">{student.gpa.toFixed(1)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-text-primary">{student.lmsActivity}%</td>
                    <td className="px-3 py-3 text-right tabular-nums text-text-primary">{student.lateAssignments}</td>
                    <td className="px-3 py-3 text-right">
                      <RiskScoreIndicator score={student.riskScore} level={student.riskLevel} />
                    </td>
                    <td className="px-3 py-3"><RiskBadge level={student.riskLevel} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="mt-4 text-xs text-text-muted">
              Showing {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
              {sortField === 'riskScore' && sortDirection === 'desc'
                ? ' · sorted by risk score (highest first)'
                : ` · sorted by ${COLUMNS.find((c) => c.key === sortField)?.label.toLowerCase()} (${sortDirection})`}
            </p>
          </div>
        )}
      </Card>
    </PageLayout>
  )
}
