import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@a5c-ai/compendium';
import { useGateway, useRun, useStopRun } from '@a5c-ai/agent-mux-ui';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom-v6';

import { PageHeroGrid, PageSection, PageShell } from '../components/shared/page-shell.js';
import { StatusBadge } from '../components/shared/status-badge.js';
import { useGatewayFetch } from '../providers/GatewayProvider.js';

type DispatchRecord = Record<string, unknown> | null;

function readText(value: unknown, fallback = 'Unknown'): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function readOptionalText(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatMoment(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toLocaleString();
  }
  if (typeof value === 'string' && value.length > 0) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return new Date(parsed).toLocaleString();
    }
    return value;
  }
  return 'Unavailable';
}

function isActiveDispatch(run: DispatchRecord): boolean {
  const status = String(run?.status ?? '');
  return status === 'queued' || status === 'starting' || status === 'pending' || status === 'waiting' || status === 'running';
}

function shouldKeepResolvingSessionId(status: string): boolean {
  return status === 'queued' || status === 'starting' || status === 'pending' || status === 'waiting' || status === 'running';
}

function DispatchSummaryCard(props: {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
}): JSX.Element {
  return (
    <div className="summary-card">
      <span className="summary-label">{props.label}</span>
      <strong>{props.value}</strong>
      {props.detail ? <p className="muted-copy mt-2">{props.detail}</p> : null}
    </div>
  );
}

export function SessionPendingPage(): JSX.Element {
  const params = useParams<{ runId: string }>();
  const location = useLocation();
  const fetchGateway = useGatewayFetch();
  const { client, store } = useGateway();
  const runId = params.runId ?? '';
  const run = useRun(runId);
  const [resolvedSessionId, setResolvedSessionId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const agent = String(run?.agent ?? 'unknown');
  const status = String(run?.status ?? 'starting');
  const sessionId = readOptionalText(run?.sessionId) ?? resolvedSessionId;

  useEffect(() => {
    if (!runId) {
      return;
    }
    return client.subscribeRun(runId);
  }, [client, runId]);

  useEffect(() => {
    if (!runId || sessionId) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefresh = (delayMs: number) => {
      if (cancelled || timer != null) {
        return;
      }
      timer = setTimeout(() => {
        timer = null;
        void hydrateFromDispatch();
      }, delayMs);
    };

    const hydrateFromDispatch = async () => {
      try {
        const response = await fetchGateway(`/api/v1/dispatches/${encodeURIComponent(runId)}`);
        if (!response.ok) {
          if (response.status === 404 || cancelled) {
            return;
          }
          throw new Error(`Gateway request failed: ${response.status}`);
        }
        const body = await response.json() as Record<string, unknown>;
        if (cancelled) {
          return;
        }
        store.getState().actions.mergeRun(runId, body);
        const fetchedSessionId = readOptionalText(body.sessionId);
        if (fetchedSessionId) {
          store.getState().actions.mergeSession(fetchedSessionId, {
            sessionId: fetchedSessionId,
            agent: body.agent,
            latestRunId: runId,
            activeRunId: shouldKeepResolvingSessionId(String(body.status ?? '')) ? runId : null,
          });
          setResolvedSessionId(fetchedSessionId);
          setLoadError(null);
          return;
        }

        const nextStatus = String(body.status ?? '');
        if (shouldKeepResolvingSessionId(nextStatus)) {
          scheduleRefresh(1_000);
          return;
        }

        setLoadError('This dispatch finished before the gateway exposed a durable session id.');
      } catch (cause) {
        if (!cancelled) {
          setLoadError(cause instanceof Error ? cause.message : String(cause));
          scheduleRefresh(1_500);
        }
      }
    };

    void hydrateFromDispatch();

    return () => {
      cancelled = true;
      if (timer != null) {
        clearTimeout(timer);
      }
    };
  }, [client, fetchGateway, runId, sessionId, store]);

  if (sessionId) {
    return <Navigate to={`/sessions/${sessionId}${location.search}`} replace />;
  }

  return (
    <PageShell>
      <PageSection>
        <PageHeroGrid className="session-browser__hero-grid">
          <div>
            <p className="page-kicker">Dispatch handoff</p>
            <h1 className="page-title page-title--secondary">
              Waiting for this dispatch to bind to its session.
            </h1>
            <p className="page-copy page-copy--wide">
              The browser is holding this bootstrap route only long enough for the gateway to attach
              the dispatch to a durable session id. As soon as that happens, this page redirects into the
              live session chat automatically.
            </p>
            {loadError ? (
              <p className="mt-4 rounded-2xl border border-warning/20 bg-warning/8 px-4 py-3 text-sm text-warning">
                {loadError}
              </p>
            ) : null}
            <div className="page-actions">
              <Link to="/sessions" className="session-browser__action session-browser__action--primary">
                Open sessions
              </Link>
              <Link to="/projects" className="session-browser__action">
                Open projects
              </Link>
            </div>
          </div>

          <div className="session-browser__hero-kpis">
            <div className="summary-card">
              <span className="summary-label">Dispatch id</span>
              <strong>{runId || 'pending session'}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">Agent</span>
              <strong>{agent}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">State</span>
              <strong>{status}</strong>
            </div>
            <div className="summary-card">
              <span className="summary-label">Next hop</span>
              <strong>Session chat</strong>
            </div>
          </div>
        </PageHeroGrid>
      </PageSection>

      <PageSection inset>
        <div className="session-browser__section-header">
          <div>
            <p className="page-kicker page-kicker--compact">What Happens Next</p>
            <h2 className="page-title page-title--secondary">Dispatches are only the transport bootstrap.</h2>
            <p className="page-copy">
              Once the harness publishes the final `sessionId`, the session route becomes the real
              working surface. That keeps transcript, approvals, runtime context, and follow-up turns
              on one stable screen instead of forcing users to stay on a dispatch-centric detail view.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="summary-card">
            <span className="summary-label">Until then</span>
            <strong>Keep this route lightweight</strong>
            <p className="muted-copy">It exists to hand off into the session, not to become the primary UI.</p>
          </div>
          <div className="summary-card">
            <span className="summary-label">If it stalls</span>
            <strong>Check the session list</strong>
            <p className="muted-copy">The session may already be visible there even if this route has not redirected yet.</p>
          </div>
          <div className="summary-card">
            <span className="summary-label">If it fails</span>
            <strong>Return to projects or workspaces</strong>
            <p className="muted-copy">Recovery, retries, and workflow context live in those surfaces.</p>
          </div>
        </div>

        <div className="page-actions">
          <Link to="/sessions" className="session-browser__action">
            Back to sessions
          </Link>
          <Link to="/workspaces" className="session-browser__action">
            Open workspaces
          </Link>
        </div>
      </PageSection>
    </PageShell>
  );
}

export function DispatchDetailPage(): JSX.Element {
  const { runId = '' } = useParams<{ runId: string }>();
  const run = useRun(runId);
  const fetchGateway = useGatewayFetch();
  const stopRun = useStopRun();
  const { client, store } = useGateway();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stopError, setStopError] = useState<string | null>(null);
  const [stopRequested, setStopRequested] = useState(false);

  useEffect(() => {
    if (!runId) {
      return;
    }
    const unsubscribe = client.subscribeRun(runId);
    return () => {
      unsubscribe();
    };
  }, [client, runId]);

  useEffect(() => {
    if (!runId) {
      setLoading(false);
      setError('Missing dispatch id.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const response = await fetchGateway(`/api/v1/dispatches/${runId}`);
        if (!response.ok) {
          throw new Error(`Gateway request failed: ${response.status}`);
        }
        const body = await response.json() as Record<string, unknown>;
        if (cancelled) {
          return;
        }
        store.getState().actions.mergeRun(runId, body);
        const sessionId = readOptionalText(body.sessionId);
        if (sessionId) {
          store.getState().actions.mergeSession(sessionId, {
            sessionId,
            agent: body.agent,
            latestRunId: runId,
          });
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : String(cause));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchGateway, runId, store]);

  useEffect(() => {
    if (!isActiveDispatch(run)) {
      setStopRequested(false);
    }
  }, [run]);

  const agent = readText(run?.agent, 'Unknown agent');
  const processId = readText(run?.processId, 'Unknown process');
  const status = String(run?.status ?? (loading ? 'loading' : 'unknown'));
  const sessionId = readOptionalText(run?.sessionId);
  const workspacePath =
    readOptionalText(run?.cwd) ??
    readOptionalText(run?.workspacePath) ??
    readOptionalText(run?.workspaceRootPath);
  const failureMessage =
    readOptionalText(run?.failureMessage) ??
    readOptionalText(run?.failureError) ??
    readOptionalText(run?.exitReason);
  const progress = useMemo(() => {
    const totalTasks = readNumber(run?.totalTasks) ?? 0;
    const completedTasks = readNumber(run?.completedTasks) ?? 0;
    if (totalTasks <= 0) {
      return null;
    }
    return `${completedTasks}/${totalTasks} tasks completed`;
  }, [run]);
  const canStop = isActiveDispatch(run) && !stopRequested;

  async function handleStop(): Promise<void> {
    if (!runId || !canStop) {
      return;
    }
    setStopError(null);
    setStopRequested(true);
    try {
      const response = await stopRun(runId) as { stopped?: boolean };
      if (!response?.stopped) {
        throw new Error('Gateway refused to stop this dispatch');
      }
    } catch (cause) {
      setStopRequested(false);
      setStopError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  return (
    <PageShell>
      <PageSection>
        <PageHeroGrid className="session-browser__hero-grid">
          <div>
            <p className="page-kicker">Dispatch detail</p>
            <h1 className="page-title page-title--secondary">Manage this live dispatch without leaving the queue.</h1>
            <p className="page-copy page-copy--wide">
              Use this surface to inspect the active dispatch, jump to its linked session or workspace,
              and stop it when the underlying subprocess or in-process loop needs to be interrupted.
            </p>
            <div className="page-actions">
              {sessionId ? (
                <Link to={`/sessions/${sessionId}`} className="session-browser__action session-browser__action--primary">
                  Open session chat
                </Link>
              ) : null}
              {workspacePath ? (
                <Link to={`/workspaces?workspace=${encodeURIComponent(workspacePath)}`} className="session-browser__action">
                  Open workspace
                </Link>
              ) : null}
              <Link to="/dispatches" className="session-browser__action">
                Back to dispatches
              </Link>
            </div>
          </div>

          <div className="session-browser__hero-kpis">
            <DispatchSummaryCard label="Dispatch id" value={runId || 'Unavailable'} />
            <DispatchSummaryCard label="Agent" value={agent} />
            <DispatchSummaryCard label="State" value={<StatusBadge status={status} />} />
            <DispatchSummaryCard label="Session" value={sessionId ?? 'Not attached yet'} />
          </div>
        </PageHeroGrid>
      </PageSection>

      <PageSection inset>
        {error ? (
          <div className="summary-card border border-error/20 bg-error/5">
            <span className="summary-label">Dispatch unavailable</span>
            <strong>{error}</strong>
          </div>
        ) : null}

        {stopError ? (
          <div className="summary-card border border-error/20 bg-error/5">
            <span className="summary-label">Stop request failed</span>
            <strong>{stopError}</strong>
          </div>
        ) : null}

        {stopRequested ? (
          <div className="summary-card border border-warning/25 bg-warning/8">
            <span className="summary-label">Stop requested</span>
            <strong>The gateway is terminating this dispatch now.</strong>
            <p className="muted-copy mt-2">
              Subprocess-backed dispatches receive a terminate signal and are force-killed if they do not exit.
              In-process agent-mux loops are aborted through the same control path.
            </p>
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <DispatchSummaryCard label="Process" value={processId} />
          <DispatchSummaryCard label="Created" value={formatMoment(run?.createdAt)} />
          <DispatchSummaryCard label="Updated" value={formatMoment(run?.updatedAt)} />
          <DispatchSummaryCard label="Progress" value={progress ?? 'No task breakdown'} />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <DispatchSummaryCard
            label="Workspace"
            value={workspacePath ?? 'No workspace attached'}
            detail={workspacePath ? 'Jump back into the workspace shell from the actions above.' : null}
          />
          <DispatchSummaryCard
            label="Stop control"
            value={canStop ? 'Available' : 'Not available'}
            detail={
              canStop
                ? 'Use stop when the dispatch is still active and needs to be interrupted.'
                : stopRequested
                  ? 'A stop request is already in flight.'
                  : 'Only active dispatches can be interrupted.'
            }
          />
        </div>

        {failureMessage ? (
          <div className="summary-card mt-5 border border-error/20 bg-error/5">
            <span className="summary-label">Latest failure or exit detail</span>
            <strong>{failureMessage}</strong>
          </div>
        ) : null}

        <div className="page-actions mt-5">
          <Button type="button" variant="primary" disabled={!canStop} onClick={() => void handleStop()}>
            {stopRequested ? 'Stopping dispatch' : 'Stop dispatch'}
          </Button>
          {sessionId ? (
            <Link to={`/sessions/${sessionId}`} className="session-browser__action">
              Open linked session
            </Link>
          ) : null}
        </div>

        {!run && loading ? (
          <div className="summary-card mt-5">
            <span className="summary-label">Loading</span>
            <strong>Fetching live dispatch state…</strong>
          </div>
        ) : null}
      </PageSection>
    </PageShell>
  );
}
