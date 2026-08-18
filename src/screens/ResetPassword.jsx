import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader,
  Lock,
  Mail,
} from 'lucide-react'
import { api } from '../api/client'
import PrognosAuthBackdrop from '../components/PrognosAuthBackdrop'

const BRAND = {
  primary: '#0B6E4F',
  primaryDeep: '#0E2F25',
  soft: '#E6F4EE',
  ink: '#101828',
  muted: '#475467',
}

export default function ResetPassword({ token, onComplete }) {
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await api.getPasswordReset(token)
        if (!cancelled) setPreview(data)
      } catch (err) {
        if (!cancelled) setError(err.message ?? 'This reset link is not valid.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (token) load()
    else {
      setError('Missing reset token.')
      setLoading(false)
    }

    return () => {
      cancelled = true
    }
  }, [token])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await api.resetPassword(token, password, confirmPassword)
      onComplete?.()
    } catch (err) {
      setError(err.message ?? 'Unable to reset password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PrognosAuthBackdrop>
      <div className="login-rise w-full max-w-[420px]">
        <div className="prognos-signin-card">
          <h2
            className="prognos-serif text-center font-bold tracking-tight"
            style={{ color: BRAND.primaryDeep, fontSize: '1.75rem' }}
          >
            Choose a new password
          </h2>
          <p className="mt-2 text-center text-sm" style={{ color: BRAND.muted }}>
            This link is single-use and expires shortly after it was sent.
          </p>

          {loading && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm" style={{ color: BRAND.muted }}>
              <Loader size={18} className="animate-spin" aria-hidden="true" />
              Validating reset link…
            </div>
          )}

          {!loading && error && !preview && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
              <div className="flex gap-2">
                <AlertCircle size={18} className="shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Link unavailable</p>
                  <p className="mt-1">{error}</p>
                  <p className="mt-2 text-xs opacity-80">Return to sign in and request a new reset link.</p>
                </div>
              </div>
            </div>
          )}

          {!loading && preview && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm" style={{ background: BRAND.soft }}>
                <Mail size={16} style={{ color: BRAND.primary }} aria-hidden="true" />
                <span className="font-semibold" style={{ color: BRAND.ink }}>
                  {preview.email}
                </span>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
                  <AlertCircle size={18} className="shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="new-password" className="sr-only">
                  New password
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder="New password"
                    className="prognos-input w-full rounded-xl border border-slate-200 py-3 pl-10 pr-11 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="login-focus absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-[#E6F4EE]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="sr-only">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder="Confirm new password"
                    className="prognos-input w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <p className="flex items-center gap-1.5 text-xs" style={{ color: BRAND.muted }}>
                <CheckCircle2
                  size={13}
                  style={{ color: password.length >= 8 ? BRAND.primary : BRAND.muted }}
                  aria-hidden="true"
                />
                At least 8 characters
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="prognos-btn-gradient login-focus flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader size={18} className="animate-spin" aria-hidden="true" />
                    Updating…
                  </>
                ) : (
                  <>
                    <Check size={18} aria-hidden="true" />
                    Update password
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </PrognosAuthBackdrop>
  )
}
