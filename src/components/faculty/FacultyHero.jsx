import { CalendarDays, Sparkles } from 'lucide-react'

function greetingForHour(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function FacultyHero({ name, term, courseCount, enrolled, atRiskCount, department }) {
  const firstName = String(name ?? 'Faculty').split(' ').slice(-1)[0]

  return (
    <section className="faculty-hero relative overflow-hidden rounded-2xl border border-primary-200/40 px-6 py-6 sm:px-8 sm:py-7">
      <div className="faculty-hero-glow pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full" aria-hidden="true" />
      <div className="faculty-hero-glow pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full opacity-60" aria-hidden="true" />

      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
            <Sparkles size={13} aria-hidden="true" />
            Faculty workspace
          </div>
          <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {greetingForHour()}, {firstName}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm text-white/80">
            {department ? `${department} · ` : ''}
            Monitor engagement, review at-risk students, and act on personalized recommendations.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="faculty-chip">
              <CalendarDays size={13} aria-hidden="true" />
              {term}
            </span>
            <span className="faculty-chip">{courseCount} section{courseCount !== 1 ? 's' : ''}</span>
            <span className="faculty-chip">{enrolled} enrolled</span>
            {atRiskCount > 0 ? (
              <span className="faculty-chip faculty-chip-alert">{atRiskCount} need attention</span>
            ) : (
              <span className="faculty-chip">All sections stable</span>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
