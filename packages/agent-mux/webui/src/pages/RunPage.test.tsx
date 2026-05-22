import { describe, expect, it, vi, beforeEach } from 'vitest';

import { render, screen, setupUser, waitFor } from '@/test/test-utils';

import { DispatchDetailPage, SessionPendingPage } from './RunPage.js';

const mockUseRun = vi.fn();
const mockUseStopRun = vi.fn();
const mockFetchGateway = vi.fn();
const mockMergeRun = vi.fn();
const mockMergeSession = vi.fn();
const mockSubscribeRun = vi.fn(() => vi.fn());

vi.mock('react-router-dom-v6', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom-v6')>('react-router-dom-v6');
  return {
    ...actual,
    useParams: () => ({ runId: 'run-123' }),
  };
});

vi.mock('@a5c-ai/agent-mux-ui', () => ({
  useRun: (runId: string) => mockUseRun(runId),
  useStopRun: () => mockUseStopRun,
  useGateway: () => ({
    client: { subscribeRun: mockSubscribeRun },
    store: {
      getState: () => ({
        actions: {
          mergeRun: mockMergeRun,
          mergeSession: mockMergeSession,
        },
      }),
    },
  }),
}));

vi.mock('../providers/GatewayProvider.js', () => ({
  useGatewayFetch: () => mockFetchGateway,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchGateway.mockResolvedValue({
    ok: true,
    json: async () => ({
      runId: 'run-123',
      status: 'waiting',
      agent: 'codex',
      processId: 'dispatch/process',
      cwd: 'C:\\work\\repo',
      createdAt: '2026-05-02T10:00:00.000Z',
      updatedAt: '2026-05-02T10:01:00.000Z',
      totalTasks: 3,
      completedTasks: 1,
    }),
  });
  mockUseStopRun.mockResolvedValue({ stopped: true });
});

describe('SessionPendingPage', () => {
  it('renders the dispatch handoff surface while waiting for a session id', async () => {
    mockUseRun.mockReturnValue({
      runId: 'run-123',
      agent: 'codex',
      status: 'queued',
    });

    render(<SessionPendingPage />);

    expect(screen.getByText('Waiting for this dispatch to bind to its session.')).toBeInTheDocument();
    expect(screen.getByText('run-123')).toBeInTheDocument();
    expect(screen.getByText('queued')).toBeInTheDocument();
    await waitFor(() => {
      expect(mockSubscribeRun).toHaveBeenCalledWith('run-123');
      expect(mockFetchGateway).toHaveBeenCalledWith('/api/v1/dispatches/run-123');
    });
    expect(screen.getByRole('link', { name: 'Open sessions' })).toHaveAttribute('href', '/sessions');
    expect(screen.getByRole('link', { name: 'Open workspaces' })).toHaveAttribute('href', '/workspaces');
  });
});

describe('DispatchDetailPage', () => {
  it('loads dispatch detail, shows linked actions, and stops the active dispatch', async () => {
    const user = setupUser();
    mockUseRun.mockReturnValue({
      runId: 'run-123',
      agent: 'codex',
      status: 'waiting',
      processId: 'dispatch/process',
      sessionId: 'session-9',
      cwd: 'C:\\work\\repo',
      createdAt: '2026-05-02T10:00:00.000Z',
      updatedAt: '2026-05-02T10:01:00.000Z',
      totalTasks: 3,
      completedTasks: 1,
    });

    render(<DispatchDetailPage />);

    await waitFor(() => {
      expect(mockFetchGateway).toHaveBeenCalledWith('/api/v1/dispatches/run-123');
    });
    expect(mockSubscribeRun).toHaveBeenCalledWith('run-123');
    expect(mockMergeRun).toHaveBeenCalledWith('run-123', expect.objectContaining({ runId: 'run-123' }));
    expect(screen.getByRole('link', { name: 'Open session chat' })).toHaveAttribute('href', '/sessions/session-9');
    expect(screen.getByRole('link', { name: 'Open workspace' })).toHaveAttribute(
      'href',
      '/workspaces?workspace=C%3A%5Cwork%5Crepo',
    );

    await user.click(screen.getByRole('button', { name: 'Stop dispatch' }));

    await waitFor(() => {
      expect(mockUseStopRun).toHaveBeenCalledWith('run-123');
    });
    expect(screen.getByText('The gateway is terminating this dispatch now.')).toBeInTheDocument();
  });
});
