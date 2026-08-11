import { env } from '../config/env.js'

const TIMEOUT_MS = env.ml.fetchTimeoutMs

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`ML API ${res.status}${body ? `: ${body.slice(0, 120)}` : ''}`)
    }
    return res.json()
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`ML API timeout after ${TIMEOUT_MS}ms`)
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function mapToAcademicModelFeatures(student) {
  const gpa = student.gpa ?? 0
  const attendance = student.attendance ?? 0
  const lms = student.lmsActivity ?? 0
  const late = student.lateAssignments ?? 0

  return {
    gender: gpa >= 3 ? 'M' : 'F',
    region: attendance >= 85 ? 'East Anglian Region' : 'North Western Region',
    highest_education: gpa >= 3 ? 'HE Qualification' : 'A Level or Equivalent',
    imd_band: attendance >= 90 ? '0-10%' : attendance >= 75 ? '20-30%' : '30-40%',
    age_band: '0-35',
    num_of_prev_attempts: late > 5 ? 1 : 0,
    studied_credits: Math.round(40 + (gpa / 4) * 40),
    disability: 'N',
    total_clicks: lms,
    avg_clicks: lms / 30,
    active_days: Math.round((attendance / 100) * 30),
    avg_score: gpa * 25,
    num_assessments: clamp(Math.round(10 - late), 3, 12),
  }
}

function mapToDropoutModelFeatures(student) {
  const gpa = student.gpa ?? 0
  const attendance = student.attendance ?? 0
  const lms = student.lmsActivity ?? 0
  const late = student.lateAssignments ?? 0
  const approvedUnits = clamp(Math.round((gpa / 4) * 6), 0, 6)
  const grade = gpa * 5

  return {
    marital_status: 1,
    application_mode: 1,
    application_order: 1,
    course: 1,
    daytime_evening_attendance: 1,
    previous_qualification: 1,
    previous_qualification_grade: clamp(gpa * 30, 100, 200),
    nacionality: 1,
    mothers_qualification: 1,
    fathers_qualification: 1,
    mothers_occupation: 1,
    fathers_occupation: 1,
    admission_grade: clamp(gpa * 30, 100, 200),
    displaced: 0,
    educational_special_needs: 0,
    debtor: late > 5 ? 1 : 0,
    tuition_fees_up_to_date: late <= 3 && gpa >= 2 ? 1 : 0,
    gender: 1,
    scholarship_holder: gpa >= 3.5 ? 1 : 0,
    age_at_enrollment: 20,
    international: 0,
    curricular_units_1st_sem_credited: 0,
    curricular_units_1st_sem_enrolled: 6,
    curricular_units_1st_sem_evaluations: 6,
    curricular_units_1st_sem_approved: approvedUnits,
    curricular_units_1st_sem_grade: grade,
    curricular_units_1st_sem_without_evaluations: 0,
    curricular_units_2nd_sem_credited: 0,
    curricular_units_2nd_sem_enrolled: 6,
    curricular_units_2nd_sem_evaluations: 5,
    curricular_units_2nd_sem_approved: approvedUnits,
    curricular_units_2nd_sem_grade: grade,
    curricular_units_2nd_sem_without_evaluations: 0,
    unemployment_rate: 10.8,
    inflation_rate: 1.4,
    gdp: 1.74,
  }
}

function mapToXapiFeatures(student) {
  const gpa = student.gpa ?? 0
  const attendance = student.attendance ?? 0
  const lms = student.lmsActivity ?? 0
  const late = student.lateAssignments ?? 0
  const engagementScore = Math.round(lms * 0.9)

  return {
    gender: 'M',
    NationalITy: 'KW',
    PlaceofBirth: 'KuwaIT',
    StageID: 'MiddleSchool',
    GradeID: 'G-08',
    SectionID: 'A',
    Topic: 'Math',
    Semester: 'F',
    Relation: 'Father',
    raisedhands: engagementScore,
    VisITedResources: Math.round(lms),
    AnnouncementsView: Math.round(lms * 0.6),
    Discussion: Math.round(lms * 0.5),
    ParentAnsweringSurvey: late <= 3 ? 'Yes' : 'No',
    ParentschoolSatisfaction: gpa >= 2.5 ? 'Good' : 'Bad',
    StudentAbsenceDays: attendance >= 85 ? 'Under-7' : 'Above-7',
  }
}

export async function getMlAcademicRisk(student) {
  const payload = mapToAcademicModelFeatures(student)
  const data = await fetchWithTimeout(`${env.ml.academic}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return { ...data, estimatedFeatures: true }
}

export async function getMlDropoutRisk(student) {
  const payload = mapToDropoutModelFeatures(student)
  const data = await fetchWithTimeout(`${env.ml.dropout}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return { ...data, estimatedFeatures: true }
}

export async function getXapiEngagementRisk(student) {
  const payload = mapToXapiFeatures(student)
  const data = await fetchWithTimeout(`${env.ml.academic}/predict-xapi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return { ...data, estimatedFeatures: true }
}

let _cachedKcStudentIds = null

async function getKcStudentIds() {
  if (_cachedKcStudentIds) return _cachedKcStudentIds
  const data = await fetchWithTimeout(`${env.ml.recommender}/students`)
  _cachedKcStudentIds = data.student_ids ?? []
  return _cachedKcStudentIds
}

function hashToIndex(str, max) {
  if (max === 0) return 0
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % max
}

// NOTE: this function now catches its own errors and always resolves.
// It never throws and never returns a raw error message to callers/UI.
export async function getMlSkillRecommendations(appStudentId) {
  try {
    const kcIds = await getKcStudentIds()
    if (kcIds.length === 0) {
      return { available: false, recommendations: [] }
    }
    const pickedId = kcIds[hashToIndex(appStudentId, kcIds.length)]
    const data = await fetchWithTimeout(`${env.ml.recommender}/recommend/${pickedId}?top_n=3`)
    return { ...data, proxyStudentId: pickedId, estimatedMapping: true, available: true }
  } catch (err) {
    console.error('ML skill recommendation fetch failed:', err.message)
    return { available: false, recommendations: [] }
  }
}

const SKILL_DIMENSIONS = [
  {
    key: 'conceptual',
    label: 'Conceptual Understanding',
    compute: (s) => (s.gpa / 4) * 100,
    advice: 'Review core course concepts via office hours or supplemental readings.',
  },
  {
    key: 'engagement',
    label: 'Class Participation & Engagement',
    compute: (s) => s.attendance,
    advice: 'Increase class attendance and active participation.',
  },
  {
    key: 'application',
    label: 'Problem-Solving Application',
    compute: (s) => (s.lmsActivity + (s.gpa / 4) * 100) / 2,
    advice: 'Practice applying concepts through extra problem sets or lab exercises.',
  },
  {
    key: 'timeManagement',
    label: 'Time Management & Deadlines',
    compute: (s) => Math.max(0, 100 - s.lateAssignments * 10),
    advice: 'Work with an advisor on a deadline management plan.',
  },
  {
    key: 'assessment',
    label: 'Assessment Performance',
    compute: (s) => ((s.gpa / 4) * 100 + s.attendance) / 2,
    advice: 'Schedule targeted exam-prep or tutoring sessions.',
  },
]

export function getRealSkillDiagnostic(student) {
  const scored = SKILL_DIMENSIONS.map((dim) => ({
    skill: dim.label,
    mastery: Math.round(Math.max(0, Math.min(100, dim.compute(student)))),
    recommendation: dim.advice,
  }))

  scored.sort((a, b) => a.mastery - b.mastery)

  return {
    studentId: student.id,
    source: 'platform_metrics',
    weakestAreas: scored.slice(0, 3),
  }
}

export async function getClusterSummary() {
  return fetchWithTimeout(`${env.ml.analytics}/cluster/summary`)
}

export async function checkMlServicesHealth() {
  const services = [
    { name: 'academic', url: `${env.ml.academic}/health` },
    { name: 'dropout', url: `${env.ml.dropout}/health` },
    { name: 'recommender', url: `${env.ml.recommender}/health` },
    { name: 'analytics', url: `${env.ml.analytics}/health` },
  ]

  const results = await Promise.allSettled(
    services.map(async ({ name, url }) => {
      const data = await fetchWithTimeout(url)
      return { name, ok: true, data }
    }),
  )

  return results.map((result, index) => {
    if (result.status === 'fulfilled') return result.value
    return {
      name: services[index].name,
      ok: false,
      error: result.reason?.message ?? 'Unavailable',
    }
  })
}