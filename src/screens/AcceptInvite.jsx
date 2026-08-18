import { useEffect, useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Loader,
  Lock,
  Mail,
  Shield,
} from 'lucide-react'
import { api } from '../api/client'

const C = {
  primary: '#15805D',
  primaryDark: '#0F6A4F',
  ink: '#0F172A',
  muted: '#64748B',
  border: '#E5E7EB',
  surface: '#FFFFFF',
  page: '#F8FAFC',
  danger: '#B42318',
  dangerBg: '#FEF3F2',
}

export default function AcceptInvite({ token, onAccepted, onUseAsReset }) {
  const [invite, setInvite] = useState(null)
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
        const data = await api.getInvite(token)
        if (!cancelled) setInvite(data)
      } catch (err) {
        if (err.code === 'INVITE_NOT_FOUND' && onUseAsReset) {
          try {
            await api.getPasswordReset(token)
            if (!cancelled) onUseAsReset()
            return
          } catch {
            // Not a reset link either — show the invitation error.
          }
        }
        if (!cancelled) setError(err.message ?? 'Unable to load invitation')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (token) load()
    else {
      setError('Missing invitation token')
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
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      const result = await api.acceptInvite(token, password, confirmPassword)
      onAccepted?.(result)
    } catch (err) {
      setError(err.message ?? 'Unable to activate account')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-10" style={{ background: C.page }}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border bg-white shadow-lg" style={{ borderColor: C.border }}>
        <div className="px-8 py-7 text-white" style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` }}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <GraduationCap size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/80">Student Success Platform</p>
              <h1 className="text-xl font-semibold tracking-tight">Activate your account</h1>
            </div>
          </div>
        </div>

        <div className="px-8 py-7">
          {loading && (
            <div className="flex items-center gap-3 text-sm" style={{ color: C.muted }}>
              <Loader size={18} className="animate-spin" aria-hidden="true" />
              Validating your invitation…
            </div>
          )}

          {!loading && error && !invite && (
            <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: '#FDA29B', background: C.dangerBg, color: C.danger }}>
              <div className="flex gap-2">
                <AlertCircle size={18} className="shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-medium">Invitation unavailable</p>
                  <p className="mt-1">{error}</p>
                  <p className="mt-2 text-xs opacity-80">Ask your Academic Admin to resend the invitation from the Admin Panel.</p>
                </div>
              </div>
            </div>
          )}

          {!loading && invite && (
            <>
              <div className="rounded-xl border bg-[#F8FAFC] px-4 py-4" style={{ borderColor: C.border }}>
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: C.muted }}>
                  Your professional system account
                </p>
                <p className="mt-2 text-lg font-semibold" style={{ color: C.ink }}>{invite.name}</p>
                <div className="mt-3 space-y-2 text-sm" style={{ color: C.muted }}>
                  <p className="inline-flex items-center gap-2">
                    <Mail size={14} aria-hidden="true" />
                    <span className="font-medium" style={{ color: C.ink }}>{invite.workEmail ?? invite.email}</span>
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <Shield size={14} aria-hidden="true" />
                    {invite.role}{invite.department ? ` · ${invite.department}` : ''}
                  </p>
                  {invite.courses?.length > 0 && (
                    <p className="inline-flex items-start gap-2">
                      <BookOpen size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                      <span>{invite.courses.join(', ')}</span>
                    </p>
                  )}
                </div>
              </div>

              <p className="mt-5 text-sm" style={{ color: C.muted }}>
                Create a secure password to activate your account. You will sign in with the work email above.
              </p>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {error && (
                  <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: '#FDA29B', background: C.dangerBg, color: C.danger }} role="alert">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="invite-password" className="mb-1.5 block text-xs font-medium uppercase tracking-wide" style={{ color: C.muted }}>
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} aria-hidden="true" />
                    <input
                      id="invite-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field w-full pl-9 pr-10"
                      autoComplete="new-password"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="invite-confirm" className="mb-1.5 block text-xs font-medium uppercase tracking-wide" style={{ color: C.muted }}>
                    Confirm password
                  </label>
                  <input
                    id="invite-confirm"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field w-full"
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                </div>

                <ul className="space-y-1 text-xs" style={{ color: C.muted }}>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} style={{ color: password.length >= 8 ? C.primary : C.muted }} aria-hidden="true" />
                    At least 8 characters
                  </li>
                </ul>

                <button type="submit" className="btn-primary w-full justify-center" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader size={16} className="animate-spin" aria-hidden="true" />
                      Activating…
                    </>
                  ) : (
                    'Activate account & continue'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
