import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { EventStream } from '../src/event-stream.js';
import KanbanViewPlugin from '../src/plugins/kanban-view.js';
import type { TuiInternalEvent } from '../src/plugin.js';

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 30));
}

function makeOverview() {
  return {
    summary: {
      projectCount: 1,
      issueCount: 1,
      readyCount: 1,
      blockedCount: 0,
      dispatchedCount: 1,
      completedCount: 0,
      needsDecompositionCount: 0,
      inProgressCount: 0,
    },
    snapshot: {
      generatedAt: '2026-04-27T00:00:00.000Z',
      dispatchContextLabels: [],
      projects: [
        {
          id: 'project-1',
          key: 'ACA',
          name: 'Agent Mux TUI',
          issueIds: ['issue-1'],
          labels: [],
          assignees: [],
          team: { id: 'team-1', name: 'TUI', members: [], settings: { visibility: 'team', defaultRole: 'contributor', allowSelfAssign: true } },
          settings: { reviewRequiredForDone: true, activityScope: 'project-and-issues', workspaceProvisioning: 'owners-maintainers' },
          permissions: [],
          activity: [],
          statuses: [],
          repositories: [],
          integrations: [],
          metrics: {
            totalIssues: 1,
            readyIssues: 1,
            blockedIssues: 0,
            dispatchedIssues: 1,
            completedIssues: 0,
            needsDecompositionIssues: 0,
            inProgressIssues: 0,
          },
        },
      ],
      issues: [
        {
          id: 'issue-1',
          projectId: 'project-1',
          key: 'ACA-398',
          title: 'Implement kanban view',
          summary: 'List-first kanban surface for amux-tui',
          description: 'Ship a keyboard-driven kanban tab.',
          status: 'ready',
          priority: 'high',
          labels: [],
          assignees: [],
          collaborators: [],
          dependencies: [],
          acceptanceCriteria: [],
          decomposition: [],
          childIssueIds: [],
          createdAt: '2026-04-27T00:00:00.000Z',
          updatedAt: '2026-04-27T00:00:00.000Z',
          dispatch: {
            readiness: 'dispatched',
            blockedReasons: [],
            runIds: ['run-1'],
            sessionIds: ['session-1'],
            contextLabels: [],
            contextLabelProjections: [],
          },
          workspaceLinks: [
            {
              workspacePath: '/tmp/aca-398',
              workspaceName: 'aca-398',
              branchName: 'aca-398',
              linkedAt: '2026-04-27T00:00:00.000Z',
              source: 'created-from-issue',
            },
          ],
          activity: [],
          repositoryLifecycle: {
            repositoryId: 'repo-1',
            branchName: 'aca-398',
            reviewStatus: 'pending',
            mergeStatus: 'not-ready',
            publishStatus: 'not-ready',
            ciGates: [
              {
                id: 'ci-1',
                name: 'unit',
                required: true,
                status: 'pending',
              },
            ],
          },
        },
      ],
    },
    board: {
      generatedAt: '2026-04-27T00:00:00.000Z',
      projects: [
        {
          projectId: 'project-1',
          projectKey: 'ACA',
          projectName: 'Agent Mux TUI',
          generatedAt: '2026-04-27T00:00:00.000Z',
          columns: [
            { id: 'todo', name: 'Todo', issueIds: [], issueCount: 0, isOverLimit: false },
            { id: 'in-progress', name: 'In Progress', issueIds: [], issueCount: 0, isOverLimit: false },
            { id: 'review', name: 'Review', issueIds: [], issueCount: 0, isOverLimit: false },
            { id: 'done', name: 'Done', issueIds: [], issueCount: 0, isOverLimit: false },
          ],
          swimlanes: [],
          policyHooks: [],
          cards: [
            {
              issueId: 'issue-1',
              issueKey: 'ACA-398',
              projectId: 'project-1',
              title: 'Implement kanban view',
              workflowState: 'todo',
              swimlaneId: 'standard',
              priority: 'high',
              readiness: 'dispatched',
              blocked: false,
              blockedReasons: [],
              labelNames: [],
              assigneeNames: [],
              collaboratorNames: [],
              dependencyCount: 0,
              childCount: 0,
              activityCount: 0,
              acceptanceProgress: { satisfied: 0, total: 0 },
              moveTargets: [
                { state: 'in-progress', allowed: true, signals: [] },
                { state: 'review', allowed: false, signals: [{ hookId: 'dispatch-ready', severity: 'error', message: 'skip not allowed', blocking: true }] },
              ],
              policySignals: [],
              repositoryLifecycle: {
                repositoryId: 'repo-1',
                branchName: 'aca-398',
                reviewStatus: 'pending',
                mergeStatus: 'not-ready',
                publishStatus: 'not-ready',
                ciGates: [{ id: 'ci-1', name: 'unit', required: true, status: 'pending' }],
              },
            },
          ],
        },
      ],
    },
  } as never;
}

function makeInventory() {
  return {
    workspaces: [
      {
        path: '/tmp/aca-398',
        name: 'aca-398',
        status: 'active',
        missing: false,
        archivedAt: null,
        cleanedAt: null,
        lastActivityAt: '2026-04-27T00:00:00.000Z',
        git: {
          root: '/tmp/aca-398',
          commonDir: null,
          trackingBranch: 'origin/aca-398',
          branch: 'aca-398',
          head: 'abc123',
          ahead: 0,
          behind: 0,
          dirty: false,
          uncommittedCount: 0,
          isWorktree: true,
          isPrimary: false,
        },
        notes: { value: '', updatedAt: null },
        links: { editorHref: null },
        sessions: { total: 1, active: 1, items: [] },
        runs: { total: 1, active: 1, items: [] },
        actions: {
          canArchive: true,
          canCleanup: true,
          canRecover: false,
          canRebaseStart: false,
          canRebaseAutoResolve: false,
          canRebaseOpenInEditor: false,
          canRebaseMarkResolved: false,
          canRebaseAbort: false,
        },
        issues: [
          {
            issueId: 'issue-1',
            issueKey: 'ACA-398',
            issueTitle: 'Implement kanban view',
            projectId: 'agent-catalog',
            projectKey: 'ACA',
            projectName: 'Agent Catalog',
            linkedAt: '2026-04-27T00:00:00.000Z',
            source: 'created-from-issue',
          },
        ],
      },
    ],
    summary: { total: 1, active: 1, idle: 0, archived: 0, missing: 0 },
  } as never;
}

function extractView() {
  const views: { component: React.ComponentType<unknown> }[] = [];
  KanbanViewPlugin.register({
    client: {} as never,
    eventStream: new EventStream(),
    registerView: (view) => views.push(view as never),
    registerEventRenderer: () => {},
    registerCommand: () => {},
    registerPromptHandler: () => {},
    emit: () => {},
  });
  return views[0]!.component as React.ComponentType<{
    client: unknown;
    kanban?: unknown;
    active: boolean;
    eventStream: EventStream;
    emit: (event: TuiInternalEvent) => void;
  }>;
}

describe('kanban-view', () => {
  it('renders the selected project, issue, and workspace summary', async () => {
    const View = extractView();
    const controlPlane = {
      loadOverview: vi.fn(async () => makeOverview()),
      listWorkspaces: vi.fn(async () => makeInventory()),
    } as never;
    const client = {
      adapters: { list: () => [] },
      sessions: { list: vi.fn(async () => []) },
    } as never;
    const stream = new EventStream();
    const { lastFrame, rerender } = render(
      <View client={client} kanban={controlPlane} active={true} eventStream={stream} emit={() => {}} />,
    );
    await flush();
    rerender(<View client={client} kanban={controlPlane} active={true} eventStream={stream} emit={() => {}} />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('ACA Agent Mux TUI');
    expect(frame).toContain('ACA-398');
    expect(frame).toContain('Implement kanban view');
    expect(frame).toContain('aca-398');
  });

  it('routes create-issue action through the kanban control plane', async () => {
    const View = extractView();
    const createIssue = vi.fn(async (input: unknown) => ({
      overview: makeOverview(),
      issue: {
        id: 'issue-2',
        projectId: 'project-1',
        key: 'ACA-399',
        title: (input as { title: string }).title,
      },
    }));
    const controlPlane = {
      loadOverview: vi.fn(async () => makeOverview()),
      listWorkspaces: vi.fn(async () => makeInventory()),
      createIssue,
    } as never;
    const client = {
      adapters: { list: () => [] },
      sessions: { list: vi.fn(async () => []) },
    } as never;
    const stream = new EventStream();
    const emit = vi.fn();
    const { stdin, rerender } = render(
      <View client={client} kanban={controlPlane} active={true} eventStream={stream} emit={emit} />,
    );
    await flush();
    rerender(<View client={client} kanban={controlPlane} active={true} eventStream={stream} emit={emit} />);
    stdin.write('a');
    await flush();
    stdin.write('New issue');
    await flush();
    stdin.write('\r');
    await flush();
    expect(createIssue).toHaveBeenCalledWith({
      projectId: 'project-1',
      title: 'New issue',
    });
  });

  it('opens session detail from the selected issue linkage', async () => {
    const View = extractView();
    const controlPlane = {
      loadOverview: vi.fn(async () => makeOverview()),
      listWorkspaces: vi.fn(async () => makeInventory()),
    } as never;
    const client = {
      adapters: { list: () => [{ agent: 'codex' }] },
      sessions: {
        list: vi.fn(async () => [{ sessionId: 'session-1' }]),
      },
    } as never;
    const stream = new EventStream();
    const emit = vi.fn();
    const { stdin, rerender } = render(
      <View client={client} kanban={controlPlane} active={true} eventStream={stream} emit={emit} />,
    );
    await flush();
    rerender(<View client={client} kanban={controlPlane} active={true} eventStream={stream} emit={emit} />);
    stdin.write('s');
    await flush();
    const calls = emit.mock.calls.map((call) => call[0]);
    expect(calls).toContainEqual({
      type: 'session:detail',
      agent: 'codex',
      sessionId: 'session-1',
    });
    expect(calls).toContainEqual({ type: 'view:switch', id: 'session-detail' });
  });

  it('opens the linked workspace view from the selected issue', async () => {
    const View = extractView();
    const controlPlane = {
      loadOverview: vi.fn(async () => makeOverview()),
      listWorkspaces: vi.fn(async () => makeInventory()),
    } as never;
    const client = {
      adapters: { list: () => [] },
      sessions: { list: vi.fn(async () => []) },
    } as never;
    const stream = new EventStream();
    const emit = vi.fn();
    const { stdin, rerender } = render(
      <View client={client} kanban={controlPlane} active={true} eventStream={stream} emit={emit} />,
    );
    await flush();
    rerender(<View client={client} kanban={controlPlane} active={true} eventStream={stream} emit={emit} />);
    stdin.write('w');
    await flush();
    expect(emit.mock.calls.map((call) => call[0])).toContainEqual({
      type: 'workspace:select',
      workspacePath: '/tmp/aca-398',
      viewId: 'workspaces',
    });
  });

  it('explains when no kanban control plane is injected', () => {
    const View = extractView();
    const stream = new EventStream();
    const client = {
      adapters: { list: () => [] },
      sessions: { list: vi.fn(async () => []) },
    } as never;
    const { lastFrame } = render(
      <View client={client} active={true} eventStream={stream} emit={() => {}} />,
    );
    expect(lastFrame() ?? '').toContain('did not inject a kanban control plane');
  });
});
