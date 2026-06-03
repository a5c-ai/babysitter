export default function Loading() {
  return (
    <section className="krateLoadingView fullPage" aria-live="polite" aria-busy="true">
      <div className="krateSpinner" role="progressbar" aria-label="Loading">
        <svg viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="var(--border, #d1d5db)" strokeWidth="3" />
          <circle cx="24" cy="24" r="20" fill="none" stroke="var(--text, #1f2937)" strokeWidth="3" strokeLinecap="round" strokeDasharray="90 126" className="krateSpinnerArc" />
        </svg>
      </div>
      <p className="krateLoadingLabel">Loading</p>
    </section>
  );
}
