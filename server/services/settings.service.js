import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDb } from '../db/connection.js'
import { loadUserById } from './auth.service.js'
import { AppError } from '../utils/response.js'
import { env } from '../config/env.js'

const avatarsDir = env.isVercel
  ? path.join('/tmp', 'avatars')
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data/avatars')
const MAX_AVATAR_BYTES = 500_000
const DATA_URL_PATTERN = /^data:image\/jpeg;base64,([A-Za-z0-9+/=\s]+)$/

function avatarFilename(userId) {
  return `${String(userId).replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`
}

function withUser(userId) {
  const settings = getSettings(userId)
  return { ...settings, user: loadUserById(userId) }
}

export function getSettings(userId) {
  const db = getDb()
  const user = loadUserById(userId)
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND')

  const prefs = db
    .prepare(
      `
      SELECT critical_alerts, weekly_digest, intervention_updates
      FROM user_notification_preferences
      WHERE user_id = ?
    `,
    )
    .get(userId)

  return {
    profile: {
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department ?? 'Institution-wide',
      status: user.status,
      avatarUrl: user.avatarUrl,
    },
    notifications: {
      criticalAlerts: Boolean(prefs?.critical_alerts ?? 1),
      weeklyDigest: Boolean(prefs?.weekly_digest ?? 1),
      interventionUpdates: Boolean(prefs?.intervention_updates ?? 0),
    },
  }
}

export function updateProfile() {
  throw new AppError(
    'Account details cannot be changed from Settings. Contact an administrator.',
    403,
    'PROFILE_LOCKED',
  )
}

export function updateAvatar(userId, image) {
  const user = loadUserById(userId)
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND')

  const match = typeof image === 'string' ? image.trim().match(DATA_URL_PATTERN) : null
  if (!match) {
    throw new AppError('Upload a JPEG photo (JPG).', 400, 'INVALID_IMAGE')
  }

  const buffer = Buffer.from(match[1].replace(/\s+/g, ''), 'base64')
  if (!buffer.length || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    throw new AppError('Upload a valid JPEG photo.', 400, 'INVALID_IMAGE')
  }
  if (buffer.length > MAX_AVATAR_BYTES) {
    throw new AppError('Photo must be smaller than 500 KB.', 400, 'IMAGE_TOO_LARGE')
  }

  fs.mkdirSync(avatarsDir, { recursive: true })
  const filename = avatarFilename(userId)
  fs.writeFileSync(path.join(avatarsDir, filename), buffer)

  const publicUrl = `/api/uploads/avatars/${filename}`
  getDb()
    .prepare(`UPDATE users SET avatar_url = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(publicUrl, userId)

  return withUser(userId)
}

export function removeAvatar(userId) {
  const user = loadUserById(userId)
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND')

  const filePath = path.join(avatarsDir, avatarFilename(userId))
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

  getDb()
    .prepare(`UPDATE users SET avatar_url = NULL, updated_at = datetime('now') WHERE id = ?`)
    .run(userId)

  return withUser(userId)
}

export function updateNotifications(userId, notifications) {
  const db = getDb()

  db.prepare(
    `
    INSERT INTO user_notification_preferences
      (user_id, critical_alerts, weekly_digest, intervention_updates, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      critical_alerts = excluded.critical_alerts,
      weekly_digest = excluded.weekly_digest,
      intervention_updates = excluded.intervention_updates,
      updated_at = datetime('now')
  `,
  ).run(
    userId,
    notifications.criticalAlerts ? 1 : 0,
    notifications.weeklyDigest ? 1 : 0,
    notifications.interventionUpdates ? 1 : 0,
  )

  return getSettings(userId)
}
