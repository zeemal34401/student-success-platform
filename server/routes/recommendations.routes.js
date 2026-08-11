import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  getRecommendations,
  saveRecommendationDecision,
} from '../services/recommendations.service.js'
import { asyncHandler, sendSuccess, AppError } from '../utils/response.js'
import {
  getRealSkillDiagnostic,
  getMlSkillRecommendations,
} from '../services/mlPrediction.service.js'
import { getStudentById } from '../services/students.service.js'

const router = Router()
router.use(authenticate)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    sendSuccess(res, getRecommendations(req.user))
  }),
)

router.get(
  '/:id/ml-skills',
  asyncHandler(async (req, res) => {
    const student = getStudentById(req.params.id, req.user)
    if (!student) throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND')

    // Platform skill diagnostic is computed locally and always available.
    // Model 3 tutoring-log recommendations are optional — if the ML service
    // is offline, we still return the platform diagnostic without surfacing
    // a raw network error to the UI.
    const platformDiagnostic = getRealSkillDiagnostic(student)
    const mlRecommendations = await getMlSkillRecommendations(student.id)

    sendSuccess(res, {
      ...platformDiagnostic,
      mlRecommendations,
    })
  }),
)

router.post(
  '/:studentId/decision',
  asyncHandler(async (req, res) => {
    const { decision } = req.body ?? {}
    const result = saveRecommendationDecision(req.user, req.params.studentId, decision)
    sendSuccess(res, result)
  }),
)

export default router
