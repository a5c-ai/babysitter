const loadingPhases = [
  'Connecting to the Krate workspace',
  'Checking controller health',
  'Refreshing organization resources',
  'Reconciling repository state'
];

export default function Loading() {
  return (
    <section className="krateLoadingView fullPage routeLoading" aria-live="polite" aria-busy="true">
      <div className="krateLoadingLogo" aria-hidden="true">K</div>
      <div className="krateLoadingText">
        <h2>Loading Krate page</h2>
        <p>Fetching the latest workspace state.</p>
      </div>
      <div className="krateLoadingBar animated" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-label="Loading Krate page">
        <span />
      </div>
      <p className="krateLoadingPhase routeLoadingPhases">
        {loadingPhases.map((phase) => <span key={phase}>{phase}</span>)}
      </p>
      <small>Showing while this route prepares fresh data.</small>
    </section>
  );
}
