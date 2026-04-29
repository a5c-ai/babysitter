import React, { useMemo } from 'react';
import { Link } from 'react-router-dom-v6';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useParams, useSearchParams } from 'react-router-dom-v6';
import { LogoWordmark } from '@a5c-ai/compendium';
import type { Attachment, WorkspaceRuntimeSurface } from '@a5c-ai/agent-mux-core';
import type { KanbanWorkspaceSessionSummary } from '@a5c-ai/agent-mux-core/kanban';
import { useGateway } from '@a5c-ai/agent-mux-ui';

import ProjectsRoutePage from '../kanban/routes/ProjectsPage.js';
import AutomationsRoutePage from '../kanban/routes/AutomationsPage.js';
import SettingsRoutePage from '../kanban/routes/SettingsPage.js';
import { RequireGatewayAuth } from '../kanban/components/agent-mux/require-gateway-auth.js';
import { useGatewayAuth, useGatewayFetch } from '../kanban/components/agent-mux/gateway-provider.js';
import { BabysitterOverlayPanel } from '../kanban/components/dashboard/babysitter-overlay-panel.js';
import { BacklogOverview } from '../kanban/components/dashboard/backlog-overview.js';
import { BreakpointBanner } from '../kanban/components/dashboard/breakpoint-banner.js';
import { CatchUpBanner } from '../kanban/components/dashboard/catch-up-banner.js';
import { ExecutiveSummaryBanner } from '../kanban/components/dashboard/executive-summary-banner.js';
import { GlobalSearch } from '../kanban/components/dashboard/global-search.js';
import { KpiGrid } from '../kanban/components/dashboard/kpi-grid.js';
import { ProjectListView } from '../kanban/components/dashboard/project-list-view.js';
import { RunFilterBar } from '../kanban/components/dashboard/run-filter-bar.js';
import { ErrorBoundary } from '../kanban/components/shared/error-boundary.js';
import { PageHeroGrid, PageSection, PageShell } from '../kanban/components/shared/page-shell.js';
import { Button } from '@a5c-ai/compendium';
import { WorkspaceProvisioningPage } from '../kanban/components/workspaces/workspace-provisioning-page.js';
import { WorkspacesPageContent } from '../kanban/components/workspaces/workspaces-page.js';
import { useRunDashboard } from '../kanban/hooks/use-run-dashboard.js';

function readRuntime(value: unknown): WorkspaceRuntimeSurface | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  return value as WorkspaceRuntimeSurface;
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
    <PageShell className="gap-0">
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
    <PageShell className="gap-0">
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
  const { isAuthenticated } = useGatewayAuth();
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

  const showBanners = !loading && !error && projects.length > 0;

  return (
    <PageShell>
      <PageHeroGrid>
        <PageSection>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Execution overlays</p>
          <div className="mt-2">
            <LogoWordmark className="h-6 w-auto" />
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Runs stay visible without replacing the planning workspace
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground-muted">
            The project board now owns the main journey. This route keeps Babysitter runs,
            approvals, search, and status triage available as an execution dashboard.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="primary">
              <Link to="/projects">Open projects</Link>
            </Button>
            <Button variant="ghost">
              <Link to="/sessions/new">Start session</Link>
            </Button>
            <Button variant="ghost">
              <Link to="/workspaces">Open workspaces</Link>
            </Button>
            <Button variant="ghost">
              <Link to="/inbox">Open inbox</Link>
            </Button>
          </div>
        </PageSection>

        <PageSection>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Gateway</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            {isAuthenticated ? 'agent-mux connected' : 'agent-mux disconnected'}
          </h2>
          <p className="mt-3 text-sm leading-6 text-foreground-muted">
            {isAuthenticated
              ? 'Live sessions and workspace attention are available now.'
              : 'Connect the gateway to enable session creation, chat continuation, and live workspace context from the same app.'}
          </p>
          <div className="mt-5">
            <Button variant="ghost">
              <Link to={isAuthenticated ? '/sessions' : '/login'}>
                {isAuthenticated ? 'Open sessions' : 'Connect gateway'}
              </Link>
            </Button>
          </div>
        </PageSection>
      </PageHeroGrid>

      <BabysitterOverlayPanel />
      <GlobalSearch />

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
      />
    </PageShell>
  );
}

export function KanbanWorkspacesPage(): JSX.Element {
  return (
    <RequireGatewayAuth>
      <KanbanWorkspacesContent />
    </RequireGatewayAuth>
  );
}

function KanbanWorkspacesContent(): JSX.Element {
  const [searchParams] = useSearchParams();
  const selectedWorkspacePath = searchParams.get('workspace');
  const fetchGateway = useGatewayFetch();
  const { store } = useGateway();
  const sessions = useStore(store, useShallow((state) => Object.values(state.sessions.byId)));
  const runs = useStore(store, useShallow((state) => Object.values(state.runs.byId)));
  const eventBuffers = useStore(store, (state) => state.events.byRunId);

  const workspaceSessions = useMemo<KanbanWorkspaceSessionSummary[]>(
    () =>
      sessions.flatMap((session) => {
        const sessionId = typeof session.sessionId === 'string' ? session.sessionId : '';
        const agent = typeof session.agent === 'string' ? session.agent : '';
        const status: KanbanWorkspaceSessionSummary['status'] =
          session.status === 'active' ? 'active' : 'inactive';
        if (!sessionId || !agent) {
          return [];
        }

        return [
          {
            sessionId,
            agent,
            status,
            cwd: typeof session.cwd === 'string' ? session.cwd : undefined,
            title: typeof session.title === 'string' ? session.title : undefined,
            updatedAt: typeof session.updatedAt === 'number' ? session.updatedAt : undefined,
            activeRunId: typeof session.activeRunId === 'string' ? session.activeRunId : null,
            latestRunId: typeof session.latestRunId === 'string' ? session.latestRunId : null,
            runtime: readRuntime(session.runtime),
          },
        ];
      }),
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
    const response = await fetchGateway(`/api/v1/sessions/${input.sessionId}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt: input.prompt,
        agent: input.agent,
        model: input.model,
        attachments: input.attachments,
        approvalMode: input.approvalMode,
      }),
    });

    if (!response.ok) {
      throw new Error(`Gateway request failed: ${response.status}`);
    }

    const body = (await response.json()) as {
      run?: Record<string, unknown>;
      session?: Record<string, unknown>;
    };

    if (body.run?.runId) {
      store.getState().actions.mergeRun(String(body.run.runId), body.run);
    }
    if (body.session?.sessionId) {
      store.getState().actions.mergeSession(String(body.session.sessionId), body.session);
    }
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
    () =>
      sessions.flatMap((session) => {
        const sessionId = typeof session.sessionId === 'string' ? session.sessionId : '';
        const agent = typeof session.agent === 'string' ? session.agent : '';
        const status: KanbanWorkspaceSessionSummary['status'] =
          session.status === 'active' ? 'active' : 'inactive';
        if (!sessionId || !agent) {
          return [];
        }

        return [
          {
            sessionId,
            agent,
            status,
            cwd: typeof session.cwd === 'string' ? session.cwd : undefined,
            title: typeof session.title === 'string' ? session.title : undefined,
            updatedAt: typeof session.updatedAt === 'number' ? session.updatedAt : undefined,
            activeRunId: typeof session.activeRunId === 'string' ? session.activeRunId : null,
            latestRunId: typeof session.latestRunId === 'string' ? session.latestRunId : null,
            runtime: readRuntime(session.runtime),
          },
        ];
      }),
    [sessions],
  );

  return <WorkspacesPageContent isAuthenticated sessions={workspaceSessions} mode="attention" />;
}
