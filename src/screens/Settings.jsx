import { useEffect, useRef, useState } from 'react'
import { Bell, Check, Mail, Shield, User } from 'lucide-react'
import { Card, PageLayout, SectionHeader, ErrorState } from '../components/ui'
import { api } from '../api/client'

const inputClassName = 'input-field'

const NOTIFICATION_OPTIONS = [
  { key: 'criticalAlerts', label: 'Critical alerts', description: 'Immediate notifications when a student reaches critical risk.' },
  { key: 'weeklyDigest', label: 'Weekly digest', description: 'Summary of at-risk students and engagement trends every Monday.' },
  { key: 'interventionUpdates', label: 'Intervention updates', description: 'Status changes when intervention plans are accepted or completed.' },
]

function Toggle({ id, checked, onChange, label, description }) {
  const labelId = `${id}-label`
  const descId = `${id}-description`

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <span id={labelId} className="text-sm font-medium text-text-primary">{label}</span>
        <p id={descId} className="mt-0.5 text-sm text-text-secondary">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={descId}
        onClick={() => onChange(!checked)}
        className={[
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-150',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600',
          checked ? 'bg-primary-600' : 'bg-border-strong',
        ].join(' ')}
      >
        <span className={['pointer-events-none inline-block h-5 w-5 rounded-full bg-surface shadow-sm transition-transform', checked ? 'translate-x-5' : 'translate-x-0'].join(' ')} />
      </button>
    </div>
  )
}

export default function Settings({ user, onUserUpdate, onNotify }) {
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [notifications, setNotifications] = useState({
    criticalAlerts: true,
    weeklyDigest: true,
    interventionUpdates: false,
  })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const saveTimerRef = useRef(null)

  useEffect(() => {
    api
      .getSettings()
      .then((settings) => {
        setName(settings.profile.name)
        setEmail(settings.profile.email)
        setNotifications(settings.notifications)
      })
      .catch(setError)
      .finally(() => setLoading(false))

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  function handleNotificationChange(key, value) {
    setNotifications((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave(event) {
    event.preventDefault()
    setSaveError(null)

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    try {
      const profileResult = await api.updateProfile({ name, email })
      await api.updateNotifications(notifications)
      if (profileResult.user) onUserUpdate?.(profileResult.user)
      setSaved(true)
      console.log('onNotify is:', onNotify)
      onNotify?.({ message: 'Settings saved successfully', variant: 'success' })
      saveTimerRef.current = setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setSaveError(err)
      onNotify?.({ message: 'Failed to save settings', variant: 'dismiss' })
    }
  }

  if (loading) {
    return (
      <PageLayout size="form">
        <div className="animate-skeleton h-8 w-40 rounded-md bg-border/80" />
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout size="form">
        <ErrorState error={error} />
      </PageLayout>
    )
  }

  return (
    <PageLayout size="form">
      <SectionHeader as="h2" title="Settings" description="Manage your profile and notification preferences." />

      <form onSubmit={handleSave} className="mt-6 space-y-6">
        <Card>
          <h2 className="card-title">Profile</h2>
          <p className="mt-0.5 text-sm text-text-secondary">Your account information</p>
          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-secondary">Full name</label>
              <div className="relative">
                <User size={16} className="pointer-events-none absolute left-[10px] top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
                <input id="name" type="text" value={name} onChange={(e) => { setName(e.target.value); setSaved(false) }} className={`${inputClassName} h-11 pl-9`} />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-secondary">Email address</label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-[10px] top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
                <input id="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setSaved(false) }} className={`${inputClassName} h-11 pl-9`} />
              </div>
            </div>
            <div>
              <label htmlFor="role" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-secondary">Role</label>
              <div className="relative">
                <Shield size={16} className="pointer-events-none absolute left-[10px] top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
                <input
                  id="role"
                  type="text"
                  value={user?.role ?? ''}
                  readOnly
                  aria-readonly="true"
                  className={`${inputClassName} h-11 cursor-not-allowed pl-9 text-text-muted`}
                  style={{
                    backgroundColor: '#F2F4F7',
                    color: '#98A2B3',
                  }}
                />
              </div>
              <p className="mt-1.5 text-xs text-text-muted">
                Contact an administrator to change your role.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <fieldset>
            <legend className="sr-only">Notification preferences</legend>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Bell size={18} aria-hidden="true" />
              </div>
              <div>
                <h2 className="card-title">Notifications</h2>
                <p className="mt-0.5 text-sm text-text-secondary">Choose how you want to be notified</p>
              </div>
            </div>
            <div className="mt-5 divide-y divide-border">
              {NOTIFICATION_OPTIONS.map((option) => (
                <div key={option.key} className="py-4 first:pt-0 last:pb-0">
                  <Toggle
                    id={option.key}
                    label={option.label}
                    description={option.description}
                    checked={notifications[option.key]}
                    onChange={(value) => handleNotificationChange(option.key, value)}
                  />
                </div>
              ))}
            </div>
          </fieldset>
        </Card>

        {saveError && (
          <div className="rounded-md border border-risk-critical-border bg-risk-critical-bg px-3 py-2 text-sm text-risk-critical">
            {saveError.message}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary px-5 py-2.5">
            {saved ? (<><Check size={16} aria-hidden="true" /> Saved</>) : 'Save changes'}
          </button>
          {saved && (
            <span className="text-sm text-risk-low" role="status">Your preferences have been saved.</span>
          )}
        </div>
      </form>

    </PageLayout>
  )
}