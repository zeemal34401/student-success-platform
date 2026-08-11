import { verifyToken } from '../services/auth.service.js'
import { AppError } from '../utils/response.js'

export function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null
    req.user = verifyToken(token)
    next()
  } catch (error) {
    next(error)
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'))
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'))
    }
    next()
  }
}
