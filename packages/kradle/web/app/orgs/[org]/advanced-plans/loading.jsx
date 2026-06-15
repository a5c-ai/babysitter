export default function Loading() {
  return (
    <section className="kradleLoadingView fullPage" aria-live="polite" aria-busy="true">
      <div className="kradleSpinner" role="progressbar" aria-label="Loading">
        <svg viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="var(--border)" strokeWidth="3" />
          <circle cx="24" cy="24" r="20" fill="none" stroke="var(--text)" strokeWidth="3" strokeLinecap="round" strokeDasharray="90 126" className="kradleSpinnerArc" />
        </svg>
      </div>
      <p className="kradleLoadingLabel">Loading</p>
    </section>
  );
}
