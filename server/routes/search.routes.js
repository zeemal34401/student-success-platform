import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { searchPeople } from '../services/search.service.js'
import { asyncHandler, sendSuccess } from '../utils/response.js'

const router = Router()

router.use(authenticate)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const people = searchPeople(req.user, req.query.q ?? '')
    sendSuccess(res, people, { total: people.length })
  }),
)

export default router
