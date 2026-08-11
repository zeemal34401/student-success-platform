import { env } from './env.js'
import { getSmtpConfigStatus } from '../services/email.service.js'

const WEAK_SECRETS = new Set([
  'dev-only-change-me-in-production',
  'change-this-to-a-long-random-secret-in-production',
])

export function validateEnv() {
  if (env.isProduction) {
    const secret = process.env.JWT_SECRET
    if (!secret || WEAK_SECRETS.has(secret) || secret.length < 32) {
      throw new Error(
        'JWT_SECRET must be set to a strong random value (32+ chars) when NODE_ENV=production',
      )
    }
  }

  const mlUrls = [
    ['ML_ACADEMIC_API_URL', process.env.ML_ACADEMIC_API_URL],
    ['ML_DROPOUT_API_URL', process.env.ML_DROPOUT_API_URL],
    ['ML_RECOMMENDER_API_URL', process.env.ML_RECOMMENDER_API_URL],
    ['ML_ANALYTICS_API_URL', process.env.ML_ANALYTICS_API_URL],
  ]

  for (const [name, value] of mlUrls) {
    if (value && !/^https?:\/\//.test(value)) {
      console.warn(`Warning: ${name}="${value}" does not look like a valid URL`)
    }
  }

  const smtp = getSmtpConfigStatus()
  if (!smtp.configured) {
    console.warn(`[email] ${smtp.reason}`)
    console.warn(
      '[email] Invitations will fail until SMTP_HOST / SMTP_USER / SMTP_PASS are set with real credentials.',
    )
  } else {
    console.log(
      `[email] SMTP configured (${env.email.smtpHost}:${env.email.smtpPort}, user=${env.email.smtpUser})`,
    )
  }

  if (!env.appBaseUrl?.trim()) {
    console.warn('[email] APP_BASE_URL is empty — activation links in invite emails may be invalid.')
  }
}
