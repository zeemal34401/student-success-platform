import { getRiskLevelConfig } from '../../constants/riskLevels'

export default function RiskScoreIndicator({ score, level }) {
  const config = getRiskLevelConfig(level)
  const width = Math.min(100, Math.max(0, score))

  return (
    <div className="flex items-center justify-end gap-2">
      <div
        className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-border sm:block"
        aria-hidden="true"
      >
        <div
          className={['h-full rounded-full', config.barClass].join(' ')}
          style={{ width: `${width}%` }}
        />
      </div>
      <span
        className={['h-2 w-2 shrink-0 rounded-full', config.dotClass].join(' ')}
        aria-hidden="true"
      />
      <span className="tabular-nums font-semibold text-text-primary">{score}</span>
    </div>
  )
}
