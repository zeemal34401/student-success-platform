import { getDb } from '../db/connection.js'
import { getCurrentTerm } from './auth.service.js'
import { AppError } from '../utils/response.js'
import {
  computeFacultyRiskSummary,
  computeStudentStats,
  getFacultyById,
  getTopRiskStudents,
  listStudents,
  studentInAnyCourse,
  studentInCourse,
  ROLES,
} from './students.service.js'
import { generateEngagementTrend } from '../utils/risk.js'

export function getFacultyDashboard(user) {
  const students = listStudents(user)
  const stats = computeStudentStats(students)
  const engagementTrend = generateEngagementTrend(students)
  const topRiskStudents = getTopRiskStudents(user, 5)
  const { name: term } = getCurrentTerm()
  const courseCount =
    user.courses?.length ?? new Set(students.map((s) => s.course)).size

  return {
    stats,
    engagementTrend,
    topRiskStudents,
    meta: { term, courseCount },
  }
}

export function getDepartmentDashboard(user) {
  const students = listStudents(user)
  const stats = computeStudentStats(students)
  const topRiskStudents = getTopRiskStudents(user, 5)
  const facultySummary = getDepartmentFacultySummary(user)
  const { name: term } = getCurrentTerm()

  return {
    stats,
    facultySummary,
    topRiskStudents,
    meta: { term, department: user.department },
  }
}

function getDepartmentFacultySummary(user) {
  const db = getDb()
  const { id: termId } = getCurrentTerm()

  const faculty = db
    .prepare(
      `
      SELECT u.id, u.name, u.email
      FROM users u
      JOIN roles r ON r.id = u.role_id
      JOIN departments d ON d.id = u.department_id
      WHERE r.name = 'Faculty' AND d.name = ?
      ORDER BY u.name
    `,
    )
    .all(user.department)
    .map((row) => {
      const courses = db
        .prepare(
          `
          SELECT c.display_name AS course
          FROM faculty_courses fc
          JOIN courses c ON c.id = fc.course_id
          WHERE fc.user_id = ? AND fc.term_id = ?
        `,
        )
        .all(row.id, termId)
        .map((c) => c.course)

      return { ...row, courses }
    })

  const allStudents = listStudents({ role: ROLES.ADMIN })
  return computeFacultyRiskSummary(faculty, allStudents)
}

export function getFacultyOverview(user) {
  const db = getDb()
  const { id: termId, name: term } = getCurrentTerm()
  const department = user.department

  const deptStudents = listStudents(user)
  const facultyRows = db
    .prepare(
      `
      SELECT u.id, u.name, u.email
      FROM users u
      JOIN roles r ON r.id = u.role_id
      JOIN departments d ON d.id = u.department_id
      WHERE r.name = 'Faculty' AND d.name = ?
    `,
    )
    .all(department)

  const faculty = facultyRows
    .map((row) => {
      const courses = db
        .prepare(
          `
          SELECT c.display_name AS course
          FROM faculty_courses fc
          JOIN courses c ON c.id = fc.course_id
          WHERE fc.user_id = ? AND fc.term_id = ?
        `,
        )
        .all(row.id, termId)
        .map((c) => c.course)

      const sectionStudents = deptStudents.filter((s) => studentInAnyCourse(s, courses))
      const studentCount = sectionStudents.length
      const atRiskCount = sectionStudents.filter(
        (s) => s.riskLevel === 'Critical' || s.riskLevel === 'High',
      ).length
      const hasCriticalStudent = sectionStudents.some((s) => s.riskLevel === 'Critical')

      if (studentCount === 0) {
        return {
          id: row.id,
          name: row.name,
          email: row.email,
          courses,
          studentCount: 0,
          avgRiskScore: null,
          avgClassRiskLevel: 'Low',
          atRiskCount: 0,
          hasCriticalStudent: false,
          sectionStudents: [],
        }
      }

      const avgRiskScore = Math.round(
        sectionStudents.reduce((sum, s) => sum + s.riskScore, 0) / studentCount,
      )

      const avgClassRiskLevel =
        avgRiskScore >= 75 ? 'Critical' : avgRiskScore >= 55 ? 'High' : avgRiskScore >= 35 ? 'Medium' : 'Low'

      return {
        id: row.id,
        name: row.name,
        email: row.email,
        courses,
        studentCount,
        avgRiskScore,
        avgClassRiskLevel,
        atRiskCount,
        hasCriticalStudent,
        sectionStudents,
      }
    })
    .sort((a, b) => b.atRiskCount - a.atRiskCount)

  const activeFaculty = faculty.filter((f) => f.studentCount > 0)
  const avgDepartmentRisk =
    activeFaculty.length > 0
      ? Math.round(
          activeFaculty.reduce((sum, f) => sum + f.avgRiskScore, 0) / activeFaculty.length,
        )
      : 0

  return {
    faculty,
    summary: {
      totalFaculty: faculty.length,
      avgDepartmentRisk,
      avgDepartmentRiskLevel:
        avgDepartmentRisk >= 75
          ? 'Critical'
          : avgDepartmentRisk >= 55
            ? 'High'
            : avgDepartmentRisk >= 35
              ? 'Medium'
              : 'Low',
      facultyWithCritical: faculty.filter((f) => f.hasCriticalStudent).length,
    },
    meta: { term, department },
  }
}

export function getFacultyMember(facultyId, user) {
  const faculty = getFacultyById(facultyId)
  if (!faculty) return null

  if (user.role === ROLES.ADMIN || user.role === ROLES.DIRECTOR || user.role === ROLES.STAFF) {
    return faculty
  }

  if (user.role === ROLES.DEPARTMENT_HEAD) {
    return faculty.department === user.department ? faculty : null
  }

  if (user.role === ROLES.FACULTY) {
    return faculty.id === user.id ? faculty : null
  }

  return null
}

/** Director / Dean — university performance, high-risk students, department comparison */
export function getDirectorDashboard(user) {
  const students = listStudents(user)
  const stats = computeStudentStats(students)
  const topRiskStudents = getTopRiskStudents(user, 8).filter(
    (s) => s.riskLevel === 'Critical' || s.riskLevel === 'High',
  )
  const departmentComparison = getDepartmentComparison()
  const { name: term } = getCurrentTerm()

  const highRiskCount = students.filter(
    (s) => s.riskLevel === 'Critical' || s.riskLevel === 'High',
  ).length

  return {
    stats: {
      ...stats,
      highRiskCount,
      departmentCount: departmentComparison.length,
    },
    departmentComparison,
    topRiskStudents,
    meta: { term, scope: 'university' },
  }
}

/** Academic Admin — academic performance across departments, faculty/course statistics */
export function getAcademicAdminDashboard(user) {
  const students = listStudents(user)
  const stats = computeStudentStats(students)
  const departmentComparison = getDepartmentComparison()
  const facultyCourseStats = getFacultyCourseStats()
  const { name: term } = getCurrentTerm()

  return {
    stats: {
      ...stats,
      facultyCount: facultyCourseStats.length,
      courseCount: new Set(facultyCourseStats.flatMap((f) => f.courses)).size,
      departmentCount: departmentComparison.length,
    },
    departmentComparison,
    facultyCourseStats,
    topRiskStudents: getTopRiskStudents(user, 5),
    meta: { term, scope: 'academic' },
  }
}

function getDepartmentComparison() {
  const db = getDb()
  const { id: termId } = getCurrentTerm()
  const allStudents = listStudents({ role: ROLES.ADMIN })

  const departments = db.prepare('SELECT id, name FROM departments ORDER BY name').all()
  const uniqueDepartments = []
  const seenNames = new Set()
  for (const dept of departments) {
    if (seenNames.has(dept.name)) continue
    seenNames.add(dept.name)
    uniqueDepartments.push(dept)
  }

  return uniqueDepartments.map((dept) => {
    const deptStudents = allStudents.filter((s) => s.department === dept.name)
    const enrolled = deptStudents.length
    const atRiskCount = deptStudents.filter(
      (s) => s.riskLevel === 'Critical' || s.riskLevel === 'High',
    ).length
    const criticalCount = deptStudents.filter((s) => s.riskLevel === 'Critical').length
    const avgAttendance =
      enrolled > 0
        ? Math.round(deptStudents.reduce((sum, s) => sum + s.attendance, 0) / enrolled)
        : 0
    const avgGpa =
      enrolled > 0
        ? Number((deptStudents.reduce((sum, s) => sum + s.gpa, 0) / enrolled).toFixed(2))
        : 0
    const avgRiskScore =
      enrolled > 0
        ? Math.round(deptStudents.reduce((sum, s) => sum + s.riskScore, 0) / enrolled)
        : 0

    const snapshot = db
      .prepare(
        `
        SELECT total_students AS totalStudents
        FROM department_risk_snapshots
        WHERE department_id = ? AND term_id = ?
      `,
      )
      .get(dept.id, termId)

    return {
      id: dept.id,
      department: dept.name,
      enrolled: snapshot?.totalStudents ?? enrolled,
      sampleEnrolled: enrolled,
      atRiskCount,
      criticalCount,
      avgAttendance,
      avgGpa,
      avgRiskScore,
      riskShare: enrolled > 0 ? Math.round((atRiskCount / enrolled) * 100) : 0,
    }
  })
}

function summarizeGroup(students) {
  const enrolled = students.length
  const atRiskCount = students.filter(
    (s) => s.riskLevel === 'Critical' || s.riskLevel === 'High',
  ).length
  const criticalCount = students.filter((s) => s.riskLevel === 'Critical').length
  const avgAttendance =
    enrolled > 0 ? Math.round(students.reduce((sum, s) => sum + s.attendance, 0) / enrolled) : 0
  const avgGpa =
    enrolled > 0 ? Number((students.reduce((sum, s) => sum + s.gpa, 0) / enrolled).toFixed(2)) : 0
  const riskShare = enrolled > 0 ? Math.round((atRiskCount / enrolled) * 100) : 0

  return { enrolled, atRiskCount, criticalCount, avgAttendance, avgGpa, riskShare }
}

function assertDirectorScope(user) {
  if (user?.role !== ROLES.DIRECTOR && user?.role !== ROLES.ADMIN && user?.role !== ROLES.STAFF) {
    throw new AppError('Insufficient permissions', 403, 'FORBIDDEN')
  }
}

/** Director Academic Insights — department comparison rows */
export function getDirectorDepartments(user) {
  assertDirectorScope(user)
  return getDepartmentComparison()
}

/** Faculty in a department with the same comparison metrics */
export function getDirectorDepartmentFaculty(user, departmentName) {
  assertDirectorScope(user)
  if (!departmentName?.trim()) throw new AppError('Department is required', 400, 'VALIDATION_ERROR')

  const db = getDb()
  const { id: termId } = getCurrentTerm()
  const department = departmentName.trim()
  const allStudents = listStudents({ role: ROLES.ADMIN }).filter((s) => s.department === department)

  const faculty = db
    .prepare(
      `
      SELECT DISTINCT u.id, u.name, u.email, r.name AS role_name
      FROM users u
      JOIN roles r ON r.id = u.role_id
      LEFT JOIN departments d ON d.id = u.department_id
      LEFT JOIN faculty_courses fc ON fc.user_id = u.id AND fc.term_id = ?
      LEFT JOIN courses c ON c.id = fc.course_id
      LEFT JOIN departments cd ON cd.id = c.department_id
      WHERE r.name IN ('Faculty', 'Department Head')
        AND u.status = 'Active'
        AND (d.name = ? OR cd.name = ?)
      ORDER BY u.name
    `,
    )
    .all(termId, department, department)

  return faculty.map((row) => {
    const courses = db
      .prepare(
        `
        SELECT c.display_name AS course
        FROM faculty_courses fc
        JOIN courses c ON c.id = fc.course_id
        WHERE fc.user_id = ? AND fc.term_id = ?
        ORDER BY c.display_name
      `,
      )
      .all(row.id, termId)
      .map((c) => c.course)

    const sectionStudents = allStudents.filter((s) => studentInAnyCourse(s, courses))
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      department,
      role: row.role_name,
      courseCount: courses.length,
      ...summarizeGroup(sectionStudents),
    }
  })
}

/** Courses taught by a faculty member, with comparison metrics */
export function getDirectorFacultyCourses(user, facultyId) {
  assertDirectorScope(user)
  const faculty = getFacultyById(facultyId)
  if (!faculty) throw new AppError('Faculty member not found', 404, 'FACULTY_NOT_FOUND')

  const allStudents = listStudents({ role: ROLES.ADMIN })
  const departmentStudents = faculty.department
    ? allStudents.filter((s) => s.department === faculty.department)
    : allStudents

  return (faculty.courses ?? []).map((course) => {
    const courseStudents = departmentStudents.filter((s) => studentInCourse(s, course))
    return {
      course,
      facultyId: faculty.id,
      facultyName: faculty.name,
      department: faculty.department ?? null,
      ...summarizeGroup(courseStudents),
    }
  })
}

/** Students in a faculty member's course */
export function getDirectorCourseStudents(user, facultyId, courseName) {
  assertDirectorScope(user)
  if (!courseName?.trim()) throw new AppError('Course is required', 400, 'VALIDATION_ERROR')

  const faculty = getFacultyById(facultyId)
  if (!faculty) throw new AppError('Faculty member not found', 404, 'FACULTY_NOT_FOUND')

  return listStudents(
    { role: ROLES.ADMIN },
    { facultyId, department: faculty.department ?? undefined },
  )
    .filter((s) => studentInCourse(s, courseName.trim()))
    .sort((a, b) => b.riskScore - a.riskScore)
}

function getFacultyCourseStats() {
  const db = getDb()
  const { id: termId } = getCurrentTerm()
  const allStudents = listStudents({ role: ROLES.ADMIN })

  const faculty = db
    .prepare(
      `
      SELECT u.id, u.name, u.email, d.name AS department
      FROM users u
      JOIN roles r ON r.id = u.role_id
      LEFT JOIN departments d ON d.id = u.department_id
      WHERE r.name = 'Faculty' AND u.status = 'Active'
      ORDER BY u.name
    `,
    )
    .all()

  return faculty.map((row) => {
    const courses = db
      .prepare(
        `
        SELECT c.display_name AS course
        FROM faculty_courses fc
        JOIN courses c ON c.id = fc.course_id
        WHERE fc.user_id = ? AND fc.term_id = ?
        ORDER BY c.display_name
      `,
      )
      .all(row.id, termId)
      .map((c) => c.course)

    const sectionStudents = allStudents.filter((s) => studentInAnyCourse(s, courses))
    const studentCount = sectionStudents.length
    const atRiskCount = sectionStudents.filter(
      (s) => s.riskLevel === 'Critical' || s.riskLevel === 'High',
    ).length

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      department: row.department ?? '—',
      courses,
      courseCount: courses.length,
      studentCount,
      atRiskCount,
    }
  })
}
