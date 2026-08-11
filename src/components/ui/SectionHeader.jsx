export default function SectionHeader({ title, description, action, as: Heading = 'h2' }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <Heading className="font-heading text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
          {title}
        </Heading>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-text-secondary">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-3 shrink-0 sm:mt-0">{action}</div>}
    </div>
  )
}
