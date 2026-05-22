/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { SessionDetailPage } from './SessionDetailPage.js';

const mockUseGateway = vi.fn();
const mockFetchGateway = vi.fn();
const mockBuildSessionFlowModel = vi.fn();
const mockBuildNativeTranscript = vi.fn();
const mockBuildNativeAgentFlowLane = vi.fn();
const mockBuildSessionTimelineFromTranscript = vi.fn();
const mockBuildSessionFilesFromTranscript = vi.fn();
const mockAccumulateEventCost = vi.fn();
const capturedShellProps: Array<Record<string, unknown>> = [];
const mockNavigate = vi.fn();

vi.mock('react-router-dom-v6', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom-v6')>();
  return {
    ...actual,
    useParams: () => ({ sessionId: 'session-1' }),
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(), vi.fn()] as const,
  };
});

vi.mock('@a5c-ai/agent-mux-ui', () => ({
  useGateway: () => mockUseGateway(),
}));

vi.mock('../providers/GatewayProvider.js', () => ({
  useGatewayFetch: () => mockFetchGateway,
}));

vi.mock('../components/sessions/session-workspace-shell.js', () => ({
  SessionWorkspaceShell: (props: Record<string, unknown>) => {
    capturedShellProps.push(props);
    return (
      <div data-testid="session-workspace-shell">
        <div>{String(props.sessionTitle ?? '')}</div>
        <div>{String((props.flowModelOverride as { transcript?: Array<{ text?: string }> } | undefined)?.transcript?.[0]?.text ?? '')}</div>
        <button
          type="button"
          onClick={() =>
            void (props.onSubmit as (input: {
              sessionId: string;
              prompt: string;
              agent?: string;
              model?: string;
              approvalMode?: 'yolo' | 'prompt' | 'deny';
              attachments?: Array<Record<string, unknown>>;
            }) => Promise<void>)({
              sessionId: 'session-1',
              prompt: 'Continue the task',
              agent: 'claude',
              model: 'sonnet',
              approvalMode: 'yolo',
              attachments: [{ name: 'trace.txt', mimeType: 'text/plain', base64: 'dGVzdA==' }],
            })
          }
        >
          submit
        </button>
      </div>
    );
  },
}));

vi.mock('@a5c-ai/agent-mux-ui/session-flow', () => ({
  buildSessionFlowModel: (...args: unknown[]) => mockBuildSessionFlowModel(...args),
  buildNativeTranscript: (...args: unknown[]) => mockBuildNativeTranscript(...args),
  buildNativeAgentFlowLane: (...args: unknown[]) => mockBuildNativeAgentFlowLane(...args),
  buildSessionTimelineFromTranscript: (...args: unknown[]) => mockBuildSessionTimelineFromTranscript(...args),
  buildSessionFilesFromTranscript: (...args: unknown[]) => mockBuildSessionFilesFromTranscript(...args),
  accumulateEventCost: (...args: unknown[]) => mockAccumulateEventCost(...args),
}));

function createMockStore(initialState: Record<string, unknown>) {
  const state = initialState;
  return {
    getState: () => state,
    subscribe: () => () => {},
  };
}

function createSessionState(overrides?: {
  session?: Record<string, unknown>;
  runs?: Array<Record<string, unknown>>;
  agents?: Record<string, Record<string, unknown>>;
  events?: Record<string, unknown>;
}) {
  const sessionId = 'session-1';
  return {
    agents: {
      byId: overrides?.agents ?? {
        claude: {
          agent: 'claude',
          structuredSessionTransport: 'persistent',
        },
      },
    },
    sessions: {
      byId: {
        [sessionId]: {
          sessionId,
          status: 'active',
          agent: 'claude',
          title: 'Realtime shell session',
          ...overrides?.session,
        },
      },
    },
    runs: {
      byId: Object.fromEntries(
        (overrides?.runs ?? [
          {
            runId: 'run-1',
            sessionId,
            agent: 'claude',
            status: 'running',
            startedAt: 1_000,
          },
        ]).map((run) => [String(run.runId), run]),
      ),
    },
    events: {
      byRunId: overrides?.events ?? {},
    },
    actions: {
      mergeSession: vi.fn(),
      mergeRun: vi.fn(),
    },
  };
}

function okJson(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  };
}

function latestShellProps() {
  return capturedShellProps[capturedShellProps.length - 1] ?? null;
}

describe('SessionDetailPage route shell wiring', () => {
  beforeEach(() => {
    capturedShellProps.length = 0;
    mockNavigate.mockReset();
    mockUseGateway.mockReset();
    mockFetchGateway.mockReset();
    mockBuildSessionFlowModel.mockReset();
    mockBuildNativeTranscript.mockReset();
    mockBuildNativeAgentFlowLane.mockReset();
    mockBuildSessionTimelineFromTranscript.mockReset();
    mockBuildSessionFilesFromTranscript.mockReset();
    mockAccumulateEventCost.mockReset();
    mockAccumulateEventCost.mockReturnValue({ totalUsd: 0.25, inputTokens: 10, outputTokens: 5 });
    mockBuildSessionFlowModel.mockReturnValue({
      lanes: [],
      transcript: [],
      timeline: [],
      files: [],
      summary: {
        totalRuns: 0,
        totalSegments: 0,
        totalTools: 0,
        pendingTools: 0,
        fileCount: 0,
        totalUsd: null,
      },
    });
    mockBuildNativeTranscript.mockReturnValue([]);
    mockBuildNativeAgentFlowLane.mockReturnValue(null);
    mockBuildSessionTimelineFromTranscript.mockReturnValue([]);
    mockBuildSessionFilesFromTranscript.mockReturnValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it('hydrates the chat-first shell with native transcript fallback when event buffers are empty', async () => {
    const client = { subscribeSession: vi.fn(() => () => {}) };
    const store = createMockStore(createSessionState());
    mockUseGateway.mockReturnValue({ client, store });
    mockFetchGateway.mockImplementation(async (path: string) => {
      if (path.includes('/messages?')) {
        return okJson({
          messages: [{ role: 'assistant', content: 'unused native payload' }],
          pagination: {
            total: 1,
            offset: 0,
            limit: 60,
            hasMore: false,
          },
        });
      }
      return okJson({});
    });
    mockBuildNativeTranscript.mockReturnValue([
      {
        id: 'native-transcript-1',
        kind: 'tool',
        label: 'Write',
        text: 'Native tool still running',
        runId: 'run-1',
        timestamp: 1_100,
        status: 'running',
        filePaths: ['src/native.ts'],
      },
    ]);
    mockBuildSessionTimelineFromTranscript.mockReturnValue([
      {
        id: 'native-transcript-1:timeline',
        runId: 'run-1',
        laneKey: 'run-1',
        kind: 'tool',
        title: 'Write',
        detail: 'Native tool still running',
        timestamp: 1_100,
        status: 'running',
        filePaths: ['src/native.ts'],
      },
    ]);
    mockBuildSessionFilesFromTranscript.mockReturnValue([
      {
        path: 'src/native.ts',
        reads: 0,
        writes: 0,
        touches: 1,
        lastEventAt: 1_100,
        runIds: ['run-1'],
        tools: ['Write'],
      },
    ]);
    mockBuildNativeAgentFlowLane.mockReturnValue({
      runId: 'run-1',
      laneKey: 'run-1',
      agent: 'claude',
      status: 'running',
      startedAt: 1_000,
      lastEventAt: 1_100,
      segmentCount: 1,
      toolCount: 1,
      totalUsd: null,
      segments: [
        {
          id: 'native-segment-1',
          kind: 'tool',
          title: 'Write',
          detail: 'Native tool still running',
          weight: 1,
          startedAt: 1_000,
          endedAt: null,
          status: 'running',
          filePaths: ['src/native.ts'],
        },
      ],
    });

    render(<SessionDetailPage />);

    expect(await screen.findByTestId('session-workspace-shell')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockFetchGateway).toHaveBeenCalledWith('/api/v1/sessions/session-1/messages?limit=60&tail=true');
    });

    const props = latestShellProps();
    expect(props?.sessionTitle).toBe('Realtime shell session');
    expect((props?.flowModelOverride as { transcript: Array<{ text: string }> }).transcript[0]?.text).toBe(
      'Native tool still running',
    );
    expect(props?.conversationDisabled).toBe(false);
  });

  it('prefers indexed event data and skips native transcript fetch when streamed transcript exists', async () => {
    const client = { subscribeSession: vi.fn(() => () => {}) };
    const store = createMockStore(createSessionState());
    mockUseGateway.mockReturnValue({ client, store });
    mockFetchGateway.mockImplementation(async () => okJson({}));
    mockBuildSessionFlowModel.mockReturnValue({
      lanes: [
        {
          runId: 'run-1',
          laneKey: 'run-1',
          agent: 'claude',
          status: 'running',
          startedAt: 1_000,
          lastEventAt: 1_100,
          segmentCount: 1,
          toolCount: 1,
          totalUsd: 0.2,
          segments: [],
        },
      ],
      transcript: [
        {
          id: 'event-transcript-1',
          kind: 'assistant',
          label: 'Assistant',
          text: 'Event transcript wins',
          runId: 'run-1',
          timestamp: 1_100,
          filePaths: ['src/event.ts'],
        },
      ],
      timeline: [
        {
          id: 'event-timeline-1',
          runId: 'run-1',
          laneKey: 'run-1',
          kind: 'tool',
          title: 'ApplyPatch',
          detail: 'Event timeline wins',
          timestamp: 1_100,
          status: 'running',
          filePaths: ['src/event.ts'],
        },
      ],
      files: [
        {
          path: 'src/event.ts',
          reads: 1,
          writes: 1,
          touches: 2,
          lastEventAt: 1_100,
          runIds: ['run-1'],
          tools: ['ApplyPatch'],
        },
      ],
      summary: {
        totalRuns: 1,
        totalSegments: 1,
        totalTools: 1,
        pendingTools: 1,
        fileCount: 1,
        totalUsd: 0.2,
      },
    });
    mockBuildNativeTranscript.mockReturnValue([
      {
        id: 'native-transcript-1',
        kind: 'assistant',
        label: 'Assistant',
        text: 'Native fallback should stay hidden',
        runId: 'run-1',
        timestamp: 1_200,
        filePaths: ['src/native.ts'],
      },
    ]);

    render(<SessionDetailPage />);

    expect(await screen.findByText('Event transcript wins')).toBeInTheDocument();

    await waitFor(() => {
      expect(
        mockFetchGateway.mock.calls.some(([path]) => String(path).includes('/messages?')),
      ).toBe(false);
    });

    const props = latestShellProps();
    expect((props?.flowModelOverride as { transcript: Array<{ text: string }> }).transcript[0]?.text).toBe(
      'Event transcript wins',
    );
    expect(mockBuildSessionTimelineFromTranscript).not.toHaveBeenCalled();
    expect(mockBuildSessionFilesFromTranscript).not.toHaveBeenCalled();
  });

  it('locks the composer while a non-persistent live session is still attached', async () => {
    const client = { subscribeSession: vi.fn(() => () => {}) };
    const store = createMockStore(
      createSessionState({
        agents: {
          claude: {
            agent: 'claude',
            structuredSessionTransport: 'restart-per-turn',
          },
        },
      }),
    );
    mockUseGateway.mockReturnValue({ client, store });
    mockFetchGateway.mockImplementation(async (path: string) => {
      if (path.includes('/messages?')) {
        return okJson({
          messages: [],
          pagination: {
            total: 0,
            offset: 0,
            limit: 60,
            hasMore: false,
          },
        });
      }
      return okJson({});
    });

    render(<SessionDetailPage />);

    expect(await screen.findByTestId('session-workspace-shell')).toBeInTheDocument();

    await waitFor(() => {
      const props = latestShellProps();
      expect(props?.conversationDisabled).toBe(true);
      expect(props?.conversationPlaceholder).toBe('The live session is still running…');
    });
  });

  it('submits follow-up turns through the session message endpoint and merges returned records', async () => {
    const client = { subscribeSession: vi.fn(() => () => {}), subscribeRun: vi.fn(() => () => {}) };
    const state = createSessionState();
    const store = createMockStore(state);
    mockUseGateway.mockReturnValue({ client, store });
    mockFetchGateway.mockImplementation(async (path: string, init?: RequestInit) => {
      if (path.includes('/messages?')) {
        return okJson({
          messages: [],
          pagination: {
            total: 0,
            offset: 0,
            limit: 60,
            hasMore: false,
          },
        });
      }
      if (path.endsWith('/messages')) {
        expect(init?.method).toBe('POST');
        expect(JSON.parse(String(init?.body))).toEqual({
          prompt: 'Continue the task',
          agent: 'claude',
          model: 'sonnet',
          approvalMode: 'yolo',
          attachments: [{ name: 'trace.txt', mimeType: 'text/plain', base64: 'dGVzdA==' }],
        });
        return okJson({
          run: { runId: 'run-2', sessionId: 'session-1', status: 'queued' },
          session: { sessionId: 'session-1', status: 'active' },
        });
      }
      return okJson({});
    });

    render(<SessionDetailPage />);

    expect(await screen.findByTestId('session-workspace-shell')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() => {
      expect(mockFetchGateway).toHaveBeenCalledWith(
        '/api/v1/sessions/session-1/messages',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    expect((state.actions.mergeRun as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      'run-2',
      expect.objectContaining({ runId: 'run-2' }),
    );
    expect(client.subscribeRun).toHaveBeenCalledWith('run-2', expect.any(Function));
    expect((state.actions.mergeSession as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      'session-1',
      expect.objectContaining({ sessionId: 'session-1' }),
    );
  });

  it('refreshes native transcript after a follow-up run finalizes', async () => {
    const subscribeRun = vi.fn((_runId: string, callback?: (frame: { event?: Record<string, unknown> }) => void) => {
      if (callback) {
        setTimeout(() => callback({ event: { type: 'run.finalized', exitReason: 'completed' } }), 0);
      }
      return () => {};
    });
    const client = { subscribeSession: vi.fn(() => () => {}), subscribeRun };
    const state = createSessionState({
      session: {
        status: 'inactive',
      },
      runs: [
        {
          runId: 'run-1',
          sessionId: 'session-1',
          agent: 'claude',
          status: 'completed',
          startedAt: 1_000,
        },
      ],
    });
    const store = createMockStore(state);
    mockUseGateway.mockReturnValue({ client, store });
    let messageFetchCount = 0;
    mockFetchGateway.mockImplementation(async (path: string, init?: RequestInit) => {
      if (path.includes('/messages?')) {
        messageFetchCount += 1;
        return okJson({
          messages:
            messageFetchCount === 1
              ? [{ role: 'assistant', content: 'Existing native transcript' }]
              : [{ role: 'assistant', content: 'Native transcript includes the resumed reply' }],
          pagination: {
            total: 1,
            offset: 0,
            limit: 60,
            hasMore: false,
          },
        });
      }
      if (path.endsWith('/messages')) {
        expect(init?.method).toBe('POST');
        return okJson({
          run: { runId: 'run-2', sessionId: 'session-1', status: 'queued' },
          session: { sessionId: 'session-1', status: 'active' },
        });
      }
      return okJson({});
    });
    mockBuildNativeTranscript.mockImplementation((_sessionId: string, messages: Array<{ content?: string }>) =>
      messages.map((message, index) => ({
        id: `native-${index}`,
        kind: 'assistant',
        label: 'Assistant',
        text: String(message.content ?? ''),
        runId: `session-1:native:${index}`,
        timestamp: index + 1,
        filePaths: [],
      })),
    );

    render(<SessionDetailPage />);

    expect(await screen.findByText('Existing native transcript')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'submit' }));

    expect(await screen.findByText('Native transcript includes the resumed reply')).toBeInTheDocument();
    expect(subscribeRun).toHaveBeenCalledWith('run-2', expect.any(Function));
    expect(messageFetchCount).toBeGreaterThanOrEqual(2);
  });
});
