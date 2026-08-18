import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { getDb } from '../db/connection.js'
import { AppError } from '../utils/response.js'
import { ROLES } from '../constants/roles.js'
import { getSmtpConfigStatus, sendPasswordResetEmail } from './email.service.js'

const ROLE_NAMES = {
  faculty: ROLES.FACULTY,
  department_head: ROLES.DEPARTMENT_HEAD,
  academic_admin: ROLES.ADMIN,
  director_dean: ROLES.DIRECTOR,
  administrative_staff: ROLES.STAFF,
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function getCurrentTermId(db) {
  const term = db.prepare('SELECT id, name FROM terms WHERE is_current = 1 LIMIT 1').get()
  if (!term) throw new AppError('No active term configured', 500, 'NO_ACTIVE_TERM')
  return term
}

export function mapUserRow(row, courses = []) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role_name,
    department: row.department_name ?? undefined,
    status: row.status,
    avatarUrl: row.avatar_url
      ? `${row.avatar_url}${row.updated_at ? `?v=${encodeURIComponent(row.updated_at)}` : ''}`
      : null,
    courses: courses.length ? courses : undefined,
  }
}

export function loadUserById(userId) {
  const db = getDb()
  const row = db
    .prepare(
      `
      SELECT u.id, u.email, u.name, u.status, u.avatar_url, u.updated_at, r.name AS role_name, d.name AS department_name
      FROM users u
      JOIN roles r ON r.id = u.role_id
      LEFT JOIN departments d ON d.id = u.department_id
      WHERE u.id = ?
    `,
    )
    .get(userId)

  if (!row) return null

  const { id: termId } = getCurrentTermId(db)
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
    .all(userId, termId)
    .map((c) => c.course)

  return mapUserRow(row, courses)
}

export function login(email, password, role) {
  const db = getDb()

  const row = db
    .prepare(
      `
      SELECT u.*, r.name AS role_name, d.name AS department_name
      FROM users u
      JOIN roles r ON r.id = u.role_id
      LEFT JOIN departments d ON d.id = u.department_id
      WHERE u.email = ? COLLATE NOCASE
    `,
    )
    .get(email.trim())

  if (!row) throw new AppError('Invalid email, password, or role', 401, 'INVALID_CREDENTIALS')
  if (row.status === 'Disabled') throw new AppError('Account is disabled', 403, 'ACCOUNT_DISABLED')
  if (row.status === 'Invited') throw new AppError('Please accept your invitation before signing in', 403, 'ACCOUNT_INVITED')

  // Merged-role login support:
  // - Department Head behaves like Faculty
  // - Administrative Staff behaves like Academic Admin
  const roleMatches =
    row.role_name === role ||
    (role === ROLES.FACULTY && row.role_name === ROLES.DEPARTMENT_HEAD) ||
    (role === ROLES.ADMIN && row.role_name === ROLES.STAFF)

  if (!roleMatches) throw new AppError('Invalid email, password, or role', 401, 'INVALID_CREDENTIALS')
  if (!bcrypt.compareSync(password, row.password_hash)) {
    throw new AppError('Invalid email, password, or role', 401, 'INVALID_CREDENTIALS')
  }

  const token = jwt.sign({ sub: row.id, role: row.role_name }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  })

  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  db.prepare(
    `
    INSERT INTO auth_sessions (id, user_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `,
  ).run(sessionId, row.id, hashToken(token), expiresAt)

  db.prepare(`UPDATE users SET last_login_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run(
    row.id,
  )

  const user = loadUserById(row.id)
  return { token, user }
}

export function verifyToken(token) {
  if (!token) throw new AppError('Authentication required', 401, 'UNAUTHORIZED')

  let payload
  try {
    payload = jwt.verify(token, env.jwtSecret)
  } catch {
    throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN')
  }

  const db = getDb()
  const session = db
    .prepare(
      `
      SELECT id FROM auth_sessions
      WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > datetime('now')
    `,
    )
    .get(hashToken(token))

  if (!session) throw new AppError('Session expired or revoked', 401, 'SESSION_EXPIRED')

  const user = loadUserById(payload.sub)
  if (!user) throw new AppError('User not found', 401, 'USER_NOT_FOUND')
  if (user.status === 'Disabled') throw new AppError('Account is disabled', 403, 'ACCOUNT_DISABLED')

  return user
}

export function logout(token) {
  if (!token) return
  const db = getDb()
  db.prepare(
    `UPDATE auth_sessions SET revoked_at = datetime('now') WHERE token_hash = ? AND revoked_at IS NULL`,
  ).run(hashToken(token))
}

export function getDemoAccounts() {
  const db = getDb()
  const passwords = {
    'faculty@university.edu': 'faculty123',
    'admin@university.edu': 'admin123',
    'head@university.edu': 'head123',
    'director@university.edu': 'director123',
    'staff@university.edu': 'staff123',
  }

  return db
    .prepare(
      `
      SELECT u.name, u.email, r.name AS role
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id IN ('USR-001', 'USR-002', 'USR-003', 'USR-004', 'USR-005')
      ORDER BY
        CASE u.id
          WHEN 'USR-004' THEN 1
          WHEN 'USR-002' THEN 2
          WHEN 'USR-003' THEN 3
          WHEN 'USR-001' THEN 4
          WHEN 'USR-005' THEN 5
          ELSE 9
        END
    `,
    )
    .all()
    .map((row) => ({
      name: row.name,
      email: row.email,
      role: row.role,
      password: passwords[row.email] ?? 'changeme123',
    }))
}

export function getCurrentTerm() {
  return getCurrentTermId(getDb())
}

export function getInviteByToken(rawToken) {
  if (!rawToken?.trim()) throw new AppError('Invitation token is required', 400, 'TOKEN_REQUIRED')

  const db = getDb()
  const row = db
    .prepare(
      `
      SELECT
        u.id, u.name, u.email, u.work_email, u.status,
        u.invite_expires_at, u.password_set_at, r.name AS role_name, d.name AS department_name
      FROM users u
      JOIN roles r ON r.id = u.role_id
      LEFT JOIN departments d ON d.id = u.department_id
      WHERE u.invite_token_hash = ?
    `,
    )
    .get(hashToken(rawToken.trim()))

  if (!row) throw new AppError('This invitation link is invalid or has already been used', 404, 'INVITE_NOT_FOUND')
  if (row.status === 'Disabled') throw new AppError('This account has been disabled', 403, 'ACCOUNT_DISABLED')
  if (row.status === 'Active') {
    throw new AppError('This invitation has already been accepted. Please sign in.', 409, 'INVITE_USED')
  }
  if (row.invite_expires_at && new Date(row.invite_expires_at) < new Date()) {
    throw new AppError('This invitation has expired. Ask your administrator to resend it.', 410, 'INVITE_EXPIRED')
  }

  const { id: termId } = getCurrentTermId(db)
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

  return {
    name: row.name,
    email: row.email,
    workEmail: row.work_email ?? row.email,
    role: row.role_name,
    department: row.department_name ?? undefined,
    courses,
    expiresAt: row.invite_expires_at,
  }
}

export function acceptInvite(rawToken, password) {
  if (!rawToken?.trim()) throw new AppError('Invitation token is required', 400, 'TOKEN_REQUIRED')
  if (!password || password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400, 'WEAK_PASSWORD')
  }

  const db = getDb()
  const row = db
    .prepare(
      `
      SELECT u.id, u.status, u.invite_expires_at, r.name AS role_name
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.invite_token_hash = ?
    `,
    )
    .get(hashToken(rawToken.trim()))

  if (!row) throw new AppError('This invitation link is invalid or has already been used', 404, 'INVITE_NOT_FOUND')
  if (row.status === 'Disabled') throw new AppError('This account has been disabled', 403, 'ACCOUNT_DISABLED')
  if (row.invite_expires_at && new Date(row.invite_expires_at) < new Date()) {
    throw new AppError('This invitation has expired. Ask your administrator to resend it.', 410, 'INVITE_EXPIRED')
  }

  const passwordHash = bcrypt.hashSync(password, 10)

  db.prepare(
    `
    UPDATE users
    SET password_hash = ?,
        status = 'Active',
        password_set_at = datetime('now'),
        invite_token_hash = NULL,
        invite_expires_at = NULL,
        updated_at = datetime('now')
    WHERE id = ?
  `,
  ).run(passwordHash, row.id)

  // Auto-login after activation
  const userRow = db
    .prepare(
      `
      SELECT u.*, r.name AS role_name, d.name AS department_name
      FROM users u
      JOIN roles r ON r.id = u.role_id
      LEFT JOIN departments d ON d.id = u.department_id
      WHERE u.id = ?
    `,
    )
    .get(row.id)

  const token = jwt.sign({ sub: userRow.id, role: userRow.role_name }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  })

  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  db.prepare(
    `
    INSERT INTO auth_sessions (id, user_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `,
  ).run(sessionId, userRow.id, hashToken(token), expiresAt)

  db.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).run(userRow.id)

  return { token, user: loadUserById(userRow.id) }
}

function buildResetUrl(rawToken) {
  const token = encodeURIComponent(rawToken)
  if (env.isProduction) {
    const origin = String(env.appBaseUrl || '').replace(/\/$/, '')
    if (!origin || /localhost|127\.0\.0\.1/i.test(origin)) {
      throw new AppError(
        'APP_BASE_URL must be your public application URL so reset emails contain a reachable link.',
        500,
        'INVALID_APP_BASE_URL',
      )
    }
    return `${origin}/reset-password?token=${token}`
  }

  // Windows often refuses the LAN IP. Same-PC Gmail/Chrome can open localhost Vite.
  return `http://localhost:5173/reset-password?token=${token}`
}

const GENERIC_RESET_RESPONSE = {
  sent: true,
  message: 'If an account exists for that email, a reset link has been sent.',
}

export async function requestPasswordReset(email) {
  const address = String(email ?? '').trim().toLowerCase()
  if (!address || !address.includes('@')) {
    throw new AppError('Enter a valid email address.', 400, 'INVALID_EMAIL')
  }

  const smtp = getSmtpConfigStatus()
  if (!smtp.configured) {
    throw new AppError(smtp.reason, 503, 'EMAIL_NOT_CONFIGURED')
  }

  const db = getDb()
  const user = db
    .prepare(
      `
      SELECT u.id, u.name, u.email, u.work_email, u.status
      FROM users u
      WHERE LOWER(u.email) = ? OR LOWER(COALESCE(u.work_email, '')) = ?
    `,
    )
    .get(address, address)

  if (!user || user.status !== 'Active') {
    return GENERIC_RESET_RESPONSE
  }

  db.prepare(
    `
    UPDATE password_reset_tokens
    SET used_at = datetime('now')
    WHERE user_id = ? AND used_at IS NULL
  `,
  ).run(user.id)

  const rawToken = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + env.passwordResetExpiryMinutes * 60 * 1000).toISOString()

  db.prepare(
    `
    INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `,
  ).run(crypto.randomUUID(), user.id, hashToken(rawToken), expiresAt)

  const resetUrl = buildResetUrl(rawToken)
  await sendPasswordResetEmail({
    to: address,
    name: user.name,
    resetUrl,
  })

  return env.isProduction ? GENERIC_RESET_RESPONSE : { ...GENERIC_RESET_RESPONSE, resetUrl }
}

export function getPasswordResetByToken(rawToken) {
  if (!rawToken?.trim()) throw new AppError('Reset token is required', 400, 'TOKEN_REQUIRED')

  const db = getDb()
  const row = db
    .prepare(
      `
      SELECT t.id, t.expires_at, t.used_at, u.name, u.email, u.status
      FROM password_reset_tokens t
      JOIN users u ON u.id = t.user_id
      WHERE t.token_hash = ?
    `,
    )
    .get(hashToken(rawToken.trim()))

  if (!row || row.used_at) {
    throw new AppError('This reset link is invalid or has already been used.', 404, 'RESET_NOT_FOUND')
  }
  if (row.status === 'Disabled') {
    throw new AppError('This account has been disabled.', 403, 'ACCOUNT_DISABLED')
  }
  if (new Date(row.expires_at) < new Date()) {
    throw new AppError('This reset link has expired. Request a new one from the sign-in page.', 410, 'RESET_EXPIRED')
  }

  return { name: row.name, email: row.email, expiresAt: row.expires_at }
}

export function resetPassword(rawToken, password) {
  if (!rawToken?.trim()) throw new AppError('Reset token is required', 400, 'TOKEN_REQUIRED')
  if (!password || password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400, 'WEAK_PASSWORD')
  }

  const db = getDb()
  const row = db
    .prepare(
      `
      SELECT t.id, t.user_id, t.expires_at, t.used_at, u.status
      FROM password_reset_tokens t
      JOIN users u ON u.id = t.user_id
      WHERE t.token_hash = ?
    `,
    )
    .get(hashToken(rawToken.trim()))

  if (!row || row.used_at) {
    throw new AppError('This reset link is invalid or has already been used.', 404, 'RESET_NOT_FOUND')
  }
  if (row.status === 'Disabled') {
    throw new AppError('This account has been disabled.', 403, 'ACCOUNT_DISABLED')
  }
  if (new Date(row.expires_at) < new Date()) {
    throw new AppError('This reset link has expired. Request a new one from the sign-in page.', 410, 'RESET_EXPIRED')
  }

  const passwordHash = bcrypt.hashSync(password, 10)

  db.prepare(
    `
    UPDATE users
    SET password_hash = ?,
        password_set_at = datetime('now'),
        updated_at = datetime('now')
    WHERE id = ?
  `,
  ).run(passwordHash, row.user_id)

  db.prepare(`UPDATE password_reset_tokens SET used_at = datetime('now') WHERE id = ?`).run(row.id)
  db.prepare(
    `UPDATE password_reset_tokens SET used_at = datetime('now') WHERE user_id = ? AND used_at IS NULL`,
  ).run(row.user_id)
  db.prepare(
    `UPDATE auth_sessions SET revoked_at = datetime('now') WHERE user_id = ? AND revoked_at IS NULL`,
  ).run(row.user_id)

  return { reset: true }
}

export { ROLE_NAMES }
