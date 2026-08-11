const TOKEN_KEY = 'ssp_auth_token'
const REQUEST_TIMEOUT_MS = 15000
const EMAIL_REQUEST_TIMEOUT_MS = 45000

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

let onUnauthorized = null

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new ApiError(
      payload.error?.message ?? 'Request failed',
      response.status,
      payload.error?.code,
    )
  }

  return payload
}

export async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  }

  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const { timeoutMs: _timeoutMs, ...fetchOptions } = options
    const response = await fetch(`${API_BASE}${path}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    })

    if (response.status === 401) {
      setToken(null)
      onUnauthorized?.()
    }

    const payload = await parseResponse(response)
    return payload.data
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', 408, 'TIMEOUT')
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

export const api = {
  login(email, password, role) {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    })
  },

  getInvite(token) {
    return apiRequest(`/auth/invite/${encodeURIComponent(token)}`)
  },

  acceptInvite(token, password, confirmPassword) {
    return apiRequest('/auth/accept-invite', {
      method: 'POST',
      body: JSON.stringify({ token, password, confirmPassword }),
    })
  },

  logout() {
    return apiRequest('/auth/logout', { method: 'POST' })
  },

  getMe() {
    return apiRequest('/auth/me')
  },

  getDemoAccounts() {
    return apiRequest('/auth/demo-accounts')
  },

  getFacultyDashboard() {
    return apiRequest('/dashboard/faculty')
  },

  getDepartmentDashboard() {
    return apiRequest('/dashboard/department')
  },

  getDirectorDashboard() {
    return apiRequest('/dashboard/director')
  },

  getAcademicAdminDashboard() {
    return apiRequest('/dashboard/academic-admin')
  },

  getFacultyOverview() {
    return apiRequest('/dashboard/faculty-overview')
  },

  getFacultyMember(id) {
    return apiRequest(`/dashboard/faculty/${id}`)
  },

  getStudents(params = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value != null && value !== '') searchParams.set(key, value)
    })
    const query = searchParams.toString()
    return apiRequest(`/students${query ? `?${query}` : ''}`)
  },

  searchStudents(q) {
    return apiRequest(`/students/search?q=${encodeURIComponent(q)}`)
  },

  getStudent(id) {
    return apiRequest(`/students/${id}`)
  },

  getMlRisk(id) {
    return apiRequest(`/students/${id}/ml-risk`)
  },

  getReports() {
    return apiRequest('/reports/institutional')
  },

  getInterventions() {
    return apiRequest('/reports/interventions')
  },

  getMlClusterSummary() {
    return apiRequest('/reports/ml-clusters')
  },

  getRecommendations() {
    return apiRequest('/recommendations')
  },

  saveRecommendationDecision(studentId, decision) {
    return apiRequest(`/recommendations/${studentId}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision }),
    })
  },

  getAdminUsers(params = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value != null && value !== '') searchParams.set(key, value)
    })
    const query = searchParams.toString()
    return apiRequest(`/admin/users${query ? `?${query}` : ''}`)
  },

  getDepartments() {
    return apiRequest('/admin/departments')
  },

  getCourses(params = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value != null && value !== '') searchParams.set(key, value)
    })
    const query = searchParams.toString()
    return apiRequest(`/admin/courses${query ? `?${query}` : ''}`)
  },

  createAdminUser(payload) {
    return apiRequest('/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
      timeoutMs: EMAIL_REQUEST_TIMEOUT_MS,
    })
  },

  validateWorkEmail(email) {
    return apiRequest('/admin/validate-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
      timeoutMs: EMAIL_REQUEST_TIMEOUT_MS,
    })
  },

  resendInvite(id) {
    return apiRequest(`/admin/users/${id}/resend-invite`, {
      method: 'POST',
      timeoutMs: EMAIL_REQUEST_TIMEOUT_MS,
    })
  },

  updateAdminUser(id, payload) {
    return apiRequest(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  toggleAdminUserStatus(id) {
    return apiRequest(`/admin/users/${id}/status`, { method: 'PATCH' })
  },

  deleteAdminUser(id) {
    return apiRequest(`/admin/users/${id}`, { method: 'DELETE' })
  },

  getSettings() {
    return apiRequest('/settings')
  },

  updateProfile(payload) {
    return apiRequest('/settings/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  updateNotifications(payload) {
    return apiRequest('/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  getMlSkillRecommendations(id) {
    return apiRequest(`/recommendations/${id}/ml-skills`)
  },
}
