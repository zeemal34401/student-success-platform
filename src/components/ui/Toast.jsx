import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    className: 'border-risk-low-border bg-surface text-text-primary',
    iconClassName: 'text-risk-low',
  },
  info: {
    icon: Info,
    className: 'border-primary-100 bg-surface text-text-primary',
    iconClassName: 'text-primary-600',
  },
  dismiss: {
    icon: XCircle,
    className: 'border-border bg-surface text-text-primary',
    iconClassName: 'text-text-muted',
  },
}

export default function Toast({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (!toast) return undefined

    setExiting(false)
    const exitTimer = setTimeout(() => setExiting(true), 2700)
    const removeTimer = setTimeout(() => onDismiss?.(), 3000)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(removeTimer)
    }
  }, [toast, onDismiss])

  if (!toast) return null

  const variant = VARIANTS[toast.variant] ?? VARIANTS.info
  const Icon = variant.icon

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'fixed bottom-24 right-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-card-hover md:bottom-6',
        variant.className,
        exiting ? 'animate-toast-exit' : 'animate-toast-enter',
      ].join(' ')}
    >
      <Icon size={18} className={`mt-0.5 shrink-0 ${variant.iconClassName}`} aria-hidden="true" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        type="button"
        onClick={() => {
          setExiting(true)
          setTimeout(() => onDismiss?.(), 180)
        }}
        aria-label="Dismiss notification"
        className="btn-ghost -mr-1 shrink-0 p-1"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  )
}
