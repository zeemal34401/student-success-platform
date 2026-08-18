import { createApp } from './app.js'
import { env } from './config/env.js'
import { validateEnv } from './config/validateEnv.js'
import { runMigrations } from './db/migrate.js'
import { seedDatabase } from './db/seed.js'
import { closeDb } from './db/connection.js'

validateEnv()
runMigrations()
seedDatabase()

const app = createApp()

const server = app.listen(env.port, '0.0.0.0', () => {
  console.log(`Student Success API running on http://localhost:${env.port}`)
  console.log(`Database: ${env.databasePath}`)
})

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${env.port} is already in use. Close the other running app and try again.`)
    process.exit(1)
  }
  throw error
})

function shutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down...`)
  server.close(() => {
    closeDb()
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
