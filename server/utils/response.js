export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
  }
}

export function sendSuccess(res, data, meta = undefined, statusCode = 200) {
  const payload = { success: true, data }
  if (meta !== undefined) payload.meta = meta
  return res.status(statusCode).json(payload)
}

export function sendError(res, error) {
  const statusCode = error.statusCode ?? 500
  return res.status(statusCode).json({
    success: false,
    error: {
      message: error.message ?? 'Internal server error',
      code: error.code ?? 'INTERNAL_ERROR',
    },
  })
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
