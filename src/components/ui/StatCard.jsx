import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import Card from './Card'

const TREND_ICONS = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
}

export default function StatCard({
  label,
  value,
  subLabel,
  icon: Icon,
  iconTone = 'emerald',
  trend,
  topBorderColor,
  tintBackgroundColor,
  neutralTrendLabel,
}) {
  const TrendIcon = trend ? TREND_ICONS[trend.direction] ?? Minus : null
  const trendPositive = trend?.positive ?? trend?.direction === 'up'
  const isNeutralTrend = trend?.direction === 'flat' && neutralTrendLabel

  // Backwards compatible mapping for existing screens still passing blue/purple/indigo/green.
  const normalizedIconTone =
    iconTone === 'blue' || iconTone === 'purple' || iconTone === 'indigo' || iconTone === 'green'
      ? 'emerald'
      : iconTone

  const status =
    normalizedIconTone === 'critical' || normalizedIconTone === 'red'
      ? 'critical'
      : normalizedIconTone === 'amber' || normalizedIconTone === 'warning'
        ? 'amber'
        : 'emerald'

  const ICON_TONE_STYLES = {
    emerald: { bg: '#E6F4EE', fg: '#0B6E4F' },
    amber: { bg: '#FEF0C7', fg: '#F79009' },
    critical: { bg: '#FEE4E2', fg: '#D92D20' },
  }

  const iconToneStyles = ICON_TONE_STYLES[status] ?? ICON_TONE_STYLES.emerald

  return (
    <Card
      className="transition-shadow duration-200 hover:shadow-card-hover"
      style={{
        borderTop: topBorderColor ? `3px solid ${topBorderColor}` : undefined,
        backgroundColor: tintBackgroundColor ?? undefined,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            {label}
          </p>
          <p className="mt-2 text-[1.75rem] font-extrabold leading-8 tracking-tight text-text-primary">
            {value}
          </p>
          {trend && TrendIcon && !isNeutralTrend && (
            <p
              className={[
                'mt-2 inline-flex items-center gap-1 text-xs font-semibold',
              ].join(' ')}
              style={{
                color: trendPositive ? '#0B6E4F' : '#D92D20',
              }}
            >
              <TrendIcon size={14} aria-hidden="true" />
              <span>{trend.value}</span>
              <span className="font-normal text-text-muted">vs last term</span>
            </p>
          )}
          {isNeutralTrend && (
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-text-muted">
              <Minus size={14} aria-hidden="true" />
              <span>{neutralTrendLabel}</span>
            </p>
          )}
          {subLabel && (
            <p className="mt-2 text-sm text-text-muted">{subLabel}</p>
          )}
        </div>
        {Icon && (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: iconToneStyles.bg,
              color: iconToneStyles.fg,
            }}
          >
            <Icon size={20} strokeWidth={2} aria-hidden="true" />
          </div>
        )}
      </div>
    </Card>
  )
}
