import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import apiRoutes from './routes/index.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { apiRateLimiter } from './middleware/rateLimit.js'
import { env } from './config/env.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '../dist')

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '1mb' }))
  app.use('/api', apiRateLimiter, apiRoutes)

  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath))
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next()
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
