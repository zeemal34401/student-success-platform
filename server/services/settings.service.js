import { getDb } from '../db/connection.js'
import { loadUserById } from './auth.service.js'
import { AppError } from '../utils/response.js'

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
    },
    notifications: {
      criticalAlerts: Boolean(prefs?.critical_alerts ?? 1),
      weeklyDigest: Boolean(prefs?.weekly_digest ?? 1),
      interventionUpdates: Boolean(prefs?.intervention_updates ?? 0),
    },
  }
}

export function updateProfile(userId, { name, email }) {
  const db = getDb()
  if (!name?.trim() || !email?.trim()) {
    throw new AppError('Name and email are required', 400, 'VALIDATION_ERROR')
  }

  const conflict = db
    .prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE AND id != ?')
    .get(email.trim(), userId)
  if (conflict) throw new AppError('Email already in use', 409, 'EMAIL_EXISTS')

  db.prepare(
    `UPDATE users SET name = ?, email = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(name.trim(), email.trim(), userId)

  return getSettings(userId)
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
