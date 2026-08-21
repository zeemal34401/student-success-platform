import { useEffect, useMemo, useRef, useState } from 'react'

import { AlertTriangle, ArrowDownUp, ArrowRight, BookOpen, Search, Users } from 'lucide-react'

import {

  Card,

  PageLayout,

  RiskBadge,

  RiskScoreIndicator,

  ErrorState,

} from '../components/ui'

import {

  FacultyBreadcrumb,

  FacultyCourseCard,

  FacultyMetricBar,

} from '../components/faculty'

import { api } from '../api/client'

import { useAsyncData } from '../hooks/useAsyncData'

import StudentDetail from './StudentDetail'



function studentCourses(student) {

  if (Array.isArray(student?.courses) && student.courses.length) return student.courses

  return student?.course ? [student.course] : []

}



function studentInCourse(student, courseName) {

  return studentCourses(student).includes(courseName)

}



const RISK_FILTERS = ['All', 'Critical', 'High', 'Medium', 'Low']

const SORT_OPTIONS = [

  { id: 'risk', label: 'Risk score' },

  { id: 'name', label: 'Name' },

  { id: 'attendance', label: 'Attendance' },

  { id: 'gpa', label: 'GPA' },

]



function sortStudents(rows, sortBy) {

  const next = [...rows]

  switch (sortBy) {

    case 'name':

      return next.sort((a, b) => a.name.localeCompare(b.name))

    case 'attendance':

      return next.sort((a, b) => a.attendance - b.attendance)

    case 'gpa':

      return next.sort((a, b) => a.gpa - b.gpa)

    default:

      return next.sort((a, b) => b.riskScore - a.riskScore)

  }

}



export default function FacultyStudents({

  user,

  onNotify,

  initialCourse = null,

  initialRiskFilter = 'All',

  onPrefillConsumed,

}) {

  const [selectedCourse, setSelectedCourse] = useState(initialCourse)

  const [selectedStudentId, setSelectedStudentId] = useState(null)

  const [search, setSearch] = useState('')

  const [riskFilter, setRiskFilter] = useState(initialRiskFilter)

  const [sortBy, setSortBy] = useState('risk')

  const appliedPrefill = useRef(null)

  useEffect(() => {
    const key = `${initialCourse ?? ''}:${initialRiskFilter ?? 'All'}`
    if (key === ':All' || appliedPrefill.current === key) return
    appliedPrefill.current = key
    if (initialCourse) setSelectedCourse(initialCourse)
    if (initialRiskFilter) setRiskFilter(initialRiskFilter)
    onPrefillConsumed?.()
  }, [initialCourse, initialRiskFilter, onPrefillConsumed])

  const { data: students, loading, error, refetch } = useAsyncData(

    () => api.getStudents({ sortField: 'name', sortDirection: 'asc' }),

    [],

  )



  const roster = students ?? []

  const assignedCourses = user?.courses?.length

    ? user.courses

    : [...new Set(roster.flatMap((s) => studentCourses(s)))].sort()



  const courseRows = useMemo(() => {

    return assignedCourses.map((course) => {

      const members = roster.filter((s) => studentInCourse(s, course))

      const atRiskCount = members.filter((s) => s.riskLevel === 'Critical' || s.riskLevel === 'High').length

      const criticalCount = members.filter((s) => s.riskLevel === 'Critical').length

      return {

        course,

        enrolled: members.length,

        atRiskCount,

        criticalCount,

        students: [...members].sort((a, b) => b.riskScore - a.riskScore),

      }

    })

  }, [assignedCourses, roster])



  const activeCourse = courseRows.find((row) => row.course === selectedCourse) ?? null

  const courseStudents = useMemo(() => {

    let rows = activeCourse?.students ?? []

    if (riskFilter !== 'All') {

      rows = rows.filter((s) => s.riskLevel === riskFilter)

    }

    if (search.trim()) {

      const q = search.trim().toLowerCase()

      rows = rows.filter((s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))

    }

    return sortStudents(rows, sortBy)

  }, [activeCourse, riskFilter, search, sortBy])



  const totalAtRisk = courseRows.reduce((sum, row) => sum + row.atRiskCount, 0)



  function openCourse(course) {

    setSelectedCourse(course)

    setSelectedStudentId(null)

    setSearch('')

    setRiskFilter('All')

    setSortBy('risk')

  }



  function backToCourses() {

    setSelectedCourse(null)

    setSelectedStudentId(null)

    setSearch('')

    setRiskFilter('All')

  }



  function backToRoster() {

    setSelectedStudentId(null)

  }



  if (error) {

    return (

      <PageLayout size="wide">

        <ErrorState error={error} onRetry={refetch} />

      </PageLayout>

    )

  }



  if (selectedStudentId) {

    return (

      <StudentDetail

        studentId={selectedStudentId}

        onBack={backToRoster}

        includeRecommendations

        onNotify={onNotify}

        facultyMode

      />

    )

  }



  if (selectedCourse) {

    return (

      <PageLayout size="wide">

        <FacultyBreadcrumb

          items={[

            { label: 'My Students', onClick: backToCourses },

            { label: selectedCourse },

          ]}

        />



        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <h2 className="font-heading text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">

              {selectedCourse}

            </h2>

            <p className="mt-1 text-sm text-text-secondary">

              {activeCourse?.enrolled ?? 0} enrolled · {activeCourse?.atRiskCount ?? 0} at risk · open a student for risk details and personalized advising.

            </p>

          </div>

        </div>



        <div className="faculty-filter-bar mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

          <div className="relative min-w-0 flex-1 max-w-md">

            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />

            <input

              type="search"

              value={search}

              onChange={(e) => setSearch(e.target.value)}

              placeholder="Search by name or student ID"

              className="input-field w-full pl-9"

            />

          </div>



          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">

            <div>

              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.03em] text-text-muted">Sort by</p>

              <div className="relative">

                <ArrowDownUp size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />

                <select

                  value={sortBy}

                  onChange={(e) => setSortBy(e.target.value)}

                  className="input-field min-w-[10rem] appearance-none pl-9 pr-8"

                  aria-label="Sort students"

                >

                  {SORT_OPTIONS.map((option) => (

                    <option key={option.id} value={option.id}>{option.label}</option>

                  ))}

                </select>

              </div>

            </div>



            <div>

              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.03em] text-text-muted">Risk level</p>

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

              <div key={i} className="animate-skeleton h-16 w-full rounded-xl bg-border/80" />

            ))}

          </div>

        ) : courseStudents.length === 0 ? (

          <Card className="mt-6 text-center">

            <div className="flex flex-col items-center py-12">

              <Users size={22} className="text-primary-600" aria-hidden="true" />

              <h3 className="mt-4 text-sm font-semibold text-text-primary">

                {activeCourse?.enrolled ? 'No students match these filters' : 'No students enrolled in this course'}

              </h3>

              <p className="mt-1 max-w-md text-sm text-text-secondary">

                Try clearing the risk filter or search term to see the full roster.

              </p>

            </div>

          </Card>

        ) : (

          <Card className="mt-6" padding={false}>

            <div className="overflow-x-auto">

              <table className="w-full min-w-[980px] border-collapse text-left text-sm" aria-label={`Students in ${selectedCourse}`}>

                <thead>

                  <tr className="border-b border-border bg-[#F9FAFB]">

                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-text-secondary">Student</th>

                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-text-secondary">Attendance</th>

                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-text-secondary">GPA</th>

                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-text-secondary">LMS</th>

                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-text-secondary">Late</th>

                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-text-secondary">Risk</th>

                    <th className="px-4 py-3"><span className="sr-only">Open</span></th>

                  </tr>

                </thead>

                <tbody>

                  {courseStudents.map((student) => (

                    <tr

                      key={student.id}

                      className="faculty-table-row cursor-pointer border-b border-border last:border-b-0"

                      onClick={() => setSelectedStudentId(student.id)}

                    >

                      <td className="px-4 py-4">

                        <div>

                          <p className="font-semibold text-primary-700">{student.name}</p>

                          <p className="text-xs text-text-muted">{student.id}</p>

                        </div>

                      </td>

                      <td className="px-4 py-4">

                        <FacultyMetricBar value={student.attendance} label={`${student.attendance}%`} />

                      </td>

                      <td className="px-4 py-4">

                        <FacultyMetricBar value={(student.gpa / 4) * 100} label={Number(student.gpa).toFixed(2)} />

                      </td>

                      <td className="px-4 py-4">

                        <FacultyMetricBar value={student.lmsActivity} label={`${student.lmsActivity}%`} />

                      </td>

                      <td className="px-4 py-4">

                        <FacultyMetricBar value={student.lateAssignments} max={10} invert label={`${student.lateAssignments}`} />

                      </td>

                      <td className="px-4 py-4">

                        <div className="flex flex-wrap items-center gap-2">

                          <RiskBadge level={student.riskLevel} />

                          <RiskScoreIndicator score={student.riskScore} level={student.riskLevel} />

                        </div>

                      </td>

                      <td className="px-4 py-4 text-right">

                        <button

                          type="button"

                          onClick={(e) => {

                            e.stopPropagation()

                            setSelectedStudentId(student.id)

                          }}

                          className="btn-secondary"

                        >

                          Open profile

                          <ArrowRight size={14} aria-hidden="true" />

                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </Card>

        )}

      </PageLayout>

    )

  }



  return (

    <PageLayout size="wide">

      <FacultyBreadcrumb items={[{ label: 'My Students' }]} />



      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <h2 className="font-heading text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">

            My Students

          </h2>

          <p className="mt-1 text-sm text-text-secondary">

            {assignedCourses.length} section{assignedCourses.length !== 1 ? 's' : ''} assigned to {user?.name ?? 'you'}.

            {totalAtRisk > 0 ? ` ${totalAtRisk} students need follow-up.` : ' All sections look stable.'}

          </p>

        </div>

      </div>



      {loading ? (

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

          {Array.from({ length: 3 }).map((_, i) => (

            <div key={i} className="animate-skeleton h-44 rounded-2xl bg-border/80" />

          ))}

        </div>

      ) : courseRows.length === 0 ? (

        <Card className="mt-6 text-center">

          <div className="flex flex-col items-center py-12">

            <BookOpen size={22} className="text-primary-600" aria-hidden="true" />

            <h3 className="mt-4 text-sm font-semibold text-text-primary">No courses assigned</h3>

            <p className="mt-1 max-w-md text-sm text-text-secondary">

              Ask an Academic Admin to assign you to one or more courses.

            </p>

          </div>

        </Card>

      ) : (

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

          {courseRows.map((row) => (

            <FacultyCourseCard

              key={row.course}

              course={row.course}

              enrolled={row.enrolled}

              atRiskCount={row.atRiskCount}

              criticalCount={row.criticalCount}

              onOpen={openCourse}

            />

          ))}

        </div>

      )}



      {totalAtRisk > 0 ? (

        <Card className="mt-6 border-risk-high-border/60 bg-risk-high-bg/20">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-risk-high ring-1 ring-risk-high-border/50">

                <AlertTriangle size={18} aria-hidden="true" />

              </div>

              <div>

                <h3 className="text-sm font-semibold text-text-primary">Priority follow-up recommended</h3>

                <p className="mt-0.5 text-sm text-text-secondary">

                  {totalAtRisk} student{totalAtRisk !== 1 ? 's' : ''} across your sections are flagged critical or high risk.

                </p>

              </div>

            </div>

            <button

              type="button"

              className="btn-primary shrink-0"

              onClick={() => {

                const urgent = courseRows.find((row) => row.criticalCount > 0) ?? courseRows[0]

                if (urgent) openCourse(urgent.course)

              }}

            >

              Review highest-risk section

              <ArrowRight size={15} aria-hidden="true" />

            </button>

          </div>

        </Card>

      ) : null}

    </PageLayout>

  )

}


