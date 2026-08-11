const SIZES = {
  default: 'max-w-7xl',
  wide: 'max-w-5xl',
  medium: 'max-w-4xl',
  narrow: 'max-w-3xl',
  form: 'max-w-2xl',
}

export default function PageLayout({ children, size = 'default', className = '' }) {
  return (
    <div
      className={[
        'mx-auto w-full min-w-0 max-w-full px-4 py-6 sm:px-6 lg:px-8',
        SIZES[size] ?? SIZES.default,
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
