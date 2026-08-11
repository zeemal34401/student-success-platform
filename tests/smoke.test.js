import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../server/app.js'
import { runMigrations } from '../server/db/migrate.js'
import { validateEnv } from '../server/config/validateEnv.js'
import { scoreToRiskLevel } from '../server/utils/risk.js'

test('validateEnv passes in development', () => {
  const prev = process.env.NODE_ENV
  process.env.NODE_ENV = 'development'
  assert.doesNotThrow(() => validateEnv())
  process.env.NODE_ENV = prev
})

test('scoreToRiskLevel maps thresholds', () => {
  assert.equal(scoreToRiskLevel(80), 'Critical')
  assert.equal(scoreToRiskLevel(60), 'High')
  assert.equal(scoreToRiskLevel(40), 'Medium')
  assert.equal(scoreToRiskLevel(10), 'Low')
})

test('GET /api/health returns ok', async () => {
  runMigrations()
  const app = createApp()
  const server = app.listen(0)

  try {
    const { port } = server.address()
    const res = await fetch(`http://127.0.0.1:${port}/api/health`)
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.success, true)
    assert.equal(body.data.status, 'ok')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('GET /api/students/:id requires authentication', async () => {
  runMigrations()
  const app = createApp()
  const server = app.listen(0)

  try {
    const { port } = server.address()
    const res = await fetch(`http://127.0.0.1:${port}/api/students/S001`)
    assert.equal(res.status, 401)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})
