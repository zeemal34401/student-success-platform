import { useEffect, useRef, useState } from 'react'
import { Bell, Camera, Check, ImagePlus, Lock, Mail, Shield, Trash2, User } from 'lucide-react'
import { PageLayout, ErrorState, UserAvatar, StatusBadge } from '../components/ui'
import { api } from '../api/client'

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
        <span id={labelId} className="text-sm font-medium text-[#2C3546]">{label}</span>
        <p id={descId} className="mt-0.5 text-sm text-[#5A6578]">{description}</p>
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
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3546]',
          checked ? 'bg-[#2C3546]' : 'bg-[#C5CDD8]',
        ].join(' ')}
      >
        <span className={['pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform', checked ? 'translate-x-5' : 'translate-x-0'].join(' ')} />
      </button>
    </div>
  )
}

function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp'])
    if (!allowed.has(file.type)) {
      reject(new Error('Please choose a JPG, PNG, or WebP image.'))
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error('Image must be under 8 MB.'))
      return
    }

    const image = new Image()
    const objectUrl = URL.createObjectURL(file)
    image.onload = () => {
      const size = 512
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const context = canvas.getContext('2d')
      const min = Math.min(image.width, image.height)
      const sx = (image.width - min) / 2
      const sy = (image.height - min) / 2
      context.drawImage(image, sx, sy, min, min, 0, 0, size, size)
      URL.revokeObjectURL(objectUrl)
      resolve(canvas.toDataURL('image/jpeg', 0.88))
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read that image.'))
    }
    image.src = objectUrl
  })
}

function CredentialRow({ icon: Icon, label, value }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-[#D4DBE5] py-3.5 last:border-b-0 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-center sm:gap-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5A6578]">
        <Icon size={13} aria-hidden="true" />
        {label}
      </div>
      <p className="truncate font-heading text-base font-semibold text-[#2C3546]">{value || '—'}</p>
    </div>
  )
}

export default function Settings({ user, onUserUpdate, onNotify }) {
  const fileInputRef = useRef(null)
  const saveTimerRef = useRef(null)
  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    role: user?.role ?? '',
    department: user?.department ?? 'Institution-wide',
    status: user?.status ?? 'Active',
    avatarUrl: user?.avatarUrl ?? null,
  })
  const [notifications, setNotifications] = useState({
    criticalAlerts: true,
    weeklyDigest: true,
    interventionUpdates: false,
  })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState(null)

  useEffect(() => {
    api
      .getSettings()
      .then((settings) => {
        setProfile(settings.profile)
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
      await api.updateNotifications(notifications)
      setSaved(true)
      onNotify?.({ message: 'Notification preferences saved', variant: 'success' })
      saveTimerRef.current = setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setSaveError(err)
      onNotify?.({ message: 'Failed to save preferences', variant: 'dismiss' })
    }
  }

  async function handlePhotoSelected(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setPhotoError(null)
    setPhotoBusy(true)
    try {
      const image = await resizeImageFile(file)
      const result = await api.updateAvatar(image)
      setProfile(result.profile)
      if (result.user) onUserUpdate?.(result.user)
      onNotify?.({ message: 'Profile photo updated', variant: 'success' })
    } catch (err) {
      setPhotoError(err)
      onNotify?.({ message: err.message ?? 'Could not update photo', variant: 'dismiss' })
    } finally {
      setPhotoBusy(false)
    }
  }

  async function handleRemovePhoto() {
    setPhotoError(null)
    setPhotoBusy(true)
    try {
      const result = await api.removeAvatar()
      setProfile(result.profile)
      if (result.user) onUserUpdate?.(result.user)
      onNotify?.({ message: 'Profile photo removed', variant: 'info' })
    } catch (err) {
      setPhotoError(err)
      onNotify?.({ message: err.message ?? 'Could not remove photo', variant: 'dismiss' })
    } finally {
      setPhotoBusy(false)
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="animate-skeleton h-48 w-full rounded-2xl bg-border/80" />
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout>
        <ErrorState error={error} />
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <section
        className="relative overflow-hidden rounded-2xl border px-6 py-8 sm:px-8 sm:py-9"
        style={{
          backgroundColor: '#2C3546',
          borderColor: '#3A4458',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
          aria-hidden="true"
        />
        <p
          className="pointer-events-none absolute -right-4 top-6 hidden font-heading text-[7rem] font-bold leading-none text-white/[0.04] sm:block"
          aria-hidden="true"
        >
          Profile
        </p>

        <div className="relative grid gap-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
          <div className="mx-auto lg:mx-0">
            <div
              className="relative rounded-[2rem] p-2"
              style={{
                background: 'linear-gradient(160deg, #4A5568 0%, #1E2633 100%)',
                boxShadow: '0 18px 40px rgba(8, 12, 20, 0.35)',
              }}
            >
              <div className="rounded-[1.65rem] bg-[#2C3546] p-1.5">
                <UserAvatar
                  name={profile.name}
                  photoUrl={profile.avatarUrl}
                  size="xl"
                  shape="portrait"
                  className="bg-[#3A4458] text-white"
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoBusy}
                className="absolute -bottom-2 -right-2 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#4A5568] bg-white text-[#2C3546] shadow-card hover:bg-[#E8EDF4] disabled:opacity-60"
                aria-label="Change profile photo"
              >
                <Camera size={18} aria-hidden="true" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handlePhotoSelected}
            />
          </div>

          <div className="min-w-0 text-center lg:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
              Personal workspace
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {profile.name}
              </h2>
              {profile.status ? <StatusBadge status={profile.status} /> : null}
            </div>
            <p className="mt-2 text-base text-white/70">{profile.role}</p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60">
              Account identity is issued by the institution and cannot be edited here.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              <button
                type="button"
                disabled={photoBusy}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#2C3546] transition-colors hover:bg-[#E8EDF4] disabled:opacity-60"
              >
                <ImagePlus size={16} aria-hidden="true" />
                {photoBusy ? 'Updating…' : profile.avatarUrl ? 'Change portrait' : 'Add portrait'}
              </button>
              {profile.avatarUrl ? (
                <button
                  type="button"
                  disabled={photoBusy}
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-transparent px-4 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10 disabled:opacity-60"
                >
                  <Trash2 size={15} aria-hidden="true" />
                  Remove
                </button>
              ) : null}
            </div>
            <p className="mt-3 text-xs text-white/45">JPG, PNG, or WebP · up to 8 MB</p>
            {photoError ? (
              <p className="mt-2 text-sm text-risk-critical">{photoError.message}</p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article
          className="overflow-hidden rounded-2xl border"
          style={{
            backgroundColor: '#E8ECF2',
            borderColor: '#C5CDD8',
            boxShadow: '0 10px 28px rgba(44, 53, 70, 0.08)',
          }}
        >
          <div className="flex items-start justify-between gap-3 border-b border-[#D4DBE5] px-6 py-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5A6578]">Institutional record</p>
              <h3 className="mt-1 font-heading text-xl font-semibold text-[#2C3546]">Account information</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C5CDD8] bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-[#3A4458]">
              <Lock size={12} aria-hidden="true" />
              Locked
            </span>
          </div>
          <div className="px-6 py-1">
            <CredentialRow icon={User} label="Name" value={profile.name} />
            <CredentialRow icon={Mail} label="Email" value={profile.email} />
            <CredentialRow icon={Shield} label="Role" value={profile.role} />
            <CredentialRow icon={Lock} label="Unit" value={profile.department} />
          </div>
          <p className="border-t border-[#D4DBE5] bg-[#DCE2EB] px-6 py-3 text-xs leading-relaxed text-[#5A6578]">
            Name, email, role, and department are assigned by an administrator.
          </p>
        </article>

        <form onSubmit={handleSave}>
          <article
            className="flex h-full flex-col overflow-hidden rounded-2xl border"
            style={{
              backgroundColor: '#E8ECF2',
              borderColor: '#C5CDD8',
              boxShadow: '0 10px 28px rgba(44, 53, 70, 0.08)',
            }}
          >
            <div className="border-b border-[#D4DBE5] px-6 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5A6578]">Correspondence</p>
              <div className="mt-1 flex items-center gap-2">
                <Bell size={16} className="text-[#3A4458]" aria-hidden="true" />
                <h3 className="font-heading text-xl font-semibold text-[#2C3546]">Notifications</h3>
              </div>
              <p className="mt-1 text-sm text-[#5A6578]">Choose how this account should be reached.</p>
            </div>

            <fieldset className="flex-1 px-6">
              <legend className="sr-only">Notification preferences</legend>
              <div className="divide-y divide-[#D4DBE5]">
                {NOTIFICATION_OPTIONS.map((option) => (
                  <div key={option.key} className="py-4">
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

            {saveError && (
              <div className="mx-6 mb-3 rounded-md border border-risk-critical-border bg-risk-critical-bg px-3 py-2 text-sm text-risk-critical">
                {saveError.message}
              </div>
            )}

            <div className="border-t border-[#D4DBE5] bg-[#DCE2EB] px-6 py-4">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2C3546] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3A4458] sm:w-auto"
              >
                {saved ? (
                  <>
                    <Check size={16} aria-hidden="true" /> Saved
                  </>
                ) : (
                  'Save preferences'
                )}
              </button>
              {saved ? (
                <span className="ml-3 text-sm text-[#3A4458]" role="status">
                  Preferences updated.
                </span>
              ) : null}
            </div>
          </article>
        </form>
      </div>
    </PageLayout>
  )
}
