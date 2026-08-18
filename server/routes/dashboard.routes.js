import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  getAcademicAdminDashboard,
  getDepartmentDashboard,
  getDirectorCourseStudents,
  getDirectorDashboard,
  getDirectorDepartmentFaculty,
  getDirectorDepartments,
  getDirectorFacultyCourses,
  getFacultyDashboard,
  getFacultyMember,
  getFacultyOverview,
} from '../services/dashboard.service.js'
import { asyncHandler, sendSuccess } from '../utils/response.js'
import { AppError } from '../utils/response.js'

const router = Router()

router.use(authenticate)

router.get(
  '/faculty',
  asyncHandler(async (req, res) => {
    sendSuccess(res, getFacultyDashboard(req.user))
  }),
)

router.get(
  '/department',
  asyncHandler(async (req, res) => {
    sendSuccess(res, getDepartmentDashboard(req.user))
  }),
)

router.get(
  '/director',
  asyncHandler(async (req, res) => {
    sendSuccess(res, getDirectorDashboard(req.user))
  }),
)

router.get(
  '/director/departments',
  asyncHandler(async (req, res) => {
    sendSuccess(res, getDirectorDepartments(req.user))
  }),
)

router.get(
  '/director/departments/:department/faculty',
  asyncHandler(async (req, res) => {
    sendSuccess(res, getDirectorDepartmentFaculty(req.user, req.params.department))
  }),
)

router.get(
  '/director/faculty/:id/courses',
  asyncHandler(async (req, res) => {
    sendSuccess(res, getDirectorFacultyCourses(req.user, req.params.id))
  }),
)

router.get(
  '/director/faculty/:id/students',
  asyncHandler(async (req, res) => {
    sendSuccess(res, getDirectorCourseStudents(req.user, req.params.id, req.query.course))
  }),
)

router.get(
  '/academic-admin',
  asyncHandler(async (req, res) => {
    sendSuccess(res, getAcademicAdminDashboard(req.user))
  }),
)

router.get(
  '/faculty-overview',
  asyncHandler(async (req, res) => {
    sendSuccess(res, getFacultyOverview(req.user))
  }),
)

router.get(
  '/faculty/:id',
  asyncHandler(async (req, res) => {
    const faculty = getFacultyMember(req.params.id, req.user)
    if (!faculty) throw new AppError('Faculty member not found', 404, 'FACULTY_NOT_FOUND')
    sendSuccess(res, faculty)
  }),
)

export default router
