import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, GraduationCap, Search, Shield, Users } from 'lucide-react'
import { Card, PageLayout, RiskBadge, StatusBadge } from '../components/ui'
import { api } from '../api/client'
import { ROLES } from '../constants/roles'

const FACULTY_ROLES = new Set([ROLES.FACULTY, ROLES.DEPARTMENT_HEAD])
const ADMIN_ROLES = new Set([ROLES.DIRECTOR, ROLES.ADMIN, ROLES.STAFF])

function displayRole(role) {
  if (role === ROLES.DEPARTMENT_HEAD) return 'Faculty'
  if (role === ROLES.STAFF) return 'Academic Admin'
  return role
}

function personMatchesFilter(person, filter) {
  if (filter === 'all') return true
  if (filter === 'students') return person.kind === 'student'
  if (filter === 'faculty') return person.kind === 'staff' && FACULTY_ROLES.has(person.role)
  if (filter === 'admins') return person.kind === 'staff' && ADMIN_ROLES.has(person.role)
  return true
}

export default function StudentSearch({ user, onSelectStudent, onSelectStaff, onBack }) {
  const isDirectorySearch =
    user?.role === ROLES.DIRECTOR || user?.role === ROLES.ADMIN || user?.role === ROLES.STAFF
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    let cancelled = false

    async function runSearch() {
      if (!debouncedQuery) {
        setResults([])
        setIsSearching(false)
        setError('')
        return
      }

      setIsSearching(true)
      setError('')
      try {
        const data = await api.searchPeople(debouncedQuery)
        if (!cancelled) setResults(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!cancelled) {
          setResults([])
          setError(err.message ?? 'Search failed. Please try again.')
        }
      } finally {
        if (!cancelled) setIsSearching(false)
      }
    }

    runSearch()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  const filteredResults = useMemo(
    () => results.filter((person) => personMatchesFilter(person, filter)),
    [results, filter],
  )

  const counts = useMemo(() => ({
    all: results.length,
    students: results.filter((person) => person.kind === 'student').length,
    faculty: results.filter((person) => person.kind === 'staff' && FACULTY_ROLES.has(person.role)).length,
    admins: results.filter((person) => person.kind === 'staff' && ADMIN_ROLES.has(person.role)).length,
  }), [results])

  function handleSelect(person) {
    if (person.kind === 'student') {
      onSelectStudent?.(person.id)
      return
    }
    onSelectStaff?.(person)
  }

  const filters = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'students', label: 'Students', count: counts.students },
    { id: 'faculty', label: 'Faculty', count: counts.faculty },
    { id: 'admins', label: 'Admins', count: counts.admins },
  ]

  return (
    <PageLayout>
      <div className="mb-4 flex items-center gap-2">
        <button type="button" onClick={onBack} className="btn-ghost -ml-2">
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </button>
      </div>

      <Card>
        <label htmlFor="directory-search" className="sr-only">
          {isDirectorySearch ? 'Search students, faculty, and administrators' : 'Search students'}
        </label>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
          <input
            id="directory-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              isDirectorySearch
                ? 'Search by name, email, role, department, or student ID'
                : 'Search by student name, ID, or course'
            }
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-text-primary outline-none ring-primary-600/20 placeholder:text-text-muted focus:border-primary-600 focus:ring-2"
            autoFocus
          />
        </div>

        {isDirectorySearch && (
          <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Search filters">
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={filter === item.id}
                onClick={() => setFilter(item.id)}
                className={[
                  'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                  filter === item.id
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-border bg-surface text-text-secondary hover:bg-background',
                ].join(' ')}
              >
                {item.label}
                <span className="ml-1 tabular-nums opacity-70">{item.count}</span>
              </button>
            ))}
          </div>
        )}
      </Card>

      <div className="mt-4">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : isSearching ? (
          <p className="text-sm text-text-muted">Searching…</p>
        ) : filteredResults.length === 0 ? (
          <p className="text-sm text-text-muted">
            {debouncedQuery
              ? 'No matching people found.'
              : isDirectorySearch
                ? 'Start typing to search students, faculty, and administrators.'
                : 'Start typing to search students.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {filteredResults.map((person) => (
              <li key={`${person.kind}-${person.id}`}>
                <button
                  type="button"
                  onClick={() => handleSelect(person)}
                  className="w-full rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-primary-200 hover:bg-primary-50/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <PersonIcon person={person} />
                        <p className="truncate font-heading text-sm font-semibold text-text-primary">{person.name}</p>
                      </div>
                      <p className="mt-1 truncate text-xs text-text-muted">
                        {person.kind === 'student'
                          ? `${person.id} · ${person.course ?? 'Course'} · ${person.department}`
                          : `${person.email} · ${person.department}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="rounded-badge border border-border bg-background px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
                        {displayRole(person.role)}
                      </span>
                      {person.kind === 'student' && person.riskLevel ? (
                        <RiskBadge level={person.riskLevel} score={person.riskScore} />
                      ) : null}
                      {person.kind === 'staff' && person.status ? (
                        <StatusBadge status={person.status} />
                      ) : null}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageLayout>
  )
}

function PersonIcon({ person }) {
  const className = 'mt-0.5 shrink-0 text-text-muted'
  if (person.kind === 'student') return <GraduationCap size={16} className={className} aria-hidden="true" />
  if (FACULTY_ROLES.has(person.role)) return <Users size={16} className={className} aria-hidden="true" />
  return <Shield size={16} className={className} aria-hidden="true" />
}
