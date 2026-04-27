import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom-v6';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useGateway } from '@a5c-ai/agent-mux-ui';
import type { WorkspaceRuntimeSurface } from '@a5c-ai/agent-mux-core';
import { Button, Field, Tabs, Textarea, type TabItem } from '@a5c-ai/compendium';

import { useGatewayFetch } from '../providers/GatewayProvider.js';
import {
  accumulateEventCost,
  buildNativeAgentFlowLane,
  buildNativeTranscript,
  buildSessionFlowModel,
  type NativeSessionMessage,
  type SessionCost,
  type SessionTranscriptNode,
} from './SessionDetailFlow.js';

type SessionControlPlane = 'self-managed' | 'external-host' | 'mcp-mediated';
type AgentFlowViewMode = 'transcript' | 'agent-flow' | 'timeline' | 'files';
type ActionLink = {
  key: string;
  label: string;
  href: string;
  external?: boolean;
};

type RunActionContext = {
  runId: string;
  runHref: string;
  workspaceHref?: string;
  runtimeHref?: string;
  fileHref: (path: string) => string | null;
};

function formatUsd(totalUsd: number | null): string {
  if (totalUsd == null || !Number.isFinite(totalUsd)) {
    return 'unavailable';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: totalUsd >= 1 ? 2 : 4,
    maximumFractionDigits: 4,
  }).format(totalUsd);
}

function formatFlowTime(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return 'unknown';
  }
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDuration(start: number | null, end: number | null): string | null {
  if (start == null || end == null || end <= start) {
    return null;
  }
  const delta = end - start;
  if (delta < 1000) {
    return `${delta}ms`;
  }
  if (delta < 60_000) {
    return `${(delta / 1000).toFixed(1)}s`;
  }
  return `${Math.round(delta / 1000)}s`;
}

function resolveTransport(
  agent: string,
  agentRecords: Record<string, Record<string, unknown>>,
): 'persistent' | 'restart-per-turn' | 'none' {
  const advertised = agentRecords[agent]?.structuredSessionTransport;
  if (advertised === 'persistent' || advertised === 'restart-per-turn') {
    return advertised;
  }
  return 'none';
}

function resolveControlPlane(
  agent: string,
  agentRecords: Record<string, Record<string, unknown>>,
): SessionControlPlane {
  const advertised = agentRecords[agent]?.sessionControlPlane;
  if (advertised === 'external-host' || advertised === 'mcp-mediated') {
    return advertised;
  }
  return 'self-managed';
}

function formatControlPlane(controlPlane: SessionControlPlane): string {
  switch (controlPlane) {
    case 'external-host':
      return 'external host';
    case 'mcp-mediated':
      return 'host mediated';
    default:
      return 'agent-mux managed';
  }
}

function buildTimelineFromTranscript(transcript: SessionTranscriptNode[]) {
  return transcript.map((node) => ({
    id: `${node.id}:timeline`,
    runId: node.runId,
    laneKey: node.runId,
    kind:
      node.kind === 'tool' || node.kind === 'system' || node.kind === 'branch' || node.kind === 'error'
        ? node.kind
        : node.kind,
    title: node.label,
    detail: node.text,
    timestamp: node.timestamp,
    status: node.status ?? 'complete',
    filePaths: node.filePaths,
  }));
}

function buildFilesFromTranscript(transcript: SessionTranscriptNode[]) {
  const files = new Map<string, { path: string; touches: number; runIds: Set<string> }>();
  for (const node of transcript) {
    for (const path of node.filePaths) {
      const record = files.get(path) ?? { path, touches: 0, runIds: new Set<string>() };
      record.touches += 1;
      record.runIds.add(node.runId);
      files.set(path, record);
    }
  }
  return Array.from(files.values())
    .sort((left, right) => right.touches - left.touches)
    .map((record) => ({
      path: record.path,
      reads: record.touches,
      writes: 0,
      touches: record.touches,
      lastEventAt: null,
      runIds: Array.from(record.runIds),
      tools: [],
    }));
}

function resolveInitialView(searchParams: URLSearchParams): AgentFlowViewMode {
  const view = searchParams.get('view');
  if (view === 'flow') return 'agent-flow';
  if (view === 'timeline' || view === 'files' || view === 'transcript') {
    return view;
  }
  return 'agent-flow';
}

function readRuntime(value: unknown): WorkspaceRuntimeSurface | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  return value as WorkspaceRuntimeSurface;
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

function isAbsolutePath(value: string): boolean {
  return value.startsWith('/') || value.startsWith('\\\\') || /^[a-zA-Z]:[\\/]/.test(value);
}

function joinWorkspacePath(workspacePath: string, filePath: string): string {
  const separator = workspacePath.includes('\\') ? '\\' : '/';
  const base = workspacePath.replace(/[\\/]+$/, '');
  const relative = filePath.replace(/^[./\\\/]+/, '');
  return `${base}${separator}${relative}`;
}

function resolveAbsoluteFilePath(workspacePath: string | null, filePath: string): string | null {
  if (!filePath.trim()) {
    return null;
  }
  if (isAbsolutePath(filePath)) {
    return filePath;
  }
  if (!workspacePath) {
    return null;
  }
  return joinWorkspacePath(workspacePath, filePath);
}

function buildEditorHref(path: string): string {
  return `vscode://file${path}`;
}

function pickRuntimeHref(runtime: WorkspaceRuntimeSurface | null): string | null {
  if (typeof runtime?.preview?.primaryUrl === 'string' && runtime.preview.primaryUrl.length > 0) {
    return runtime.preview.primaryUrl;
  }
  if (typeof runtime?.devServer?.primaryUrl === 'string' && runtime.devServer.primaryUrl.length > 0) {
    return runtime.devServer.primaryUrl;
  }
  return null;
}

function ActionLinks(props: { actions: ActionLink[] }): JSX.Element | null {
  if (props.actions.length === 0) {
    return null;
  }
  return (
    <div className="item-actions">
      {props.actions.map((action) =>
        action.external ? (
          <a key={action.key} className="ghost-link action-link" href={action.href} target="_blank" rel="noreferrer">
            {action.label}
          </a>
        ) : (
          <a key={action.key} className="ghost-link action-link" href={action.href}>
            {action.label}
          </a>
        ),
      )}
    </div>
  );
}

export function SessionDetailPage(): JSX.Element {
  const params = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const sessionId = params.sessionId ?? '';
  const fetchGateway = useGatewayFetch();
  const { client, store } = useGateway();
  const agentRecords = useStore(store, (state) => state.agents.byId);
  const session = useStore(store, (state) => state.sessions.byId[sessionId] ?? null);
  const runs = useStore(
    store,
    useShallow((state) =>
      Object.values(state.runs.byId)
        .filter((run) => run.sessionId === sessionId)
        .sort((left, right) => Number(right.startedAt ?? 0) - Number(left.startedAt ?? 0)),
    ),
  );
  const eventBuffers = useStore(store, (state) => state.events.byRunId);

  const [prompt, setPrompt] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nativeMessages, setNativeMessages] = useState<NativeSessionMessage[]>([]);
  const [loadingNativeTranscript, setLoadingNativeTranscript] = useState(false);
  const [viewMode, setViewMode] = useState<AgentFlowViewMode>(() => resolveInitialView(searchParams));

  const transportCandidates = useMemo(
    () => [
      ...(typeof session?.agent === 'string' ? [session.agent] : []),
      ...runs
        .map((run) => (typeof run.agent === 'string' ? run.agent : null))
        .filter((value): value is string => value != null),
    ],
    [runs, session?.agent],
  );
  const resolvedAgent = transportCandidates[0] ?? 'unknown';
  const status = String(session?.status ?? 'inactive');
  const transport = transportCandidates.reduce<'persistent' | 'restart-per-turn' | 'none'>(
    (current, candidate) => {
      const next = resolveTransport(candidate, agentRecords as Record<string, Record<string, unknown>>);
      if (next === 'persistent') {
        return next;
      }
      if (current === 'none' && next === 'restart-per-turn') {
        return next;
      }
      return current;
    },
    'none',
  );
  const controlPlane = transportCandidates.reduce<SessionControlPlane>(
    (current, candidate) => {
      const next = resolveControlPlane(candidate, agentRecords as Record<string, Record<string, unknown>>);
      if (next === 'mcp-mediated') {
        return next;
      }
      if (current === 'self-managed' && next === 'external-host') {
        return next;
      }
      return current;
    },
    'self-managed',
  );
  const activeRunId =
    typeof session?.activeRunId === 'string'
      ? session.activeRunId
      : typeof runs.find((run) => run.status === 'running')?.runId === 'string'
        ? String(runs.find((run) => run.status === 'running')?.runId)
        : null;
  const canCompose = status !== 'active' || transport === 'persistent';
  const workspacePath =
    typeof session?.cwd === 'string' && session.cwd.length > 0
      ? session.cwd
      : readWorkspacePath(session?.workspace);
  const runtime = readRuntime(session?.runtime);
  const runtimeHref = pickRuntimeHref(runtime);
  const runActionContexts = useMemo(() => {
    const entries = runs.map((run) => {
      const runId = String(run.runId ?? '');
      const runWorkspacePath =
        typeof run.cwd === 'string' && run.cwd.length > 0
          ? run.cwd
          : readWorkspacePath(run.workspace) ?? workspacePath;
      const runRuntime = readRuntime(run.runtime) ?? runtime;
      const runRuntimeHref = pickRuntimeHref(runRuntime) ?? runtimeHref;
      const fileHref = (filePath: string): string | null => {
        const absoluteFilePath = resolveAbsoluteFilePath(runWorkspacePath, filePath);
        return absoluteFilePath ? buildEditorHref(absoluteFilePath) : null;
      };
      return [
        runId,
        {
          runId,
          runHref: `/runs/${encodeURIComponent(runId)}`,
          workspaceHref: runWorkspacePath ? buildEditorHref(runWorkspacePath) : undefined,
          runtimeHref: runRuntimeHref ?? undefined,
          fileHref,
        } satisfies RunActionContext,
      ] as const;
    });
    return new Map(entries);
  }, [runs, runtime, runtimeHref, workspacePath]);

  const buildEntryActions = (runId: string, filePaths: string[]): ActionLink[] => {
    const context = runActionContexts.get(runId);
    if (!context) {
      return [];
    }
    const actions: ActionLink[] = [
      { key: `${runId}:run`, label: 'Open run detail', href: context.runHref },
    ];
    const fileHref = filePaths.map((path) => ({ path, href: context.fileHref(path) })).find((entry) => entry.href != null);
    if (fileHref?.href) {
      actions.push({
        key: `${runId}:file:${fileHref.path}`,
        label: 'Open file',
        href: fileHref.href,
        external: true,
      });
    }
    if (context.workspaceHref) {
      actions.push({
        key: `${runId}:workspace`,
        label: 'Open workspace',
        href: context.workspaceHref,
        external: true,
      });
    }
    if (context.runtimeHref) {
      actions.push({
        key: `${runId}:runtime`,
        label: 'Open runtime',
        href: context.runtimeHref,
        external: true,
      });
    }
    return actions;
  };

  const eventFlowModel = useMemo(() => buildSessionFlowModel(runs, eventBuffers), [eventBuffers, runs]);
  const nativeTranscript = useMemo(() => buildNativeTranscript(sessionId, nativeMessages), [nativeMessages, sessionId]);
  const nativeFlowLane = useMemo(
    () => buildNativeAgentFlowLane(sessionId, nativeMessages, resolvedAgent, status),
    [nativeMessages, resolvedAgent, sessionId, status],
  );
  const flowLanes = eventFlowModel.lanes.length > 0 ? eventFlowModel.lanes : nativeFlowLane ? [nativeFlowLane] : [];
  const transcript =
    status === 'active'
      ? (eventFlowModel.transcript.length > 0 ? eventFlowModel.transcript : nativeTranscript)
      : (nativeTranscript.length > 0 ? nativeTranscript : eventFlowModel.transcript);
  const timeline = eventFlowModel.timeline.length > 0 ? eventFlowModel.timeline : buildTimelineFromTranscript(transcript);
  const files = eventFlowModel.files.length > 0 ? eventFlowModel.files : buildFilesFromTranscript(transcript);
  const eventCost = useMemo(
    () => accumulateEventCost(runs.map((run) => String(run.runId ?? '')), eventBuffers),
    [eventBuffers, runs],
  );
  const sessionCost =
    session?.cost && typeof session.cost === 'object'
      ? session.cost as SessionCost
      : eventCost;

  useEffect(() => {
    if (!sessionId) {
      return;
    }
    return client.subscribeSession(sessionId);
  }, [client, sessionId]);

  useEffect(() => {
    if (!sessionId) {
      setError(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const response = await fetchGateway(`/api/v1/sessions/${encodeURIComponent(sessionId)}`);
        if (!response.ok) {
          if (response.status === 404 || cancelled) {
            return;
          }
          throw new Error(`Gateway request failed: ${response.status}`);
        }
        const body = await response.json() as Record<string, unknown>;
        if (!cancelled) {
          store.getState().actions.mergeSession(sessionId, body);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : String(cause));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchGateway, sessionId, store]);

  useEffect(() => {
    if (!sessionId) {
      setNativeMessages([]);
      setLoadingNativeTranscript(false);
      return;
    }
    if (status === 'active' && eventFlowModel.transcript.length > 0) {
      setLoadingNativeTranscript(false);
      return;
    }

    let cancelled = false;
    setError(null);
    setLoadingNativeTranscript(true);
    setNativeMessages([]);
    void (async () => {
      try {
        const response = await fetchGateway(`/api/v1/sessions/${encodeURIComponent(sessionId)}/full`);
        if (!response.ok) {
          if (response.status === 404) {
            if (!cancelled) {
              setNativeMessages([]);
            }
            return;
          }
          throw new Error(`Gateway request failed: ${response.status}`);
        }
        const body = await response.json() as {
          title?: string;
          turnCount?: number;
          model?: string;
          cost?: SessionCost;
          cwd?: string;
          messages?: NativeSessionMessage[];
        };
        if (cancelled) {
          return;
        }
        if (Array.isArray(body.messages)) {
          setNativeMessages(body.messages);
        }
        store.getState().actions.mergeSession(sessionId, {
          title: body.title,
          turnCount: body.turnCount,
          model: body.model,
          cost: body.cost,
          cwd: body.cwd,
        });
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : String(cause));
        }
      } finally {
        if (!cancelled) {
          setLoadingNativeTranscript(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventFlowModel.transcript.length, fetchGateway, sessionId, status, store]);

  async function handleSend(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!prompt.trim()) {
      return;
    }
    setSending(true);
    setError(null);
    try {
      const response = await fetchGateway(`/api/v1/sessions/${encodeURIComponent(sessionId)}/messages`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          prompt,
          agent: resolvedAgent,
        }),
      });
      if (!response.ok) {
        throw new Error(`Gateway request failed: ${response.status}`);
      }
      const body = (await response.json()) as {
        run?: Record<string, unknown>;
        session?: Record<string, unknown>;
      };
      if (body.run && typeof body.run.runId === 'string') {
        store.getState().actions.mergeRun(body.run.runId, body.run);
      }
      if (body.session && typeof body.session.sessionId === 'string') {
        store.getState().actions.mergeSession(body.session.sessionId, body.session);
      }
      setPrompt('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSending(false);
    }
  }

  const tabItems: TabItem[] = [
    {
      value: 'agent-flow',
      label: 'Flow',
      badge: flowLanes.length,
      body: (
        <div className="agent-flow-view">
          {flowLanes.map((lane) => (
            <article key={lane.runId} className="flow-lane">
              <div className="flow-lane-header">
                <div>
                  <div className="flow-lane-title">{lane.agent}</div>
                  <div className="flow-lane-subtitle">
                    {lane.startedAt > 0 ? `${formatFlowTime(lane.startedAt)} · ` : ''}
                    {lane.runId}
                  </div>
                </div>
                <div className="chip-row">
                  <span className={`status-badge status-${lane.status}`}>{lane.status}</span>
                  <span className="meta-chip">{lane.segmentCount} phases</span>
                  {lane.toolCount > 0 ? <span className="meta-chip">{lane.toolCount} tools</span> : null}
                  {lane.totalUsd != null ? <span className="meta-chip">{formatUsd(lane.totalUsd)}</span> : null}
                </div>
              </div>
              <div className="flow-track" aria-label={`Agent flow for ${lane.runId}`}>
                {lane.segments.map((segment) => (
                  <article
                    key={segment.id}
                    className={`flow-segment segment-${segment.kind} segment-status-${segment.status}`}
                    style={{ flexGrow: segment.weight }}
                  >
                    <div className="flow-segment-topline">
                      <div className="flow-segment-title">{segment.title}</div>
                      {segment.secondaryLabel ? <span className="meta-chip">{segment.secondaryLabel}</span> : null}
                    </div>
                    <p>{segment.detail}</p>
                    <div className="flow-segment-meta">
                      {segment.status !== 'complete' ? <span>{segment.status}</span> : null}
                      {formatDuration(segment.startedAt, segment.endedAt) ? <span>{formatDuration(segment.startedAt, segment.endedAt)}</span> : null}
                      {segment.filePaths.length > 0 ? <span>{segment.filePaths.length} file refs</span> : null}
                    </div>
                    <ActionLinks actions={buildEntryActions(lane.runId, segment.filePaths)} />
                  </article>
                ))}
              </div>
            </article>
          ))}
          {flowLanes.length === 0 && loadingNativeTranscript ? <p className="muted-copy">Loading agent flow…</p> : null}
          {flowLanes.length === 0 && !loadingNativeTranscript ? <p className="muted-copy">No structured execution flow has been indexed yet.</p> : null}
        </div>
      ),
    },
    {
      value: 'timeline',
      label: 'Timeline',
      badge: timeline.length,
      body: (
        <div className="timeline-view">
          {timeline.map((item) => (
            <article key={item.id} className={`timeline-item timeline-${item.kind}`}>
              <div className="timeline-item-topline">
                <div>
                  <div className="flow-segment-title">{item.title}</div>
                  <div className="flow-lane-subtitle">
                    {item.timestamp != null ? `${formatFlowTime(item.timestamp)} · ` : ''}
                    {item.runId}
                  </div>
                </div>
                <div className="chip-row">
                  <span className={`status-badge status-${item.status === 'error' ? 'failed' : item.status === 'running' ? 'running' : 'completed'}`}>
                    {item.status}
                  </span>
                  <span className="meta-chip">{item.kind}</span>
                </div>
              </div>
              <pre>{item.detail}</pre>
              <ActionLinks actions={buildEntryActions(item.runId, item.filePaths)} />
            </article>
          ))}
          {timeline.length === 0 && loadingNativeTranscript ? <p className="muted-copy">Loading timeline…</p> : null}
          {timeline.length === 0 && !loadingNativeTranscript ? <p className="muted-copy">No timeline events have been indexed yet.</p> : null}
        </div>
      ),
    },
    {
      value: 'transcript',
      label: 'Transcript',
      badge: transcript.length,
      body: (
        <div className="transcript">
          {transcript.map((node) => (
            <article
              key={node.id}
              className={`message ${
                node.kind === 'assistant'
                  ? 'agent-message'
                  : node.kind === 'user'
                    ? 'user-message'
                    : node.kind === 'thinking'
                      ? 'thinking-message'
                      : node.kind === 'error'
                        ? 'error-message'
                        : 'tool-message'
              }`}
            >
              <div className="message-meta">
                {node.label}
                {node.timestamp != null ? <span className="message-time"> · {formatFlowTime(node.timestamp)}</span> : null}
              </div>
              <pre>{node.text}</pre>
              <ActionLinks actions={buildEntryActions(node.runId, node.filePaths)} />
            </article>
          ))}
          {transcript.length === 0 && loadingNativeTranscript ? <p className="muted-copy">Loading session transcript…</p> : null}
          {transcript.length === 0 && !loadingNativeTranscript ? <p className="muted-copy">No session transcript has been indexed yet.</p> : null}
        </div>
      ),
    },
    {
      value: 'files',
      label: 'Files',
      badge: files.length,
      body: (
        <div className="files-view">
          {files.map((file) => (
            <article key={file.path} className="file-card">
              <div className="flow-segment-topline">
                <div className="flow-segment-title">{file.path}</div>
                <div className="chip-row">
                  <span className="meta-chip">{file.touches} touches</span>
                  {file.reads > 0 ? <span className="meta-chip">{file.reads} reads</span> : null}
                  {file.writes > 0 ? <span className="meta-chip">{file.writes} writes</span> : null}
                </div>
              </div>
              <p className="muted-copy">
                Runs: {file.runIds.join(', ')}
                {file.tools.length > 0 ? ` · Tools: ${file.tools.join(', ')}` : ''}
              </p>
              <ActionLinks actions={buildEntryActions(file.runIds[0] ?? '', [file.path])} />
            </article>
          ))}
          {files.length === 0 && loadingNativeTranscript ? <p className="muted-copy">Loading file attention…</p> : null}
          {files.length === 0 && !loadingNativeTranscript ? <p className="muted-copy">No file attention has been captured for this session yet.</p> : null}
        </div>
      ),
    },
  ];

  return (
    <section className="flow-grid">
      <article className="panel run-shell">
        <header>
          <div>
            <p className="eyebrow">Realtime Session View</p>
            <h2>{sessionId || 'Missing session id'}</h2>
          </div>
          <div className="status-stack">
            <span className={`status-badge status-${status}`}>{status}</span>
            <span className="meta-chip">{resolvedAgent}</span>
          </div>
        </header>

        <div className="flow-summary-strip">
          <span className="meta-chip">{flowLanes.length} lanes</span>
          <span className="meta-chip">{timeline.length} timeline events</span>
          <span className="meta-chip">{files.length} files</span>
          <span className="meta-chip">{eventFlowModel.summary.pendingTools} pending tools</span>
        </div>

        <Tabs value={viewMode} onChange={(value) => setViewMode(value as AgentFlowViewMode)} items={tabItems} />

        <form className="composer" onSubmit={handleSend}>
          <Field
            label={
              status === 'active' && transport !== 'persistent'
                ? 'Wait for the current live turn to finish'
                : 'Continue this session with a new turn'
            }
          >
            <Textarea
              autoFocus={searchParams.get('compose') === '1'}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={5}
              placeholder={
                status === 'active' && transport !== 'persistent'
                  ? 'The live session is still running…'
                  : 'Type the next message for this session…'
              }
              disabled={!canCompose}
            />
          </Field>
          {error ? <p className="error-banner">{error}</p> : null}
          <div className="actions">
            <Button
              type="submit"
              variant="primary"
              loading={sending}
              disabled={sending || !prompt.trim() || !canCompose}
            >
              Continue session
            </Button>
          </div>
        </form>
      </article>

      <article className="panel">
        <header>
          <h2>Session State</h2>
        </header>
        <div className="summary-grid">
          <div className="summary-card">
            <span className="summary-label">Session</span>
            <strong>{sessionId || 'unknown'}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Agent</span>
            <strong>{resolvedAgent}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">State</span>
            <strong>{status}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Session owner</span>
            <strong>{formatControlPlane(controlPlane)}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Live attachment</span>
            <strong>{activeRunId ? 'attached' : 'idle'}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Session cost</span>
            <strong>{formatUsd(sessionCost?.totalUsd ?? null)}</strong>
          </div>
        </div>

        {sessionCost ? (
          <p className="muted-copy">
            Tokens in {sessionCost.inputTokens ?? 0} · out {sessionCost.outputTokens ?? 0}
            {sessionCost.thinkingTokens != null ? ` · thinking ${sessionCost.thinkingTokens}` : ''}
            {sessionCost.cachedTokens != null ? ` · cached ${sessionCost.cachedTokens}` : ''}
          </p>
        ) : null}
        <p className="muted-copy">
          {transport === 'persistent'
            ? 'Later turns stay on the same live structured channel.'
            : transport === 'restart-per-turn'
              ? 'Later turns resume the same session by starting a fresh execution.'
              : 'This harness does not currently expose structured session continuation.'}
        </p>
        <p className="muted-copy">
          {runs.length > 0
            ? `${runs.length} execution ${runs.length === 1 ? 'attempt' : 'attempts'} recorded for this session.`
            : 'No execution attempts recorded for this session yet.'}
        </p>
      </article>
    </section>
  );
}
