import { Router } from 'express'
import authRoutes from './auth.routes.js'
import studentsRoutes from './students.routes.js'
import dashboardRoutes from './dashboard.routes.js'
import reportsRoutes from './reports.routes.js'
import recommendationsRoutes from './recommendations.routes.js'
import adminRoutes from './admin.routes.js'
import searchRoutes from './search.routes.js'
import settingsRoutes from './settings.routes.js'
import ragRoutes from './rag.routes.js'
import { asyncHandler, sendSuccess } from '../utils/response.js'
import { checkMlServicesHealth } from '../services/mlPrediction.service.js'
import { getSmtpConfigStatus, verifySmtpConnection } from '../services/email.service.js'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', service: 'student-success-api' } })
})

router.get(
  '/health/ml',
  asyncHandler(async (_req, res) => {
    const services = await checkMlServicesHealth()
    const allOk = services.every((s) => s.ok)
    sendSuccess(res, { status: allOk ? 'ok' : 'degraded', services })
  }),
)

router.get(
  '/health/email',
  asyncHandler(async (_req, res) => {
    const config = getSmtpConfigStatus()
    if (!config.configured) {
      sendSuccess(res, { status: 'not_configured', ok: false, reason: config.reason })
      return
    }
    const verified = await verifySmtpConnection()
    sendSuccess(res, {
      status: verified.ok ? 'ok' : 'error',
      ok: verified.ok,
      reason: verified.reason ?? null,
    })
  }),
)

router.use('/auth', authRoutes)
router.use('/students', studentsRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/reports', reportsRoutes)
router.use('/recommendations', recommendationsRoutes)
router.use('/admin', adminRoutes)
router.use('/search', searchRoutes)
router.use('/settings', settingsRoutes)
router.use('/rag', ragRoutes)

export default router
