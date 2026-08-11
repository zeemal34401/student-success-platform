export default function ErrorState({ error, onRetry }) {
  if (!error) return null

  return (
    <div className="rounded-md border border-risk-critical-border bg-risk-critical-bg px-4 py-3 text-sm text-risk-critical">
      <p>{error.message ?? 'Something went wrong while loading data.'}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-3">
          Try again
        </button>
      )}
    </div>
  )
}
