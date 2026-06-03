'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

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


function controllerModelIsReachable(body) {
  if (!body || body.error) return false;
  const errors = body.controller?.connection?.errors || [];
  const hasUnavailableError = errors.some((error) => /fetch failed|controller API|ECONN|ENOTFOUND|ETIMEDOUT|Krate workspace unavailable|KRATE_CONTROLLER_URL is not configured/i.test(String(error || '')));
  if (hasUnavailableError) return false;
  const hasResourceMetric = Number.isFinite(body.metrics?.resources);
  const hasControllerEnvelope = Boolean(body.controller?.connection || body.metrics || body.views);
  return Boolean(body.status === 'ready' || body.controller?.connection?.available || body.controller?.apiService || hasResourceMetric || hasControllerEnvelope);
}

function refreshCurrentRoute(router, refreshKey, cooldownMs) {
  const now = Date.now();
  const lastRefresh = Number(window.sessionStorage.getItem(refreshKey) || 0);
  if (now - lastRefresh > cooldownMs) {
    window.sessionStorage.setItem(refreshKey, String(now));
    router.refresh();
  }
}

export function KrateControllerRecovery({ org = 'default', pollMs = 2500 }) {
  const router = useRouter();
  const pathname = usePathname();
  const [detail, setDetail] = useState('Polling the controller until the workspace responds.');
  const [recovered, setRecovered] = useState(false);

  useEffect(() => {
    let disposed = false;

    function refreshPageOnce() {
      refreshCurrentRoute(router, `krate-recovery-refresh:${org}:${pathname || '/'}`, 60000);
    }

    async function checkController() {
      const target = new URL('/api/controller', window.location.origin);
      if (org) target.searchParams.set('org', org);
      try {
        const response = await fetch(target, { cache: 'no-store' });
        if (response.redirected && new URL(response.url).pathname === '/login') {
          window.location.assign(response.url);
          return;
        }
        if (!response.ok) throw new Error(`controller ${response.status}`);
        if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('controller did not return JSON');
        const body = await response.json();
        if (controllerModelIsReachable(body)) {
          if (!disposed) {
            setRecovered(true);
            refreshPageOnce();
          }
          return;
        }
        if (!disposed) setDetail('The controller answered; waiting for reachable workspace data.');
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
  }, [org, pathname, pollMs, router]);

  if (recovered) return null;

  return (
    <div className="krateRecoveryOverlay">
      <KrateLoadingView
        title="Reconnecting Krate workspace"
        subtitle=""
        detail={detail}
        fullPage={false}
      />
      <p className="krateRecoveryHint">This overlay will close as soon as the controller responds with workspace data.</p>
    </div>
  );
}
