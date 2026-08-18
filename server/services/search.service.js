import { ROLES } from '../constants/roles.js'
import { getDb } from '../db/connection.js'
import { getCurrentTerm } from './auth.service.js'
import { searchStudents } from './students.service.js'

function searchStaff(query) {
  const db = getDb()
  const { id: termId } = getCurrentTerm()
  const q = String(query ?? '').trim().toLowerCase()

  let sql = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.work_email,
      u.status,
      r.name AS role_name,
      d.name AS department_name,
      (
        SELECT GROUP_CONCAT(c.display_name, '||')
        FROM faculty_courses fc
        JOIN courses c ON c.id = fc.course_id
        WHERE fc.user_id = u.id AND fc.term_id = ?
      ) AS courses
    FROM users u
    JOIN roles r ON r.id = u.role_id
    LEFT JOIN departments d ON d.id = u.department_id
    WHERE 1 = 1
  `
  const params = [termId]

  if (q) {
    sql += `
      AND (
        LOWER(u.name) LIKE ?
        OR LOWER(u.email) LIKE ?
        OR LOWER(COALESCE(u.work_email, '')) LIKE ?
        OR LOWER(r.name) LIKE ?
        OR LOWER(COALESCE(d.name, '')) LIKE ?
      )
    `
    const like = `%${q}%`
    params.push(like, like, like, like, like)
  }

  sql += ' ORDER BY u.name'

  return db.prepare(sql).all(...params).map((row) => ({
    kind: 'staff',
    id: row.id,
    name: row.name,
    role: row.role_name,
    email: row.work_email ?? row.email,
    department: row.department_name ?? 'Institution-wide',
    status: row.status,
    course: row.courses ? String(row.courses).split('||').filter(Boolean)[0] ?? null : null,
    courses: row.courses ? String(row.courses).split('||').filter(Boolean) : [],
    riskLevel: null,
    riskScore: null,
  }))
}

export function searchPeople(user, query) {
  const students = searchStudents(user, query).map((student) => ({
    kind: 'student',
    id: student.id,
    name: student.name,
    role: 'Student',
    email: null,
    department: student.department,
    status: null,
    course: student.course,
    courses: student.courses?.length ? student.courses : student.course ? [student.course] : [],
    riskLevel: student.riskLevel,
    riskScore: student.riskScore,
  }))

  const canSearchStaff =
    user.role === ROLES.DIRECTOR || user.role === ROLES.ADMIN || user.role === ROLES.STAFF

  if (!canSearchStaff) {
    return students
  }

  return [...searchStaff(query), ...students]
}
