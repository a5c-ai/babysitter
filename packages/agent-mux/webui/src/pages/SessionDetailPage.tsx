import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom-v6';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useGateway } from '@a5c-ai/agent-mux-ui';
import { Button, Field, Textarea } from '@a5c-ai/compendium';

import { useGatewayFetch } from '../providers/GatewayProvider.js';
import {
  buildAgentFlowLanes,
  buildNativeAgentFlowLane,
  type NativeSessionMessage,
  type SessionCost,
} from './SessionDetailFlow.js';

type SessionTranscriptNode =
  | { kind: 'user'; text: string; runId: string }
  | { kind: 'assistant'; text: string; runId: string }
  | { kind: 'thinking'; text: string; runId: string }
  | { kind: 'tool'; text: string; runId: string; label: string };

type SessionControlPlane = 'self-managed' | 'external-host' | 'mcp-mediated';
type AgentFlowViewMode = 'transcript' | 'agent-flow';

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

function accumulateEventCost(
  runIds: string[],
  eventBuffers: Record<string, { events: Record<string, unknown>[] } | undefined>,
): SessionCost | null {
  const totals: SessionCost = {
    totalUsd: 0,
    inputTokens: 0,
    outputTokens: 0,
    thinkingTokens: 0,
    cachedTokens: 0,
  };
  let found = false;

  for (const runId of runIds) {
    const buffer = eventBuffers[runId];
    if (!buffer) {
      continue;
    }
    for (const event of buffer.events) {
      if (event.type !== 'cost') {
        continue;
      }
      const cost = event.cost;
      if (!cost || typeof cost !== 'object') {
        continue;
      }
      const record = cost as SessionCost;
      totals.totalUsd = (totals.totalUsd ?? 0) + Number(record.totalUsd ?? 0);
      totals.inputTokens = (totals.inputTokens ?? 0) + Number(record.inputTokens ?? 0);
      totals.outputTokens = (totals.outputTokens ?? 0) + Number(record.outputTokens ?? 0);
      totals.thinkingTokens = (totals.thinkingTokens ?? 0) + Number(record.thinkingTokens ?? 0);
      totals.cachedTokens = (totals.cachedTokens ?? 0) + Number(record.cachedTokens ?? 0);
      found = true;
    }
  }

  return found ? totals : null;
}

function formatFlowTime(value: number): string {
  if (!Number.isFinite(value)) {
    return 'unknown';
  }
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function buildTranscript(
  runs: Array<Record<string, unknown>>,
  eventBuffers: Record<string, { events: Record<string, unknown>[] } | undefined>,
): SessionTranscriptNode[] {
  const orderedRuns = [...runs].sort((left, right) => Number(left.startedAt ?? 0) - Number(right.startedAt ?? 0));
  const nodes: SessionTranscriptNode[] = [];

  for (const run of orderedRuns) {
    const runId = String(run.runId ?? '');
    const buffer = eventBuffers[runId];
    if (!buffer) {
      continue;
    }
    let currentAssistantText = '';
    let currentThinkingText = '';
    const flushAssistant = (): void => {
      if (!currentAssistantText) return;
      nodes.push({ kind: 'assistant', text: currentAssistantText, runId });
      currentAssistantText = '';
    };
    const flushThinking = (): void => {
      if (!currentThinkingText) return;
      nodes.push({ kind: 'thinking', text: currentThinkingText, runId });
      currentThinkingText = '';
    };
    for (const event of buffer.events) {
      const type = String(event.type ?? '');
      if (type === 'user_message') {
        flushThinking();
        flushAssistant();
        const text = String(event.text ?? '');
        if (text.length > 0) {
          nodes.push({ kind: 'user', text, runId });
        }
        continue;
      }
      if (type === 'thinking_delta') {
        const delta = String(event.delta ?? '');
        if (delta.length > 0) {
          currentThinkingText += delta;
        }
        continue;
      }
      if (type === 'thinking_stop') {
        const finalThinking = String(event.thinking ?? '');
        if (finalThinking.length > 0) {
          currentThinkingText = finalThinking;
        }
        flushThinking();
        continue;
      }
      if (type === 'text_delta') {
        flushThinking();
        currentAssistantText += String(event.delta ?? '');
        continue;
      }
      if (type === 'message_stop') {
        flushThinking();
        const finalText = String(event.text ?? '');
        if (finalText.length > 0) {
          currentAssistantText = finalText;
        }
        flushAssistant();
        continue;
      }
      flushThinking();
      flushAssistant();
      if (type === 'tool_call_start' || type === 'tool_call_ready') {
        nodes.push({
          kind: 'tool',
          runId,
          label: `start ${String(event.toolName ?? 'tool')}`,
          text:
            type === 'tool_call_ready'
              ? JSON.stringify(event.input ?? {}, null, 2)
              : String(event.inputAccumulated ?? ''),
        });
        continue;
      }
      if (type === 'tool_result' || type === 'tool_error') {
        nodes.push({
          kind: 'tool',
          runId,
          label: String(event.toolName ?? 'tool'),
          text: JSON.stringify(event, null, 2),
        });
      }
    }
    flushThinking();
    flushAssistant();
  }

  return nodes;
}

function renderToolPayload(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function buildNativeTranscript(sessionId: string, messages: NativeSessionMessage[]): SessionTranscriptNode[] {
  const nodes: SessionTranscriptNode[] = [];
  for (const [index, message] of messages.entries()) {
    const runId = `${sessionId}:native:${index}`;
    if (message.role === 'user' && typeof message.content === 'string' && message.content.length > 0) {
      nodes.push({ kind: 'user', text: message.content, runId });
      continue;
    }
    if (typeof message.thinking === 'string' && message.thinking.length > 0) {
      nodes.push({ kind: 'thinking', text: message.thinking, runId });
    }
    if (Array.isArray(message.toolCalls)) {
      for (const toolCall of message.toolCalls) {
        nodes.push({
          kind: 'tool',
          runId,
          label: String(toolCall.toolName ?? 'tool'),
          text: renderToolPayload({
            input: toolCall.input,
            output: toolCall.output,
            durationMs: toolCall.durationMs,
          }),
        });
      }
    }
    if (message.role === 'tool' && message.toolResult) {
      nodes.push({
        kind: 'tool',
        runId,
        label: String(message.toolResult.toolName ?? 'tool'),
        text: renderToolPayload(message.toolResult.output),
      });
      continue;
    }
    if (message.role === 'assistant' && typeof message.content === 'string' && message.content.length > 0) {
      nodes.push({ kind: 'assistant', text: message.content, runId });
      continue;
    }
    if (message.role === 'system' && typeof message.content === 'string' && message.content.length > 0) {
      nodes.push({ kind: 'tool', text: message.content, runId, label: 'system' });
    }
  }
  return nodes;
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
  const [viewMode, setViewMode] = useState<AgentFlowViewMode>(() =>
    searchParams.get('view') === 'flow' ? 'agent-flow' : 'transcript',
  );

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
  const eventTranscript = useMemo(() => buildTranscript(runs, eventBuffers), [eventBuffers, runs]);
  const nativeTranscript = useMemo(() => buildNativeTranscript(sessionId, nativeMessages), [nativeMessages, sessionId]);
  const eventFlowLanes = useMemo(() => buildAgentFlowLanes(runs, eventBuffers), [eventBuffers, runs]);
  const nativeFlowLane = useMemo(
    () => buildNativeAgentFlowLane(sessionId, nativeMessages, resolvedAgent, status),
    [nativeMessages, resolvedAgent, sessionId, status],
  );
  const flowLanes = eventFlowLanes.length > 0 ? eventFlowLanes : nativeFlowLane ? [nativeFlowLane] : [];
  const eventCost = useMemo(
    () => accumulateEventCost(runs.map((run) => String(run.runId ?? '')), eventBuffers),
    [eventBuffers, runs],
  );
  const sessionCost =
    session?.cost && typeof session.cost === 'object'
      ? session.cost as SessionCost
      : eventCost;
  const transcript =
    status === 'active'
      ? (eventTranscript.length > 0 ? eventTranscript : nativeTranscript)
      : (nativeTranscript.length > 0 ? nativeTranscript : eventTranscript);

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
    if (status === 'active' && eventTranscript.length > 0) {
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
  }, [eventTranscript.length, fetchGateway, sessionId, status, store]);

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

  return (
    <section className="flow-grid">
      <article className="panel run-shell">
        <header>
          <div>
            <p className="eyebrow">Session Chat</p>
            <h2>{sessionId || 'Missing session id'}</h2>
          </div>
          <div className="status-stack">
            <span className={`status-badge status-${status}`}>{status}</span>
            <span className="meta-chip">{resolvedAgent}</span>
          </div>
        </header>

        <div className="view-toggle" role="tablist" aria-label="Session detail view">
          <button
            type="button"
            className={viewMode === 'transcript' ? 'active' : ''}
            onClick={() => setViewMode('transcript')}
            aria-pressed={viewMode === 'transcript'}
          >
            Transcript
          </button>
          <button
            type="button"
            className={viewMode === 'agent-flow' ? 'active' : ''}
            onClick={() => setViewMode('agent-flow')}
            aria-pressed={viewMode === 'agent-flow'}
          >
            Agent Flow
          </button>
        </div>

        {viewMode === 'transcript' ? (
          <div className="transcript">
            {transcript.map((node, index) => (
              <article
                key={`${node.runId}-${index}`}
                className={`message ${
                  node.kind === 'assistant'
                    ? 'agent-message'
                    : node.kind === 'user'
                      ? 'user-message'
                      : node.kind === 'thinking'
                        ? 'thinking-message'
                        : 'tool-message'
                }`}
              >
                <div className="message-meta">
                  {node.kind === 'assistant'
                    ? 'assistant'
                    : node.kind === 'user'
                      ? 'user'
                      : node.kind === 'thinking'
                        ? 'thinking'
                        : node.label}
                </div>
                <pre>{node.text}</pre>
              </article>
            ))}
            {transcript.length === 0 && loadingNativeTranscript ? <p className="muted-copy">Loading session transcript…</p> : null}
            {transcript.length === 0 && !loadingNativeTranscript ? <p className="muted-copy">No session transcript has been indexed yet.</p> : null}
          </div>
        ) : (
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
                      className={`flow-segment segment-${segment.kind}`}
                      style={{ flexGrow: segment.weight }}
                    >
                      <div className="flow-segment-title">{segment.title}</div>
                      <p>{segment.detail}</p>
                    </article>
                  ))}
                </div>
              </article>
            ))}
            {flowLanes.length === 0 && loadingNativeTranscript ? <p className="muted-copy">Loading agent flow…</p> : null}
            {flowLanes.length === 0 && !loadingNativeTranscript ? (
              <p className="muted-copy">No structured execution flow has been indexed yet.</p>
            ) : null}
          </div>
        )}

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
