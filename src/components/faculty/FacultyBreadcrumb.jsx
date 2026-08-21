import { ChevronRight } from 'lucide-react'

export default function FacultyBreadcrumb({ items = [] }) {
  if (!items.length) return null

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
            {index > 0 ? <ChevronRight size={14} className="text-text-muted" aria-hidden="true" /> : null}
            {item.onClick && !isLast ? (
              <button
                type="button"
                onClick={item.onClick}
                className="rounded-md px-1.5 py-0.5 font-medium text-primary-700 transition-colors hover:bg-primary-50 hover:text-primary-800"
              >
                {item.label}
              </button>
            ) : (
              <span className={isLast ? 'px-1.5 font-semibold text-text-primary' : 'px-1.5 text-text-secondary'}>
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
