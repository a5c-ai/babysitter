import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { Link } from 'react-router-dom-v6';
import { Search } from 'lucide-react';
import { useGateway } from '@a5c-ai/agent-mux-ui';

import { cx } from '@a5c-ai/compendium';
import { useUpdateFlash } from '../hooks/use-update-flash.js';
import { PageHeroGrid, PageSection, PageShell } from '../components/shared/page-shell.js';
import { useGatewayFetch } from '../providers/GatewayProvider.js';

type SessionCost = {
  totalUsd?: number;
};

type SessionRow = {
  sessionId: string;
  agent: string;
  status: string;
  activeRunId: string | null;
  latestRunId: string | null;
  updatedAt: number;
  title: string | null;
  turnCount: number | null;
  messageCount: number | null;
  costTotalUsd: number | null;
  workspacePath: string | null;
};

type SessionFilter = 'all' | 'active' | 'inactive';
const SESSION_PAGE_SIZE = 24;

function formatUsd(totalUsd: number | null): string | null {
  if (totalUsd == null || !Number.isFinite(totalUsd)) {
    return null;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: totalUsd >= 1 ? 2 : 4,
    maximumFractionDigits: 4,
  }).format(totalUsd);
}

function readWorkspacePath(value: unknown): string | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.currentPath === 'string' && record.currentPath.length > 0) {
    return record.currentPath;
  }
  if (typeof record.workspaceDefaultCwd === 'string' && record.workspaceDefaultCwd.length > 0) {
    return record.workspaceDefaultCwd;
  }
  if (typeof record.workspaceRootPath === 'string' && record.workspaceRootPath.length > 0) {
    return record.workspaceRootPath;
  }
  return null;
}

function formatUpdatedAt(updatedAt: number): string {
  if (!Number.isFinite(updatedAt) || updatedAt <= 0) {
    return 'No heartbeat yet';
  }
  return new Date(updatedAt).toLocaleString();
}

function formatSessionVolume(session: SessionRow): string {
  const parts: string[] = [];
  if (session.messageCount != null) {
    parts.push(`${session.messageCount} messages`);
  }
  if (session.turnCount != null) {
    parts.push(`${session.turnCount} turns`);
  }
  const costLabel = formatUsd(session.costTotalUsd);
  if (costLabel) {
    parts.push(costLabel);
  }
  return parts.length > 0 ? parts.join(' · ') : 'No turns recorded yet';
}

function workspaceHref(path: string): string {
  return `/workspaces?workspace=${encodeURIComponent(path)}`;
}

function sessionUpdateSignature(session: SessionRow): string {
  return [
    session.status,
    session.updatedAt,
    session.messageCount ?? '',
    session.turnCount ?? '',
    session.costTotalUsd ?? '',
    session.activeRunId ?? '',
    session.latestRunId ?? '',
    session.workspacePath ?? '',
  ].join('|');
}

function SessionSpotlightCard(props: { session: SessionRow }) {
  const runId = props.session.activeRunId ?? props.session.latestRunId;
  const updateFlash = useUpdateFlash(sessionUpdateSignature(props.session));

  return (
    <article
      className={cx(
        "session-browser__spotlight-card",
        updateFlash && "session-browser__item--fresh-update",
      )}
      data-testid={`session-card-${props.session.sessionId}`}
    >
      <div className="session-browser__spotlight-header">
        <div>
          <p className="session-browser__eyebrow">{props.session.status === 'active' ? 'Live session' : 'Recent session'}</p>
          <h3>{props.session.title ?? props.session.sessionId}</h3>
        </div>
        <div className="status-stack">
          <span className={`status-badge status-${props.session.status}`}>{props.session.status}</span>
          <span className="meta-chip">{props.session.agent}</span>
        </div>
      </div>
      <p className="muted-copy">{formatSessionVolume(props.session)}</p>
      <div className="session-browser__meta-row">
        <span className="page-chip page-chip--muted">{props.session.sessionId}</span>
        <span className="page-chip page-chip--muted">Updated {formatUpdatedAt(props.session.updatedAt)}</span>
      </div>
      {props.session.workspacePath ? (
        <div className="session-browser__path" title={props.session.workspacePath}>
          {props.session.workspacePath}
        </div>
      ) : null}
      <div className="session-browser__actions">
        <Link to={`/sessions/${props.session.sessionId}`} className="session-browser__action session-browser__action--primary">
          {props.session.status === 'active' ? 'Open live chat' : 'Resume chat'}
        </Link>
        {props.session.workspacePath ? (
          <Link to={workspaceHref(props.session.workspacePath)} className="session-browser__action">
            Open workspace
          </Link>
        ) : null}
        {runId ? (
          <Link to={`/dispatches/${runId}`} className="session-browser__action">
            Open dispatch
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function SessionRowCard(props: { session: SessionRow }) {
  const runId = props.session.activeRunId ?? props.session.latestRunId;
  const updateFlash = useUpdateFlash(sessionUpdateSignature(props.session));

  return (
    <article
      className={cx(
        "session-browser__row",
        updateFlash && "session-browser__item--fresh-update",
      )}
      data-testid={`session-row-${props.session.sessionId}`}
    >
      <div className="session-browser__row-main">
        <div className="session-browser__row-copy">
          <div className="session-browser__row-topline">
            <h3>{props.session.title ?? props.session.sessionId}</h3>
            <span className={`status-badge status-${props.session.status}`}>{props.session.status}</span>
            <span className="meta-chip">{props.session.agent}</span>
          </div>
          <div className="session-browser__meta-row">
            <span className="page-chip page-chip--muted">{props.session.sessionId}</span>
            <span className="page-chip page-chip--muted">{formatSessionVolume(props.session)}</span>
            <span className="page-chip page-chip--muted">Updated {formatUpdatedAt(props.session.updatedAt)}</span>
          </div>
          {props.session.workspacePath ? (
            <div className="session-browser__path" title={props.session.workspacePath}>
              {props.session.workspacePath}
            </div>
          ) : null}
        </div>

        <div className="session-browser__actions">
          <Link to={`/sessions/${props.session.sessionId}`} className="session-browser__action session-browser__action--primary">
            {props.session.status === 'active' ? 'Open live chat' : 'Open chat'}
          </Link>
          {props.session.workspacePath ? (
            <Link to={workspaceHref(props.session.workspacePath)} className="session-browser__action">
              Workspace
            </Link>
          ) : null}
          {runId ? (
            <Link to={`/dispatches/${runId}`} className="session-browser__action">
              Dispatch
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function SessionsPage(): JSX.Element {
  const { store } = useGateway();
  const fetchGateway = useGatewayFetch();
  const sessions = useStore(store, useShallow((state) => Object.values(state.sessions.byId)));
  const runs = useStore(store, useShallow((state) => Object.values(state.runs.byId)));
  const eventBuffers = useStore(store, (state) => state.events.byRunId);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<SessionFilter>('all');
  const [page, setPage] = useState(0);
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const normalizedSearchTerm = deferredSearchTerm.trim().toLowerCase();

  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    const refreshSessions = async () => {
      try {
        const response = await fetchGateway('/api/v1/sessions');
        if (!response.ok || cancelled) {
          return;
        }
        const payload = (await response.json()) as { sessions?: Array<Record<string, unknown>> };
        const mergeSession = store.getState().actions.mergeSession;
        for (const session of payload.sessions ?? []) {
          const sessionId = typeof session.sessionId === 'string' ? session.sessionId : '';
          if (!sessionId) {
            continue;
          }
          mergeSession(sessionId, session);
        }
      } catch {
        // Keep the last known store snapshot visible if the refresh fails.
      }
    };

    void refreshSessions();
    timer = window.setInterval(() => {
      void refreshSessions();
    }, 2_000);

    return () => {
      cancelled = true;
      if (timer != null) {
        window.clearInterval(timer);
      }
    };
  }, [fetchGateway, store]);

  const rows = useMemo<SessionRow[]>(
    () =>
      sessions
        .map((session) => {
          const sessionId = String(session.sessionId);
          const fallbackCostTotalUsd = runs
            .filter((run) => String(run.sessionId ?? '') === sessionId)
            .reduce((sum, run) => {
              const runId = String(run.runId ?? '');
              const buffer = eventBuffers[runId];
              if (!buffer) {
                return sum;
              }
              return sum + buffer.events.reduce((runSum, event) => {
                if (event.type !== 'cost') {
                  return runSum;
                }
                const cost = event.cost;
                if (!cost || typeof cost !== 'object') {
                  return runSum;
                }
                return runSum + Number((cost as SessionCost).totalUsd ?? 0);
              }, 0);
            }, 0);

          return {
            sessionId,
            agent: String(session.agent ?? 'unknown'),
            status: String(session.status ?? 'inactive'),
            activeRunId: typeof session.activeRunId === 'string' ? session.activeRunId : null,
            latestRunId: typeof session.latestRunId === 'string' ? session.latestRunId : null,
            updatedAt: Number(session.updatedAt ?? 0),
            title: typeof session.title === 'string' ? session.title : null,
            turnCount: typeof session.turnCount === 'number' ? session.turnCount : null,
            messageCount: typeof session.messageCount === 'number' ? session.messageCount : null,
            costTotalUsd:
              session.cost && typeof session.cost === 'object' && typeof (session.cost as SessionCost).totalUsd === 'number'
                ? (session.cost as SessionCost).totalUsd ?? null
                : fallbackCostTotalUsd > 0
                  ? fallbackCostTotalUsd
                  : null,
            workspacePath:
              typeof session.cwd === 'string' && session.cwd.length > 0
                ? session.cwd
                : readWorkspacePath(session.workspace),
          };
        })
        .sort((left, right) => right.updatedAt - left.updatedAt),
    [eventBuffers, runs, sessions],
  );

  const filteredRows = useMemo(
    () =>
      rows.filter((session) => {
        if (filter === 'active' && session.status !== 'active') {
          return false;
        }
        if (filter === 'inactive' && session.status === 'active') {
          return false;
        }
        if (normalizedSearchTerm.length === 0) {
          return true;
        }
        const searchDocument = [
          session.sessionId,
          session.title ?? '',
          session.agent,
          session.status,
          session.workspacePath ?? '',
          session.activeRunId ?? '',
          session.latestRunId ?? '',
        ]
          .join(' ')
          .toLowerCase();
        return searchDocument.includes(normalizedSearchTerm);
      }),
    [filter, normalizedSearchTerm, rows],
  );
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / SESSION_PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedRows = useMemo(
    () => filteredRows.slice(safePage * SESSION_PAGE_SIZE, (safePage + 1) * SESSION_PAGE_SIZE),
    [filteredRows, safePage],
  );

  const activeSessions = rows.filter((session) => session.status === 'active');
  const inactiveSessions = rows.filter((session) => session.status !== 'active');
  const visibleActiveSessions = pagedRows.filter((session) => session.status === 'active');
  const visibleInactiveSessions = pagedRows.filter((session) => session.status !== 'active');
  const totalCost = rows.reduce((sum, session) => sum + (session.costTotalUsd ?? 0), 0);
  const workspaceBoundCount = rows.filter((session) => session.workspacePath != null).length;
  const spotlightActive = visibleActiveSessions.slice(0, 3);
  const spotlightRecent = visibleInactiveSessions.slice(0, 3);

  useEffect(() => {
    setPage(0);
  }, [filter, normalizedSearchTerm]);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  return (
    <PageShell>
      <PageSection>
        <div className="session-browser__intro">
          <div className="session-browser__intro-header">
            <div className="session-browser__intro-copy">
              <p className="page-kicker">Sessions</p>
              <h1 className="page-title page-title--secondary">Jump back into the right chat.</h1>
              <p className="page-copy page-copy--wide">
                Live conversations, paused threads, linked workspaces, and the latest dispatch stay on one surface so you can resume work without hunting across routes.
              </p>
            </div>
            <div className="page-actions">
              <Link to="/sessions/new" className="session-browser__action session-browser__action--primary">
                Start session
              </Link>
              <Link to="/workspaces" className="session-browser__action">
                Browse workspaces
              </Link>
            </div>
          </div>

          <div className="session-browser__controls">
            <label className="session-browser__search" aria-label="Search sessions">
              <Search className="h-4 w-4" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search session id, title, agent, workspace, or dispatch id"
              />
            </label>

            <div className="session-browser__filters" role="tablist" aria-label="Session filters">
              {([
                ['all', `All sessions (${rows.length})`],
                ['active', `Active (${activeSessions.length})`],
                ['inactive', `Inactive (${inactiveSessions.length})`],
              ] as const).map(([nextFilter, label]) => (
                <button
                  key={nextFilter}
                  type="button"
                  role="tab"
                  aria-selected={filter === nextFilter}
                  className={`session-browser__filter ${filter === nextFilter ? 'session-browser__filter--active' : ''}`}
                  onClick={() => setFilter(nextFilter)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="session-browser__visible-count">
              {filteredRows.length} visible · page {safePage + 1} of {totalPages}
            </div>
          </div>

          <div className="session-browser__summary-strip">
            <span className="page-chip session-browser__summary-chip">
              <strong>Live</strong>
              <span>{activeSessions.length}</span>
            </span>
            <span className="page-chip session-browser__summary-chip">
              <strong>Paused</strong>
              <span>{inactiveSessions.length}</span>
            </span>
            <span className="page-chip session-browser__summary-chip">
              <strong>Workspace-linked</strong>
              <span>{workspaceBoundCount}</span>
            </span>
            <span className="page-chip session-browser__summary-chip">
              <strong>Observed cost</strong>
              <span>{rows.length > 0 ? formatUsd(totalCost) ?? 'unavailable' : 'No usage yet'}</span>
            </span>
          </div>
        </div>
      </PageSection>

      <PageHeroGrid className="session-browser__spotlight-grid">
        <PageSection>
          <div className="session-browser__section-header">
            <div>
              <p className="page-kicker page-kicker--compact">Live</p>
              <h2 className="page-title page-title--secondary">Active chats</h2>
            </div>
          </div>
          <div className="session-browser__spotlight-list">
            {spotlightActive.map((session) => (
              <SessionSpotlightCard key={session.sessionId} session={session} />
            ))}
            {spotlightActive.length === 0 ? (
              <div className="empty-card">
                <strong>No active sessions match the current filter.</strong>
                <p className="muted-copy">Start a new session or widen the current search to reopen live work.</p>
              </div>
            ) : null}
          </div>
        </PageSection>

        <PageSection>
          <div className="session-browser__section-header">
            <div>
              <p className="page-kicker page-kicker--compact">Recent</p>
              <h2 className="page-title page-title--secondary">Paused chats</h2>
            </div>
          </div>
          <div className="session-browser__spotlight-list">
            {spotlightRecent.map((session) => (
              <SessionSpotlightCard key={session.sessionId} session={session} />
            ))}
            {spotlightRecent.length === 0 ? (
              <div className="empty-card">
                <strong>No inactive sessions match the current filter.</strong>
                <p className="muted-copy">Completed or paused sessions will collect here for quick resume.</p>
              </div>
            ) : null}
          </div>
        </PageSection>
      </PageHeroGrid>

      <PageSection>
        <div className="session-browser__section-header">
          <div>
            <p className="page-kicker page-kicker--compact">Directory</p>
            <h2 className="page-title page-title--secondary">All tracked sessions</h2>
          </div>
        </div>

        <div className="session-browser__row-list">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm">
            <div className="text-foreground-muted">
              Showing sessions {safePage * SESSION_PAGE_SIZE + 1}-{Math.min((safePage + 1) * SESSION_PAGE_SIZE, filteredRows.length)} of {filteredRows.length}
            </div>
            <div className="flex gap-2">
              <button type="button" className="session-browser__action" disabled={safePage === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>
                Previous
              </button>
              <button type="button" className="session-browser__action" disabled={safePage >= totalPages - 1} onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}>
                Next
              </button>
            </div>
          </div>
          {pagedRows.map((session) => (
            <SessionRowCard key={session.sessionId} session={session} />
          ))}
          {filteredRows.length === 0 ? (
            <div className="empty-card">
              <strong>No sessions match the current filter.</strong>
              <p className="muted-copy">Adjust the search or status filter to widen the results.</p>
            </div>
          ) : null}
        </div>
      </PageSection>
    </PageShell>
  );
}
