import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import Card from './Card'

const TREND_ICONS = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
}

const KPI_THEMES = {
  students: {
    background: 'linear-gradient(165deg, rgba(14, 90, 110, 0.72) 0%, rgba(20, 70, 95, 0.55) 100%)',
    border: 'rgba(125, 211, 252, 0.45)',
    shadow: '0 10px 28px rgba(8, 40, 55, 0.35), inset 0 1px 0 rgba(255,255,255,0.22)',
    text: '#ffffff',
    muted: 'rgba(255,255,255,0.78)',
    iconBg: 'rgba(255,255,255,0.16)',
    iconColor: '#ffffff',
    ink: false,
  },
  attendance: {
    background: 'linear-gradient(165deg, rgba(186, 242, 239, 0.78) 0%, rgba(160, 230, 232, 0.58) 100%)',
    border: 'rgba(45, 212, 191, 0.55)',
    shadow: '0 10px 28px rgba(13, 80, 85, 0.18), inset 0 1px 0 rgba(255,255,255,0.55)',
    text: '#115E59',
    muted: 'rgba(17, 94, 89, 0.78)',
    iconBg: 'rgba(17, 94, 89, 0.12)',
    iconColor: '#0F766E',
    ink: true,
  },
  risk: {
    background: 'linear-gradient(165deg, rgba(220, 38, 38, 0.78) 0%, rgba(185, 28, 28, 0.62) 100%)',
    border: 'rgba(252, 165, 165, 0.55)',
    shadow: '0 10px 28px rgba(127, 29, 29, 0.35), inset 0 1px 0 rgba(255,255,255,0.22)',
    text: '#ffffff',
    muted: 'rgba(254, 226, 226, 0.88)',
    iconBg: 'rgba(255, 255, 255, 0.16)',
    iconColor: '#ffffff',
    ink: false,
  },
  departments: {
    background: 'linear-gradient(165deg, rgba(190, 242, 214, 0.8) 0%, rgba(167, 243, 208, 0.58) 100%)',
    border: 'rgba(52, 211, 153, 0.55)',
    shadow: '0 10px 28px rgba(6, 78, 59, 0.16), inset 0 1px 0 rgba(255,255,255,0.5)',
    text: '#065F46',
    muted: 'rgba(6, 95, 70, 0.78)',
    iconBg: 'rgba(6, 95, 70, 0.12)',
    iconColor: '#047857',
    ink: true,
  },
  accounts: {
    background: 'linear-gradient(165deg, rgba(37, 99, 235, 0.78) 0%, rgba(29, 78, 216, 0.58) 100%)',
    border: 'rgba(147, 197, 253, 0.55)',
    shadow: '0 10px 28px rgba(30, 64, 175, 0.28), inset 0 1px 0 rgba(255,255,255,0.22)',
    text: '#ffffff',
    muted: 'rgba(219, 234, 254, 0.88)',
    iconBg: 'rgba(255, 255, 255, 0.16)',
    iconColor: '#ffffff',
    ink: false,
  },
  active: {
    background: 'linear-gradient(165deg, rgba(16, 185, 129, 0.78) 0%, rgba(5, 150, 105, 0.58) 100%)',
    border: 'rgba(110, 231, 183, 0.55)',
    shadow: '0 10px 28px rgba(6, 95, 70, 0.28), inset 0 1px 0 rgba(255,255,255,0.22)',
    text: '#ffffff',
    muted: 'rgba(209, 250, 229, 0.9)',
    iconBg: 'rgba(255, 255, 255, 0.16)',
    iconColor: '#ffffff',
    ink: false,
  },
  pending: {
    background: 'linear-gradient(165deg, rgba(245, 158, 11, 0.82) 0%, rgba(217, 119, 6, 0.62) 100%)',
    border: 'rgba(253, 230, 138, 0.6)',
    shadow: '0 10px 28px rgba(146, 64, 14, 0.28), inset 0 1px 0 rgba(255,255,255,0.22)',
    text: '#ffffff',
    muted: 'rgba(254, 243, 199, 0.92)',
    iconBg: 'rgba(255, 255, 255, 0.18)',
    iconColor: '#ffffff',
    ink: false,
  },
}

const VIVID_KPI_THEMES = {
  students: {
    background: 'radial-gradient(circle at 32% 28%, #F5F3FF 0%, #DDD6FE 48%, #C4B5FD 100%)',
    border: 'rgba(139, 92, 246, 0.35)',
    shadow: '0 16px 36px rgba(109, 40, 217, 0.2)',
    text: '#5B21B6',
    muted: 'rgba(91, 33, 182, 0.7)',
    iconBg: 'rgba(255,255,255,0.72)',
    iconColor: '#6D28D9',
    ink: true,
    ring: '#7C3AED',
    glow: 'rgba(139, 92, 246, 0.32)',
  },
  attendance: {
    background: 'radial-gradient(circle at 32% 28%, #F0F9FF 0%, #BAE6FD 48%, #7DD3FC 100%)',
    border: 'rgba(14, 165, 233, 0.35)',
    shadow: '0 16px 36px rgba(2, 132, 199, 0.2)',
    text: '#075985',
    muted: 'rgba(7, 89, 133, 0.7)',
    iconBg: 'rgba(255,255,255,0.72)',
    iconColor: '#0284C7',
    ink: true,
    ring: '#0284C7',
    glow: 'rgba(14, 165, 233, 0.3)',
  },
  risk: {
    background: 'radial-gradient(circle at 32% 28%, #FFF1F2 0%, #FECDD3 48%, #FDA4AF 100%)',
    border: 'rgba(244, 63, 94, 0.32)',
    shadow: '0 16px 36px rgba(225, 29, 72, 0.2)',
    text: '#9F1239',
    muted: 'rgba(159, 18, 57, 0.7)',
    iconBg: 'rgba(255,255,255,0.72)',
    iconColor: '#E11D48',
    ink: true,
    ring: '#E11D48',
    glow: 'rgba(244, 63, 94, 0.3)',
  },
  departments: {
    background: 'radial-gradient(circle at 32% 28%, #EEF2FF 0%, #C7D2FE 48%, #A5B4FC 100%)',
    border: 'rgba(99, 102, 241, 0.35)',
    shadow: '0 16px 36px rgba(79, 70, 229, 0.2)',
    text: '#3730A3',
    muted: 'rgba(55, 48, 163, 0.7)',
    iconBg: 'rgba(255,255,255,0.72)',
    iconColor: '#4F46E5',
    ink: true,
    ring: '#4F46E5',
    glow: 'rgba(99, 102, 241, 0.3)',
  },
}

const GLASS_TO_KPI = {
  blue: 'students',
  teal: 'attendance',
  coral: 'risk',
  mint: 'departments',
  emerald: 'departments',
  amber: 'attendance',
  critical: 'risk',
}

function GlobeWatermark() {
  return (
    <svg viewBox="0 0 160 160" className="h-[150px] w-[150px]" aria-hidden="true">
      <defs>
        <radialGradient id="globeGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="rgba(125,211,252,0.55)" />
          <stop offset="100%" stopColor="rgba(125,211,252,0)" />
        </radialGradient>
      </defs>
      <circle cx="80" cy="80" r="54" fill="url(#globeGlow)" />
      <circle cx="80" cy="80" r="48" fill="none" stroke="rgba(165,243,252,0.55)" strokeWidth="1.4" />
      <ellipse cx="80" cy="80" rx="22" ry="48" fill="none" stroke="rgba(165,243,252,0.4)" strokeWidth="1.1" />
      <ellipse cx="80" cy="80" rx="48" ry="18" fill="none" stroke="rgba(165,243,252,0.4)" strokeWidth="1.1" />
      <ellipse cx="80" cy="80" rx="48" ry="32" fill="none" stroke="rgba(165,243,252,0.28)" strokeWidth="1" />
      <path d="M32 80h96M80 32v96" fill="none" stroke="rgba(165,243,252,0.35)" strokeWidth="1" />
      <path
        d="M48 52c10 8 22 12 32 12s22-4 32-12M48 108c10-8 22-12 32-12s22 4 32 12"
        fill="none"
        stroke="rgba(165,243,252,0.32)"
        strokeWidth="1"
      />
    </svg>
  )
}

function ClockWatermark() {
  return (
    <svg viewBox="0 0 160 160" className="h-[150px] w-[150px]" aria-hidden="true">
      <circle cx="80" cy="80" r="50" fill="none" stroke="rgba(15,118,110,0.22)" strokeWidth="6" />
      <circle cx="80" cy="80" r="44" fill="none" stroke="rgba(15,118,110,0.16)" strokeWidth="1.5" />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
        const rad = (deg * Math.PI) / 180
        const x1 = 80 + Math.sin(rad) * 36
        const y1 = 80 - Math.cos(rad) * 36
        const x2 = 80 + Math.sin(rad) * 42
        const y2 = 80 - Math.cos(rad) * 42
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(15,118,110,0.28)" strokeWidth="2" />
      })}
      <line x1="80" y1="80" x2="80" y2="48" stroke="rgba(15,118,110,0.4)" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="80" x2="108" y2="92" stroke="rgba(15,118,110,0.35)" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="80" cy="80" r="4" fill="rgba(15,118,110,0.4)" />
    </svg>
  )
}

function WarningWatermark() {
  return (
    <svg viewBox="0 0 160 160" className="h-[150px] w-[150px]" aria-hidden="true">
      <path
        d="M80 28 L138 128 H22 Z"
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <path d="M80 62 v34" stroke="rgba(255,255,255,0.28)" strokeWidth="8" strokeLinecap="round" />
      <circle cx="80" cy="112" r="5" fill="rgba(255,255,255,0.28)" />
    </svg>
  )
}

function PeopleWatermark() {
  return (
    <svg viewBox="0 0 160 160" className="h-[150px] w-[150px]" aria-hidden="true">
      <circle cx="68" cy="58" r="18" fill="none" stroke="rgba(191,219,254,0.4)" strokeWidth="6" />
      <path d="M38 118c4-22 16-34 30-34s26 12 30 34" fill="none" stroke="rgba(191,219,254,0.4)" strokeWidth="6" strokeLinecap="round" />
      <circle cx="104" cy="54" r="14" fill="none" stroke="rgba(191,219,254,0.28)" strokeWidth="5" />
      <path d="M82 116c3-16 12-26 22-26s19 10 22 26" fill="none" stroke="rgba(191,219,254,0.28)" strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}

function CheckWatermark() {
  return (
    <svg viewBox="0 0 160 160" className="h-[150px] w-[150px]" aria-hidden="true">
      <circle cx="80" cy="80" r="46" fill="none" stroke="rgba(209,250,229,0.35)" strokeWidth="8" />
      <path d="M58 82 l16 16 30-34" fill="none" stroke="rgba(209,250,229,0.4)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EnvelopeWatermark() {
  return (
    <svg viewBox="0 0 160 160" className="h-[150px] w-[150px]" aria-hidden="true">
      <rect x="38" y="52" width="84" height="58" rx="8" fill="none" stroke="rgba(254,243,199,0.4)" strokeWidth="7" />
      <path d="M42 58 L80 88 L118 58" fill="none" stroke="rgba(254,243,199,0.4)" strokeWidth="7" strokeLinejoin="round" />
    </svg>
  )
}

function BuildingsWatermark() {
  return (
    <svg viewBox="0 0 170 160" className="h-[150px] w-[160px]" aria-hidden="true">
      <rect x="28" y="58" width="36" height="78" rx="3" fill="rgba(6,95,70,0.14)" />
      <rect x="70" y="34" width="40" height="102" rx="3" fill="rgba(6,95,70,0.18)" />
      <rect x="116" y="50" width="32" height="86" rx="3" fill="rgba(6,95,70,0.14)" />
      {[0, 1, 2, 3].map((row) =>
        [0, 1].map((col) => (
          <rect
            key={`a-${row}-${col}`}
            x={36 + col * 12}
            y={68 + row * 14}
            width="7"
            height="8"
            rx="1"
            fill="rgba(6,95,70,0.22)"
          />
        )),
      )}
      {[0, 1, 2, 3, 4].map((row) =>
        [0, 1].map((col) => (
          <rect
            key={`b-${row}-${col}`}
            x={78 + col * 13}
            y={44 + row * 14}
            width="8"
            height="8"
            rx="1"
            fill="rgba(6,95,70,0.22)"
          />
        )),
      )}
      {[0, 1, 2, 3].map((row) =>
        [0, 1].map((col) => (
          <rect
            key={`c-${row}-${col}`}
            x={123 + col * 11}
            y={60 + row * 14}
            width="7"
            height="8"
            rx="1"
            fill="rgba(6,95,70,0.2)"
          />
        )),
      )}
    </svg>
  )
}

function AreaChartViz() {
  return (
    <svg viewBox="0 0 220 72" className="h-12 w-full" aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaFillA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(34,211,238,0.55)" />
          <stop offset="100%" stopColor="rgba(34,211,238,0)" />
        </linearGradient>
        <linearGradient id="areaFillB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(125,211,252,0.4)" />
          <stop offset="100%" stopColor="rgba(125,211,252,0)" />
        </linearGradient>
        <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M0 48 C28 42, 44 30, 70 34 C96 38, 112 18, 140 22 C168 26, 186 12, 220 16 L220 72 L0 72 Z"
        fill="url(#areaFillA)"
      />
      <path
        d="M0 56 C30 50, 50 44, 78 46 C108 48, 126 32, 154 36 C182 40, 200 28, 220 32 L220 72 L0 72 Z"
        fill="url(#areaFillB)"
      />
      <path
        d="M0 48 C28 42, 44 30, 70 34 C96 38, 112 18, 140 22 C168 26, 186 12, 220 16"
        fill="none"
        stroke="#A5F3FC"
        strokeWidth="2.2"
        filter="url(#lineGlow)"
      />
      <path
        d="M0 56 C30 50, 50 44, 78 46 C108 48, 126 32, 154 36 C182 40, 200 28, 220 32"
        fill="none"
        stroke="rgba(186,230,253,0.9)"
        strokeWidth="1.6"
      />
    </svg>
  )
}

function DonutViz({ value = 79 }) {
  const pct = Math.max(0, Math.min(100, Number.parseInt(String(value), 10) || 79))
  const r = 22
  const c = 2 * Math.PI * r
  const dash = (pct / 100) * c
  return (
    <svg viewBox="0 0 72 72" className="h-12 w-12" aria-hidden="true">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(15,118,110,0.18)" strokeWidth="10" />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="#2DD4BF"
        strokeWidth="10"
        strokeDasharray={`${dash} ${c - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
        style={{ filter: 'drop-shadow(0 0 4px rgba(45,212,191,0.7))' }}
      />
    </svg>
  )
}

function HeatViz({ value = 0 }) {
  const filled = Math.max(0, Math.min(12, Number.parseInt(String(value), 10) || 0))
  return (
    <div className="grid w-full grid-cols-6 gap-1.5" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          className="h-2.5 rounded-sm"
          style={{
            backgroundColor: i < filled ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.25)',
          }}
        />
      ))}
    </div>
  )
}

function BarsViz({ color = '16, 185, 129' }) {
  const heights = [38, 58, 46, 72, 52, 64]
  return (
    <svg viewBox="0 0 120 72" className="h-12 w-[88px]" aria-hidden="true">
      {heights.map((h, i) => (
        <rect
          key={i}
          x={i * 20 + 4}
          y={72 - h}
          width="12"
          height={h}
          rx="3"
          fill={`rgba(${color}, ${0.45 + i * 0.08})`}
        />
      ))}
    </svg>
  )
}

function AccountsBars() {
  return <BarsViz color="147, 197, 253" />
}

function ActiveBars() {
  return <BarsViz color="167, 243, 208" />
}

function PendingBars() {
  return <BarsViz color="253, 230, 138" />
}

const WATERMARKS = {
  students: GlobeWatermark,
  attendance: ClockWatermark,
  risk: WarningWatermark,
  departments: BuildingsWatermark,
  accounts: PeopleWatermark,
  active: CheckWatermark,
  pending: EnvelopeWatermark,
}

const CHARTS = {
  students: AreaChartViz,
  attendance: DonutViz,
  risk: HeatViz,
  departments: BarsViz,
  accounts: AccountsBars,
  active: ActiveBars,
  pending: PendingBars,
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
  glassTint,
  kpiTheme,
  vivid = false,
  shape = 'rounded',
  decoration,
  note,
  neutralTrendLabel,
}) {
  const TrendIcon = trend ? TREND_ICONS[trend.direction] ?? Minus : null
  const trendPositive = trend?.positive ?? trend?.direction === 'up'
  const isNeutralTrend = trend?.direction === 'flat' && neutralTrendLabel

  const themeKey =
    kpiTheme ||
    GLASS_TO_KPI[glassTint] ||
    (iconTone === 'critical' || iconTone === 'red'
      ? 'risk'
      : iconTone === 'amber' || iconTone === 'warning'
        ? 'attendance'
        : 'departments')

  const mappedKey = KPI_THEMES[themeKey] ? themeKey : 'departments'
  const baseTheme = KPI_THEMES[mappedKey]
  const theme = tintBackgroundColor
    ? null
    : vivid && VIVID_KPI_THEMES[mappedKey]
      ? VIVID_KPI_THEMES[mappedKey]
      : baseTheme

  const Watermark = WATERMARKS[mappedKey]
  const Chart = CHARTS[mappedKey]
  const isKpi = Boolean(kpiTheme || glassTint || decoration)

  if (theme && isKpi) {
    const isCircle = shape === 'circle'

    if (isCircle) {
      const numeric = Number.parseFloat(String(value).replace(/,/g, ''))
      const gaugePct = String(value).includes('%')
        ? Math.max(0, Math.min(100, numeric || 0))
        : 100
      const radius = 68
      const circumference = 2 * Math.PI * radius
      const dash = (gaugePct / 100) * circumference

      return (
        <div className="flex flex-col items-center text-center">
          <div className="relative h-[168px] w-[168px]">
            <div
              className="pointer-events-none absolute inset-3 rounded-full blur-2xl"
              style={{ background: theme.glow }}
              aria-hidden="true"
            />
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 160 160" aria-hidden="true">
              <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="10" />
              <circle cx="80" cy="80" r={radius} fill="none" stroke={`${theme.ring}22`} strokeWidth="10" />
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={theme.ring}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference - dash}`}
                style={{ filter: `drop-shadow(0 0 6px ${theme.glow})` }}
              />
            </svg>
            <div
              className="absolute inset-[18px] overflow-hidden rounded-full"
              style={{
                background: theme.background,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.9), ${theme.shadow}`,
              }}
            >
              <div
                className="pointer-events-none absolute -left-4 -top-6 h-16 w-24 rounded-full opacity-70"
                style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, transparent 70%)' }}
                aria-hidden="true"
              />
              {Watermark ? (
                <div className="pointer-events-none absolute -bottom-3 -right-3 opacity-25" aria-hidden="true">
                  <Watermark />
                </div>
              ) : null}
              <div className="relative z-10 flex h-full flex-col items-center justify-center">
                {Icon ? (
                  <div
                    className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-full shadow-sm"
                    style={{
                      backgroundColor: theme.iconBg,
                      color: theme.iconColor,
                      boxShadow: '0 4px 10px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
                    }}
                  >
                    <Icon size={15} strokeWidth={2.2} aria-hidden="true" />
                  </div>
                ) : null}
                <p
                  className="text-[1.65rem] font-extrabold leading-none tracking-tight"
                  style={{ color: theme.text }}
                >
                  {value}
                </p>
              </div>
            </div>
          </div>
          <p
            className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: theme.text }}
          >
            {label}
          </p>
          {subLabel ? (
            <p className="mt-1 max-w-[11rem] text-xs leading-snug text-text-secondary">{subLabel}</p>
          ) : null}
        </div>
      )
    }

    return (
      <div
        className="relative flex flex-col overflow-hidden rounded-2xl p-4 backdrop-blur-xl"
        style={{
          background: theme.background,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.shadow,
        }}
      >
        {Watermark ? (
          <div className="pointer-events-none absolute -right-4 top-2 opacity-90" aria-hidden="true">
            <Watermark />
          </div>
        ) : null}

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: theme.muted }}
            >
              {label}
            </p>
            <p className="mt-1.5 text-[1.75rem] font-extrabold leading-none tracking-tight" style={{ color: theme.text }}>
              {value}
            </p>
            {subLabel ? (
              <p className="mt-1.5 text-sm leading-snug" style={{ color: theme.muted }}>
                {subLabel}
              </p>
            ) : null}
            {note ? (
              <p className="mt-0.5 max-w-[16rem] text-xs font-medium leading-snug" style={{ color: theme.text }}>
                {note}
              </p>
            ) : null}
          </div>
          {Icon ? (
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: theme.iconBg, color: theme.iconColor }}
            >
              <Icon size={18} strokeWidth={2} aria-hidden="true" />
            </div>
          ) : null}
        </div>

        {(mappedKey === 'attendance' || Chart) && (
          <div className="relative z-10 mt-3 flex items-end justify-start">
            {mappedKey === 'attendance' ? (
              <DonutViz value={value} />
            ) : mappedKey === 'risk' ? (
              <HeatViz value={value} />
            ) : (
              <Chart />
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card
      className="relative overflow-hidden"
      style={{
        borderTop: topBorderColor ? `3px solid ${topBorderColor}` : undefined,
        backgroundColor: tintBackgroundColor,
      }}
    >
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</p>
          <p className="mt-2 text-[1.75rem] font-extrabold leading-8 tracking-tight text-text-primary">{value}</p>
          {trend && TrendIcon && !isNeutralTrend && (
            <p
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold"
              style={{ color: trendPositive ? '#6ee7b7' : '#fda4af' }}
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
          {subLabel && <p className="mt-2 text-sm text-text-muted">{subLabel}</p>}
          {note && <p className="mt-1 text-xs font-medium text-text-secondary">{note}</p>}
        </div>
        {Icon && (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15"
            style={{ color: theme?.iconColor ?? '#ffffff' }}
          >
            <Icon size={20} strokeWidth={2} aria-hidden="true" />
          </div>
        )}
      </div>
    </Card>
  )
}
