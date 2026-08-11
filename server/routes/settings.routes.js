import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { getSettings, updateNotifications, updateProfile } from '../services/settings.service.js'
import { loadUserById } from '../services/auth.service.js'
import { asyncHandler, sendSuccess } from '../utils/response.js'

const router = Router()

router.use(authenticate)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    sendSuccess(res, getSettings(req.user.id))
  }),
)

router.put(
  '/profile',
  asyncHandler(async (req, res) => {
    const settings = updateProfile(req.user.id, req.body ?? {})
    sendSuccess(res, { ...settings, user: loadUserById(req.user.id) })
  }),
)

router.put(
  '/notifications',
  asyncHandler(async (req, res) => {
    const settings = updateNotifications(req.user.id, req.body ?? {})
    sendSuccess(res, settings)
  }),
)

export default router
