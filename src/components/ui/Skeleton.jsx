export function Skeleton({ className = '' }) {
  return (
    <div
      className={['animate-skeleton rounded-md bg-border/80', className].join(' ')}
      aria-hidden="true"
    />
  )
}

export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={['space-y-2', className].join(' ')}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={['h-3', i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'].join(' ')}
        />
      ))}
    </div>
  )
}
