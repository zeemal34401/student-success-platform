import { getAccountStatusConfig } from '../../constants/accountStatus'

export default function StatusBadge({ status }) {
  const config = getAccountStatusConfig(status)

  return (
    <span
      className={[
        'inline-flex items-center rounded-badge border px-2.5 py-0.5',
        'text-xs font-semibold tracking-wide',
        config.textClass,
        config.bgClass,
        config.borderClass,
      ].join(' ')}
      aria-label={`Account status: ${status}`}
    >
      {status}
    </span>
  )
}
