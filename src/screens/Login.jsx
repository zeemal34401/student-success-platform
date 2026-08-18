import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  GraduationCap,
  Landmark,
  Loader,
  Lock,
  Mail,
  ExternalLink,
  Shield,
  Users,
} from 'lucide-react'
import { api } from '../api/client'
import PrognosAuthBackdrop from '../components/PrognosAuthBackdrop'

const STEPS = {
  WELCOME: 'welcome',
  ROLES: 'roles',
  SIGNIN: 'signin',
  FORGOT: 'forgot',
  SENT: 'sent',
}

const ROLE_OPTIONS = [
  { value: 'Director / Dean', label: 'Director / Dean', icon: Landmark },
  { value: 'Academic Admin', label: 'Academic Admin', icon: Shield },
  { value: 'Faculty', label: 'Faculty', icon: GraduationCap },
]

const BRAND = {
  primary: '#0B6E4F',
  primaryHover: '#095C42',
  primaryDeep: '#0E2F25',
  soft: '#E6F4EE',
  softHover: '#D7F0E6',
  ink: '#101828',
  muted: '#475467',
}

function PrognosEmblem({ size = 72 }) {
  return (
    <div
      className="mx-auto flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: BRAND.primary,
        boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
      }}
      aria-hidden="true"
    >
      <div className="relative flex items-center justify-center">
        <BookOpen size={size * 0.38} className="text-white" strokeWidth={1.75} />
        <GraduationCap
          size={size * 0.32}
          className="absolute -top-1 text-white/90"
          strokeWidth={2}
        />
      </div>
    </div>
  )
}

function WelcomeScreen({ onContinue }) {
  return (
    <div className="login-rise flex w-full max-w-3xl flex-col items-center text-center">
      <h1
        className="prognos-serif font-bold tracking-tight text-white"
        style={{
          fontSize: 'clamp(3rem, 10vw, 5.5rem)',
          lineHeight: 1.05,
          textShadow: '0 2px 24px rgba(0,0,0,0.45)',
        }}
      >
        PrognosEd
      </h1>
      <p
        className="prognos-serif mt-6 max-w-xl font-medium text-white"
        style={{
          fontSize: 'clamp(1.125rem, 2.5vw, 1.625rem)',
          lineHeight: 1.45,
          textShadow: '0 2px 16px rgba(0,0,0,0.4)',
        }}
      >
        See who needs support before the term does
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="prognos-btn-gradient login-focus login-rise mt-12 rounded-full px-10 py-4 text-base font-semibold text-white transition-all"
        style={{ animationDelay: '120ms' }}
      >
        Choose your Role
      </button>
    </div>
  )
}

function RoleCard({ role, onSelect }) {
  const Icon = role.icon
  return (
    <button
      type="button"
      onClick={() => onSelect(role.value)}
      className="prognos-role-card login-focus group flex w-[220px] flex-col items-center rounded-2xl bg-white/15 px-4 py-8 text-center backdrop-blur-md border border-white/25 shadow-sm"
      style={{ minHeight: 200 }}
    >
      <span
        className="flex h-16 w-16 items-center justify-center rounded-full transition-colors"
        style={{ background: BRAND.soft }}
      >
        <Icon size={28} strokeWidth={1.75} style={{ color: BRAND.primary }} aria-hidden="true" />
      </span>
      <span
        className="prognos-serif mt-5 text-lg font-semibold leading-snug"
        style={{ color: '#F8FAFC' }}
      >
        {role.label}
      </span>
      <ChevronRight
        size={18}
        className="mt-4 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ color: '#ffffff' }}
        aria-hidden="true"
      />
    </button>
  )
}

function RoleSelectScreen({ onBack, onSelectRole }) {
  return (
    <div className="login-rise mx-auto flex w-full max-w-5xl flex-col items-center">
      <div className="mb-10 flex flex-col items-center text-center">
        <GraduationCap size={36} className="text-white/90" strokeWidth={1.75} aria-hidden="true" />
        <h2
          className="prognos-serif mt-4 font-bold text-white"
          style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
        >
          Select Your Role
        </h2>
        <div
          className="mt-3 h-0.5 w-12 rounded-full bg-white/70"
          aria-hidden="true"
        />
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-4">
        {ROLE_OPTIONS.map((role) => (
          <RoleCard key={role.value} role={role} onSelect={onSelectRole} />
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onBack}
          className="login-focus inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:text-white"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </button>
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-white/60">
        <Shield size={14} aria-hidden="true" />
        Your selection personalizes your dashboard and features
      </p>
    </div>
  )
}

function DemoAccountsPanel({ accounts, onFill }) {
  const [open, setOpen] = useState(true)
  const [copiedKey, setCopiedKey] = useState('')

  if (!accounts.length) return null

  async function copyText(key, text) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(''), 1600)
    } catch {
      // Clipboard may be unavailable
    }
  }

  return (
    <div className="login-rise mt-4 w-full max-w-[420px] overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="login-focus flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
        aria-controls="demo-accounts-list"
      >
        <span>
          <span className="block text-sm font-semibold text-white">Demo accounts</span>
          <span className="mt-0.5 block text-xs text-white/70">
            Click Use to autofill email, password, and role
          </span>
        </span>
        <ChevronDown
          size={18}
          className="shrink-0 text-white/70 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul id="demo-accounts-list" className="max-h-72 space-y-2 overflow-y-auto border-t border-white/15 px-3 py-3">
          {accounts.map((account) => (
            <li
              key={account.email}
              className="rounded-xl border border-white/15 bg-white/95 p-3 shadow-sm"
            >
              <button
                type="button"
                onClick={() => onFill(account)}
                className="login-focus flex w-full items-center justify-between gap-3 text-left"
                aria-label={`Autofill credentials for ${account.name}`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-900">{account.name}</span>
                  <span className="mt-0.5 block text-xs font-medium" style={{ color: BRAND.primary }}>
                    {account.role}
                  </span>
                </span>
                <span
                  className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold"
                  style={{ background: BRAND.soft, color: BRAND.primary }}
                >
                  Use
                </span>
              </button>

              <dl className="mt-2 space-y-1">
                {[
                  { term: 'Email', value: account.email, key: `${account.email}-email` },
                  { term: 'Pass', value: account.password, key: `${account.email}-pass` },
                ].map((row) => (
                  <div
                    key={row.key}
                    className="flex items-center gap-2 rounded-lg bg-slate-50 py-1 pl-2 pr-1"
                  >
                    <dt className="w-10 shrink-0 text-[10px] font-semibold uppercase text-slate-400">
                      {row.term}
                    </dt>
                    <dd className="min-w-0 flex-1 truncate text-xs text-slate-700">{row.value}</dd>
                    <button
                      type="button"
                      onClick={() => copyText(row.key, row.value)}
                      className="login-focus inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-1.5 text-[10px] font-semibold text-slate-500 hover:bg-white"
                      aria-label={`Copy ${row.term.toLowerCase()} for ${account.name}`}
                    >
                      {copiedKey === row.key ? (
                        <Check size={12} style={{ color: BRAND.primary }} />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SignInScreen({
  role,
  email,
  password,
  error,
  notice,
  submitting,
  showPassword,
  demoAccounts,
  onFillDemo,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
  onBack,
  onChangeRole,
  onForgotPassword,
}) {
  const roleLabel = ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role

  return (
    <div className="login-rise w-full max-w-[420px]">
      <div className="prognos-signin-card">
        <PrognosEmblem size={72} />
        <h2
          className="prognos-serif mt-5 text-center font-bold tracking-tight"
          style={{ color: BRAND.primaryDeep, fontSize: '1.75rem' }}
        >
          Sign in
        </h2>
        <p className="mt-1 text-center text-sm" style={{ color: BRAND.muted }}>
          Welcome back to PrognosEd
        </p>

        <div
          className="mt-4 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm"
          style={{ background: BRAND.soft }}
        >
          <span style={{ color: BRAND.muted }}>Role:</span>
          <span className="font-semibold" style={{ color: BRAND.primaryDeep }}>
            {roleLabel}
          </span>
          <button
            type="button"
            onClick={onChangeRole}
            className="login-focus ml-1 text-xs font-semibold hover:underline"
            style={{ color: BRAND.primary }}
          >
            Change
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate aria-busy={submitting}>
          {notice && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800"
            >
              <Check size={18} className="shrink-0" aria-hidden="true" />
              <span>{notice}</span>
            </div>
          )}
          {error && (
            <div
              id="login-error"
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              <AlertCircle size={18} className="shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={onEmailChange}
                placeholder="Enter your email"
                aria-describedby={error ? 'login-error' : undefined}
                className="prognos-input w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={onPasswordChange}
                placeholder="Enter your password"
                aria-describedby={error ? 'login-error' : undefined}
                className="prognos-input w-full rounded-xl border border-slate-200 py-3 pl-10 pr-11 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={onTogglePassword}
                className="login-focus absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-[#E6F4EE]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                className="login-focus text-xs font-semibold hover:underline"
                style={{ color: BRAND.primary }}
                onClick={onForgotPassword}
              >
                Forgot password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="prognos-btn-gradient login-focus group flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader size={18} className="animate-spin" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>

          {role !== 'Director / Dean' && (
            <div className="flex items-center gap-3 py-1">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">or</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
          )}

          {role !== 'Director / Dean' && (
            <p className="text-center text-xs text-slate-500">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className="login-focus font-semibold hover:underline"
                style={{ color: BRAND.primary }}
              >
                {role === 'Academic Admin' ? 'Contact director admin' : 'Contact admin'}
              </button>
            </p>
          )}
        </form>
      </div>

      <DemoAccountsPanel accounts={demoAccounts} onFill={onFillDemo} />

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={onBack}
          className="login-focus inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:text-white"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to roles
        </button>
      </div>
    </div>
  )
}

function toAppResetUrl(apiResetUrl) {
  if (!apiResetUrl) return ''
  try {
    const token = new URL(apiResetUrl, window.location.origin).searchParams.get('token')
    if (!token) return ''
    return `${window.location.origin}/reset-password?token=${encodeURIComponent(token)}`
  } catch {
    return ''
  }
}

function maskEmail(email) {
  const trimmed = String(email ?? '').trim()
  const at = trimmed.indexOf('@')
  if (at < 1) return trimmed
  const local = trimmed.slice(0, at)
  const domain = trimmed.slice(at + 1)
  const visible = local.slice(0, 1)
  return `${visible}***@${domain}`
}

function ForgotPasswordScreen({ email, error, submitting, onEmailChange, onSubmit, onBack }) {
  return (
    <div className="login-rise w-full max-w-[420px]">
      <div className="prognos-signin-card">
        <PrognosEmblem size={64} />
        <h2
          className="prognos-serif mt-5 text-center font-bold tracking-tight"
          style={{ color: BRAND.primaryDeep, fontSize: '1.75rem' }}
        >
          Reset password
        </h2>
        <p className="mt-2 text-center text-sm leading-relaxed" style={{ color: BRAND.muted }}>
          Enter the email for this account. If it matches a PrognosEd user, we will send a one-time reset link.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              <AlertCircle size={18} className="shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="reset-email" className="sr-only">
              Email
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                value={email}
                onChange={onEmailChange}
                placeholder="name@university.edu"
                className="prognos-input w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="prognos-btn-gradient login-focus flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader size={18} className="animate-spin" aria-hidden="true" />
                Sending link…
              </>
            ) : (
              'Send reset link'
            )}
          </button>
        </form>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={onBack}
          className="login-focus inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:text-white"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to sign in
        </button>
      </div>
    </div>
  )
}

function CheckEmailScreen({ email, resetUrl, onBack, onResend, resending }) {
  return (
    <div className="login-rise w-full max-w-[440px]">
      <div className="prognos-signin-card text-center">
        <div
          className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl"
          style={{ background: BRAND.soft }}
        >
          <Mail size={28} style={{ color: BRAND.primary }} aria-hidden="true" />
        </div>
        <h2
          className="prognos-serif mt-5 font-bold tracking-tight"
          style={{ color: BRAND.primaryDeep, fontSize: '1.75rem' }}
        >
          Check your email
        </h2>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: BRAND.muted }}>
          If an account exists for{' '}
          <span className="font-semibold" style={{ color: BRAND.ink }}>
            {maskEmail(email)}
          </span>
          , we sent a password reset link. It expires in 30 minutes and can be used once.
        </p>
        {resetUrl ? (
          <a
            href={resetUrl}
            className="prognos-btn-gradient login-focus mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white"
          >
            Open reset page
            <ExternalLink size={16} aria-hidden="true" />
          </a>
        ) : (
          <div
            className="mt-5 rounded-xl px-4 py-3 text-left text-sm leading-relaxed"
            style={{ background: BRAND.soft, color: BRAND.muted }}
          >
            Open the message from PrognosEd, then choose <strong style={{ color: BRAND.ink }}>Reset password</strong>.
            If you do not see it, check spam or promotions.
          </div>
        )}
        <button
          type="button"
          onClick={onResend}
          disabled={resending}
          className="login-focus mt-5 text-sm font-semibold hover:underline disabled:opacity-60"
          style={{ color: BRAND.primary }}
        >
          {resending ? 'Sending again…' : 'Resend link'}
        </button>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={onBack}
          className="login-focus inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:text-white"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Return to sign in
        </button>
      </div>
    </div>
  )
}

export default function Login({ onLogin, initialNotice }) {
  const [step, setStep] = useState(STEPS.WELCOME)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [demoAccounts, setDemoAccounts] = useState([])
  const [notice, setNotice] = useState(initialNotice ?? '')
  const [resetUrl, setResetUrl] = useState('')

  useEffect(() => {
    api.getDemoAccounts().then(setDemoAccounts).catch(() => setDemoAccounts([]))
  }, [])

  function fillDemoAccount(account) {
    setEmail(account.email)
    setPassword(account.password)
    // Merge-role UI mapping:
    // - Department Head -> Faculty
    // - Administrative Staff -> Academic Admin
    const mergedRole =
      account.role === 'Department Head'
        ? 'Faculty'
        : account.role === 'Administrative Staff'
          ? 'Academic Admin'
          : account.role

    setRole(mergedRole)
    setError('')
  }

  function handleSelectRole(selectedRole) {
    setRole(selectedRole)
    setError('')
    setStep(STEPS.SIGNIN)
  }

  function openForgotPassword() {
    setError('')
    setPassword('')
    setStep(STEPS.FORGOT)
  }

  async function handleForgotSubmit(event) {
    event.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      setError('Enter the email address for this account.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const result = await api.requestPasswordReset(email.trim())
      setResetUrl(toAppResetUrl(result.resetUrl))
      setStep(STEPS.SENT)
    } catch (err) {
      setError(err.message ?? 'Unable to send a reset link. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResendReset() {
    setSubmitting(true)
    setError('')
    try {
      const result = await api.requestPasswordReset(email.trim())
      setResetUrl(toAppResetUrl(result.resetUrl))
    } catch (err) {
      setError(err.message ?? 'Unable to resend the reset link.')
      setStep(STEPS.FORGOT)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!email.trim() || !password.trim() || !role) {
      setError('Please fill in all fields.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const result = await api.login(email, password, role)
      onLogin?.(result.user, result.token)
    } catch (err) {
      if (err.code === 'ACCOUNT_INVITED') {
        setError(
          'Your invitation is still pending. Open the activation link from your email, or ask your Academic Admin to resend it.',
        )
      } else if (err.code === 'ACCOUNT_DISABLED') {
        setError('This account has been disabled. Contact your Academic Admin for help.')
      } else {
        setError(err.message ?? 'Sign in failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PrognosAuthBackdrop>
      {step === STEPS.WELCOME && (
        <WelcomeScreen onContinue={() => setStep(STEPS.ROLES)} />
      )}

      {step === STEPS.ROLES && (
        <RoleSelectScreen
          onBack={() => setStep(STEPS.WELCOME)}
          onSelectRole={handleSelectRole}
        />
      )}

      {step === STEPS.SIGNIN && (
        <SignInScreen
          role={role}
          email={email}
          password={password}
          error={error}
          notice={notice}
          submitting={submitting}
          showPassword={showPassword}
          demoAccounts={demoAccounts}
          onFillDemo={fillDemoAccount}
          onEmailChange={(e) => setEmail(e.target.value)}
          onPasswordChange={(e) => setPassword(e.target.value)}
          onTogglePassword={() => setShowPassword((v) => !v)}
          onSubmit={handleSubmit}
          onBack={() => setStep(STEPS.ROLES)}
          onChangeRole={() => setStep(STEPS.ROLES)}
          onForgotPassword={openForgotPassword}
        />
      )}

      {step === STEPS.FORGOT && (
        <ForgotPasswordScreen
          email={email}
          error={error}
          submitting={submitting}
          onEmailChange={(e) => setEmail(e.target.value)}
          onSubmit={handleForgotSubmit}
          onBack={() => {
            setError('')
            setStep(STEPS.SIGNIN)
          }}
        />
      )}

      {step === STEPS.SENT && (
        <CheckEmailScreen
          email={email}
          resetUrl={resetUrl}
          resending={submitting}
          onResend={handleResendReset}
          onBack={() => {
            setError('')
            setStep(STEPS.SIGNIN)
          }}
        />
      )}
    </PrognosAuthBackdrop>
  )
}
