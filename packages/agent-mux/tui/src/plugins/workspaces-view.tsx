import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type {
  KanbanWorkspaceAction,
  KanbanWorkspaceInventory,
  KanbanWorkspaceSessionSummary,
  KanbanWorkspaceSummary,
} from '@a5c-ai/agent-mux-core/kanban';
import { definePlugin, type TuiViewProps } from '../plugin.js';
import { truncateEnd, truncateMiddle, visibleWindow } from '../layout.js';

type ComposerState =
  | { kind: 'notes'; value: string }
  | { kind: 'confirm'; action: KanbanWorkspaceAction; prompt: string };

interface LoadedState {
  inventory: KanbanWorkspaceInventory;
  sessions: readonly KanbanWorkspaceSessionSummary[];
}

function workspaceStatusColor(status: KanbanWorkspaceSummary['status']): string {
  if (status === 'active') return 'green';
  if (status === 'archived') return 'yellow';
  if (status === 'missing') return 'red';
  return 'white';
}

function rebaseStatusColor(status: string): string {
  if (status === 'ready-for-review' || status === 'ready-for-merge') return 'green';
  if (status === 'rebase-conflicts') return 'red';
  if (status === 'rebase-needed') return 'yellow';
  return 'white';
}

function formatDateTime(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().replace('T', ' ').replace('.000Z', 'Z');
}

function toEpoch(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

async function collectLiveSessions(
  client: TuiViewProps['client'],
  activeSessions?: ReadonlySet<string>,
): Promise<KanbanWorkspaceSessionSummary[]> {
  const snapshots = await Promise.all(
    client.adapters.list().map(async (adapter) => {
      try {
        const sessions = await client.sessions.list(adapter.agent as never, { limit: 50 });
        return sessions.map((session) => {
          const summary = session as unknown as Record<string, unknown>;
          const activeRunId =
            typeof summary.activeRunId === 'string' ? summary.activeRunId : summary.activeRunId === null ? null : null;
          const latestRunId =
            typeof summary.latestRunId === 'string' ? summary.latestRunId : summary.latestRunId === null ? null : null;
          return {
            sessionId: String(summary.sessionId ?? ''),
            agent: adapter.agent,
            status:
              activeRunId || activeSessions?.has(`${adapter.agent}:${String(summary.sessionId ?? '')}`)
                ? 'active'
                : 'inactive',
            cwd: typeof summary.cwd === 'string' ? summary.cwd : undefined,
            title: typeof summary.title === 'string' ? summary.title : undefined,
            updatedAt: toEpoch(summary.updatedAt),
            activeRunId,
            latestRunId,
            runtime: summary.runtime as KanbanWorkspaceSessionSummary['runtime'],
          } satisfies KanbanWorkspaceSessionSummary;
        });
      } catch {
        return [];
      }
    }),
  );

  const deduped = new Map<string, KanbanWorkspaceSessionSummary>();
  for (const snapshot of snapshots.flat()) {
    if (!snapshot.sessionId) continue;
    deduped.set(`${snapshot.agent}:${snapshot.sessionId}`, snapshot);
  }
  return [...deduped.values()].sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0));
}

function matchesFilter(workspace: KanbanWorkspaceSummary, filter: string): boolean {
  const query = filter.trim().toLowerCase();
  if (!query) return true;
  const haystack = [
    workspace.name,
    workspace.path,
    workspace.status,
    workspace.git.branch ?? '',
    workspace.git.trackingBranch ?? '',
    workspace.git.head ?? '',
    workspace.rebase?.status ?? '',
    ...(workspace.issues ?? []).flatMap((issue) => [issue.issueKey, issue.issueTitle]),
    ...workspace.sessions.items.flatMap((session) => [session.agent, session.sessionId, session.title ?? '', session.cwd ?? '']),
    ...workspace.runs.items.flatMap((run) => [run.runId, run.status, run.projectName ?? '']),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

function preferredSession(workspace: KanbanWorkspaceSummary): KanbanWorkspaceSessionSummary | null {
  return workspace.sessions.items.find((session) => session.status === 'active') ?? workspace.sessions.items[0] ?? null;
}

export function WorkspacesView({
  client,
  kanban,
  active,
  emit,
  filter,
  activeSessions,
  workspaceSelection,
  viewport,
}: TuiViewProps) {
  const [loaded, setLoaded] = useState<LoadedState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadData(options?: { workspacePath?: string | null }) {
    if (!kanban) {
      setLoaded(null);
      setError(null);
      return;
    }
    setLoading(true);
    try {
      const sessions = await collectLiveSessions(client, activeSessions);
      const inventory = await kanban.listWorkspaces({ sessions });
      const nextWorkspace =
        options?.workspacePath && inventory.workspaces.some((workspace) => workspace.path === options.workspacePath)
          ? options.workspacePath
          : inventory.workspaces[0]?.path ?? null;
      setLoaded({ inventory, sessions });
      setWorkspacePath(nextWorkspace);
      setError(null);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!active) return;
    void loadData({ workspacePath });
  }, [active, activeSessions, kanban, refreshTick]);

  useEffect(() => {
    if (!active || !workspaceSelection) return;
    if (workspaceSelection.workspacePath === workspacePath) {
      return;
    }
    void loadData({ workspacePath: workspaceSelection.workspacePath });
  }, [active, workspacePath, workspaceSelection]);

  const filteredWorkspaces = useMemo(() => {
    const workspaces = loaded?.inventory.workspaces ?? [];
    if (!filter?.trim()) return workspaces;
    return workspaces.filter((workspace) => matchesFilter(workspace, filter));
  }, [filter, loaded]);

  const workspace = useMemo(
    () => filteredWorkspaces.find((candidate) => candidate.path === workspacePath) ?? filteredWorkspaces[0] ?? null,
    [filteredWorkspaces, workspacePath],
  );

  useEffect(() => {
    if (!workspace && filteredWorkspaces.length === 0) return;
    if (workspace && workspace.path !== workspacePath) {
      setWorkspacePath(workspace.path);
    }
  }, [workspace, workspacePath, filteredWorkspaces.length]);

  async function applyAction(action: KanbanWorkspaceAction, note?: string) {
    if (!kanban || !workspace || busy || !loaded) return;
    setBusy(true);
    try {
      const response = await kanban.applyWorkspaceAction({
        action,
        workspacePath: workspace.path,
        note,
        sessions: loaded.sessions,
      });
      setLoaded({ inventory: response.inventory, sessions: loaded.sessions });
      setWorkspacePath(response.result.workspacePath);
      setComposer(null);
      emit({ type: 'status', message: response.result.message });
    } catch (cause) {
      emit({ type: 'status', message: `workspace action failed: ${(cause as Error).message}` });
    } finally {
      setBusy(false);
    }
  }

  function openComposerForAction(action: KanbanWorkspaceAction, prompt: string, enabled: boolean, disabledMessage: string) {
    if (!workspace) return;
    if (!enabled) {
      emit({ type: 'status', message: disabledMessage });
      return;
    }
    setComposer({ kind: 'confirm', action, prompt });
  }

  function jumpToSession(mode: 'detail' | 'chat') {
    if (!workspace) return;
    const session = preferredSession(workspace);
    if (!session) {
      emit({ type: 'status', message: 'Selected workspace has no linked session.' });
      return;
    }
    if (mode === 'detail') {
      emit({ type: 'session:detail', agent: session.agent, sessionId: session.sessionId });
      emit({ type: 'view:switch', id: 'session-detail' });
      return;
    }
    emit({ type: 'session:select', agent: session.agent, sessionId: session.sessionId });
    emit({ type: 'view:switch', id: 'chat' });
  }

  function jumpToIssue() {
    if (!workspace) return;
    const linkedIssue = workspace.issues?.[0];
    if (!linkedIssue) {
      emit({ type: 'status', message: 'Selected workspace has no linked issue.' });
      return;
    }
    emit({
      type: 'issue:select',
      issueId: linkedIssue.issueId,
      viewId: 'kanban',
    });
  }

  useInput(
    (input, key) => {
      if (!active) return;

      if (composer) {
        if (key.escape) {
          setComposer(null);
          return;
        }
        if (composer.kind === 'confirm') {
          if (key.return) {
            void applyAction(composer.action);
          }
          return;
        }
        if (key.return) {
          void applyAction('notes-save', composer.value);
          return;
        }
        if (key.backspace || key.delete) {
          setComposer((current) =>
            current && current.kind === 'notes'
              ? { ...current, value: current.value.slice(0, -1) }
              : current,
          );
          return;
        }
        if (input && !key.ctrl && !key.meta) {
          setComposer((current) =>
            current && current.kind === 'notes'
              ? { ...current, value: current.value + input }
              : current,
          );
        }
        return;
      }

      if (!workspace) return;

      if (key.downArrow || input === 'j') {
        const currentIndex = filteredWorkspaces.findIndex((candidate) => candidate.path === workspace.path);
        const next = filteredWorkspaces[Math.min(currentIndex + 1, filteredWorkspaces.length - 1)];
        if (next) setWorkspacePath(next.path);
        return;
      }
      if (key.upArrow || input === 'k') {
        const currentIndex = filteredWorkspaces.findIndex((candidate) => candidate.path === workspace.path);
        const next = filteredWorkspaces[Math.max(currentIndex - 1, 0)];
        if (next) setWorkspacePath(next.path);
        return;
      }
      if (input === 'R') {
        setRefreshTick((current) => current + 1);
        return;
      }
      if (input === 'n') {
        setComposer({ kind: 'notes', value: workspace.notes.value });
        return;
      }
      if (input === 'a') {
        openComposerForAction(
          'archive',
          `Archive ${workspace.name}?`,
          workspace.actions.canArchive && workspace.status !== 'archived',
          workspace.status === 'archived'
            ? 'Selected workspace is already archived.'
            : 'Selected workspace cannot be archived.',
        );
        return;
      }
      if (input === 'x') {
        openComposerForAction(
          'cleanup',
          `Cleanup ${workspace.name}? This removes the linked worktree when eligible.`,
          workspace.actions.canCleanup,
          'Selected workspace is not eligible for cleanup.',
        );
        return;
      }
      if (input === 'v') {
        openComposerForAction('recover', `Recover ${workspace.name}?`, workspace.actions.canRecover, 'Selected workspace cannot be recovered.');
        return;
      }
      if (input === 'b') {
        openComposerForAction(
          'rebase-start',
          `Start rebase workflow for ${workspace.name}?`,
          workspace.actions.canRebaseStart,
          'Selected workspace is not in rebase-needed state.',
        );
        return;
      }
      if (input === 'z') {
        openComposerForAction(
          'rebase-auto-resolve',
          `Auto-resolve tracked rebase conflicts for ${workspace.name}?`,
          workspace.actions.canRebaseAutoResolve,
          'Selected workspace has no auto-resolvable rebase conflicts.',
        );
        return;
      }
      if (input === 'o') {
        openComposerForAction(
          'rebase-open-in-editor',
          `Prepare manual conflict-resolution guidance for ${workspace.name}?`,
          workspace.actions.canRebaseOpenInEditor,
          'Selected workspace is not currently in rebase-conflicts.',
        );
        return;
      }
      if (input === 'M') {
        openComposerForAction(
          'rebase-mark-resolved',
          `Mark rebase conflicts resolved for ${workspace.name}?`,
          workspace.actions.canRebaseMarkResolved,
          'Selected workspace is not currently in rebase-conflicts.',
        );
        return;
      }
      if (input === 'A') {
        openComposerForAction(
          'rebase-abort',
          `Abort the current rebase attempt for ${workspace.name}?`,
          workspace.actions.canRebaseAbort,
          'Selected workspace is not currently in rebase-conflicts.',
        );
        return;
      }
      if (input === 's' || key.return) {
        jumpToSession('detail');
        return;
      }
      if (input === 'g') {
        jumpToIssue();
        return;
      }
      if (input === 'c') {
        jumpToSession('chat');
      }
    },
    { isActive: active },
  );

  if (!kanban) {
    return (
      <Box flexDirection="column">
        <Text bold>Workspaces</Text>
        <Text dimColor>This host did not inject a kanban control plane.</Text>
        <Text dimColor>{'Provide `kanban={createKanbanControlPlane(...)}` when rendering `App`.'}</Text>
      </Box>
    );
  }
  if (loading && !loaded) return <Text dimColor>Loading workspaces…</Text>;
  if (error) return <Text color="red">Workspace error: {error}</Text>;
  if (!loaded || filteredWorkspaces.length === 0 || !workspace) {
    return <Text dimColor>No managed workspaces available.</Text>;
  }

  const selectedIndex = Math.max(0, filteredWorkspaces.findIndex((candidate) => candidate.path === workspace.path));
  const listLimit = Math.max(3, Math.min(filteredWorkspaces.length, Math.max(4, (viewport?.listRowLimit ?? 10) - 4)));
  const { start, end } = visibleWindow(selectedIndex, filteredWorkspaces.length, listLimit);
  const visibleWorkspaces = filteredWorkspaces.slice(start, end);
  const rowWidth = Math.max(28, (viewport?.contentWidth ?? 80) - 4);
  const selectedSession = preferredSession(workspace);
  const canArchive = workspace.actions.canArchive && workspace.status !== 'archived';
  const availableActions = [
    canArchive ? 'archive[a]' : null,
    workspace.actions.canCleanup ? 'cleanup[x]' : null,
    workspace.actions.canRecover ? 'recover[v]' : null,
    workspace.actions.canRebaseStart ? 'rebase[b]' : null,
    workspace.actions.canRebaseAutoResolve ? 'auto[z]' : null,
    workspace.actions.canRebaseOpenInEditor ? 'editor[o]' : null,
    workspace.actions.canRebaseMarkResolved ? 'resolved[M]' : null,
    workspace.actions.canRebaseAbort ? 'abort[A]' : null,
    'notes[n]',
  ].filter(Boolean);

  const actionHint = composer
    ? composer.kind === 'confirm'
      ? 'Enter confirm · Esc cancel'
      : 'Type notes · Enter save · Esc cancel'
    : '↑/↓ navigate · s/Enter session · c chat · g issue · n notes · a archive · x cleanup · v recover · b/z/o/M/A rebase · R refresh';

  return (
    <Box flexDirection="column">
      <Text bold>Workspaces</Text>
      <Text dimColor>
        {loaded.inventory.summary.total} total · {loaded.inventory.summary.active} active · {loaded.inventory.summary.idle} idle ·{' '}
        {loaded.inventory.summary.archived} archived · {loaded.inventory.summary.missing} missing
      </Text>
      {start > 0 ? <Text dimColor>… {start} earlier workspaces</Text> : null}
      {visibleWorkspaces.map((candidate, index) => {
        const absoluteIndex = start + index;
        const selected = absoluteIndex === selectedIndex;
        const row = truncateEnd(
          `${candidate.name} [${candidate.status}] ${candidate.git.branch ?? candidate.path} · sessions ${candidate.sessions.total} · runs ${candidate.runs.total}`,
          rowWidth,
        );
        return (
          <Text key={candidate.path} color={selected ? 'cyan' : workspaceStatusColor(candidate.status)}>
            {selected ? '> ' : '  '}
            {row}
          </Text>
        );
      })}
      {end < filteredWorkspaces.length ? <Text dimColor>… {filteredWorkspaces.length - end} more workspaces</Text> : null}
      <Text>
        <Text bold>{workspace.name}</Text> <Text color={workspaceStatusColor(workspace.status)}>[{workspace.status}]</Text>
      </Text>
      <Text dimColor>{truncateMiddle(workspace.path, Math.max(36, viewport?.contentWidth ?? 80))}</Text>
      <Text>
        git {workspace.git.branch ?? '(detached)'} · upstream {workspace.git.trackingBranch ?? 'none'} · ahead{' '}
        {workspace.git.ahead ?? '-'} · behind {workspace.git.behind ?? '-'} · dirty{' '}
        {workspace.git.dirty == null ? 'unknown' : workspace.git.dirty ? 'yes' : 'no'}
      </Text>
      <Text dimColor>
        {workspace.git.isWorktree ? (workspace.git.isPrimary ? 'primary repo' : 'linked worktree') : 'non-worktree'} · head{' '}
        {workspace.git.head ? truncateMiddle(workspace.git.head, 20) : 'unknown'}
        {workspace.archivedAt ? ` · archived ${formatDateTime(workspace.archivedAt)}` : ''}
        {workspace.cleanedAt ? ` · cleaned ${formatDateTime(workspace.cleanedAt)}` : ''}
      </Text>
      {workspace.lastActivityAt ? <Text dimColor>last activity {formatDateTime(workspace.lastActivityAt)}</Text> : null}
      {workspace.missing ? <Text color="red">workspace path is currently missing on disk</Text> : null}
      {workspace.issues && workspace.issues.length > 0 ? (
        <Text>
          issues:{' '}
          {workspace.issues.map((issue, index) => (
            <Text key={issue.issueId}>
              {index > 0 ? ' · ' : ''}
              <Text color="yellow">{issue.issueKey}</Text> {truncateEnd(issue.issueTitle, Math.max(18, rowWidth - 24))}
            </Text>
          ))}
        </Text>
      ) : (
        <Text dimColor>issues: none linked</Text>
      )}
      {workspace.sessions.items.length > 0 ? (
        <Box flexDirection="column">
          <Text>
            sessions {workspace.sessions.active}/{workspace.sessions.total} active
            {selectedSession ? (
              <Text dimColor>
                {' '}
                · target {selectedSession.agent}:{truncateMiddle(selectedSession.sessionId, 22)}
              </Text>
            ) : null}
          </Text>
          {workspace.sessions.items.slice(0, 3).map((session) => (
            <Text key={`${session.agent}:${session.sessionId}`} dimColor>
              {session.status === 'active' ? '●' : '○'} {session.agent}:{truncateMiddle(session.sessionId, 28)}
              {session.activeRunId ? ` · run ${truncateMiddle(session.activeRunId, 18)}` : ''}
            </Text>
          ))}
        </Box>
      ) : (
        <Text dimColor>sessions: none</Text>
      )}
      {workspace.runs.items.length > 0 ? (
        <Text dimColor>
          runs:{' '}
          {workspace.runs.items
            .slice(0, 3)
            .map((run) => `${truncateMiddle(run.runId, 16)}:${run.status}`)
            .join(' · ')}
        </Text>
      ) : (
        <Text dimColor>runs: none</Text>
      )}
      <Text>
        notes:{' '}
        <Text color={workspace.notes.value.trim() ? 'white' : 'gray'}>
          {workspace.notes.value.trim()
            ? truncateEnd(workspace.notes.value.replace(/\s+/g, ' '), Math.max(24, rowWidth))
            : '(empty)'}
        </Text>
      </Text>
      {workspace.rebase ? (
        <Box flexDirection="column">
          <Text>
            rebase <Text color={rebaseStatusColor(workspace.rebase.status)}>{workspace.rebase.status}</Text> · target{' '}
            {workspace.rebase.targetBranch ?? 'main'} · attempts {workspace.rebase.attemptCount} · unresolved{' '}
            {workspace.rebase.unresolvedFiles.length} · resolved {workspace.rebase.resolvedFiles.length}
          </Text>
          {workspace.rebase.followUpInstructions.slice(0, 2).map((instruction, index) => (
            <Text key={`${workspace.path}:rebase:${index}`} dimColor>
              {truncateEnd(instruction, Math.max(36, rowWidth))}
            </Text>
          ))}
          {workspace.rebase.editorHref ? (
            <Text dimColor>editor {truncateMiddle(workspace.rebase.editorHref, Math.max(28, rowWidth))}</Text>
          ) : null}
        </Box>
      ) : (
        <Text dimColor>rebase: idle</Text>
      )}
      <Text dimColor>actions: {availableActions.join(' · ')}</Text>
      {composer ? (
        composer.kind === 'confirm' ? (
          <Text color="yellow">
            {composer.prompt} <Text dimColor>status {workspace.status} · sessions {workspace.sessions.active} · runs {workspace.runs.active}</Text>
          </Text>
        ) : (
          <Text>
            notes: <Text color="cyan">{composer.value}</Text>
            <Text color="cyan">▌</Text>
          </Text>
        )
      ) : null}
      {busy ? <Text dimColor>Applying action…</Text> : null}
      <Text dimColor>{actionHint}</Text>
    </Box>
  );
}

export default definePlugin({
  name: 'builtin:workspaces-view',
  register(ctx) {
    ctx.registerView({
      id: 'workspaces',
      title: 'Workspaces',
      hotkey: 'W',
      component: WorkspacesView,
    });
  },
});
