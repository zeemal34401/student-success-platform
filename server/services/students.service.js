import { getDb } from '../db/connection.js'
import { getCurrentTerm } from './auth.service.js'
import { scoreToRiskLevel } from '../utils/risk.js'
import { INSTITUTION_WIDE_ROLES, ROLES } from '../constants/roles.js'

export { ROLES }

function baseStudentQuery() {
  return `
    SELECT
      s.id,
      s.name,
      c.display_name AS course,
      d.name AS department,
      sm.attendance,
      sm.gpa,
      sm.lms_activity AS lmsActivity,
      sm.late_assignments AS lateAssignments,
      sm.risk_score AS riskScore,
      sm.risk_level AS riskLevel,
      sm.trend,
      (
        SELECT u.name
        FROM faculty_courses fc
        JOIN users u ON u.id = fc.user_id
        WHERE fc.course_id = c.id AND fc.term_id = t.id
        ORDER BY u.name
        LIMIT 1
      ) AS instructorName,
      (
        SELECT u.email
        FROM faculty_courses fc
        JOIN users u ON u.id = fc.user_id
        WHERE fc.course_id = c.id AND fc.term_id = t.id
        ORDER BY u.name
        LIMIT 1
      ) AS instructorEmail
    FROM students s
    JOIN courses c ON c.id = s.course_id
    JOIN departments d ON d.id = s.department_id
    JOIN student_metrics sm ON sm.student_id = s.id
    JOIN terms t ON t.id = sm.term_id
    WHERE s.is_active = 1 AND t.is_current = 1
  `
}

export function getScopedStudentFilters(user) {
  const db = getDb()
  const { id: termId } = getCurrentTerm()
  const params = []
  let sql = baseStudentQuery()

  if (INSTITUTION_WIDE_ROLES.has(user.role)) {
    return { sql, params }
  }

  if (user.role === ROLES.DEPARTMENT_HEAD) {
    sql += ' AND d.name = ?'
    params.push(user.department)
    return { sql, params }
  }

  if (user.role === ROLES.FACULTY) {
    const courseIds = db
      .prepare(
        `
        SELECT fc.course_id AS id
        FROM faculty_courses fc
        WHERE fc.user_id = ? AND fc.term_id = ?
      `,
      )
      .all(user.id, termId)
      .map((row) => row.id)

    if (courseIds.length === 0) {
      sql += ' AND 1 = 0'
      return { sql, params }
    }

    sql += ` AND c.id IN (${courseIds.map(() => '?').join(', ')})`
    params.push(...courseIds)
    return { sql, params }
  }

  // Unknown roles: deny by default (never fall through to full access)
  sql += ' AND 1 = 0'
  return { sql, params }
}

export function listStudents(user, { facultyId, department, riskLevel, search, sortField = 'riskScore', sortDirection = 'desc' } = {}) {
  const db = getDb()
  let { sql, params } = getScopedStudentFilters(user)

  if (facultyId) {
    const faculty = getFacultyById(facultyId)
    if (faculty?.courses?.length) {
      sql += ` AND c.display_name IN (${faculty.courses.map(() => '?').join(', ')})`
      params.push(...faculty.courses)
    }
  }

  if (department?.trim()) {
    sql += ' AND d.name = ?'
    params.push(department.trim())
  }

  if (riskLevel && riskLevel !== 'All') {
    sql += ' AND sm.risk_level = ?'
    params.push(riskLevel)
  }

  if (search?.trim()) {
    const q = `%${search.trim().toLowerCase()}%`
    sql += ' AND (LOWER(s.name) LIKE ? OR LOWER(c.display_name) LIKE ? OR LOWER(s.id) LIKE ?)'
    params.push(q, q, q)
  }

  const sortMap = {
    name: 's.name',
    course: 'c.display_name',
    department: 'd.name',
    instructorName: 'instructorName',
    attendance: 'sm.attendance',
    gpa: 'sm.gpa',
    lmsActivity: 'sm.lms_activity',
    lateAssignments: 'sm.late_assignments',
    riskScore: 'sm.risk_score',
    riskLevel: 'sm.risk_level',
  }

  const orderColumn = sortMap[sortField] ?? 'sm.risk_score'
  const direction = sortDirection === 'asc' ? 'ASC' : 'DESC'
  sql += ` ORDER BY ${orderColumn} ${direction}`

  const rows = db.prepare(sql).all(...params)
  return rows.map(formatStudent)
}

export function getStudentById(studentId, user) {
  const db = getDb()
  let { sql, params } = getScopedStudentFilters(user)
  sql += ' AND s.id = ?'
  params.push(studentId)

  const row = db.prepare(sql).get(...params)
  return row ? formatStudent(row) : null
}

export function searchStudents(user, query) {
  return listStudents(user, { search: query })
}

function formatStudent(row) {
  return {
    id: row.id,
    name: row.name,
    course: row.course,
    department: row.department,
    attendance: row.attendance,
    gpa: row.gpa,
    lmsActivity: row.lmsActivity,
    lateAssignments: row.lateAssignments,
    riskScore: row.riskScore,
    riskLevel: row.riskLevel,
    trend: row.trend,
    instructorName: row.instructorName ?? null,
    instructorEmail: row.instructorEmail ?? null,
  }
}

export function getFacultyById(facultyId) {
  const db = getDb()
  const { id: termId } = getCurrentTerm()

  const row = db
    .prepare(
      `
      SELECT u.id, u.name, u.email, d.name AS department
      FROM users u
      JOIN roles r ON r.id = u.role_id
      LEFT JOIN departments d ON d.id = u.department_id
      WHERE u.id = ? AND r.name = 'Faculty'
    `,
    )
    .get(facultyId)

  if (!row) return null

  const courses = db
    .prepare(
      `
      SELECT c.display_name AS course
      FROM faculty_courses fc
      JOIN courses c ON c.id = fc.course_id
      WHERE fc.user_id = ? AND fc.term_id = ?
    `,
    )
    .all(facultyId, termId)
    .map((c) => c.course)

  return { ...row, courses }
}

export function computeStudentStats(students) {
  if (students.length === 0) {
    return { enrolled: 0, avgAttendance: 0, atRiskCount: 0, avgGpa: '0.00' }
  }

  const enrolled = students.length
  const avgAttendance = Math.round(
    students.reduce((sum, s) => sum + s.attendance, 0) / enrolled,
  )
  const atRiskCount = students.filter(
    (s) => s.riskLevel === 'Critical' || s.riskLevel === 'High',
  ).length
  const avgGpa = (students.reduce((sum, s) => sum + s.gpa, 0) / enrolled).toFixed(2)

  return { enrolled, avgAttendance, atRiskCount, avgGpa }
}

export function getTopRiskStudents(user, limit = 5) {
  const students = listStudents(user)
  return [...students].sort((a, b) => b.riskScore - a.riskScore).slice(0, limit)
}

export function computeFacultyRiskSummary(facultyMembers, allStudents) {
  return facultyMembers.map((member) => {
    const classStudents = allStudents.filter((s) => member.courses.includes(s.course))
    const studentCount = classStudents.length

    if (studentCount === 0) {
      return {
        ...member,
        studentCount: 0,
        avgRiskScore: null,
        riskLevel: 'Low',
      }
    }

    const avgRiskScore = Math.round(
      classStudents.reduce((sum, s) => sum + s.riskScore, 0) / studentCount,
    )

    return {
      ...member,
      studentCount,
      avgRiskScore,
      riskLevel: scoreToRiskLevel(avgRiskScore),
    }
  })
}
