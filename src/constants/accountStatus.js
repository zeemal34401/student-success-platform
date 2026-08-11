export const ACCOUNT_STATUSES = {
  Active: {
    label: 'Active',
    textClass: 'text-risk-low',
    bgClass: 'bg-risk-low-bg',
    borderClass: 'border-risk-low-border',
  },
  Invited: {
    label: 'Invited',
    textClass: 'text-risk-high',
    bgClass: 'bg-risk-high-bg',
    borderClass: 'border-risk-high-border',
  },
  Disabled: {
    label: 'Disabled',
    textClass: 'text-risk-critical',
    bgClass: 'bg-risk-critical-bg',
    borderClass: 'border-risk-critical-border',
  },
}

export function getAccountStatusConfig(status) {
  return ACCOUNT_STATUSES[status] ?? ACCOUNT_STATUSES.Disabled
}
