import { useEffect, useState } from 'react'
import { ChevronRight, Search, SearchX, Users } from 'lucide-react'
import { Card, PageLayout, RiskBadge, SectionHeader } from '../components/ui'
import { api } from '../api/client'

export default function StudentSearch({ user, onSelectStudent }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const trimmedQuery = query.trim()
  const hasQuery = trimmedQuery.length > 0

  useEffect(() => {
    if (!hasQuery) {
      setResults([])
      setError(null)
      return undefined
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await api.searchStudents(trimmedQuery)
        setResults(data)
      } catch (err) {
        setError(err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [trimmedQuery, hasQuery])

  return (
    <PageLayout size="narrow">
      <SectionHeader as="h2" title="Student Search" description="Find a student by name, ID, or course to view their full profile." />

      <div className="relative mt-6">
        <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
        <input
          id="student-search"
          type="search"
          autoFocus
          placeholder="Search by name, student ID, or course…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input-field py-4 pl-12 text-base shadow-card"
        />
      </div>

      {!hasQuery && (
        <Card className="mt-6">
          <div className="flex flex-col items-center py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <Users size={26} aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-text-primary">Search for a student</h2>
            <p className="mt-1 max-w-sm text-sm text-text-secondary">
              Start typing a student name, ID (e.g. STU-1001), or course code to see matching results.
            </p>
          </div>
        </Card>
      )}

      {hasQuery && loading && (
        <Card className="mt-6">
          <div className="space-y-3 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-skeleton h-16 w-full rounded-md bg-border/80" />
            ))}
          </div>
        </Card>
      )}

      {hasQuery && error && (
        <Card className="mt-6 border-risk-critical-border bg-risk-critical-bg px-4 py-3 text-sm text-risk-critical">
          {error.message}
        </Card>
      )}

      {hasQuery && !loading && !error && results.length === 0 && (
        <Card className="mt-6">
          <div className="flex flex-col items-center py-14 text-center">
            <SearchX size={26} className="text-primary-600" aria-hidden="true" />
            <h2 className="mt-4 text-base font-semibold text-text-primary">No students found</h2>
            <p className="mt-1 max-w-sm text-sm text-text-secondary">
              No results match &ldquo;{trimmedQuery}&rdquo;. Try a different name, ID, or course.
            </p>
          </div>
        </Card>
      )}

      {hasQuery && !loading && results.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-sm text-text-secondary">
            {results.length} {results.length === 1 ? 'result' : 'results'} for &ldquo;{trimmedQuery}&rdquo;
          </p>
          <ul className="space-y-3">
            {results.map((student) => (
              <li key={student.id}>
                <button
                  type="button"
                  onClick={() => onSelectStudent?.(student.id)}
                  className="group w-full rounded-lg border border-border bg-surface p-4 text-left shadow-card transition-all duration-150 hover:border-primary-500 hover:bg-primary-50/40 hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary group-hover:text-primary-700">{student.name}</p>
                        <RiskBadge level={student.riskLevel} score={student.riskScore} />
                      </div>
                      <p className="mt-0.5 truncate text-sm text-text-secondary">{student.course}</p>
                      <p className="mt-0.5 text-xs text-text-muted">{student.id} · {student.department}</p>
                    </div>
                    <ChevronRight size={18} className="shrink-0 text-text-muted transition-colors group-hover:text-primary-600" aria-hidden="true" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PageLayout>
  )
}
