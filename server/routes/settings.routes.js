import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  getSettings,
  removeAvatar,
  updateAvatar,
  updateNotifications,
  updateProfile,
} from '../services/settings.service.js'
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
    sendSuccess(res, updateProfile(req.user.id, req.body ?? {}))
  }),
)

router.put(
  '/avatar',
  asyncHandler(async (req, res) => {
    sendSuccess(res, updateAvatar(req.user.id, req.body?.image))
  }),
)

router.delete(
  '/avatar',
  asyncHandler(async (req, res) => {
    sendSuccess(res, removeAvatar(req.user.id))
  }),
)

router.put(
  '/notifications',
  asyncHandler(async (req, res) => {
    sendSuccess(res, updateNotifications(req.user.id, req.body ?? {}))
  }),
)

export default router
