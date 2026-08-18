function initialsFromName(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

const SIZES = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-11 w-11 text-sm',
  lg: 'h-[7.5rem] w-[7.5rem] text-3xl',
  xl: 'h-40 w-40 text-4xl',
}

const SHAPES = {
  circle: 'rounded-full',
  portrait: 'rounded-[1.75rem]',
}

export default function UserAvatar({ name, photoUrl, size = 'sm', shape = 'circle', className = '' }) {
  const sizeClass = SIZES[size] ?? SIZES.sm
  const shapeClass = SHAPES[shape] ?? SHAPES.circle

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`${name || 'User'} profile photo`}
        className={['shrink-0 object-cover', sizeClass, shapeClass, className].join(' ')}
      />
    )
  }

  return (
    <div
      className={[
        'flex shrink-0 items-center justify-center font-bold',
        sizeClass,
        shapeClass,
        className,
      ].join(' ')}
      aria-hidden="true"
      style={{ backgroundColor: '#0B6E4F', color: '#ffffff' }}
    >
      {initialsFromName(name)}
    </div>
  )
}
