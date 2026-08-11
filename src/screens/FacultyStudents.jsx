import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BookOpen,
  Search,
  SearchX,
  Users,
} from 'lucide-react'
import {
  Card,
  PageLayout,
  RiskBadge,
  RiskScoreIndicator,
  SectionHeader,
  ErrorState,
} from '../components/ui'
import { api } from '../api/client'
import { useAsyncData } from '../hooks/useAsyncData'

const RISK_FILTERS = ['All', 'Critical', 'High', 'Medium', 'Low']

const COLUMNS = [
  { key: 'name', label: 'Student', sortable: true },
  { key: 'course', label: 'Course', sortable: true },
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

function compareValues(a, b, key) {
  const aVal = a[key]
  const bVal = b[key]
  if (typeof aVal === 'number' && typeof bVal === 'number') return aVal - bVal
  return String(aVal ?? '').localeCompare(String(bVal ?? ''))
}

export default function FacultyStudents({ user, onSelectStudent }) {
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('All')
  const [courseFilter, setCourseFilter] = useState('All')
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')

  const { data: students, loading, error, refetch } = useAsyncData(
    () => api.getStudents({ sortField: 'name', sortDirection: 'asc' }),
    [],
  )

  const roster = students ?? []
  const assignedCourses = user?.courses?.length
    ? user.courses
    : [...new Set(roster.map((s) => s.course))].sort()

  const courseOptions = useMemo(() => {
    const fromRoster = [...new Set(roster.map((s) => s.course))]
    const merged = [...new Set([...(assignedCourses ?? []), ...fromRoster])]
    return merged.sort()
  }, [roster, assignedCourses])

  const filtered = useMemo(() => {
    let rows = [...roster]

    if (courseFilter !== 'All') {
      rows = rows.filter((s) => s.course === courseFilter)
    }
    if (riskFilter !== 'All') {
      rows = rows.filter((s) => s.riskLevel === riskFilter)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      rows = rows.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.course.toLowerCase().includes(q),
      )
    }

    rows.sort((a, b) => {
      const cmp = compareValues(a, b, sortField)
      return sortDirection === 'asc' ? cmp : -cmp
    })

    return rows
  }, [roster, courseFilter, riskFilter, search, sortField, sortDirection])

  function handleSort(key) {
    if (sortField === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortField(key)
    setSortDirection(key === 'name' || key === 'course' || key === 'riskLevel' ? 'asc' : 'desc')
  }

  function clearFilters() {
    setSearch('')
    setRiskFilter('All')
    setCourseFilter('All')
  }

  const hasFilters = search.trim() !== '' || riskFilter !== 'All' || courseFilter !== 'All'

  if (error) {
    return (
      <PageLayout size="wide">
        <ErrorState error={error} onRetry={refetch} />
      </PageLayout>
    )
  }

  return (
    <PageLayout size="wide">
      <SectionHeader
        as="h2"
        title="My Students"
        description={`Complete roster of students under your supervision${user?.name ? ` (${user.name})` : ''}.`}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5">
          <Users size={14} className="text-primary-600" aria-hidden="true" />
          <span className="font-medium text-text-primary">{roster.length}</span> enrolled
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5">
          <BookOpen size={14} className="text-primary-600" aria-hidden="true" />
          <span className="font-medium text-text-primary">{courseOptions.length}</span> section
          {courseOptions.length !== 1 ? 's' : ''}
        </span>
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative min-w-0 flex-1 max-w-md">
            <label htmlFor="faculty-student-search" className="sr-only">
              Search your students
            </label>
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <input
              id="faculty-student-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, or course"
              className="input-field w-full pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.03em] text-text-muted">
                Course
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCourseFilter('All')}
                  aria-pressed={courseFilter === 'All'}
                  className={['filter-pill', courseFilter === 'All' ? 'filter-pill-active' : 'filter-pill-inactive'].join(' ')}
                >
                  All
                </button>
                {courseOptions.map((course) => (
                  <button
                    key={course}
                    type="button"
                    onClick={() => setCourseFilter(course)}
                    aria-pressed={courseFilter === course}
                    className={['filter-pill', courseFilter === course ? 'filter-pill-active' : 'filter-pill-inactive'].join(' ')}
                  >
                    {course.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.03em] text-text-muted">
                Risk
              </p>
              <div className="flex flex-wrap gap-2">
                {RISK_FILTERS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setRiskFilter(level)}
                    aria-pressed={riskFilter === level}
                    className={['filter-pill', riskFilter === level ? 'filter-pill-active' : 'filter-pill-inactive'].join(' ')}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-skeleton h-12 w-full rounded-md bg-border/80" />
            ))}
          </div>
        ) : roster.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background px-6 py-16 text-center">
            <Users size={22} className="text-primary-600" aria-hidden="true" />
            <h3 className="mt-4 text-sm font-semibold text-text-primary">
              No students assigned to your sections
            </h3>
            <p className="mt-1 max-w-md text-sm text-text-secondary">
              {assignedCourses?.length
                ? `Your courses (${assignedCourses.join(', ')}) currently have no enrolled students.`
                : 'Ask an Academic Admin to assign you to one or more courses.'}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background px-6 py-16 text-center">
            <SearchX size={22} className="text-primary-600" aria-hidden="true" />
            <h3 className="mt-4 text-sm font-semibold text-text-primary">No students match your filters</h3>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="btn-primary mt-4">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6 -mx-5 min-w-0 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            <table
              className="w-full min-w-[900px] border-collapse text-left text-sm"
              aria-label="Students under your supervision"
            >
              <caption className="sr-only">
                All students enrolled in courses taught by {user?.name ?? 'this faculty member'}
              </caption>
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
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className={[
                          'inline-flex items-center gap-1 rounded-sm transition-all duration-150 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600',
                          col.align === 'right' ? 'ml-auto' : '',
                        ].join(' ')}
                      >
                        {col.label}
                        <SortIcon column={col.key} sortField={sortField} sortDirection={sortDirection} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, index) => (
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
                    <td className="px-3 py-3 text-right tabular-nums text-text-primary">
                      {student.attendance}%
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-text-primary">
                      {student.gpa.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-text-primary">
                      {student.lmsActivity}%
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-text-primary">
                      {student.lateAssignments}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <RiskScoreIndicator score={student.riskScore} level={student.riskLevel} />
                    </td>
                    <td className="px-3 py-3">
                      <RiskBadge level={student.riskLevel} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="mt-4 text-xs text-text-muted">
              Showing {filtered.length} of {roster.length} student
              {roster.length !== 1 ? 's' : ''} under your supervision
            </p>
          </div>
        )}
      </Card>
    </PageLayout>
  )
}
