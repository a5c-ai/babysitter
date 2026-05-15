'use client';

import { useEffect, useRef, useState } from 'react';

export const KRATE_LOADING_MESSAGES = [
  'Connecting to the Krate workspace',
  'Checking controller health',
  'Refreshing organization resources',
  'Reconciling repository state',
  'Hydrating issue metadata',
  'Syncing pipeline status',
  'Waiting for workspace readiness',
  'Preparing the page refresh'
];

function useKrateLoadingProgress() {
  const [tick, setTick] = useState(0);
  const [progress, setProgress] = useState(14);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const phaseInterval = setInterval(() => setTick((value) => value + 1), 1800);
    const progressInterval = setInterval(() => setProgress((value) => (value >= 96 ? 18 : Math.min(96, value + 5 + (value % 5)))), 420);
    const dotsInterval = setInterval(() => setDots((value) => (value.length >= 3 ? '' : `${value}.`)), 360);
    return () => {
      clearInterval(phaseInterval);
      clearInterval(progressInterval);
      clearInterval(dotsInterval);
    };
  }, []);

  const shownProgress = Math.round(progress);
  const phase = KRATE_LOADING_MESSAGES[tick % KRATE_LOADING_MESSAGES.length];
  return { dots, phase, shownProgress };
}

export function KrateLoadingView({
  title = 'Loading Krate workspace',
  subtitle = 'Fetching the latest workspace state.',
  detail = 'This page updates automatically while Krate reconnects.',
  fullPage = true
}) {
  const { dots, phase, shownProgress } = useKrateLoadingProgress();

  return (
    <section className={`krateLoadingView ${fullPage ? 'fullPage' : ''}`} aria-live="polite" aria-busy="true">
      <div className="krateLoadingLogo" aria-hidden="true">K</div>
      <div className="krateLoadingText">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="krateLoadingBar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={shownProgress}>
        <span style={{ width: `${shownProgress}%` }} />
      </div>
      <p className="krateLoadingPhase">{phase}{dots}</p>
      <small>{shownProgress}% · {detail}</small>
    </section>
  );
}

export function KrateControllerRecovery({ org = 'default', pollMs = 2500 }) {
  const redirectingRef = useRef(false);
  const [detail, setDetail] = useState('Polling the controller until the workspace is ready.');

  useEffect(() => {
    let disposed = false;

    async function checkController() {
      const target = new URL('/api/controller', window.location.origin);
      if (org) target.searchParams.set('org', org);
      try {
        const response = await fetch(target, { cache: 'no-store' });
        if (!response.ok) throw new Error(`controller ${response.status}`);
        const body = await response.json();
        if (body?.status === 'ready') {
          if (!redirectingRef.current) {
            redirectingRef.current = true;
            window.location.reload();
          }
          return;
        }
        if (!disposed) setDetail('The controller answered; waiting for ready workspace data.');
      } catch {
        if (!disposed) setDetail('Waiting for the workspace service to answer.');
      }
    }

    checkController();
    const pollInterval = setInterval(checkController, pollMs);
    return () => {
      disposed = true;
      clearInterval(pollInterval);
    };
  }, [org, pollMs]);

  return (
    <div className="krateRecoveryOverlay">
      <KrateLoadingView
        title="Reconnecting Krate workspace"
        subtitle="Krate is waiting for the workspace service instead of showing a degraded empty state."
        detail={detail}
        fullPage={false}
      />
      <p className="krateRecoveryHint">This page will refresh back to the requested view as soon as the controller returns ready data.</p>
    </div>
  );
}
