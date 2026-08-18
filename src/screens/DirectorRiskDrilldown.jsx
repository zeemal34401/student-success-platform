import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Building2, ChevronRight, GraduationCap, Users } from 'lucide-react'
import { PageLayout, RiskBadge, ErrorState } from '../components/ui'
import { api } from '../api/client'
import { useAsyncData } from '../hooks/useAsyncData'

const STEPS = [
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'faculty', label: 'Faculty', icon: GraduationCap },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'students', label: 'Students', icon: Users },
]

function riskTone(share) {
  if ((share ?? 0) >= 25) return { bar: '#B42318', label: 'Elevated' }
  if ((share ?? 0) >= 12) return { bar: '#B54708', label: 'Watch' }
  return { bar: '#176455', label: 'Stable' }
}

function summarize(rows) {
  if (!rows?.length) {
    return { units: 0, enrolled: 0, atRisk: 0, critical: 0, avgRiskShare: 0 }
  }
  const enrolled = rows.reduce((sum, row) => sum + (row.enrolled ?? 0), 0)
  const atRisk = rows.reduce((sum, row) => sum + (row.atRiskCount ?? 0), 0)
  const critical = rows.reduce((sum, row) => sum + (row.criticalCount ?? 0), 0)
  const avgRiskShare = Math.round(rows.reduce((sum, row) => sum + (row.riskShare ?? 0), 0) / rows.length)
  return { units: rows.length, enrolled, atRisk, critical, avgRiskShare }
}

function rankRows(rows) {
  return [...(rows ?? [])].sort((a, b) => (b.riskShare ?? 0) - (a.riskShare ?? 0) || (b.enrolled ?? 0) - (a.enrolled ?? 0))
}

function InsightHeader({ level, onStep }) {
  const activeIndex = STEPS.findIndex((step) => step.id === level)

  return (
    <header
      className="relative overflow-hidden rounded-2xl px-6 py-6 text-white sm:px-7"
      style={{ background: 'linear-gradient(165deg, #1B2430 0%, #243044 100%)' }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, transparent 0%, transparent 48%, #fff 49%, #fff 51%, transparent 52%), linear-gradient(to bottom, transparent 0%, transparent 48%, #fff 49%, #fff 51%, transparent 52%)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden="true"
      />
      <p className="relative text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">
        Comparative analysis
      </p>
      <h2 className="relative mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">Academic Insights</h2>
      <p className="relative mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
        Rank academic units by risk exposure, then move from department to faculty, course, and student.
      </p>

      <ol className="relative mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Analysis path">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          const state = index === activeIndex ? 'current' : index < activeIndex ? 'done' : 'upcoming'
          const clickable = index < activeIndex
          const className = [
            'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors',
            state === 'current'
              ? 'border-white/35 bg-white/12 text-white'
              : state === 'done'
                ? 'border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
                : 'border-white/8 bg-transparent text-white/40',
          ].join(' ')

          const content = (
            <>
              <span
                className={[
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px]',
                  state === 'current' ? 'bg-white text-[#1B2430]' : 'bg-white/10',
                ].join(' ')}
              >
                {index + 1}
              </span>
              <Icon size={14} aria-hidden="true" />
              <span>{step.label}</span>
            </>
          )

          return (
            <li key={step.id}>
              {clickable ? (
                <button type="button" className={`${className} w-full`} onClick={() => onStep(step.id)}>
                  {content}
                </button>
              ) : (
                <div className={className} aria-current={state === 'current' ? 'step' : undefined}>
                  {content}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </header>
  )
}

function SummaryStrip({ items }) {
  return (
    <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-surface sm:grid-cols-4">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={[
            'px-4 py-3',
            index > 0 ? 'border-t border-border sm:border-t-0 sm:border-l' : '',
          ].join(' ')}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">{item.label}</p>
          <p className="mt-1 text-xl font-extrabold tabular-nums tracking-tight text-text-primary">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

function MetricCell({ label, value, warn }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <p className={['mt-0.5 text-sm font-semibold tabular-nums', warn ? 'text-risk-critical' : 'text-text-primary'].join(' ')}>
        {value}
      </p>
    </div>
  )
}

function ComparisonUnit({ rank, title, subtitle, enrolled, atRiskCount, criticalCount, avgAttendance, avgGpa, riskShare, actionLabel, onOpen }) {
  const tone = riskTone(riskShare)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full overflow-hidden rounded-xl border border-border bg-surface text-left transition-colors hover:border-[#243044]/25 hover:bg-[#F8FAFC]"
    >
      <span className="w-1.5 shrink-0" style={{ backgroundColor: tone.bar }} aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-5">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-0.5 w-7 shrink-0 font-heading text-sm font-semibold tabular-nums text-text-muted">
            {String(rank).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <p className="truncate font-heading text-base font-semibold text-text-primary">{title}</p>
            {subtitle ? <p className="mt-0.5 truncate text-xs text-text-muted">{subtitle}</p> : null}
            <p className="mt-1 text-xs text-text-secondary">{enrolled?.toLocaleString?.() ?? enrolled} students</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 sm:w-[22rem] sm:shrink-0">
          <MetricCell label="At risk" value={atRiskCount} />
          <MetricCell label="Critical" value={criticalCount} warn={criticalCount > 0} />
          <MetricCell label="Attend." value={`${avgAttendance}%`} />
          <MetricCell label="CGPA" value={avgGpa} />
        </div>

        <div className="sm:w-40 sm:shrink-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">Risk share</p>
            <p className="text-xs font-semibold tabular-nums" style={{ color: tone.bar }}>
              {riskShare}% · {tone.label}
            </p>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#EEF2F6]">
            <div className="h-full rounded-full" style={{ width: `${Math.min(riskShare ?? 0, 100)}%`, backgroundColor: tone.bar }} />
          </div>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#243044] group-hover:underline">
          {actionLabel}
          <ArrowRight size={14} aria-hidden="true" />
        </span>
      </div>
    </button>
  )
}

function studentRail(level) {
  if (level === 'Critical') return '#B42318'
  if (level === 'High') return '#B54708'
  if (level === 'Medium') return '#CA8A04'
  return '#176455'
}

function StudentUnit({ student, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(student.id)}
      className="group flex w-full overflow-hidden rounded-xl border border-border bg-surface text-left transition-colors hover:border-[#243044]/25 hover:bg-[#F8FAFC]"
    >
      <span className="w-1.5 shrink-0" style={{ backgroundColor: studentRail(student.riskLevel) }} aria-hidden="true" />
      <div className="flex min-w-0 flex-1 items-center gap-4 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-semibold text-text-primary">{student.name}</p>
          <p className="mt-0.5 truncate text-xs text-text-muted">
            {student.id} · {student.course}
          </p>
        </div>
        <div className="hidden grid-cols-3 gap-6 sm:grid">
          <MetricCell label="Attend." value={`${student.attendance}%`} />
          <MetricCell label="CGPA" value={Number(student.gpa).toFixed(2)} />
          <MetricCell label="LMS" value={`${student.lmsActivity}%`} />
        </div>
        <RiskBadge level={student.riskLevel} score={student.riskScore} />
        <ChevronRight size={16} className="shrink-0 text-text-muted group-hover:text-text-primary" aria-hidden="true" />
      </div>
    </button>
  )
}

export default function DirectorRiskDrilldown({ onSelectStudent }) {
  const [department, setDepartment] = useState(null)
  const [faculty, setFaculty] = useState(null)
  const [course, setCourse] = useState(null)

  const level = course ? 'students' : faculty ? 'courses' : department ? 'faculty' : 'departments'

  const { data: departments, loading: loadingDepartments, error: deptError, refetch: refetchDepts } = useAsyncData(
    () => api.getDirectorDepartments(),
    [],
  )

  const facultyKey = department ?? ''
  const { data: facultyRows, loading: loadingFaculty, error: facultyError, refetch: refetchFaculty } = useAsyncData(
    () => (department ? api.getDirectorDepartmentFaculty(department) : Promise.resolve([])),
    [facultyKey],
  )

  const coursesKey = faculty?.id ?? ''
  const { data: courseRows, loading: loadingCourses, error: courseError, refetch: refetchCourses } = useAsyncData(
    () => (faculty?.id ? api.getDirectorFacultyCourses(faculty.id) : Promise.resolve([])),
    [coursesKey],
  )

  const studentsKey = `${faculty?.id ?? ''}-${course ?? ''}`
  const { data: students, loading: loadingStudents, error: studentError, refetch: refetchStudents } = useAsyncData(
    () => (faculty?.id && course ? api.getDirectorCourseStudents(faculty.id, course) : Promise.resolve([])),
    [studentsKey],
  )

  function goToStep(stepId) {
    if (stepId === 'departments') {
      setDepartment(null)
      setFaculty(null)
      setCourse(null)
      return
    }
    if (stepId === 'faculty') {
      setFaculty(null)
      setCourse(null)
      return
    }
    if (stepId === 'courses') {
      setCourse(null)
    }
  }

  function goBack() {
    if (course) {
      setCourse(null)
      return
    }
    if (faculty) {
      setFaculty(null)
      return
    }
    setDepartment(null)
  }

  const loading =
    (level === 'departments' && loadingDepartments) ||
    (level === 'faculty' && loadingFaculty) ||
    (level === 'courses' && loadingCourses) ||
    (level === 'students' && loadingStudents)

  const error =
    (level === 'departments' && deptError) ||
    (level === 'faculty' && facultyError) ||
    (level === 'courses' && courseError) ||
    (level === 'students' && studentError) ||
    null

  const retry =
    level === 'departments'
      ? refetchDepts
      : level === 'faculty'
        ? refetchFaculty
        : level === 'courses'
          ? refetchCourses
          : refetchStudents

  const rankedDepartments = useMemo(() => rankRows(departments), [departments])
  const rankedFaculty = useMemo(() => rankRows(facultyRows), [facultyRows])
  const rankedCourses = useMemo(() => rankRows(courseRows), [courseRows])
  const rankedStudents = useMemo(
    () => [...(students ?? [])].sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0)),
    [students],
  )

  const comparisonRows =
    level === 'departments' ? rankedDepartments : level === 'faculty' ? rankedFaculty : rankedCourses
  const summary = level === 'students'
    ? {
        units: rankedStudents.length,
        enrolled: rankedStudents.length,
        atRisk: rankedStudents.filter((row) => row.riskLevel === 'High' || row.riskLevel === 'Critical').length,
        critical: rankedStudents.filter((row) => row.riskLevel === 'Critical').length,
        avgRiskShare: rankedStudents.length
          ? Math.round(
              rankedStudents.filter((row) => row.riskLevel === 'High' || row.riskLevel === 'Critical').length /
                rankedStudents.length *
                100,
            )
          : 0,
      }
    : summarize(comparisonRows)

  const headings = {
    departments: {
      kicker: 'Institution',
      title: 'Departments by risk exposure',
      hint: 'Highest risk share appears first. Open a department to inspect its faculty.',
    },
    faculty: {
      kicker: department,
      title: 'Faculty in this department',
      hint: 'Compare teaching load risk, then open a faculty member’s courses.',
    },
    courses: {
      kicker: faculty?.name,
      title: 'Courses in this portfolio',
      hint: 'Section-level averages for this instructor. Open a course to review students.',
    },
    students: {
      kicker: course,
      title: 'Students in this course',
      hint: `Taught by ${faculty?.name}. Ranked by current risk score.`,
    },
  }

  if (error) {
    return (
      <PageLayout>
        <ErrorState error={error} onRetry={retry} />
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <InsightHeader level={level} onStep={goToStep} />

      <SummaryStrip
        items={[
          { label: level === 'students' ? 'Students' : 'Units', value: summary.units },
          { label: 'Enrollment', value: summary.enrolled.toLocaleString() },
          { label: 'At risk', value: summary.atRisk },
          { label: 'Risk share', value: `${summary.avgRiskShare}%` },
        ]}
      />

      <div className="mt-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">{headings[level].kicker}</p>
          <h3 className="mt-1 font-heading text-xl font-semibold text-text-primary">{headings[level].title}</h3>
          <p className="mt-1 text-sm text-text-secondary">{headings[level].hint}</p>
        </div>
        {level !== 'departments' ? (
          <button type="button" onClick={goBack} className="btn-ghost shrink-0">
            <ArrowLeft size={16} aria-hidden="true" />
            Back
          </button>
        ) : null}
      </div>

      <div className="mt-4 space-y-2.5">
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="animate-skeleton h-[4.75rem] w-full rounded-xl bg-border/80" />
          ))
        ) : level === 'students' ? (
          rankedStudents.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-text-secondary">
              No students enrolled in this course.
            </p>
          ) : (
            rankedStudents.map((student) => (
              <StudentUnit key={student.id} student={student} onSelect={onSelectStudent} />
            ))
          )
        ) : comparisonRows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-text-secondary">
            {level === 'departments'
              ? 'No departments found.'
              : level === 'faculty'
                ? 'No faculty found in this department.'
                : 'No courses assigned to this faculty member.'}
          </p>
        ) : (
          comparisonRows.map((row, index) => (
            <ComparisonUnit
              key={`${level}-${row.id ?? row.course ?? row.department}-${index}`}
              rank={index + 1}
              title={row.name ?? row.course ?? row.department}
              subtitle={row.email ?? null}
              enrolled={row.enrolled}
              atRiskCount={row.atRiskCount}
              criticalCount={row.criticalCount}
              avgAttendance={row.avgAttendance}
              avgGpa={row.avgGpa}
              riskShare={row.riskShare}
              actionLabel={level === 'departments' ? 'Faculty' : level === 'faculty' ? 'Courses' : 'Students'}
              onOpen={() => {
                if (level === 'departments') {
                  setDepartment(row.department)
                  setFaculty(null)
                  setCourse(null)
                  return
                }
                if (level === 'faculty') {
                  setFaculty(row)
                  setCourse(null)
                  return
                }
                setCourse(row.course)
              }}
            />
          ))
        )}
      </div>
    </PageLayout>
  )
}
