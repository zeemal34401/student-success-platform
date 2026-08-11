import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { getInstitutionalReports, getInterventions } from '../services/reports.service.js'
import { getClusterSummary } from '../services/mlPrediction.service.js'
import { asyncHandler, sendSuccess } from '../utils/response.js'

const router = Router()
router.use(authenticate)
router.get(
  '/institutional',
  asyncHandler(async (req, res) => {
    sendSuccess(res, getInstitutionalReports(req.user))
  }),
)
router.get(
  '/interventions',
  asyncHandler(async (_req, res) => {
    sendSuccess(res, getInterventions())
  }),
)
router.get(
  '/ml-clusters',
  asyncHandler(async (_req, res) => {
    try {
      const result = await getClusterSummary()
      sendSuccess(res, { available: true, data: result, error: null })
    } catch (error) {
      sendSuccess(res, {
        available: false,
        data: null,
        error: error.message ?? 'Cluster analytics unavailable',
      })
    }
  }),
)
export default router