import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../..')

dotenv.config({ path: path.join(rootDir, '.env') })

const DEV_JWT_SECRET = 'dev-only-change-me-in-production'
const isVercel = Boolean(process.env.VERCEL)
const isProduction = process.env.NODE_ENV === 'production'

// Vercel serverless filesystem is read-only except /tmp — SQLite must live there.
const defaultDatabasePath = isVercel
  ? path.join('/tmp', 'student_success.db')
  : path.join(rootDir, 'server', 'data', 'student_success.db')

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  jwtSecret: process.env.JWT_SECRET ?? DEV_JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '24h',
  databasePath: process.env.DATABASE_PATH ?? defaultDatabasePath,
  corsOrigin: process.env.CORS_ORIGIN ?? (isVercel ? '*' : 'http://localhost:5173'),
  appBaseUrl:
    process.env.APP_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    process.env.CORS_ORIGIN ??
    'http://localhost:5173',
  isProduction,
  isVercel,
  // Allow demo logins on hosted demos even when NODE_ENV=production.
  allowDemoAccounts:
    process.env.ALLOW_DEMO_ACCOUNTS === 'true' ||
    (!isProduction && process.env.ALLOW_DEMO_ACCOUNTS !== 'false'),
  inviteExpiryHours: Number(process.env.INVITE_EXPIRY_HOURS ?? 72),
  passwordResetExpiryMinutes: Number(process.env.PASSWORD_RESET_EXPIRY_MINUTES ?? 30),
  email: {
    from: process.env.EMAIL_FROM ?? 'PrognosEd <noreply@studentsuccess.local>',
    smtpHost: process.env.SMTP_HOST ?? '',
    smtpPort: Number(process.env.SMTP_PORT ?? 587),
    // true for port 465 (SSL); false + STARTTLS for 587
    smtpSecure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    smtpUser: process.env.SMTP_USER ?? '',
    // Gmail app passwords are often copied with spaces — strip them
    smtpPass: String(process.env.SMTP_PASS ?? '').replace(/\s+/g, ''),
    // Optional nodemailer service shortcut, e.g. "gmail"
    smtpService: process.env.SMTP_SERVICE ?? '',
    // smtp = confirm the mailbox exists (default); mx = domain MX records only
    verifyMode: process.env.EMAIL_VERIFY_MODE ?? 'smtp',
    verifyStrict: process.env.EMAIL_VERIFY_STRICT !== 'false',
    verifyTimeoutMs: Number(process.env.EMAIL_VERIFY_TIMEOUT_MS ?? 8000),
  },
  ml: {
    academic: process.env.ML_ACADEMIC_API_URL ?? 'http://localhost:8000',
    dropout: process.env.ML_DROPOUT_API_URL ?? 'http://localhost:8001',
    recommender: process.env.ML_RECOMMENDER_API_URL ?? 'http://localhost:8002',
    analytics: process.env.ML_ANALYTICS_API_URL ?? 'http://localhost:8003',
    fetchTimeoutMs: Number(process.env.ML_FETCH_TIMEOUT_MS ?? 8000),
  },
}
