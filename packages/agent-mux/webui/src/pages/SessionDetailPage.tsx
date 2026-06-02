import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom-v6';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useGateway } from '@a5c-ai/agent-mux-ui';
import {
  accumulateEventCost,
  buildNativeAgentFlowLane,
  buildNativeTranscript,
  buildSessionFilesFromTranscript,
  buildSessionFlowModel,
  buildSessionTimelineFromTranscript,
  type NativeSessionMessage,
  type SessionCost,
  type SessionFlowModel,
} from '@a5c-ai/agent-mux-ui/session-flow';
import type { Attachment, WorkspaceRuntimeSurface } from '@a5c-ai/agent-mux-comm';
import { Button } from '@a5c-ai/compendium';

import { SessionWorkspaceShell } from '../components/sessions/session-workspace-shell.js';
import { useBacklog } from '../hooks/use-backlog.js';
import { findDispatchContextAuditsBySessionId } from '../lib/dispatch-context-audit.js';
import { useGatewayFetch } from '../providers/GatewayProvider.js';

const MESSAGE_PAGE_SIZE = 60;

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

function resolveFlowModel(args: {
  eventFlowModel: SessionFlowModel;
  nativeMessages: NativeSessionMessage[];
  sessionId: string;
  resolvedAgent: string;
  status: string;
  runCount: number;
}): SessionFlowModel {
  const nativeTranscript = buildNativeTranscript(args.sessionId, args.nativeMessages);
  const nativeFlowLane = buildNativeAgentFlowLane(
    args.sessionId,
    args.nativeMessages,
    args.resolvedAgent,
    args.status,
  );
  const transcript =
    args.status === 'active'
      ? (args.eventFlowModel.transcript.length > 0 ? args.eventFlowModel.transcript : nativeTranscript)
      : (nativeTranscript.length > 0 ? nativeTranscript : args.eventFlowModel.transcript);
  const lanes =
    args.eventFlowModel.lanes.length > 0
      ? args.eventFlowModel.lanes
      : nativeFlowLane
        ? [nativeFlowLane]
        : [];
  const timeline =
    args.eventFlowModel.timeline.length > 0
      ? args.eventFlowModel.timeline
      : buildSessionTimelineFromTranscript(transcript);
  const files =
    args.eventFlowModel.files.length > 0
      ? args.eventFlowModel.files
      : buildSessionFilesFromTranscript(transcript);
  const totalUsdCandidates = lanes
    .map((lane) => lane.totalUsd)
    .filter((value): value is number => value != null && Number.isFinite(value));

  return {
    lanes,
    transcript,
    timeline,
    files,
    summary: {
      totalRuns: Math.max(args.eventFlowModel.summary.totalRuns, args.runCount, lanes.length),
      totalSegments:
        lanes.length > 0
          ? lanes.reduce((sum, lane) => sum + lane.segmentCount, 0)
          : args.eventFlowModel.summary.totalSegments,
      totalTools:
        lanes.length > 0
          ? lanes.reduce((sum, lane) => sum + lane.toolCount, 0)
          : args.eventFlowModel.summary.totalTools,
      pendingTools:
        lanes.length > 0
          ? lanes.reduce(
              (sum, lane) =>
                sum + lane.segments.filter((segment) => segment.kind === 'tool' && segment.status === 'running').length,
              0,
            )
          : args.eventFlowModel.summary.pendingTools,
      fileCount: files.length,
      totalUsd:
        args.eventFlowModel.summary.totalUsd ??
        (totalUsdCandidates.length > 0
          ? totalUsdCandidates.reduce((sum, value) => sum + value, 0)
          : null),
    },
  };
}

export function SessionDetailPage(): JSX.Element {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId ?? '';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fetchGateway = useGatewayFetch();
  const { client, store } = useGateway();
  const { snapshot } = useBacklog();
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

  const [error, setError] = useState<string | null>(null);
  const [nativeMessages, setNativeMessages] = useState<NativeSessionMessage[]>([]);
  const [messagePageOffset, setMessagePageOffset] = useState<number | null>(null);
  const [messagePage, setMessagePage] = useState({ total: 0, offset: 0, limit: MESSAGE_PAGE_SIZE, hasMore: false });
  const linkedIssueKeyRef = useRef<string | null>(null);
  const nativeRefreshTimersRef = useRef<number[]>([]);
  const nativeMessageRequestIdRef = useRef(0);

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
  const canCompose = status !== 'active' || transport === 'persistent';
  const workspacePath =
    typeof session?.cwd === 'string' && session.cwd.length > 0
      ? session.cwd
      : readWorkspacePath(session?.workspace);
  const runtime = readRuntime(session?.runtime);
  const sessionAudit = useMemo(
    () => findDispatchContextAuditsBySessionId(snapshot, sessionId)[0] ?? null,
    [sessionId, snapshot],
  );
  const linkedIssueId = searchParams.get('issueId') ?? sessionAudit?.issueId ?? null;
  const linkedIssueKey = searchParams.get('issueKey') ?? sessionAudit?.issueKey ?? null;

  const eventFlowModel = useMemo(() => buildSessionFlowModel(runs, eventBuffers), [eventBuffers, runs]);
  const flowModel = useMemo(
    () =>
      resolveFlowModel({
        eventFlowModel,
        nativeMessages,
        sessionId,
        resolvedAgent,
        status,
        runCount: runs.length,
      }),
    [eventFlowModel, nativeMessages, resolvedAgent, runs.length, sessionId, status],
  );
  const eventCost = useMemo(
    () => accumulateEventCost(runs.map((run) => String(run.runId ?? '')), eventBuffers),
    [eventBuffers, runs],
  );
  const sessionCost =
    session?.cost && typeof session.cost === 'object'
      ? session.cost as SessionCost
      : eventCost;
  const activeRunId = typeof runs[0]?.runId === 'string' ? String(runs[0]?.runId) : null;

  useEffect(() => {
    if (!sessionId) {
      return;
    }
    return client.subscribeSession(sessionId);
  }, [client, sessionId]);

  useEffect(() => () => {
    for (const timer of nativeRefreshTimersRef.current) {
      window.clearTimeout(timer);
    }
    nativeRefreshTimersRef.current = [];
  }, []);

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
    setMessagePageOffset(null);
  }, [sessionId]);

  const loadNativeMessages = useCallback(async (force = false) => {
    if (!sessionId) {
      setNativeMessages([]);
      setMessagePage({ total: 0, offset: 0, limit: MESSAGE_PAGE_SIZE, hasMore: false });
      return;
    }
    if (!force && status === 'active' && eventFlowModel.transcript.length > 0) {
      return;
    }
    const requestId = ++nativeMessageRequestIdRef.current;
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(MESSAGE_PAGE_SIZE));
      if (messagePageOffset == null) {
        params.set('tail', 'true');
      } else {
        params.set('offset', String(messagePageOffset));
      }
      const response = await fetchGateway(`/api/v1/sessions/${encodeURIComponent(sessionId)}/messages?${params.toString()}`);
      if (!response.ok) {
        if (response.status === 404) {
          if (requestId === nativeMessageRequestIdRef.current) {
            setNativeMessages([]);
            setMessagePage({ total: 0, offset: 0, limit: MESSAGE_PAGE_SIZE, hasMore: false });
          }
          return;
        }
        throw new Error(`Gateway request failed: ${response.status}`);
      }
      const body = await response.json() as {
        messages?: NativeSessionMessage[];
        pagination?: {
          total?: number;
          offset?: number;
          limit?: number;
          hasMore?: boolean;
        };
      };
      if (requestId !== nativeMessageRequestIdRef.current) {
        return;
      }
      if (Array.isArray(body.messages)) {
        setNativeMessages(body.messages);
      }
      setMessagePage({
        total: Number(body.pagination?.total ?? body.messages?.length ?? 0),
        offset: Number(body.pagination?.offset ?? 0),
        limit: Number(body.pagination?.limit ?? MESSAGE_PAGE_SIZE),
        hasMore: body.pagination?.hasMore === true,
      });
    } catch (cause) {
      if (requestId === nativeMessageRequestIdRef.current) {
        setError(cause instanceof Error ? cause.message : String(cause));
      }
    }
  }, [eventFlowModel.transcript.length, fetchGateway, messagePageOffset, sessionId, status]);

  useEffect(() => {
    void loadNativeMessages(false);
  }, [loadNativeMessages]);

  useEffect(() => {
    if (!linkedIssueId || !sessionId) {
      return;
    }
    const linkKey = `${linkedIssueId}:${sessionId}:${activeRunId ?? ''}`;
    if (linkedIssueKeyRef.current === linkKey) {
      return;
    }
    linkedIssueKeyRef.current = linkKey;
    void fetch('/api/backlog', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'link-issue-session',
        issueId: linkedIssueId,
        sessionId,
        runId: activeRunId ?? undefined,
      }),
    }).catch(() => {
      linkedIssueKeyRef.current = null;
    });
  }, [activeRunId, linkedIssueId, sessionId]);

  async function handleSubmit(input: {
    sessionId: string;
    prompt: string;
    agent?: string;
    model?: string;
    attachments?: Attachment[];
    approvalMode?: 'yolo' | 'prompt' | 'deny';
  }): Promise<void> {
    if (input.agent && input.agent !== resolvedAgent) {
      const response = await fetchGateway('/api/v1/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          agent: input.agent,
          prompt: input.prompt,
          model: input.model,
          attachments: input.attachments,
          approvalMode: input.approvalMode,
          forkSessionId: input.sessionId,
          workspaceId: typeof session?.workspaceId === 'string' ? session.workspaceId : undefined,
          cwd: workspacePath ?? undefined,
        }),
      });
      if (!response.ok) {
        throw new Error(`Gateway request failed: ${response.status}`);
      }
      const body = (await response.json()) as {
        run?: Record<string, unknown>;
      };
      const runId = typeof body.run?.runId === 'string' ? body.run.runId : null;
      const targetSessionId = typeof body.run?.sessionId === 'string' ? body.run.sessionId : null;
      if (!runId) {
        throw new Error('Gateway did not return a dispatch id');
      }
      store.getState().actions.mergeRun(runId, body.run ?? {});
      client.subscribeRun(runId);
      if (linkedIssueId) {
        await fetch('/api/backlog', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            action: 'link-issue-session',
            issueId: linkedIssueId,
            sessionId: targetSessionId ?? undefined,
            runId,
          }),
        }).catch(() => undefined);
      }
      const issueQuery = linkedIssueId
        ? `?issueId=${encodeURIComponent(linkedIssueId)}${linkedIssueKey ? `&issueKey=${encodeURIComponent(linkedIssueKey)}` : ''}`
        : '';
      navigate(targetSessionId ? `/sessions/${targetSessionId}${issueQuery}` : `/sessions/pending/${runId}${issueQuery}`);
      return;
    }

    const response = await fetchGateway(`/api/v1/sessions/${encodeURIComponent(input.sessionId)}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt: input.prompt,
        agent: input.agent ?? resolvedAgent,
        model: input.model,
        attachments: input.attachments,
        approvalMode: input.approvalMode,
      }),
    });
    if (!response.ok) {
      throw new Error(`Gateway request failed: ${response.status}`);
    }

    setMessagePageOffset(null);
    const body = (await response.json()) as {
      run?: Record<string, unknown>;
      session?: Record<string, unknown>;
    };
    if (body.run && typeof body.run.runId === 'string') {
      store.getState().actions.mergeRun(body.run.runId, body.run);
      const scheduleNativeRefresh = () => {
        for (const timer of nativeRefreshTimersRef.current) {
          window.clearTimeout(timer);
        }
        nativeRefreshTimersRef.current = [0, 600, 1_800, 3_200].map((delay) =>
          window.setTimeout(() => {
            void loadNativeMessages(true);
          }, delay),
        );
      };
      scheduleNativeRefresh();
      client.subscribeRun(body.run.runId, (frame) => {
        const event = frame.event as Record<string, unknown> | undefined;
        if (event?.type === 'run.finalized') {
          scheduleNativeRefresh();
        }
      });
    }
    if (body.session && typeof body.session.sessionId === 'string') {
      store.getState().actions.mergeSession(body.session.sessionId, body.session);
    }
  }

  const showingTranscriptPager = flowModel.transcript.length === nativeMessages.length && messagePage.total > messagePage.limit;
  const conversationSupplement = showingTranscriptPager ? (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background/65 px-4 py-3 text-sm">
      <div className="text-foreground-muted">
        Showing messages {messagePage.offset + 1}-{Math.min(messagePage.offset + nativeMessages.length, messagePage.total)} of {messagePage.total}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={messagePage.offset <= 0}
          onClick={() => setMessagePageOffset(Math.max(0, messagePage.offset - messagePage.limit))}
        >
          Older
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={messagePage.offset + messagePage.limit >= messagePage.total}
          onClick={() => setMessagePageOffset(Math.min(Math.max(0, messagePage.total - messagePage.limit), messagePage.offset + messagePage.limit))}
        >
          Newer
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <>
      {error ? (
        <div className="w-full px-3 pt-4 sm:px-5 sm:pt-6 xl:px-6">
          <div className="rounded-2xl border border-error/20 bg-error-muted px-4 py-3 text-sm text-error">
            {error}
          </div>
        </div>
      ) : null}
      <SessionWorkspaceShell
        sessionId={sessionId}
        sessionTitle={String(session?.title ?? sessionId ?? 'Missing session id')}
        sessionAgent={resolvedAgent}
        sessionStatus={status}
        totalCostLabel={formatUsd(sessionCost?.totalUsd ?? null)}
        runs={runs}
        eventBuffers={eventBuffers}
        workspacePath={workspacePath}
        runtime={runtime ?? undefined}
        sessionModel={typeof session?.model === 'string' ? session.model : null}
        flowModelOverride={flowModel}
        sessionCostOverride={sessionCost}
        conversationSupplement={conversationSupplement}
        conversationDisabled={!canCompose}
        conversationPlaceholder={
          status === 'active' && transport !== 'persistent'
            ? 'The live session is still running…'
            : 'Continue the session...'
        }
        conversationSubmitLabel="Continue session"
        conversationEmptyStateTitle="No transcript yet"
        conversationEmptyStateBody="The transcript will appear here as soon as the gateway or native session history has something to show."
        heroEyebrow="Live session"
        heroBody="Keep the transcript open, continue the session from here, and pull in runtime or execution detail only when you need it."
        onSubmit={handleSubmit}
      />
    </>
  );
}
