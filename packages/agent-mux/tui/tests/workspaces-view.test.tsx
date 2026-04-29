import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { EventStream } from '../src/event-stream.js';
import WorkspacesViewPlugin from '../src/plugins/workspaces-view.js';
import type { TuiInternalEvent } from '../src/plugin.js';

function makeInventory() {
  return {
    summary: { total: 2, active: 1, idle: 0, archived: 1, missing: 0 },
    workspaces: [
      {
        path: '/repo/worktrees/amtui-kw-3',
        name: 'AMTUI-KW-3',
        status: 'active',
        missing: false,
        archivedAt: null,
        cleanedAt: null,
        lastActivityAt: '2026-04-27T07:00:00.000Z',
        git: {
          root: '/repo',
          commonDir: '/repo/.git',
          trackingBranch: 'origin/main',
          branch: 'vk/amtui-kw-3',
          head: 'abcdef1234567890',
          ahead: 1,
          behind: 0,
          dirty: true,
          uncommittedCount: 2,
          isWorktree: true,
          isPrimary: false,
        },
        notes: {
          value: 'Finish the lifecycle presentation.',
          updatedAt: '2026-04-27T06:55:00.000Z',
        },
        links: {
          editorHref: 'vscode://file/repo/worktrees/amtui-kw-3',
        },
        sessions: {
          total: 1,
          active: 1,
          items: [
            {
              sessionId: 'sess-kw3',
              agent: 'codex',
              status: 'active',
              cwd: '/repo/worktrees/amtui-kw-3',
              title: 'AMTUI workspace session',
              updatedAt: 1_777_270_000_000,
              activeRunId: 'run-kw3',
              latestRunId: 'run-kw3',
            },
          ],
        },
        runs: {
          total: 1,
          active: 1,
          items: [
            {
              runId: 'run-kw3',
              status: 'waiting',
              projectName: 'agent-mux-tui',
            },
          ],
        },
        rebase: {
          status: 'rebase-conflicts',
          branch: 'vk/amtui-kw-3',
          targetBranch: 'main',
          attemptCount: 2,
          unresolvedFiles: ['packages/agent-mux/tui/src/plugins/workspaces-view.tsx'],
          resolvedFiles: ['packages/agent-mux/webui/src/kanban/lib/workspace-lifecycle.ts'],
          followUpInstructions: ['Resolve the remaining workspace-view conflicts.'],
          manualResolutionSuggested: true,
          readyFor: 'merge',
          editorHref: 'vscode://file/repo/worktrees/amtui-kw-3',
          lastAction: 'open-in-editor',
          persistedAt: 1_777_270_000_000,
        },
        actions: {
          canArchive: true,
          canCleanup: false,
          canRecover: false,
          canRebaseStart: false,
          canRebaseAutoResolve: true,
          canRebaseOpenInEditor: true,
          canRebaseMarkResolved: true,
          canRebaseAbort: true,
        },
        issues: [
          {
            issueId: 'issue-1',
            issueKey: 'AMTUI-KW-3',
            issueTitle: 'Implement the workspaces view',
            projectId: 'agent-mux',
            projectKey: 'AMTUI',
            projectName: 'Agent Mux TUI',
            linkedAt: '2026-04-27T06:30:00.000Z',
            source: 'created-from-issue',
          },
        ],
      },
      {
        path: '/repo',
        name: 'primary',
        status: 'archived',
        missing: false,
        archivedAt: '2026-04-26T12:00:00.000Z',
        cleanedAt: null,
        lastActivityAt: '2026-04-26T12:00:00.000Z',
        git: {
          root: '/repo',
          commonDir: '/repo/.git',
          trackingBranch: 'origin/main',
          branch: 'main',
          head: 'fedcba987654321',
          ahead: 0,
          behind: 0,
          dirty: false,
          uncommittedCount: 0,
          isWorktree: true,
          isPrimary: true,
        },
        notes: { value: '', updatedAt: null },
        links: { editorHref: 'vscode://file/repo' },
        sessions: { total: 0, active: 0, items: [] },
        runs: { total: 0, active: 0, items: [] },
        actions: {
          canArchive: true,
          canCleanup: false,
          canRecover: true,
          canRebaseStart: false,
          canRebaseAutoResolve: false,
          canRebaseOpenInEditor: false,
          canRebaseMarkResolved: false,
          canRebaseAbort: false,
        },
        issues: [],
      },
    ],
  } as const;
}

function makeClient() {
  return {
    adapters: {
      list: () => [{ agent: 'codex' }],
    },
    sessions: {
      list: vi.fn(async () => [
        {
          sessionId: 'sess-kw3',
          title: 'AMTUI workspace session',
          cwd: '/repo/worktrees/amtui-kw-3',
          updatedAt: 1_777_270_000_000,
          activeRunId: 'run-kw3',
        },
      ]),
    },
  } as never;
}

function extractView() {
  const views: { component: React.ComponentType<unknown> }[] = [];
  WorkspacesViewPlugin.register({
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

async function flush(ms = 25) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

describe('workspaces-view', () => {
  it('renders workspace inventory, issue linkage, and rebase status', async () => {
    const View = extractView();
    const client = makeClient();
    const controlPlane = {
      listWorkspaces: vi.fn(async () => makeInventory()),
    };
    const stream = new EventStream();
    const { lastFrame, rerender } = render(
      <View client={client} kanban={controlPlane} active={true} eventStream={stream} emit={() => {}} />,
    );

    await flush();
    rerender(<View client={client} kanban={controlPlane} active={true} eventStream={stream} emit={() => {}} />);

    const frame = lastFrame() ?? '';
    expect(frame).toContain('Workspaces');
    expect(frame).toContain('AMTUI-KW-3');
    expect(frame).toContain('Implement the workspaces view');
    expect(frame).toContain('rebase-conflicts');
    expect(frame).toContain('run-kw3');
    expect(controlPlane.listWorkspaces).toHaveBeenCalledWith({
      sessions: [
        expect.objectContaining({
          sessionId: 'sess-kw3',
          agent: 'codex',
          status: 'active',
        }),
      ],
    });
  });

  it('routes archive action through the kanban control plane', async () => {
    const View = extractView();
    const client = makeClient();
    const applyWorkspaceAction = vi.fn(async () => ({
      result: {
        ok: true,
        workspacePath: '/repo/worktrees/amtui-kw-3',
        action: 'archive',
        message: 'Archived /repo/worktrees/amtui-kw-3.',
      },
      inventory: makeInventory(),
    }));
    const controlPlane = {
      listWorkspaces: vi.fn(async () => makeInventory()),
      applyWorkspaceAction,
    };
    const stream = new EventStream();
    const emit = vi.fn();
    const { stdin, rerender } = render(
      <View client={client} kanban={controlPlane} active={true} eventStream={stream} emit={emit} />,
    );

    await flush();
    rerender(<View client={client} kanban={controlPlane} active={true} eventStream={stream} emit={emit} />);

    stdin.write('a');
    await flush();
    stdin.write('\r');
    await flush();

    expect(applyWorkspaceAction).toHaveBeenCalledWith({
      action: 'archive',
      workspacePath: '/repo/worktrees/amtui-kw-3',
      note: undefined,
      sessions: [
        expect.objectContaining({
          sessionId: 'sess-kw3',
          agent: 'codex',
          status: 'active',
        }),
      ],
    });
    expect(emit).toHaveBeenCalledWith({
      type: 'status',
      message: 'Archived /repo/worktrees/amtui-kw-3.',
    });
  });

  it('opens the preferred linked session in detail mode on Enter', async () => {
    const View = extractView();
    const client = makeClient();
    const controlPlane = {
      listWorkspaces: vi.fn(async () => makeInventory()),
    };
    const stream = new EventStream();
    const emit = vi.fn();
    const { stdin, rerender } = render(
      <View client={client} kanban={controlPlane} active={true} eventStream={stream} emit={emit} />,
    );

    await flush();
    rerender(<View client={client} kanban={controlPlane} active={true} eventStream={stream} emit={emit} />);

    stdin.write('\r');
    await flush();

    expect(emit).toHaveBeenCalledWith({
      type: 'session:detail',
      agent: 'codex',
      sessionId: 'sess-kw3',
    });
    expect(emit).toHaveBeenCalledWith({ type: 'view:switch', id: 'session-detail' });
  });

  it('opens the linked issue in kanban mode', async () => {
    const View = extractView();
    const client = makeClient();
    const controlPlane = {
      listWorkspaces: vi.fn(async () => makeInventory()),
    };
    const stream = new EventStream();
    const emit = vi.fn();
    const { stdin, rerender } = render(
      <View client={client} kanban={controlPlane} active={true} eventStream={stream} emit={emit} />,
    );

    await flush();
    rerender(<View client={client} kanban={controlPlane} active={true} eventStream={stream} emit={emit} />);

    stdin.write('g');
    await flush();

    expect(emit).toHaveBeenCalledWith({
      type: 'issue:select',
      issueId: 'issue-1',
      viewId: 'kanban',
    });
  });

  it('explains when no kanban control plane is injected', () => {
    const View = extractView();
    const stream = new EventStream();
    const { lastFrame } = render(
      <View client={makeClient()} active={true} eventStream={stream} emit={() => {}} />,
    );

    expect(lastFrame() ?? '').toContain('did not inject a kanban control plane');
  });
});
