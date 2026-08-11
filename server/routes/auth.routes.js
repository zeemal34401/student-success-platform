import { Router } from 'express'
import { getDemoAccounts, login, logout, verifyToken, getInviteByToken, acceptInvite } from '../services/auth.service.js'
import { asyncHandler, sendSuccess, AppError } from '../utils/response.js'
import { authenticate } from '../middleware/auth.js'
import { loginRateLimiter } from '../middleware/rateLimit.js'
import { env } from '../config/env.js'

const router = Router()

router.post(
  '/login',
  loginRateLimiter,
  asyncHandler(async (req, res) => {
    const { email, password, role } = req.body ?? {}
    const result = login(email, password, role)
    sendSuccess(res, result)
  }),
)

router.get(
  '/invite/:token',
  asyncHandler(async (req, res) => {
    const invite = getInviteByToken(req.params.token)
    sendSuccess(res, invite)
  }),
)

router.post(
  '/accept-invite',
  loginRateLimiter,
  asyncHandler(async (req, res) => {
    const { token, password, confirmPassword } = req.body ?? {}
    if (password !== confirmPassword) {
      throw new AppError('Passwords do not match', 400, 'PASSWORD_MISMATCH')
    }
    const result = acceptInvite(token, password)
    sendSuccess(res, result)
  }),
)

router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    const header = req.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null
    logout(token)
    sendSuccess(res, { loggedOut: true })
  }),
)

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    sendSuccess(res, req.user)
  }),
)

router.get(
  '/demo-accounts',
  asyncHandler(async (_req, res) => {
    if (env.isProduction) {
      throw new AppError('Demo accounts are disabled in production', 404, 'NOT_FOUND')
    }
    sendSuccess(res, getDemoAccounts())
  }),
)

router.get(
  '/verify',
  asyncHandler(async (req, res) => {
    const header = req.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null
    const user = verifyToken(token)
    sendSuccess(res, user)
  }),
)

export default router
