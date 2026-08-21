import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runMigrations } from '../server/db/migrate.js'
import { seedDatabase, seedRagChatIfEmpty } from '../server/db/seed.js'
import { getDb, closeDb } from '../server/db/connection.js'
import { env } from '../server/config/env.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const envPath = path.join(rootDir, '.env')
const envExamplePath = path.join(rootDir, '.env.example')

function ensureEnvFile() {
  if (fs.existsSync(envPath)) return

  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath)
    console.log('Created .env from .env.example')
    return
  }

  fs.writeFileSync(
    envPath,
    [
      'PORT=3001',
      'NODE_ENV=development',
      'JWT_SECRET=student-success-dev-secret-change-in-production',
      'JWT_EXPIRES_IN=24h',
      'DATABASE_PATH=./server/data/student_success.db',
      'CORS_ORIGIN=http://localhost:5173',
      'VITE_API_URL=/api',
      '',
    ].join('\n'),
  )
  console.log('Created default .env file')
}

function ensureDatabase() {
  runMigrations()

  const db = getDb()
  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count
  closeDb()

  if (userCount === 0) {
    seedDatabase()
    console.log('Database seeded with demo data.')
  } else {
    console.log('Database ready.')
  }

  seedRagChatIfEmpty()

  console.log(`SQLite file: ${path.resolve(rootDir, env.databasePath)}`)
}

ensureEnvFile()
ensureDatabase()
