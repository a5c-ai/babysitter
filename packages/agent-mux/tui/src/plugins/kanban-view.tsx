import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type {
  KanbanBacklogOverview,
  KanbanBoardCard,
  KanbanBoardMoveTarget,
  KanbanIssue,
  KanbanProject,
  KanbanWorkspaceInventory,
  KanbanWorkspaceSummary,
} from '@a5c-ai/agent-mux-core/kanban';
import { definePlugin, type TuiViewProps } from '../plugin.js';
import { truncateEnd, truncateMiddle, visibleWindow } from '../layout.js';

type ComposerState =
  | { kind: 'create'; value: string }
  | { kind: 'update'; issueId: string; value: string }
  | { kind: 'link'; issueId: string; value: string }
  | { kind: 'move'; issueId: string; targets: KanbanBoardMoveTarget[]; index: number };

interface LoadedState {
  overview: KanbanBacklogOverview;
  inventory: KanbanWorkspaceInventory;
}

const WORKFLOW_ORDER = ['todo', 'in-progress', 'review', 'done'] as const;
const PRIORITY_WEIGHT: Record<KanbanIssue['priority'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function issueStatusColor(issue: KanbanIssue): string {
  if (issue.status === 'blocked') return 'red';
  if (issue.status === 'done') return 'green';
  if (issue.status === 'review') return 'yellow';
  if (issue.status === 'in-progress') return 'cyan';
  return 'white';
}

function readinessColor(issue: KanbanIssue): string {
  if (issue.dispatch.readiness === 'blocked') return 'red';
  if (issue.dispatch.readiness === 'ready') return 'green';
  if (issue.dispatch.readiness === 'dispatched') return 'cyan';
  if (issue.dispatch.readiness === 'completed') return 'green';
  return 'yellow';
}

function moveTargetColor(target: KanbanBoardMoveTarget): string {
  return target.allowed ? 'green' : 'red';
}

function sortIssues(projectId: string, overview: KanbanBacklogOverview): KanbanIssue[] {
  const cardsByIssueId = new Map<string, KanbanBoardCard>();
  for (const board of overview.board.projects) {
    if (board.projectId !== projectId) continue;
    for (const card of board.cards) {
      cardsByIssueId.set(card.issueId, card);
    }
  }

  return overview.snapshot.issues
    .filter((issue) => issue.projectId === projectId)
    .sort((left, right) => {
      const leftCard = cardsByIssueId.get(left.id);
      const rightCard = cardsByIssueId.get(right.id);
      const leftStateIndex = WORKFLOW_ORDER.indexOf(leftCard?.workflowState ?? 'todo');
      const rightStateIndex = WORKFLOW_ORDER.indexOf(rightCard?.workflowState ?? 'todo');
      if (leftStateIndex !== rightStateIndex) {
        return leftStateIndex - rightStateIndex;
      }
      const leftPriority = PRIORITY_WEIGHT[left.priority];
      const rightPriority = PRIORITY_WEIGHT[right.priority];
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }
      return left.key.localeCompare(right.key);
    });
}

function firstProject(overview: KanbanBacklogOverview): KanbanProject | undefined {
  return overview.snapshot.projects[0];
}

function workspaceMap(inventory: KanbanWorkspaceInventory): Map<string, KanbanWorkspaceSummary> {
  return new Map(inventory.workspaces.map((workspace) => [workspace.path, workspace]));
}

export function KanbanView({
  client,
  kanban,
  active,
  emit,
  filter,
  issueSelection,
  viewport,
}: TuiViewProps) {
  const [loaded, setLoaded] = useState<LoadedState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [issueId, setIssueId] = useState<string | null>(null);
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadData(options?: { projectId?: string | null; issueId?: string | null }) {
    if (!kanban) {
      setLoaded(null);
      setError(null);
      return;
    }
    setLoading(true);
    try {
      const [overview, inventory] = await Promise.all([
        kanban.loadOverview(),
        kanban.listWorkspaces(),
      ]);
      const nextProjectId =
        options?.projectId && overview.snapshot.projects.some((project) => project.id === options.projectId)
          ? options.projectId
          : firstProject(overview)?.id ?? null;
      const issues = nextProjectId ? sortIssues(nextProjectId, overview) : [];
      const nextIssueId =
        options?.issueId && issues.some((issue) => issue.id === options.issueId)
          ? options.issueId
          : issues[0]?.id ?? null;
      setLoaded({ overview, inventory });
      setProjectId(nextProjectId);
      setIssueId(nextIssueId);
      setError(null);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!active) return;
    void loadData({ projectId, issueId });
  }, [active, kanban, refreshTick]);

  useEffect(() => {
    if (!active || !issueSelection) return;
    if (issueSelection.issueId === issueId && (!issueSelection.projectId || issueSelection.projectId === projectId)) {
      return;
    }
    void loadData({
      projectId: issueSelection.projectId ?? projectId,
      issueId: issueSelection.issueId,
    });
  }, [active, issueId, issueSelection, projectId]);

  const project = useMemo(() => {
    if (!loaded || !projectId) return null;
    return loaded.overview.snapshot.projects.find((candidate) => candidate.id === projectId) ?? null;
  }, [loaded, projectId]);

  const board = useMemo(() => {
    if (!loaded || !projectId) return null;
    return loaded.overview.board.projects.find((candidate) => candidate.projectId === projectId) ?? null;
  }, [loaded, projectId]);

  const issues = useMemo(() => {
    if (!loaded || !projectId) return [];
    const scoped = sortIssues(projectId, loaded.overview);
    if (!filter?.trim()) return scoped;
    const query = filter.trim().toLowerCase();
    return scoped.filter((issue) => {
      const haystack = [
        issue.key,
        issue.title,
        issue.summary ?? '',
        issue.status,
        issue.priority,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [filter, loaded, projectId]);

  const issue = useMemo(
    () => issues.find((candidate) => candidate.id === issueId) ?? issues[0] ?? null,
    [issueId, issues],
  );

  const cardsByIssueId = useMemo(() => {
    const map = new Map<string, KanbanBoardCard>();
    for (const card of board?.cards ?? []) {
      map.set(card.issueId, card);
    }
    return map;
  }, [board]);

  const workspacesByPath = useMemo(
    () => (loaded ? workspaceMap(loaded.inventory) : new Map<string, KanbanWorkspaceSummary>()),
    [loaded],
  );

  async function refresh(after?: { projectId?: string | null; issueId?: string | null }) {
    await loadData({
      projectId: after?.projectId ?? projectId,
      issueId: after?.issueId ?? issueId,
    });
  }

  async function submitComposer() {
    if (!kanban || !composer || busy) return;
    if (!issue && composer.kind !== 'create') return;
    setBusy(true);
    try {
      if (composer.kind === 'create') {
        const created = await kanban.createIssue({
          projectId: project?.id,
          title: composer.value.trim(),
        });
        setLoaded((current) =>
          current
            ? { ...current, overview: created.overview }
            : current,
        );
        setComposer(null);
        emit({ type: 'status', message: `Created issue ${created.issue.key}.` });
        await refresh({ projectId: created.issue.projectId, issueId: created.issue.id });
        return;
      }
      if (composer.kind === 'update') {
        const overview = await kanban.updateIssue({
          issueId: composer.issueId,
          description: composer.value.trim(),
        });
        setLoaded((current) => (current ? { ...current, overview } : current));
        setComposer(null);
        emit({ type: 'status', message: 'Updated issue description.' });
        await refresh({ projectId, issueId: composer.issueId });
        return;
      }
      if (composer.kind === 'link') {
        const overview = await kanban.linkIssueWorkspace({
          issueId: composer.issueId,
          workspacePath: composer.value.trim(),
        });
        setLoaded((current) => (current ? { ...current, overview } : current));
        setComposer(null);
        emit({ type: 'status', message: 'Linked workspace to issue.' });
        await refresh({ projectId, issueId: composer.issueId });
        return;
      }
      if (composer.kind === 'move') {
        const target = composer.targets[composer.index];
        if (!target?.allowed) {
          emit({ type: 'status', message: 'Selected move target is blocked by board policy.' });
          return;
        }
        const overview = await kanban.moveIssue({
          issueId: composer.issueId,
          toState: target.state,
        });
        setLoaded((current) => (current ? { ...current, overview } : current));
        setComposer(null);
        emit({ type: 'status', message: `Moved issue to ${target.state}.` });
        await refresh({ projectId, issueId: composer.issueId });
      }
    } catch (cause) {
      emit({ type: 'status', message: `kanban action failed: ${(cause as Error).message}` });
    } finally {
      setBusy(false);
    }
  }

  async function provisionWorkspace() {
    if (!kanban || !issue || busy) return;
    setBusy(true);
    try {
      const result = await kanban.createIssueWorkspace(issue.id);
      setLoaded((current) => (current ? { ...current, overview: result.overview } : current));
      emit({ type: 'status', message: `Provisioned ${result.workspace.name}.` });
      await refresh({ projectId, issueId: issue.id });
    } catch (cause) {
      emit({ type: 'status', message: `workspace provisioning failed: ${(cause as Error).message}` });
    } finally {
      setBusy(false);
    }
  }

  async function resolveSessionAgent(sessionId: string): Promise<string | null> {
    const adapters = client.adapters.list();
    for (const adapter of adapters) {
      try {
        const sessions = await client.sessions.list(adapter.agent as never, { limit: 50 });
        if (sessions.some((session) => session.sessionId === sessionId)) {
          return adapter.agent;
        }
      } catch {
        // ignore unsupported session listings
      }
    }
    return null;
  }

  async function jumpToSession(mode: 'detail' | 'chat') {
    if (!issue) return;
    const sessionId = issue.dispatch.sessionIds[0];
    if (!sessionId) {
      emit({ type: 'status', message: 'Selected issue has no linked session.' });
      return;
    }
    const agent = await resolveSessionAgent(sessionId);
    if (!agent) {
      emit({ type: 'status', message: `No adapter currently exposes session ${sessionId}.` });
      return;
    }
    if (mode === 'detail') {
      emit({ type: 'session:detail', agent, sessionId });
      emit({ type: 'view:switch', id: 'session-detail' });
      return;
    }
    emit({ type: 'session:select', agent, sessionId });
    emit({ type: 'view:switch', id: 'chat' });
  }

  function jumpToWorkspace() {
    if (!issue) return;
    const workspacePath = issue.workspaceLinks?.[0]?.workspacePath;
    if (!workspacePath) {
      emit({ type: 'status', message: 'Selected issue has no linked workspace.' });
      return;
    }
    emit({ type: 'workspace:select', workspacePath, viewId: 'workspaces' });
  }

  useInput(
    (input, key) => {
      if (!active) return;
      if (composer) {
        if (key.escape) {
          setComposer(null);
          return;
        }
        if (composer.kind === 'move') {
          if (key.leftArrow || key.upArrow) {
            setComposer((current) =>
              current && current.kind === 'move'
                ? {
                    ...current,
                    index: Math.max(0, current.index - 1),
                  }
                : current,
            );
            return;
          }
          if (key.rightArrow || key.downArrow) {
            setComposer((current) =>
              current && current.kind === 'move'
                ? {
                    ...current,
                    index: Math.min(current.targets.length - 1, current.index + 1),
                  }
                : current,
            );
            return;
          }
          if (key.return) {
            void submitComposer();
          }
          return;
        }
        if (key.return) {
          if (composer.value.trim()) {
            void submitComposer();
          }
          return;
        }
        if (key.backspace || key.delete) {
          setComposer((current) =>
            current && current.kind !== 'move'
              ? { ...current, value: current.value.slice(0, -1) }
              : current,
          );
          return;
        }
        if (input && !key.ctrl && !key.meta) {
          setComposer((current) =>
            current && current.kind !== 'move'
              ? { ...current, value: current.value + input }
              : current,
          );
        }
        return;
      }

      if (key.downArrow || input === 'j') {
        const currentIndex = issues.findIndex((candidate) => candidate.id === issue?.id);
        const next = issues[Math.min(currentIndex + 1, issues.length - 1)];
        if (next) setIssueId(next.id);
        return;
      }
      if (key.upArrow || input === 'k') {
        const currentIndex = issues.findIndex((candidate) => candidate.id === issue?.id);
        const next = issues[Math.max(currentIndex - 1, 0)];
        if (next) setIssueId(next.id);
        return;
      }
      if (input === '[' || input === '{') {
        if (!loaded?.overview.snapshot.projects.length) return;
        const projects = loaded.overview.snapshot.projects;
        const currentIndex = Math.max(
          0,
          projects.findIndex((candidate) => candidate.id === project?.id),
        );
        const next = projects[(currentIndex - 1 + projects.length) % projects.length];
        setProjectId(next?.id ?? null);
        setIssueId(next ? sortIssues(next.id, loaded.overview)[0]?.id ?? null : null);
        return;
      }
      if (input === ']' || input === '}') {
        if (!loaded?.overview.snapshot.projects.length) return;
        const projects = loaded.overview.snapshot.projects;
        const currentIndex = Math.max(
          0,
          projects.findIndex((candidate) => candidate.id === project?.id),
        );
        const next = projects[(currentIndex + 1) % projects.length];
        setProjectId(next?.id ?? null);
        setIssueId(next ? sortIssues(next.id, loaded.overview)[0]?.id ?? null : null);
        return;
      }
      if (input === 'R') {
        setRefreshTick((current) => current + 1);
        return;
      }
      if (input === 'a') {
        setComposer({ kind: 'create', value: '' });
        return;
      }
      if (input === 'u' && issue) {
        setComposer({ kind: 'update', issueId: issue.id, value: issue.description ?? '' });
        return;
      }
      if (input === 'l' && issue) {
        setComposer({ kind: 'link', issueId: issue.id, value: issue.workspaceLinks?.[0]?.workspacePath ?? '' });
        return;
      }
      if (input === 'm' && issue) {
        const targets = (cardsByIssueId.get(issue.id)?.moveTargets ?? []).filter(
          (target) => target.state !== cardsByIssueId.get(issue.id)?.workflowState,
        );
        if (targets.length === 0) {
          emit({ type: 'status', message: 'Selected issue has no available move targets.' });
          return;
        }
        setComposer({
          kind: 'move',
          issueId: issue.id,
          targets,
          index: Math.max(0, targets.findIndex((target) => target.allowed)),
        });
        return;
      }
      if (input === 'p') {
        void provisionWorkspace();
        return;
      }
      if (input === 'w') {
        jumpToWorkspace();
        return;
      }
      if (input === 's' || key.return) {
        void jumpToSession('detail');
        return;
      }
      if (input === 'c') {
        void jumpToSession('chat');
      }
    },
    { isActive: active },
  );

  if (!kanban) {
    return (
      <Box flexDirection="column">
        <Text bold>Kanban</Text>
        <Text dimColor>This host did not inject a kanban control plane.</Text>
        <Text dimColor>{'Provide `kanban={createKanbanControlPlane(...)}` when rendering `App`.'}</Text>
      </Box>
    );
  }
  if (loading && !loaded) return <Text dimColor>Loading kanban…</Text>;
  if (error) return <Text color="red">Kanban error: {error}</Text>;
  if (!loaded || !project || !issue) return <Text dimColor>No kanban issues available.</Text>;

  const selectedIssueIndex = Math.max(0, issues.findIndex((candidate) => candidate.id === issue.id));
  const listLimit = Math.max(3, Math.min(issues.length, Math.max(4, (viewport?.listRowLimit ?? 10) - 4)));
  const { start, end } = visibleWindow(selectedIssueIndex, issues.length, listLimit);
  const visibleIssues = issues.slice(start, end);
  const card = cardsByIssueId.get(issue.id);
  const linkedWorkspaces = (issue.workspaceLinks ?? []).map((link) => ({
    link,
    workspace: workspacesByPath.get(link.workspacePath),
  }));
  const actionHint = composer
    ? composer.kind === 'move'
      ? '←/→ choose target · Enter confirm · Esc cancel'
      : 'Type value · Enter confirm · Esc cancel'
    : '↑/↓ navigate · [ ] project · a add · u update · m move · p provision · l link workspace · w workspace · s/Enter session · c chat · R refresh';

  return (
    <Box flexDirection="column">
      <Text bold>
        {project.key} {project.name}
      </Text>
      <Text dimColor>
        {loaded.overview.summary.issueCount} issues · {loaded.overview.summary.readyCount} ready ·{' '}
        {loaded.overview.summary.blockedCount} blocked · {loaded.overview.summary.inProgressCount} in progress
      </Text>
      <Text>
        {(board?.columns ?? []).map((column) => `${column.name}:${column.issueCount}`).join(' · ')}
      </Text>
      {start > 0 ? <Text dimColor>… {start} earlier issues</Text> : null}
      {visibleIssues.map((candidate, index) => {
        const absoluteIndex = start + index;
        const selected = absoluteIndex === selectedIssueIndex;
        const candidateCard = cardsByIssueId.get(candidate.id);
        const statusText = candidateCard?.workflowState ?? candidate.status;
        const rowText = truncateEnd(
          `${candidate.key} ${candidate.title} [${statusText}] {${candidate.priority}}`,
          Math.max(24, (viewport?.contentWidth ?? 80) - 4),
        );
        return (
          <Text key={candidate.id} color={selected ? 'green' : issueStatusColor(candidate)}>
            {selected ? '> ' : '  '}
            {rowText}
          </Text>
        );
      })}
      {end < issues.length ? <Text dimColor>… {issues.length - end} more issues</Text> : null}
      <Text>
        <Text color="cyan">{issue.key}</Text> <Text bold>{issue.title}</Text>
      </Text>
      {issue.summary ? <Text>{issue.summary}</Text> : null}
      {issue.description ? (
        <Text dimColor>{truncateEnd(issue.description.replace(/\s+/g, ' '), Math.max(40, viewport?.contentWidth ?? 80))}</Text>
      ) : null}
      <Text>
        status <Text color={issueStatusColor(issue)}>{issue.status}</Text> · readiness{' '}
        <Text color={readinessColor(issue)}>{issue.dispatch.readiness}</Text> · priority{' '}
        <Text color="yellow">{issue.priority}</Text>
      </Text>
      {issue.dispatch.blockedReasons.length > 0 ? (
        <Text color="red">blocked: {issue.dispatch.blockedReasons.join('; ')}</Text>
      ) : null}
      <Text dimColor>
        sessions {issue.dispatch.sessionIds.length} · runs {issue.dispatch.runIds.length} · workspaces{' '}
        {issue.workspaceLinks?.length ?? 0}
      </Text>
      {issue.dispatch.sessionIds[0] ? (
        <Text dimColor>first session: {truncateMiddle(issue.dispatch.sessionIds[0], Math.max(20, viewport?.contentWidth ?? 60))}</Text>
      ) : null}
      {card?.repositoryLifecycle ? (
        <Text dimColor>
          repo {card.repositoryLifecycle.branchName} · review {card.repositoryLifecycle.reviewStatus} · merge{' '}
          {card.repositoryLifecycle.mergeStatus} · publish {card.repositoryLifecycle.publishStatus}
        </Text>
      ) : issue.repositoryLifecycle ? (
        <Text dimColor>
          repo {issue.repositoryLifecycle.branchName} · review {issue.repositoryLifecycle.reviewStatus} · merge{' '}
          {issue.repositoryLifecycle.mergeStatus} · publish {issue.repositoryLifecycle.publishStatus}
        </Text>
      ) : null}
      {(card?.repositoryLifecycle?.ciGates ?? issue.repositoryLifecycle?.ciGates ?? []).length > 0 ? (
        <Text dimColor>
          ci:{' '}
          {(card?.repositoryLifecycle?.ciGates ?? issue.repositoryLifecycle?.ciGates ?? [])
            .map((gate) => `${gate.name}:${gate.status}`)
            .join(' · ')}
        </Text>
      ) : null}
      {linkedWorkspaces.map(({ link, workspace }) => (
        <Text key={link.workspacePath} dimColor>
          ws {truncateMiddle(link.workspaceName || link.workspacePath, Math.max(20, viewport?.contentWidth ?? 60))} ·{' '}
          {workspace?.status ?? 'linked'} · sessions {workspace?.sessions.total ?? 0} · runs {workspace?.runs.total ?? 0}
        </Text>
      ))}
      {composer ? (
        composer.kind === 'move' ? (
          <Text>
            move target:{' '}
            {composer.targets.map((target, index) => (
              <Text
                key={target.state}
                color={index === composer.index ? moveTargetColor(target) : undefined}
              >
                {index > 0 ? ' · ' : ''}
                {index === composer.index ? '[' : ''}
                {target.state}
                {target.allowed ? '' : ' blocked'}
                {index === composer.index ? ']' : ''}
              </Text>
            ))}
          </Text>
        ) : (
          <Text>
            {composer.kind === 'create'
              ? 'new issue title'
              : composer.kind === 'update'
                ? 'issue description'
                : 'workspace path'}
            {' : '}
            <Text color="cyan">{composer.value}</Text>
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
  name: 'builtin:kanban-view',
  register(ctx) {
    ctx.registerView({
      id: 'kanban',
      title: 'Kanban',
      hotkey: '8',
      component: KanbanView,
    });
  },
});
