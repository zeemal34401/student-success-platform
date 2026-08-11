import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { getDb } from './connection.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const schemaDir = path.join(__dirname, 'schema')

export function runMigrations() {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  const applied = new Set(
    db.prepare('SELECT version FROM schema_migrations ORDER BY version').all().map((r) => r.version),
  )

  const files = fs
    .readdirSync(schemaDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const version = Number(file.split('_')[0])
    if (applied.has(version)) continue

    const sql = fs.readFileSync(path.join(schemaDir, file), 'utf8')
    db.exec(sql)
    db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(version, file)
    console.log(`Applied migration ${file}`)
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMigrations()
  console.log('Migrations complete.')
}
