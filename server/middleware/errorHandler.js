import { AppError, sendError } from '../utils/response.js'

export function notFoundHandler(_req, res) {
  res.status(404).json({
    success: false,
    error: { message: 'Route not found', code: 'NOT_FOUND' },
  })
}

export function errorHandler(err, _req, res, _next) {
  if (!(err instanceof AppError)) {
    console.error(err)
  }
  sendError(res, err instanceof AppError ? err : new AppError('Internal server error'))
}
