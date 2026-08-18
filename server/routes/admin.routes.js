import { Router } from 'express'
import {
  createAdminUser,
  deleteAdminUser,
  getAdminStats,
  listAdminUsers,
  listCourses,
  listDepartments,
  resendInvite,
  toggleAdminUserStatus,
  updateAdminUser,
  ROLES,
} from '../services/admin.service.js'
import {
  createStudent,
  deleteStudent,
  listManagedStudents,
  toggleStudentStatus,
  updateStudent,
} from '../services/students.service.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { asyncHandler, sendSuccess } from '../utils/response.js'

const router = Router()

router.use(authenticate, requireRole(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.STAFF))

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const users = listAdminUsers({
      search: req.query.search,
      role: req.query.role,
      status: req.query.status,
    })
    sendSuccess(res, users, { total: users.length, ...getAdminStats() })
  }),
)

router.get(
  '/departments',
  asyncHandler(async (_req, res) => {
    sendSuccess(res, listDepartments())
  }),
)

router.get(
  '/courses',
  asyncHandler(async (req, res) => {
    sendSuccess(res, listCourses({ department: req.query.department }))
  }),
)

router.post(
  '/users',
  asyncHandler(async (req, res) => {
    const result = await createAdminUser(req.body ?? {}, req.user)
    sendSuccess(res, result, undefined, 201)
  }),
)

router.put(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await updateAdminUser(req.params.id, req.body ?? {}, req.user)
    sendSuccess(res, user)
  }),
)

router.post(
  '/validate-email',
  asyncHandler(async (req, res) => {
    const { assertDeliverableEmail } = await import('../services/email-validation.service.js')
    const result = await assertDeliverableEmail(req.body?.email)
    sendSuccess(res, {
      valid: true,
      email: result.email,
      verifiedBy: result.verifiedBy,
      mailboxConfirmed: Boolean(result.mailboxConfirmed),
    })
  }),
)

router.post(
  '/users/:id/resend-invite',
  asyncHandler(async (req, res) => {
    const result = await resendInvite(req.params.id, req.user)
    sendSuccess(res, result)
  }),
)

router.patch(
  '/users/:id/status',
  asyncHandler(async (req, res) => {
    const user = toggleAdminUserStatus(req.params.id, req.user)
    sendSuccess(res, user)
  }),
)

router.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const result = deleteAdminUser(req.params.id, req.user)
    sendSuccess(res, result)
  }),
)

router.get(
  '/students',
  asyncHandler(async (req, res) => {
    const students = listManagedStudents({
      search: req.query.search,
      status: req.query.status,
    })
    sendSuccess(res, students, { total: students.length })
  }),
)

router.post(
  '/students',
  asyncHandler(async (req, res) => {
    const result = createStudent(req.body ?? {}, req.user)
    sendSuccess(res, result, undefined, 201)
  }),
)

router.put(
  '/students/:id',
  asyncHandler(async (req, res) => {
    const student = updateStudent(req.params.id, req.body ?? {}, req.user)
    sendSuccess(res, student)
  }),
)

router.patch(
  '/students/:id/status',
  asyncHandler(async (req, res) => {
    const student = toggleStudentStatus(req.params.id, req.user)
    sendSuccess(res, student)
  }),
)

router.delete(
  '/students/:id',
  asyncHandler(async (req, res) => {
    const result = deleteStudent(req.params.id, req.user)
    sendSuccess(res, result)
  }),
)

export default router
