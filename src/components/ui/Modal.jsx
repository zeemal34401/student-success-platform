import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'medium',
}) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef(null)
  const previousFocusRef = useRef(null)
  const onCloseRef = useRef(onClose)

  onCloseRef.current = onClose

  useEffect(() => {
    if (!isOpen) return undefined

    previousFocusRef.current = document.activeElement
    document.body.style.overflow = 'hidden'

    const panel = panelRef.current
    const focusables = panel?.querySelectorAll(FOCUSABLE)
    focusables?.[0]?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab' || !panel) return

      const elements = [...panel.querySelectorAll(FOCUSABLE)].filter(
        (el) => !el.closest('[aria-hidden="true"]'),
      )
      if (elements.length === 0) return

      const first = elements[0]
      const last = elements[elements.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      previousFocusRef.current?.focus?.()
    }
  }, [isOpen])

  if (!isOpen) return null

  const widthClass = size === 'small' ? 'max-w-md' : 'max-w-lg'

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-text-primary/40 backdrop-blur-[1px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={[
          'relative z-10 w-full rounded-lg border border-border bg-surface shadow-card-hover',
          widthClass,
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-text-primary">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-0.5 text-sm text-text-secondary">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost shrink-0 p-1.5"
            aria-label="Close dialog"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="max-h-[calc(100vh-2rem)] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
