import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { getStudentById, listStudents, searchStudents } from '../services/students.service.js'
import { generateRiskTrend } from '../utils/risk.js'
import { getInterventions } from '../services/reports.service.js'
import { asyncHandler, sendSuccess, AppError } from '../utils/response.js'
import { getMlAcademicRisk, getMlDropoutRisk, getXapiEngagementRisk } from '../services/mlPrediction.service.js'

const router = Router()

router.use(authenticate)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { facultyId, department, riskLevel, search, sortField, sortDirection } = req.query
    const students = listStudents(req.user, {
      facultyId,
      department,
      riskLevel,
      search,
      sortField,
      sortDirection,
    })
    sendSuccess(res, students, {
      total: students.length,
      generatedAt: new Date().toISOString(),
    })
  }),
)

router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const { q } = req.query
    const students = searchStudents(req.user, q ?? '')
    sendSuccess(res, students, { total: students.length })
  }),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const student = getStudentById(req.params.id, req.user)
    if (!student) throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND')

    const interventionMap = getInterventions()
    sendSuccess(res, {
      ...student,
      riskTrend: generateRiskTrend(student),
      interventions: interventionMap[student.riskLevel] ?? [],
    })
  }),
)

router.get(
  '/:id/ml-risk',
  asyncHandler(async (req, res) => {
    const student = getStudentById(req.params.id, req.user)
    if (!student) throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND')

    const [academicResult, dropoutResult, engagementResult] = await Promise.allSettled([
      getMlAcademicRisk(student),
      getMlDropoutRisk(student),
      getXapiEngagementRisk(student),
    ])

    const wrap = (result, model) => {
      if (result.status === 'fulfilled') {
        return { available: true, model, data: result.value, error: null }
      }
      const raw = result.reason?.message ?? 'Prediction unavailable'
      const error =
        raw === 'fetch failed' || raw === 'Failed to fetch' || raw.includes('ECONNREFUSED')
          ? 'Prediction service is offline; using platform metrics.'
          : raw
      return {
        available: false,
        model,
        data: null,
        error,
      }
    }

    sendSuccess(res, {
      studentId: student.id,
      academic: wrap(academicResult, 'academic'),
      dropout: wrap(dropoutResult, 'dropout'),
      engagement: wrap(engagementResult, 'engagement'),
      disclaimer:
        'Predictions use available student metrics; some model features are estimated from attendance, GPA, and LMS activity.',
    })
  }),
)

export default router
