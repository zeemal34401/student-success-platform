import { useState } from 'react'
import { CheckCircle2, Lightbulb, ShieldAlert, XCircle } from 'lucide-react'
import { Card, PageLayout, RiskBadge, SectionHeader, ErrorState } from '../components/ui'
import { api } from '../api/client'
import { ROLES } from '../constants/roles'
import { useAsyncData } from '../hooks/useAsyncData'

function MlSkillRecommendations({ studentId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function fetchSkills() {
    setLoading(true)
    setError(null)
    try {
      const result = await api.getMlSkillRecommendations(studentId)
      setData(result)
    } catch (err) {
      setError('Unable to load skill-gap diagnostic. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      {!data && !error && (
        <button type="button" onClick={fetchSkills} disabled={loading} className="btn-secondary">
          {loading ? 'Loading...' : 'View ML Skill-Gap Diagnostic'}
        </button>
      )}
      {error && (
        <div>
          <p className="text-sm text-text-secondary">{error}</p>
          <button type="button" onClick={fetchSkills} disabled={loading} className="btn-secondary mt-2">
            Retry
          </button>
        </div>
      )}
      {data && (
        <div>
          <p className="text-xs text-text-muted italic">
            Skill-gap diagnostic computed from this student&apos;s tracked performance data
          </p>
          <ul className="mt-2 space-y-1">
            {(data.weakestAreas ?? []).map((r) => (
              <li key={r.skill} className="text-sm text-text-secondary">
                <span className="font-medium">{r.skill}</span> — {r.mastery}% mastery
                <span className="block text-xs text-text-muted">{r.recommendation}</span>
              </li>
            ))}
          </ul>
          {data.mlRecommendations?.available && data.mlRecommendations?.recommendations?.length > 0 && (
            <div className="mt-3 border-t border-border pt-3">
              <p className="text-xs font-medium text-text-primary">Reference tutoring-log recommendations</p>
              <ul className="mt-1 space-y-1">
                {data.mlRecommendations.recommendations.map((r) => (
                  <li key={r.skill} className="text-xs text-text-muted">
                    {r.skill} — priority {r.priority_score}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function RecommendationEngine({ user, onNotify }) {
  const { data, loading, error, setData } = useAsyncData(() => api.getRecommendations(), [])

  async function handleDecision(studentId, decision) {
    try {
      const result = await api.saveRecommendationDecision(studentId, decision)
      onNotify?.({ studentName: result.studentName, decision: result.decision })

      setData((prev) => {
        if (!prev) return prev
        const items = prev.items.map((item) =>
          item.id === studentId ? { ...item, decision } : item,
        )
        const summary = {
          pendingCount: items.filter((s) => !s.decision).length,
          acceptedCount: items.filter((s) => s.decision === 'accepted').length,
          dismissedCount: items.filter((s) => s.decision === 'dismissed').length,
        }
        return { items, summary }
      })
    } catch (err) {
      onNotify?.({ studentName: 'Student', decision: 'error' })
      console.error(err)
    }
  }

  if (loading) {
    return (
      <PageLayout size="medium">
        <div className="animate-skeleton h-8 w-56 rounded-md bg-border/80" />
      </PageLayout>
    )
  }

  if (error || !data) {
    return (
      <PageLayout size="medium">
        <ErrorState error={error} />
      </PageLayout>
    )
  }

  const { items: flaggedStudents, summary } = data

  return (
    <PageLayout size="medium">
      <SectionHeader
        as="h2"
        title="Recommendation Engine"
        description={
          user?.role === ROLES.FACULTY
            ? 'Review intervention plans for flagged students in your sections.'
            : 'Review AI-generated intervention plans for flagged students and accept or dismiss each recommendation.'
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-2 border-risk-high text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Pending</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{summary.pendingCount}</p>
        </Card>
        <Card className="border-2 border-risk-low text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Accepted</p>
          <p className="mt-1 text-2xl font-bold text-risk-low">{summary.acceptedCount}</p>
        </Card>
        <Card className="border-2 border-risk-critical text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Dismissed</p>
          <p className="mt-1 text-2xl font-bold text-text-muted">{summary.dismissedCount}</p>
        </Card>
      </div>

      {flaggedStudents.length === 0 ? (
        <Card className="mt-6 text-center">
          <div className="flex flex-col items-center py-12">
            <ShieldAlert size={40} className="text-text-muted" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold text-text-primary">No flagged students</h2>
            <p className="mt-1 text-sm text-text-secondary">
              All students are currently at low risk. No interventions required.
            </p>
          </div>
        </Card>
      ) : (
        <ul className="mt-6 space-y-4">
          {flaggedStudents.map((student) => {
            const decision = student.decision
            const actions = student.interventions ?? []

            return (
              <li key={student.id}>
                <Card
                  className={[
                    'transition-all duration-200',
                    decision === 'accepted'
                      ? 'border-risk-low-border bg-risk-low-bg/30'
                      : decision === 'dismissed'
                        ? 'border-border bg-background opacity-80'
                        : 'hover:shadow-card-hover',
                  ].join(' ')}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-text-primary">{student.name}</h2>
                        <RiskBadge level={student.riskLevel} score={student.riskScore} />
                      </div>
                      <p className="mt-0.5 text-sm text-text-secondary">{student.course}</p>
                      <p className="text-xs text-text-muted">{student.id} · {student.department}</p>
                    </div>

                    {decision === 'accepted' && (
                      <div className="flex items-center gap-2 rounded-md border border-risk-low-border bg-risk-low-bg px-3 py-2 text-sm font-medium text-risk-low">
                        <CheckCircle2 size={16} aria-hidden="true" />
                        Intervention plan accepted
                      </div>
                    )}

                    {decision === 'dismissed' && (
                      <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-text-muted">
                        <XCircle size={16} aria-hidden="true" />
                        Recommendation dismissed
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center gap-2">
                      <Lightbulb size={15} className="text-primary-600" aria-hidden="true" />
                      <h3 className="text-sm font-medium text-text-primary">Recommended Interventions</h3>
                    </div>
                    <ul className="mt-2 space-y-2">
                      {actions.map((action) => (
                        <li key={action} className="flex gap-2 text-sm text-text-secondary">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <MlSkillRecommendations studentId={student.id} />

                  {!decision && (
                    <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:flex-wrap">
                      <button type="button" onClick={() => handleDecision(student.id, 'accepted')} className="btn-primary">
                        <CheckCircle2 size={15} aria-hidden="true" />
                        Accept
                      </button>
                      <button type="button" onClick={() => handleDecision(student.id, 'dismissed')} className="btn-secondary">
                        <XCircle size={15} aria-hidden="true" />
                        Dismiss
                      </button>
                    </div>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </PageLayout>
  )
}