import { validateEnv } from './config/validateEnv.js'
import { runMigrations } from './db/migrate.js'
import { seedDatabase, seedRagChatIfEmpty } from './db/seed.js'

let readyPromise

/**
 * One-time init for Vercel serverless cold starts.
 * SQLite lives under /tmp (ephemeral) and is re-seeded when missing.
 */
export function ensureServerlessReady() {
  if (!readyPromise) {
    readyPromise = Promise.resolve().then(() => {
      validateEnv()
      runMigrations()
      seedDatabase()
      seedRagChatIfEmpty()
    })
  }
  return readyPromise
}
