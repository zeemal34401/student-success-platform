import { getRiskLevelConfig } from '../../constants/riskLevels'

export default function RiskBadge({ level, score }) {
  const config = getRiskLevelConfig(level)

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-badge border px-2.5 py-0.5',
        'text-xs font-semibold tracking-wide',
        config.textClass,
        config.bgClass,
        config.borderClass,
      ].join(' ')}
      aria-label={
        score != null
          ? `Risk level: ${level}, score ${score} out of 100`
          : `Risk level: ${level}`
      }
    >
      <span aria-hidden="true">{level}</span>
      {score != null && (
        <span className="font-normal opacity-80" aria-hidden="true">({score})</span>
      )}
    </span>
  )
}
