import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler, sendSuccess } from '../utils/response.js'
import { askRagChat, getRagChat } from '../services/ragChat.service.js'

const router = Router()
router.use(authenticate)

router.get(
  '/:studentId',
  asyncHandler(async (req, res) => {
    const data = getRagChat(req.params.studentId, req.user)
    sendSuccess(res, data)
  }),
)

router.post(
  '/:studentId',
  asyncHandler(async (req, res) => {
    const data = askRagChat(req.params.studentId, req.body?.question, req.user)
    sendSuccess(res, data)
  }),
)

export default router
