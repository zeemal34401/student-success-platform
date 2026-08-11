/** Shared PrognosEd auth backdrop — students on campus, project-themed photo in /public */
export default function PrognosAuthBackdrop({ children, className = '' }) {
  return (
    <div className={`prognos-auth-page ${className}`}>
      <div
        className="prognos-auth-bg"
        role="img"
        aria-label="University campus building and lawn"
      />
      <div className="prognos-auth-overlay" aria-hidden="true" />
      <div className="prognos-auth-waves" aria-hidden="true" />
      <div className="prognos-auth-content">{children}</div>
    </div>
  )
}
