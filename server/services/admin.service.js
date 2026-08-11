import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { getDb } from '../db/connection.js'
import { AppError } from '../utils/response.js'
import { getCurrentTerm } from './auth.service.js'
import { env } from '../config/env.js'
import { sendInviteEmail, getSmtpConfigStatus } from './email.service.js'
import { assertDeliverableEmail } from './email-validation.service.js'
import { NO_DEPARTMENT_ROLES, ROLES } from '../constants/roles.js'

export { ROLES, hashToken }

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function assertEmailDeliveryReady() {
  const status = getSmtpConfigStatus()
  if (!status.configured) {
    throw new AppError(status.reason, 503, 'EMAIL_NOT_CONFIGURED')
  }
}

function createInviteToken() {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + env.inviteExpiryHours * 60 * 60 * 1000).toISOString()
  return { rawToken, tokenHash: hashToken(rawToken), expiresAt }
}

function buildInviteUrl(rawToken) {
  const base = env.appBaseUrl.replace(/\/$/, '')
  if (/localhost|127\.0\.0\.1/i.test(base) && env.isProduction) {
    throw new AppError(
      'APP_BASE_URL must be your public application URL so activation emails contain a reachable link.',
      500,
      'INVALID_APP_BASE_URL',
    )
  }
  return `${base}/accept-invite?token=${encodeURIComponent(rawToken)}`
}

function mapAdminUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    workEmail: row.work_email ?? row.email,
    role: row.role_name,
    department: row.department_name ?? 'Institution-wide',
    status: row.status,
    courses: row.courses ? String(row.courses).split('||').filter(Boolean) : [],
    invitedAt: row.invited_at ?? null,
    inviteExpiresAt: row.invite_expires_at ?? null,
  }
}

function getUserCourses(userId) {
  const db = getDb()
  const { id: termId } = getCurrentTerm()
  return db
    .prepare(
      `
      SELECT c.display_name
      FROM faculty_courses fc
      JOIN courses c ON c.id = fc.course_id
      WHERE fc.user_id = ? AND fc.term_id = ?
      ORDER BY c.display_name
    `,
    )
    .all(userId, termId)
    .map((row) => row.display_name)
}

function syncFacultyCourses(userId, courseNames = []) {
  const db = getDb()
  const { id: termId } = getCurrentTerm()

  db.prepare('DELETE FROM faculty_courses WHERE user_id = ? AND term_id = ?').run(userId, termId)

  if (!Array.isArray(courseNames) || courseNames.length === 0) return

  const insert = db.prepare(
    `INSERT INTO faculty_courses (user_id, course_id, term_id) VALUES (?, ?, ?)`,
  )

  for (const name of courseNames) {
    const course = db.prepare('SELECT id FROM courses WHERE display_name = ?').get(name)
    if (!course) {
      throw new AppError(`Unknown course: ${name}`, 400, 'INVALID_COURSE')
    }
    insert.run(userId, course.id, termId)
  }
}

function loadAdminUser(userId) {
  const db = getDb()
  const row = db
    .prepare(
      `
      SELECT
        u.id, u.name, u.email, u.work_email, u.status,
        u.invited_at, u.invite_expires_at,
        r.name AS role_name, d.name AS department_name
      FROM users u
      JOIN roles r ON r.id = u.role_id
      LEFT JOIN departments d ON d.id = u.department_id
      WHERE u.id = ?
    `,
    )
    .get(userId)

  if (!row) return null
  return {
    ...mapAdminUser({ ...row, courses: null }),
    courses: getUserCourses(userId),
  }
}

export function listAdminUsers({ search, role, status } = {}) {
  const db = getDb()
  const { id: termId } = getCurrentTerm()
  let sql = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.work_email,
      u.status,
      u.invited_at,
      u.invite_expires_at,
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

  if (search?.trim()) {
    const q = `%${search.trim().toLowerCase()}%`
    sql += ' AND (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(COALESCE(u.work_email, "")) LIKE ?)'
    params.push(q, q, q)
  }

  if (role && role !== 'All') {
    sql += ' AND r.name = ?'
    params.push(role)
  }

  if (status && status !== 'All') {
    sql += ' AND u.status = ?'
    params.push(status)
  }

  sql += ' ORDER BY u.name'

  return db.prepare(sql).all(...params).map(mapAdminUser)
}

export function getAdminStats() {
  const users = listAdminUsers()
  return {
    total: users.length,
    active: users.filter((u) => u.status === 'Active').length,
    invited: users.filter((u) => u.status === 'Invited').length,
  }
}

function deletePendingInviteUser(userId) {
  const db = getDb()
  // Children use ON DELETE CASCADE; explicit cleanup keeps rollback reliable if FKs are off.
  db.prepare('DELETE FROM faculty_courses WHERE user_id = ?').run(userId)
  db.prepare('DELETE FROM user_notification_preferences WHERE user_id = ?').run(userId)
  db.prepare('DELETE FROM users WHERE id = ?').run(userId)
}

async function issueAndSendInvite(userId, invitedByUser) {
  const db = getDb()
  const { rawToken, tokenHash, expiresAt } = createInviteToken()

  db.prepare(
    `
    UPDATE users
    SET invite_token_hash = ?,
        invite_expires_at = ?,
        invited_at = datetime('now'),
        invited_by = ?,
        status = 'Invited',
        updated_at = datetime('now')
    WHERE id = ?
  `,
  ).run(tokenHash, expiresAt, invitedByUser?.id ?? null, userId)

  const user = loadAdminUser(userId)
  if (!user?.email) {
    throw new AppError('Invited user is missing a work email address.', 500, 'INVALID_EMAIL')
  }

  const inviteUrl = buildInviteUrl(rawToken)

  const emailResult = await sendInviteEmail({
    to: user.workEmail ?? user.email,
    name: user.name,
    role: user.role,
    department: user.department === 'Institution-wide' ? null : user.department,
    courses: user.courses,
    inviteUrl,
    invitedBy: invitedByUser?.name,
  })

  // Never expose activation URLs to the admin client — delivery is email-only.
  return {
    user,
    invite: {
      expiresAt,
      email: {
        delivered: emailResult.delivered,
        mode: emailResult.mode,
        to: emailResult.to,
      },
    },
  }
}

export async function createAdminUser(payload, invitedByUser = null) {
  assertEmailDeliveryReady()

  const db = getDb()
  const roleRow = db.prepare('SELECT id FROM roles WHERE name = ?').get(payload.role)
  if (!roleRow) throw new AppError('Invalid role', 400, 'INVALID_ROLE')

  if (!payload.name?.trim() || !payload.email?.trim()) {
    throw new AppError('Name and email are required', 400, 'VALIDATION_ERROR')
  }

  // Real-time deliverability check before any account is created
  const { email } = await assertDeliverableEmail(payload.email)

  let departmentId = null
  if (!NO_DEPARTMENT_ROLES.has(payload.role)) {
    const dept = db.prepare('SELECT id FROM departments WHERE name = ?').get(payload.department)
    if (!dept) throw new AppError('Invalid department', 400, 'INVALID_DEPARTMENT')
    departmentId = dept.id
  }

  if (payload.role === ROLES.FACULTY && (!payload.courses || payload.courses.length === 0)) {
    throw new AppError('Assign at least one course to this faculty member', 400, 'COURSES_REQUIRED')
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').get(email)
  if (existing) throw new AppError('This work email is already registered in the system', 409, 'EMAIL_EXISTS')

  const id = `USR-${Date.now()}`
  // Unusable placeholder until the invitee sets their own password
  const passwordHash = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 10)

  db.prepare(
    `
    INSERT INTO users (id, email, work_email, password_hash, name, role_id, department_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Invited')
  `,
  ).run(id, email, email, passwordHash, payload.name.trim(), roleRow.id, departmentId)

  db.prepare(`INSERT INTO user_notification_preferences (user_id) VALUES (?)`).run(id)

  if (payload.role === ROLES.FACULTY) {
    syncFacultyCourses(id, payload.courses ?? [])
  }

  try {
    return await issueAndSendInvite(id, invitedByUser)
  } catch (error) {
    // Roll back the pending account if the activation email could not be delivered
    try {
      deletePendingInviteUser(id)
    } catch (rollbackError) {
      console.error('[admin] Failed to roll back invite user after email error:', rollbackError.message)
    }
    throw error
  }
}

export async function updateAdminUser(userId, payload) {
  const db = getDb()
  const existing = db.prepare('SELECT id, email FROM users WHERE id = ?').get(userId)
  if (!existing) throw new AppError('User not found', 404, 'USER_NOT_FOUND')

  const roleRow = db.prepare('SELECT id FROM roles WHERE name = ?').get(payload.role)
  if (!roleRow) throw new AppError('Invalid role', 400, 'INVALID_ROLE')

  if (!payload.name?.trim() || !payload.email?.trim()) {
    throw new AppError('Name and email are required', 400, 'VALIDATION_ERROR')
  }

  const { email } = await assertDeliverableEmail(payload.email)

  let departmentId = null
  if (!NO_DEPARTMENT_ROLES.has(payload.role)) {
    const dept = db.prepare('SELECT id FROM departments WHERE name = ?').get(payload.department)
    if (!dept) throw new AppError('Invalid department', 400, 'INVALID_DEPARTMENT')
    departmentId = dept.id
  }

  if (payload.role === ROLES.FACULTY && (!payload.courses || payload.courses.length === 0)) {
    throw new AppError('Assign at least one course to this faculty member', 400, 'COURSES_REQUIRED')
  }

  const emailConflict = db
    .prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE AND id != ?')
    .get(email, userId)
  if (emailConflict) throw new AppError('This work email is already registered in the system', 409, 'EMAIL_EXISTS')

  db.prepare(
    `
    UPDATE users
    SET name = ?, email = ?, work_email = ?, role_id = ?, department_id = ?, updated_at = datetime('now')
    WHERE id = ?
  `,
  ).run(payload.name.trim(), email, email, roleRow.id, departmentId, userId)

  if (payload.role === ROLES.FACULTY) {
    syncFacultyCourses(userId, payload.courses ?? [])
  } else {
    const { id: termId } = getCurrentTerm()
    db.prepare('DELETE FROM faculty_courses WHERE user_id = ? AND term_id = ?').run(userId, termId)
  }

  return loadAdminUser(userId)
}

export async function resendInvite(userId, invitedByUser = null) {
  assertEmailDeliveryReady()

  const db = getDb()
  const user = db
    .prepare(
      `
      SELECT u.id, u.status, r.name AS role_name
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = ?
    `,
    )
    .get(userId)

  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND')
  if (user.status === 'Disabled') {
    throw new AppError('Cannot invite a disabled account. Enable it first.', 400, 'ACCOUNT_DISABLED')
  }
  if (user.status === 'Active') {
    throw new AppError('This account is already active', 400, 'ALREADY_ACTIVE')
  }

  return issueAndSendInvite(userId, invitedByUser)
}

export function toggleAdminUserStatus(userId) {
  const db = getDb()
  const user = db.prepare('SELECT id, status FROM users WHERE id = ?').get(userId)
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND')

  let nextStatus
  if (user.status === 'Disabled') nextStatus = 'Active'
  else if (user.status === 'Active') nextStatus = 'Disabled'
  else if (user.status === 'Invited') {
    throw new AppError(
      'Invited accounts must activate via their invitation link. Use Resend invite instead.',
      400,
      'INVITE_PENDING',
    )
  } else {
    nextStatus = 'Disabled'
  }

  db.prepare(`UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(nextStatus, userId)
  return loadAdminUser(userId)
}

export function deleteAdminUser(userId) {
  const db = getDb()
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(userId)
  if (result.changes === 0) throw new AppError('User not found', 404, 'USER_NOT_FOUND')
  return { id: userId }
}

export function listDepartments() {
  const db = getDb()
  return db.prepare('SELECT name FROM departments ORDER BY name').all().map((d) => d.name)
}

export function listCourses({ department } = {}) {
  const db = getDb()
  let sql = `
    SELECT c.display_name AS name, d.name AS department
    FROM courses c
    JOIN departments d ON d.id = c.department_id
    WHERE c.is_active = 1
  `
  const params = []

  if (department && department !== 'All' && department !== 'Institution-wide') {
    sql += ' AND d.name = ?'
    params.push(department)
  }

  sql += ' ORDER BY c.display_name'
  return db.prepare(sql).all(...params)
}
