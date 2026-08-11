export const RISK_LEVELS = {
  Critical: {
    label: 'Critical',
    textClass: 'text-risk-critical',
    bgClass: 'bg-risk-critical-bg',
    borderClass: 'border-risk-critical-border',
    barClass: 'bg-risk-critical',
    dotClass: 'bg-risk-critical',
  },
  High: {
    label: 'High',
    textClass: 'text-risk-high',
    bgClass: 'bg-risk-high-bg',
    borderClass: 'border-risk-high-border',
    barClass: 'bg-risk-high',
    dotClass: 'bg-risk-high',
  },
  Medium: {
    label: 'Medium',
    textClass: 'text-risk-medium',
    bgClass: 'bg-risk-medium-bg',
    borderClass: 'border-risk-medium-border',
    barClass: 'bg-risk-medium',
    dotClass: 'bg-risk-medium',
  },
  Low: {
    label: 'Low',
    textClass: 'text-risk-low',
    bgClass: 'bg-risk-low-bg',
    borderClass: 'border-risk-low-border',
    barClass: 'bg-risk-low',
    dotClass: 'bg-risk-low',
  },
}

export function getRiskLevelConfig(level) {
  return RISK_LEVELS[level] ?? RISK_LEVELS.Low
}
