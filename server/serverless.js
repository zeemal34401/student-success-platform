import { validateEnv } from './config/validateEnv.js'
import { getDb } from './db/connection.js'
import { runMigrations } from './db/migrate.js'
import { seedDatabase, seedRagChatIfEmpty } from './db/seed.js'

let readyPromise

/**
 * One-time init for Vercel serverless cold starts.
 * SQLite lives under /tmp (ephemeral) and is re-seeded when incomplete/missing.
 */
export function ensureServerlessReady() {
  if (!readyPromise) {
    readyPromise = Promise.resolve().then(() => {
      validateEnv()
      runMigrations()

      const db = getDb()
      const demoCount = db
        .prepare(
          `SELECT COUNT(*) AS count FROM users WHERE id IN ('USR-001','USR-002','USR-003','USR-004','USR-005')`,
        )
        .get().count

      // /tmp can retain a partial DB across warm invocations — force a full seed if incomplete.
      seedDatabase({ force: demoCount < 5 })
      seedRagChatIfEmpty()
    })
  }
  return readyPromise
}
