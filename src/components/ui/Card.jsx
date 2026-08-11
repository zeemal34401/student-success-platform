export default function Card({ children, className = '', padding = true, ...rest }) {
  return (
    <div
      className={[
        'rounded-[12px] border border-border bg-surface shadow-card transition-shadow duration-200',
        padding ? 'p-6' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </div>
  )
}
