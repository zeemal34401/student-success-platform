import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { env } from '../config/env.js'

let dbInstance = null

export function getDb() {
  if (dbInstance) return dbInstance

  const dir = path.dirname(env.databasePath)
  fs.mkdirSync(dir, { recursive: true })

  dbInstance = new Database(env.databasePath)
  dbInstance.pragma('journal_mode = WAL')
  dbInstance.pragma('foreign_keys = ON')
  dbInstance.pragma('busy_timeout = 5000')
  dbInstance.pragma('synchronous = NORMAL')

  return dbInstance
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

export function withTransaction(fn) {
  const db = getDb()
  const run = db.transaction(fn)
  return run()
}
