import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom-v6';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom-v6';
import { LogoWordmark } from '@a5c-ai/compendium';
import type { Attachment, WorkspaceRuntimeSurface } from '@a5c-ai/agent-mux-core';
import type { KanbanWorkspaceSessionSummary } from '@a5c-ai/agent-mux-core/kanban';
import { useGateway, useStopRun } from '@a5c-ai/agent-mux-ui';
import type { Run } from '../types/index.js';

import ProjectsRoutePage from '../routes/ProjectsPage.js';
import AutomationsRoutePage from '../routes/AutomationsPage.js';
import SettingsRoutePage from '../routes/SettingsPage.js';
import { RequireGatewayAuth } from '../components/agent-mux/require-gateway-auth.js';
import { useGatewayAuth, useGatewayFetch } from '../components/agent-mux/gateway-provider.js';
import { BabysitterOverlayPanel } from '../components/dashboard/babysitter-overlay-panel.js';
import { BacklogOverview } from '../components/dashboard/backlog-overview.js';
import { BreakpointBanner } from '../components/dashboard/breakpoint-banner.js';
import { CatchUpBanner } from '../components/dashboard/catch-up-banner.js';
import { ExecutiveSummaryBanner } from '../components/dashboard/executive-summary-banner.js';
import { GlobalSearch } from '../components/dashboard/global-search.js';
import { KpiGrid } from '../components/dashboard/kpi-grid.js';
import { ProjectListView } from '../components/dashboard/project-list-view.js';
import { RunFilterBar } from '../components/dashboard/run-filter-bar.js';
import { ErrorBoundary } from '../components/shared/error-boundary.js';
import { PageHeroGrid, PageSection, PageShell } from '../components/shared/page-shell.js';
import { Button } from '@a5c-ai/compendium';
import { WorkspaceProvisioningPage } from '../components/workspaces/workspace-provisioning-page.js';
import { WorkspacesPageContent } from '../components/workspaces/workspaces-page.js';
import { useRunDashboard } from '../hooks/use-run-dashboard.js';

function readRuntime(value: unknown): WorkspaceRuntimeSurface | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  return value as WorkspaceRuntimeSurface;
}

function toWorkspaceSessionSummary(session: Record<string, unknown>): KanbanWorkspaceSessionSummary[] {
  const sessionId = typeof session.sessionId === 'string' ? session.sessionId : '';
  const agent = typeof session.agent === 'string' ? session.agent : '';
  const runtime = readRuntime(session.runtime);
  const workspacePath =
    typeof session.cwd === 'string' && session.cwd.length > 0
      ? session.cwd
      : typeof runtime?.workspacePath === 'string' && runtime.workspacePath.length > 0
        ? runtime.workspacePath
        : undefined;
  const status: KanbanWorkspaceSessionSummary['status'] =
    session.status === 'active' ? 'active' : 'inactive';
  if (!sessionId || !agent || !workspacePath) {
    return [];
  }

  return [
    {
      sessionId,
      agent,
      status,
      cwd: workspacePath,
      title: typeof session.title === 'string' ? session.title : undefined,
      updatedAt: typeof session.updatedAt === 'number' ? session.updatedAt : undefined,
      activeRunId: typeof session.activeRunId === 'string' ? session.activeRunId : null,
      latestRunId: typeof session.latestRunId === 'string' ? session.latestRunId : null,
      runtime,
    },
  ];
}

export function ProjectsPage(): JSX.Element {
  return <ProjectsRoutePage />;
}

export function AutomationsPage(): JSX.Element {
  return <AutomationsRoutePage />;
}

export function KanbanSettingsPage(): JSX.Element {
  return <SettingsRoutePage />;
}

export function ProjectBoardPage(): JSX.Element {
  const { projectId = '' } = useParams();
  return (
    <PageShell className="gap-0 page-shell__container--board">
      <BacklogOverview
        projectId={projectId}
        routeBasePath={`/projects/${projectId}`}
        forcedPresentation="board"
      />
    </PageShell>
  );
}

export function ProjectListPage(): JSX.Element {
  const { projectId = '' } = useParams();
  return (
    <PageShell className="gap-0 page-shell__container--board">
      <BacklogOverview
        projectId={projectId}
        routeBasePath={`/projects/${projectId}`}
        forcedPresentation="list"
      />
    </PageShell>
  );
}

export function ProjectIssuePage(): JSX.Element {
  const { projectId = '', issueId = '' } = useParams();
  return <BacklogOverview routeMode="issue" initialProjectId={projectId} initialIssueId={issueId} />;
}

export function IssueDetailPage(): JSX.Element {
  const { issueId = '' } = useParams();
  return <BacklogOverview routeMode="issue" initialIssueId={issueId} />;
}

export function ProjectIssueCreatePage(): JSX.Element {
  const { projectId = '' } = useParams();
  return <BacklogOverview routeMode="create" initialProjectId={projectId} />;
}

export function ProjectWorkspaceCreatePage(): JSX.Element {
  const { projectId = '' } = useParams();
  return <WorkspaceProvisioningPage mode="project" projectId={projectId} />;
}

export function IssueWorkspaceCreatePage(): JSX.Element {
  const { projectId = '', issueId = '' } = useParams();
  return <WorkspaceProvisioningPage mode="issue" projectId={projectId} issueId={issueId} />;
}

export function HostWorkspaceCreatePage(): JSX.Element {
  return <WorkspaceProvisioningPage mode="host" />;
}

export function KanbanRunsPage(): JSX.Element {
  const navigate = useNavigate();
  const { isAuthenticated } = useGatewayAuth();
  const { store } = useGateway();
  const stopRun = useStopRun();
  const [stoppingRunIds, setStoppingRunIds] = useState<Set<string>>(() => new Set());
  const [stopError, setStopError] = useState<string | null>(null);
  const {
    projects,
    loading,
    error,
    metrics,
    allBreakpointRuns,
    summaryMetrics,
    bannerFingerprint,
    bannerDismissed,
    filterCounts,
    filteredProjects,
    activeProjects,
    historyProjects,
    statusFilter,
    sortMode,
    historyCollapsed,
    cardStatusFilter,
    hasStaleRuns,
    catchUp,
    setStatusFilter,
    setSortMode,
    setHistoryCollapsed,
    setDismissedFingerprint,
    toggleMetricFilter,
    handleHideProject,
  } = useRunDashboard();

  const liveRuns = useStore(store, useShallow((state) => Object.values(state.runs.byId)));
  const showBanners = !loading && !error && projects.length > 0;

  useEffect(() => {
    const activeRunIds = new Set(
      liveRuns
        .filter((run) => {
          const status = String(run.status ?? '');
          return status === 'pending' || status === 'waiting';
        })
        .map((run) => String(run.runId ?? ''))
        .filter((runId) => runId.length > 0),
    );

    setStoppingRunIds((current) => {
      let changed = false;
      const next = new Set<string>();
      for (const runId of current) {
        if (activeRunIds.has(runId)) {
          next.add(runId);
        } else {
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [liveRuns]);

  const handleStopRun = useCallback(async (run: Run) => {
    if (!run.runId) {
      return;
    }
    setStopError(null);
    setStoppingRunIds((current) => {
      if (current.has(run.runId)) {
        return current;
      }
      const next = new Set(current);
      next.add(run.runId);
      return next;
    });

    try {
      const response = await stopRun(run.runId) as { stopped?: boolean };
      if (!response?.stopped) {
        throw new Error('Gateway refused to stop this dispatch');
      }
    } catch (cause) {
      setStoppingRunIds((current) => {
        if (!current.has(run.runId)) {
          return current;
        }
        const next = new Set(current);
        next.delete(run.runId);
        return next;
      });
      setStopError(cause instanceof Error ? cause.message : String(cause));
    }
  }, [stopRun]);

  return (
    <PageShell>
      <PageHeroGrid>
        <PageSection>
          <p className="page-kicker">Dispatches</p>
          <div className="page-logo">
            <LogoWordmark className="h-6 w-auto" />
          </div>
          <h1 className="page-title">Dispatch queue and approvals</h1>
          <p className="page-copy">
            Inspect live dispatch activity, breakpoints, and recent history here, then jump back to the linked project, workspace, or chat without losing context.
          </p>
          <div className="page-actions">
            <Button variant="primary" onClick={() => navigate('/projects')}>
              Projects
            </Button>
            <Button variant="ghost" onClick={() => navigate('/sessions/new')}>
              New session
            </Button>
            <Button variant="ghost" onClick={() => navigate('/workspaces')}>
              Workspaces
            </Button>
            <Button variant="ghost" onClick={() => navigate('/inbox')}>
              Inbox
            </Button>
          </div>
        </PageSection>

        <PageSection>
          <p className="page-kicker">Gateway</p>
          <h2 className="page-title page-title--secondary">
            {isAuthenticated ? 'Connected and streaming' : 'Reconnect the gateway'}
          </h2>
          <p className="page-copy">
            {isAuthenticated
              ? 'Live sessions, workspace attention, and dispatch telemetry are available now.'
              : 'Reconnect to create sessions, continue chats, and pull live workspace context into the same surface.'}
          </p>
          <div className="page-actions">
            <Button variant="ghost" onClick={() => navigate(isAuthenticated ? '/sessions' : '/login')}>
              {isAuthenticated ? 'Open sessions' : 'Connect gateway'}
            </Button>
          </div>
        </PageSection>
      </PageHeroGrid>

      <GlobalSearch />
      <BabysitterOverlayPanel />

      {showBanners ? (
        <ErrorBoundary section="Executive Summary">
          <ExecutiveSummaryBanner
            metrics={summaryMetrics}
            onFilterChange={setStatusFilter}
            dismissed={bannerDismissed}
            onDismiss={() => setDismissedFingerprint(bannerFingerprint)}
          />
        </ErrorBoundary>
      ) : null}

      {showBanners ? (
        <ErrorBoundary section="KPI Metrics">
          <KpiGrid
            metrics={metrics}
            statusFilter={statusFilter}
            hasStaleRuns={hasStaleRuns}
            onToggleFilter={toggleMetricFilter}
          />
        </ErrorBoundary>
      ) : null}

      {catchUp.active ? (
        <CatchUpBanner
          catchUp={catchUp}
          summary={{
            failedRuns: summaryMetrics.failedRuns,
            completedRuns: summaryMetrics.completedRuns,
            pendingBreakpoints: summaryMetrics.pendingBreakpoints,
          }}
        />
      ) : null}

      {!loading && !error && allBreakpointRuns.length > 0 ? (
        <ErrorBoundary section="Breakpoint Banner">
          <div className="sticky top-0 z-40">
            <BreakpointBanner breakpointRuns={allBreakpointRuns} />
          </div>
        </ErrorBoundary>
      ) : null}

      {stopError ? (
        <div className="summary-card border border-error/20 bg-error/5">
          <span className="summary-label">Stop request failed</span>
          <strong>{stopError}</strong>
        </div>
      ) : null}

      <RunFilterBar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        filterCounts={filterCounts}
        sortMode={sortMode}
        onSortModeToggle={() => setSortMode((prev) => (prev === 'status' ? 'activity' : 'status'))}
        filteredProjectCount={filteredProjects.length}
      />

      <ProjectListView
        loading={loading}
        error={error}
        filteredProjects={filteredProjects}
        activeProjects={activeProjects}
        historyProjects={historyProjects}
        statusFilter={statusFilter}
        sortMode={sortMode}
        cardStatusFilter={cardStatusFilter}
        historyCollapsed={historyCollapsed}
        onHistoryCollapsedChange={setHistoryCollapsed}
        onHideProject={handleHideProject}
        onStopRun={handleStopRun}
        stoppingRunIds={stoppingRunIds}
      />
    </PageShell>
  );
}

export function KanbanWorkspacesPage(): JSX.Element {
  const { isAuthenticated } = useGatewayAuth();

  if (!isAuthenticated) {
    return <KanbanWorkspacesLocalContent />;
  }

  return <KanbanWorkspacesGatewayContent />;
}

function KanbanWorkspacesLocalContent(): JSX.Element {
  const [searchParams] = useSearchParams();
  const selectedWorkspacePath = searchParams.get('workspace');

  return (
    <WorkspacesPageContent
      isAuthenticated={false}
      sessions={[]}
      selectedWorkspacePath={selectedWorkspacePath}
    />
  );
}

function KanbanWorkspacesGatewayContent(): JSX.Element {
  const [searchParams] = useSearchParams();
  const selectedWorkspacePath = searchParams.get('workspace');
  const fetchGateway = useGatewayFetch();
  const { store } = useGateway();
  const sessions = useStore(store, useShallow((state) => Object.values(state.sessions.byId)));
  const runs = useStore(store, useShallow((state) => Object.values(state.runs.byId)));
  const eventBuffers = useStore(store, (state) => state.events.byRunId);

  const workspaceSessions = useMemo<KanbanWorkspaceSessionSummary[]>(
    () => sessions.flatMap((session) => toWorkspaceSessionSummary(session as Record<string, unknown>)),
    [sessions],
  );

  async function handleSendPrompt(input: {
    sessionId: string;
    prompt: string;
    agent?: string;
    model?: string;
    attachments?: Attachment[];
    approvalMode?: 'yolo' | 'prompt' | 'deny';
  }) {
    const currentSession = sessions.find((session) => String(session.sessionId) === input.sessionId) as Record<string, unknown> | undefined;
    const sessionAgent = typeof currentSession?.agent === 'string' ? currentSession.agent : undefined;
    const switchesAgent = input.agent && sessionAgent && input.agent !== sessionAgent;
    const response = await fetchGateway(
      switchesAgent ? '/api/v1/sessions' : `/api/v1/sessions/${input.sessionId}/messages`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(
          switchesAgent
            ? {
                agent: input.agent,
                prompt: input.prompt,
                model: input.model,
                attachments: input.attachments,
                approvalMode: input.approvalMode,
                forkSessionId: input.sessionId,
                workspaceId: typeof currentSession?.workspaceId === 'string' ? currentSession.workspaceId : undefined,
                cwd: typeof currentSession?.cwd === 'string' ? currentSession.cwd : undefined,
              }
            : {
                prompt: input.prompt,
                agent: input.agent,
                model: input.model,
                attachments: input.attachments,
                approvalMode: input.approvalMode,
              },
        ),
      },
    );

    if (!response.ok) {
      throw new Error(`Gateway request failed: ${response.status}`);
    }

    const body = (await response.json()) as {
      run?: Record<string, unknown>;
      session?: Record<string, unknown>;
      sourceSessionId?: string | null;
    };

    if (body.run?.runId) {
      store.getState().actions.mergeRun(String(body.run.runId), body.run);
    }
    if (body.session?.sessionId) {
      store.getState().actions.mergeSession(String(body.session.sessionId), body.session);
    }
    return {
      runId: typeof body.run?.runId === 'string' ? body.run.runId : undefined,
      sessionId: typeof body.run?.sessionId === 'string'
        ? body.run.sessionId
        : typeof body.session?.sessionId === 'string'
          ? body.session.sessionId
          : undefined,
    };
  }

  return (
    <WorkspacesPageContent
      isAuthenticated
      sessions={workspaceSessions}
      selectedWorkspacePath={selectedWorkspacePath}
      allRuns={runs as Array<Record<string, unknown>>}
      eventBuffers={eventBuffers}
      onSendPrompt={handleSendPrompt}
    />
  );
}

export function KanbanInboxPage(): JSX.Element {
  return (
    <RequireGatewayAuth>
      <KanbanInboxContent />
    </RequireGatewayAuth>
  );
}

function KanbanInboxContent(): JSX.Element {
  const { store } = useGateway();
  const sessions = useStore(store, useShallow((state) => Object.values(state.sessions.byId)));

  const workspaceSessions = useMemo<KanbanWorkspaceSessionSummary[]>(
    () => sessions.flatMap((session) => toWorkspaceSessionSummary(session as Record<string, unknown>)),
    [sessions],
  );

  return <WorkspacesPageContent isAuthenticated sessions={workspaceSessions} mode="attention" />;
}
