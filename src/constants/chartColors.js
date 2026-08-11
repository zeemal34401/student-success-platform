/** Chart & SVG hex values — mirrors design-system.css tokens for Recharts/SVG. */
export const RISK_CHART_COLORS = {
  Critical: '#D92D20',
  High: '#F79009',
  Medium: '#F79009',
  Low: '#0B6E4F',
}

export const CHART_COLORS = {
  primary: '#0B6E4F',
  secondary: '#F79009',
  grid: '#E4E7EC',
  tick: '#98A2B3',
}

export function getRiskChartColor(level) {
  return RISK_CHART_COLORS[level] ?? CHART_COLORS.primary
}
