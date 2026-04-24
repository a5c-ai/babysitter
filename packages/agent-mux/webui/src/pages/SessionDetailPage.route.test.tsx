/** @vitest-environment jsdom */

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { SessionDetailPage } from './SessionDetailPage.js';

const mockUseGateway = vi.fn();
const mockFetchGateway = vi.fn();
const mockBuildSessionFlowModel = vi.fn();
const mockBuildNativeTranscript = vi.fn();
const mockBuildNativeAgentFlowLane = vi.fn();
const mockAccumulateEventCost = vi.fn();

vi.mock('react-router-dom-v6', () => ({
  useParams: () => ({ sessionId: 'session-1' }),
  useSearchParams: () => [new URLSearchParams(''), vi.fn()],
}));

vi.mock('@a5c-ai/agent-mux-ui', () => ({
  useGateway: () => mockUseGateway(),
}));

vi.mock('../providers/GatewayProvider.js', () => ({
  useGatewayFetch: () => mockFetchGateway,
}));

vi.mock('./SessionDetailFlow.js', () => ({
  buildSessionFlowModel: (...args: unknown[]) => mockBuildSessionFlowModel(...args),
  buildNativeTranscript: (...args: unknown[]) => mockBuildNativeTranscript(...args),
  buildNativeAgentFlowLane: (...args: unknown[]) => mockBuildNativeAgentFlowLane(...args),
  accumulateEventCost: (...args: unknown[]) => mockAccumulateEventCost(...args),
}));

vi.mock('@a5c-ai/compendium', () => ({
  Tabs: ({
    value,
    onChange,
    items,
  }: {
    value: string;
    onChange: (value: string) => void;
    items: Array<{ value: string; label: string; body: React.ReactNode }>;
  }) => (
    <div>
      <div role="tablist">
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={item.value === value}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div>{items.find((item) => item.value === value)?.body}</div>
    </div>
  ),
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
  Field: ({ label, children }: { label: React.ReactNode; children: React.ReactNode }) => (
    <label>
      <span>{label}</span>
      {children}
    </label>
  ),
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
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
          sessionControlPlane: 'self-managed',
        },
      },
    },
    sessions: {
      byId: {
        [sessionId]: {
          sessionId,
          status: 'active',
          agent: 'claude',
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

describe('SessionDetailPage realtime routing', () => {
  beforeEach(() => {
    cleanup();
    mockUseGateway.mockReset();
    mockFetchGateway.mockReset();
    mockBuildSessionFlowModel.mockReset();
    mockBuildNativeTranscript.mockReset();
    mockBuildNativeAgentFlowLane.mockReset();
    mockAccumulateEventCost.mockReset();
    mockAccumulateEventCost.mockReturnValue({ totalUsd: 0.25, inputTokens: 10, outputTokens: 5 });
  });

  it('falls back to native transcript data and shows pending realtime flow across tabs', async () => {
    const client = {
      subscribeSession: vi.fn(() => () => {}),
    };
    const store = createMockStore(createSessionState());
    mockUseGateway.mockReturnValue({ client, store });
    mockFetchGateway.mockImplementation(async (path: string) => {
      if (path.endsWith('/full')) {
        return okJson({
          messages: [{ role: 'assistant', content: 'unused transport body' }],
        });
      }
      return okJson({});
    });
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

    const user = userEvent.setup();
    render(<SessionDetailPage />);

    expect(await screen.findByText('Native tool still running')).toBeTruthy();
    expect(screen.getAllByText('running').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('tab', { name: 'Transcript' }));
    expect(screen.getByText('Native tool still running')).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Timeline' }));
    expect(screen.getByText('Write')).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Files' }));
    expect(screen.getByText('src/native.ts')).toBeTruthy();

    expect(mockFetchGateway).toHaveBeenCalledWith('/api/v1/sessions/session-1/full');
  });

  it('prefers indexed event-stream data over the native transcript fallback when active events exist', async () => {
    const client = {
      subscribeSession: vi.fn(() => () => {}),
    };
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
          segments: [
            {
              id: 'event-segment-1',
              kind: 'tool',
              title: 'ApplyPatch',
              detail: 'Streamed event output',
              weight: 1,
              startedAt: 1_000,
              endedAt: null,
              status: 'running',
              filePaths: ['src/event.ts'],
            },
          ],
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
    mockBuildNativeAgentFlowLane.mockReturnValue({
      runId: 'run-1',
      laneKey: 'run-1',
      agent: 'claude',
      status: 'running',
      startedAt: 1_000,
      lastEventAt: 1_200,
      segmentCount: 1,
      toolCount: 1,
      totalUsd: null,
      segments: [
        {
          id: 'native-segment-hidden',
          kind: 'tool',
          title: 'Write',
          detail: 'Native fallback should stay hidden',
          weight: 1,
          startedAt: 1_000,
          endedAt: null,
          status: 'running',
          filePaths: ['src/native.ts'],
        },
      ],
    });

    const user = userEvent.setup();
    render(<SessionDetailPage />);

    await user.click(screen.getByRole('tab', { name: 'Transcript' }));
    expect(screen.getByText('Event transcript wins')).toBeTruthy();
    expect(screen.queryByText('Native fallback should stay hidden')).toBeNull();

    await user.click(screen.getByRole('tab', { name: 'Timeline' }));
    expect(screen.getByText('Event timeline wins')).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Files' }));
    expect(screen.getByText('src/event.ts')).toBeTruthy();

    await waitFor(() => {
      expect(
        mockFetchGateway.mock.calls.some(([path]) => String(path).endsWith('/full')),
      ).toBe(false);
    });
  });
});
