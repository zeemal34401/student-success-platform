import { getDb } from '../db/connection.js'
import { getCurrentTerm } from './auth.service.js'
import { scoreToRiskLevel } from '../utils/risk.js'
import { INSTITUTION_WIDE_ROLES, ROLES } from '../constants/roles.js'
import { AppError } from '../utils/response.js'

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
      ) AS instructorEmail,
      (
        SELECT GROUP_CONCAT(c2.display_name, '||')
        FROM student_courses sc
        JOIN courses c2 ON c2.id = sc.course_id
        WHERE sc.student_id = s.id AND sc.term_id = t.id
      ) AS enrolled_courses
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

    const placeholders = courseIds.map(() => '?').join(', ')
    sql += ` AND EXISTS (
      SELECT 1 FROM student_courses sc
      WHERE sc.student_id = s.id AND sc.term_id = ? AND sc.course_id IN (${placeholders})
    )`
    params.push(termId, ...courseIds)
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
      const placeholders = faculty.courses.map(() => '?').join(', ')
      sql += ` AND EXISTS (
        SELECT 1 FROM student_courses sc
        JOIN courses fc_c ON fc_c.id = sc.course_id
        JOIN terms tsc ON tsc.id = sc.term_id AND tsc.is_current = 1
        WHERE sc.student_id = s.id AND fc_c.display_name IN (${placeholders})
      )`
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
    sql += ` AND (
      LOWER(s.name) LIKE ?
      OR LOWER(s.id) LIKE ?
      OR LOWER(c.display_name) LIKE ?
      OR EXISTS (
        SELECT 1 FROM student_courses sc
        JOIN courses c2 ON c2.id = sc.course_id
        WHERE sc.student_id = s.id AND LOWER(c2.display_name) LIKE ?
      )
    )`
    params.push(q, q, q, q)
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

function parseCourseList(value, fallback) {
  const fromConcat = value ? String(value).split('||').map((name) => name.trim()).filter(Boolean) : []
  if (fromConcat.length) return [...new Set(fromConcat)]
  return fallback ? [fallback] : []
}

export function enrolledCourses(student) {
  if (Array.isArray(student?.courses) && student.courses.length) return student.courses
  return student?.course ? [student.course] : []
}

export function studentInAnyCourse(student, courseNames = []) {
  const enrolled = enrolledCourses(student)
  return courseNames.some((name) => enrolled.includes(name))
}

export function studentInCourse(student, courseName) {
  return enrolledCourses(student).includes(courseName)
}

function formatStudent(row) {
  const courses = parseCourseList(row.enrolled_courses, row.course)
  return {
    id: row.id,
    name: row.name,
    course: courses[0] ?? row.course,
    courses,
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
      WHERE u.id = ? AND r.name IN ('Faculty', 'Department Head')
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
    const classStudents = allStudents.filter((s) => studentInAnyCourse(s, member.courses ?? []))
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

function assertCanManageStudents(actor) {
  if (!actor?.role) throw new AppError('Authentication required', 401, 'UNAUTHORIZED')
  if (!INSTITUTION_WIDE_ROLES.has(actor.role)) {
    throw new AppError('Insufficient permissions', 403, 'FORBIDDEN')
  }
}

function mapManagedStudent(row) {
  const courses = parseCourseList(row.courses, row.course)
  return {
    id: row.id,
    name: row.name,
    email: null,
    workEmail: null,
    role: ROLES.STUDENT,
    department: row.department,
    status: row.is_active ? 'Active' : 'Disabled',
    courses,
    kind: 'student',
    invitedAt: null,
    inviteExpiresAt: null,
  }
}

const managedStudentSelect = `
  SELECT
    s.id,
    s.name,
    s.is_active,
    c.display_name AS course,
    d.name AS department,
    (
      SELECT GROUP_CONCAT(c2.display_name, '||')
      FROM student_courses sc
      JOIN courses c2 ON c2.id = sc.course_id
      JOIN terms t ON t.id = sc.term_id AND t.is_current = 1
      WHERE sc.student_id = s.id
    ) AS courses
  FROM students s
  JOIN courses c ON c.id = s.course_id
  JOIN departments d ON d.id = s.department_id
`

function resolveDepartmentCourses(departmentId, courseNames) {
  const db = getDb()
  const names = [...new Set((courseNames ?? []).map((name) => String(name).trim()).filter(Boolean))]
  if (!names.length) throw new AppError('Assign at least one course to this student', 400, 'COURSES_REQUIRED')

  const rows = names.map((name) => {
    const course = db
      .prepare('SELECT id, display_name FROM courses WHERE display_name = ? AND department_id = ?')
      .get(name, departmentId)
    if (!course) throw new AppError(`Unknown course for this department: ${name}`, 400, 'INVALID_COURSE')
    return course
  })

  return rows
}

function syncStudentCourses(studentId, courseIds, termId) {
  const db = getDb()
  db.prepare('DELETE FROM student_courses WHERE student_id = ? AND term_id = ?').run(studentId, termId)
  const insert = db.prepare(
    `INSERT INTO student_courses (student_id, course_id, term_id) VALUES (?, ?, ?)`,
  )
  for (const courseId of courseIds) {
    insert.run(studentId, courseId, termId)
  }
}

function loadManagedStudent(id) {
  const db = getDb()
  const row = db.prepare(`${managedStudentSelect} WHERE s.id = ?`).get(id)
  return row ? mapManagedStudent(row) : null
}

export function listManagedStudents({ search, status } = {}) {
  const db = getDb()
  let sql = `${managedStudentSelect} WHERE 1 = 1`
  const params = []

  if (search?.trim()) {
    sql += ` AND (
      LOWER(s.name) LIKE ?
      OR LOWER(s.id) LIKE ?
      OR LOWER(c.display_name) LIKE ?
      OR EXISTS (
        SELECT 1 FROM student_courses sc
        JOIN courses c2 ON c2.id = sc.course_id
        WHERE sc.student_id = s.id AND LOWER(c2.display_name) LIKE ?
      )
    )`
    const q = `%${search.trim().toLowerCase()}%`
    params.push(q, q, q, q)
  }

  if (status === 'Active') sql += ' AND s.is_active = 1'
  if (status === 'Disabled') sql += ' AND s.is_active = 0'

  sql += ' ORDER BY s.name'
  return db.prepare(sql).all(...params).map(mapManagedStudent)
}

export function createStudent(payload, actor) {
  assertCanManageStudents(actor)

  const name = String(payload?.name ?? '').trim()
  const departmentName = String(payload?.department ?? '').trim()
  const courseNames = Array.isArray(payload?.courses)
    ? payload.courses
    : payload?.course
      ? [payload.course]
      : []

  if (!name) throw new AppError('Student name is required', 400, 'VALIDATION_ERROR')
  if (!departmentName) throw new AppError('Department is required', 400, 'INVALID_DEPARTMENT')

  const db = getDb()
  const dept = db.prepare('SELECT id FROM departments WHERE name = ?').get(departmentName)
  if (!dept) throw new AppError('Invalid department', 400, 'INVALID_DEPARTMENT')

  const courseRows = resolveDepartmentCourses(dept.id, courseNames)
  const { id: termId } = getCurrentTerm()
  const id = `STU-${Date.now().toString(36).toUpperCase()}`

  const create = db.transaction(() => {
    db.prepare(
      `INSERT INTO students (id, name, course_id, department_id, is_active) VALUES (?, ?, ?, ?, 1)`,
    ).run(id, name, courseRows[0].id, dept.id)

    syncStudentCourses(id, courseRows.map((row) => row.id), termId)

    db.prepare(
      `
      INSERT INTO student_metrics
        (student_id, term_id, attendance, gpa, lms_activity, late_assignments, risk_score, risk_level, trend)
      VALUES (?, ?, 100, 4.0, 100, 0, 8, 'Low', 'flat')
    `,
    ).run(id, termId)
  })

  create()
  return { user: loadManagedStudent(id), added: true }
}

export function updateStudent(id, payload, actor) {
  assertCanManageStudents(actor)
  const existing = loadManagedStudent(id)
  if (!existing) throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND')

  const name = String(payload?.name ?? existing.name).trim()
  const departmentName = String(payload?.department ?? existing.department).trim()
  const courseNames = Array.isArray(payload?.courses) && payload.courses.length
    ? payload.courses
    : existing.courses

  const db = getDb()
  const dept = db.prepare('SELECT id FROM departments WHERE name = ?').get(departmentName)
  if (!dept) throw new AppError('Invalid department', 400, 'INVALID_DEPARTMENT')

  const courseRows = resolveDepartmentCourses(dept.id, courseNames)
  const { id: termId } = getCurrentTerm()

  const update = db.transaction(() => {
    db.prepare(
      `
      UPDATE students
      SET name = ?, course_id = ?, department_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `,
    ).run(name, courseRows[0].id, dept.id, id)

    syncStudentCourses(id, courseRows.map((row) => row.id), termId)
  })

  update()
  return loadManagedStudent(id)
}

export function toggleStudentStatus(id, actor) {
  assertCanManageStudents(actor)
  const db = getDb()
  const row = db.prepare('SELECT is_active FROM students WHERE id = ?').get(id)
  if (!row) throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND')
  db.prepare(
    `UPDATE students SET is_active = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(row.is_active ? 0 : 1, id)
  return loadManagedStudent(id)
}

export function deleteStudent(id, actor) {
  assertCanManageStudents(actor)
  const db = getDb()
  const result = db.prepare('DELETE FROM students WHERE id = ?').run(id)
  if (result.changes === 0) throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND')
  return { id }
}
