import { render, screen, act } from '@/test/test-utils';
import { NotificationProvider, useNotificationContext, STABILIZATION_WINDOW_MS } from '../notification-provider';
import type { DigestResponse, RunDigest } from '@/types';
import React from 'react';

// Mock hooks used by NotificationProvider
const mockNotify = vi.fn();
const mockDismiss = vi.fn();
const mockRequestPermission = vi.fn();

vi.mock('@/hooks/use-notifications', () => ({
  useNotifications: () => ({
    notifications: [],
    notify: mockNotify,
    dismiss: mockDismiss,
    requestPermission: mockRequestPermission,
    permission: 'default' as NotificationPermission,
  }),
}));

// Mutable digest data that the usePolling mock reads from.
// Tests update this variable and rerender to simulate new poll responses.
let mockDigestData: DigestResponse | null = null;

vi.mock('@/hooks/use-polling', () => ({
  usePolling: () => ({
    data: mockDigestData,
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

// Mock ToastStack to avoid next/navigation dependency
vi.mock('../toast-stack', () => ({
  ToastStack: ({ notifications, onDismiss: _onDismiss }: { notifications: unknown[]; onDismiss: (id: string) => void }) =>
    React.createElement('div', { 'data-testid': 'toast-stack' }, `toasts: ${(notifications as unknown[]).length}`),
}));

describe('NotificationProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDigestData = null;
  });

  // -----------------------------------------------------------------------
  // Renders children
  // -----------------------------------------------------------------------
  it('renders its children', () => {
    render(
      <NotificationProvider>
        <div data-testid="child">Hello</div>
      </NotificationProvider>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Renders ToastStack
  // -----------------------------------------------------------------------
  it('renders the ToastStack component', () => {
    render(
      <NotificationProvider>
        <span>child</span>
      </NotificationProvider>,
    );

    expect(screen.getByTestId('toast-stack')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Context provides notify function
  // -----------------------------------------------------------------------
  it('provides notify function through context', () => {
    function Consumer() {
      const { notify } = useNotificationContext();
      return (
        <button onClick={() => notify('Test', 'Body', 'info')}>
          Notify
        </button>
      );
    }

    render(
      <NotificationProvider>
        <Consumer />
      </NotificationProvider>,
    );

    screen.getByText('Notify').click();

    expect(mockNotify).toHaveBeenCalledWith('Test', 'Body', 'info');
  });

  // -----------------------------------------------------------------------
  // Context provides dismiss function
  // -----------------------------------------------------------------------
  it('provides dismiss function through context', () => {
    function Consumer() {
      const { dismiss } = useNotificationContext();
      return (
        <button onClick={() => dismiss('notif-1')}>
          Dismiss
        </button>
      );
    }

    render(
      <NotificationProvider>
        <Consumer />
      </NotificationProvider>,
    );

    screen.getByText('Dismiss').click();

    expect(mockDismiss).toHaveBeenCalledWith('notif-1');
  });

  // -----------------------------------------------------------------------
  // Context provides requestPermission
  // -----------------------------------------------------------------------
  it('provides requestPermission through context', () => {
    function Consumer() {
      const { requestPermission } = useNotificationContext();
      return (
        <button onClick={() => requestPermission()}>
          Request
        </button>
      );
    }

    render(
      <NotificationProvider>
        <Consumer />
      </NotificationProvider>,
    );

    screen.getByText('Request').click();

    expect(mockRequestPermission).toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Context provides permission value
  // -----------------------------------------------------------------------
  it('provides permission value through context', () => {
    function Consumer() {
      const { permission } = useNotificationContext();
      return <span data-testid="perm">{permission}</span>;
    }

    render(
      <NotificationProvider>
        <Consumer />
      </NotificationProvider>,
    );

    expect(screen.getByTestId('perm').textContent).toBe('default');
  });

  // -----------------------------------------------------------------------
  // Context provides notifications array
  // -----------------------------------------------------------------------
  it('provides notifications array through context', () => {
    function Consumer() {
      const { notifications } = useNotificationContext();
      return <span data-testid="count">{notifications.length}</span>;
    }

    render(
      <NotificationProvider>
        <Consumer />
      </NotificationProvider>,
    );

    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  // -----------------------------------------------------------------------
  // Default context values (used without provider)
  // -----------------------------------------------------------------------
  it('provides safe default context values when used without a provider', () => {
    function Consumer() {
      const ctx = useNotificationContext();
      return (
        <div>
          <span data-testid="perm">{ctx.permission}</span>
          <span data-testid="count">{ctx.notifications.length}</span>
          <button onClick={() => ctx.notify('a', 'b')}>n</button>
          <button onClick={() => ctx.dismiss('x')}>d</button>
        </div>
      );
    }

    // Render without provider -- uses the default context
    render(<Consumer />);

    expect(screen.getByTestId('perm').textContent).toBe('default');
    expect(screen.getByTestId('count').textContent).toBe('0');
    // These should not throw
    screen.getByText('n').click();
    screen.getByText('d').click();
  });

  // =======================================================================
  // Stabilization window tests
  // =======================================================================
  describe('stabilization window', () => {
    /** Helper to create a RunDigest with sensible defaults. */
    function makeRun(overrides: Partial<RunDigest> = {}): RunDigest {
      return {
        runId: 'run-001',
        latestSeq: 1,
        status: 'pending',
        taskCount: 5,
        completedTasks: 0,
        updatedAt: new Date().toISOString(),
        pendingBreakpoints: 0,
        ...overrides,
      };
    }

    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: false });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    // -------------------------------------------------------------------
    // 1. No notifications during stabilization window
    // -------------------------------------------------------------------
    it('does not fire notifications during the stabilization window', async () => {
      mockDigestData = {
        runs: [
          makeRun({ runId: 'run-001' }),
          makeRun({ runId: 'run-002' }),
          makeRun({ runId: 'run-003' }),
        ],
      };

      await act(async () => {
        render(
          <NotificationProvider>
            <span>child</span>
          </NotificationProvider>,
        );
      });

      // We are within the stabilization window — no notifications should fire
      expect(mockNotify).not.toHaveBeenCalled();
    });

    // -------------------------------------------------------------------
    // 2. Watermarks seeded during stabilization (no duplicate notifications)
    // -------------------------------------------------------------------
    it('seeds watermarks during stabilization so existing runs do not trigger notifications after window', async () => {
      const runs = [
        makeRun({ runId: 'run-001' }),
        makeRun({ runId: 'run-002' }),
      ];

      mockDigestData = { runs };

      const { rerender } = await act(async () =>
        render(
          <NotificationProvider>
            <span>child</span>
          </NotificationProvider>,
        ),
      );

      expect(mockNotify).not.toHaveBeenCalled();

      // Advance past the stabilization window
      await act(async () => {
        vi.advanceTimersByTime(STABILIZATION_WINDOW_MS + 100);
      });

      // Provide the SAME runs again (simulating a new poll)
      mockDigestData = { runs: [...runs] };
      await act(async () => {
        rerender(
          <NotificationProvider>
            <span>child</span>
          </NotificationProvider>,
        );
      });

      // No "New Run Started" notifications because watermarks were already seeded
      expect(mockNotify).not.toHaveBeenCalled();
    });

    // -------------------------------------------------------------------
    // 3. New run after stabilization fires notification
    // -------------------------------------------------------------------
    it('fires "New Run Started" for a genuinely new run after stabilization', async () => {
      const existingRuns = [makeRun({ runId: 'run-001' })];
      mockDigestData = { runs: existingRuns };

      const { rerender } = await act(async () =>
        render(
          <NotificationProvider>
            <span>child</span>
          </NotificationProvider>,
        ),
      );

      expect(mockNotify).not.toHaveBeenCalled();

      // Advance past stabilization window
      await act(async () => {
        vi.advanceTimersByTime(STABILIZATION_WINDOW_MS + 100);
      });

      // Add a new run to the digest
      mockDigestData = {
        runs: [...existingRuns, makeRun({ runId: 'run-new' })],
      };
      await act(async () => {
        rerender(
          <NotificationProvider>
            <span>child</span>
          </NotificationProvider>,
        );
      });

      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(
        'New Run Started',
        expect.stringContaining('started'),
        'info',
        expect.objectContaining({ href: '/runs/run-new' }),
      );
    });

    // -------------------------------------------------------------------
    // 4. Run completed during stabilization doesn't fire notification
    // -------------------------------------------------------------------
    it('does not fire "Run Completed" for a run that was already completed during stabilization', async () => {
      mockDigestData = {
        runs: [makeRun({ runId: 'run-001', status: 'completed' })],
      };

      const { rerender } = await act(async () =>
        render(
          <NotificationProvider>
            <span>child</span>
          </NotificationProvider>,
        ),
      );

      expect(mockNotify).not.toHaveBeenCalled();

      // Advance past stabilization window
      await act(async () => {
        vi.advanceTimersByTime(STABILIZATION_WINDOW_MS + 100);
      });

      // Same run, still completed
      mockDigestData = {
        runs: [makeRun({ runId: 'run-001', status: 'completed' })],
      };
      await act(async () => {
        rerender(
          <NotificationProvider>
            <span>child</span>
          </NotificationProvider>,
        );
      });

      // No notification since it was completed before stabilization ended
      expect(mockNotify).not.toHaveBeenCalled();
    });

    // -------------------------------------------------------------------
    // 5. Status transition after stabilization fires once
    // -------------------------------------------------------------------
    it('fires "Run Completed" exactly once when a run transitions to completed after stabilization', async () => {
      mockDigestData = {
        runs: [makeRun({ runId: 'run-001', status: 'pending' })],
      };

      const { rerender } = await act(async () =>
        render(
          <NotificationProvider>
            <span>child</span>
          </NotificationProvider>,
        ),
      );

      expect(mockNotify).not.toHaveBeenCalled();

      // Advance past stabilization window
      await act(async () => {
        vi.advanceTimersByTime(STABILIZATION_WINDOW_MS + 100);
      });

      // Run transitions to completed
      mockDigestData = {
        runs: [makeRun({ runId: 'run-001', status: 'completed' })],
      };
      await act(async () => {
        rerender(
          <NotificationProvider>
            <span>child</span>
          </NotificationProvider>,
        );
      });

      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(
        'Run Completed',
        expect.stringContaining('finished successfully'),
        'success',
        expect.objectContaining({ href: '/runs/run-001' }),
      );

      mockNotify.mockClear();

      // Same completed state on next poll — should NOT fire again
      mockDigestData = {
        runs: [makeRun({ runId: 'run-001', status: 'completed' })],
      };
      await act(async () => {
        rerender(
          <NotificationProvider>
            <span>child</span>
          </NotificationProvider>,
        );
      });

      expect(mockNotify).not.toHaveBeenCalled();
    });

    // -------------------------------------------------------------------
    // 6. Task completion does NOT fire per-task notification (flood fix)
    // -------------------------------------------------------------------
    it('does not fire per-task notifications when completedTasks increases after stabilization', async () => {
      mockDigestData = {
        runs: [makeRun({ runId: 'run-001', completedTasks: 3, taskCount: 10 })],
      };

      const { rerender } = await act(async () =>
        render(
          <NotificationProvider>
            <span>child</span>
          </NotificationProvider>,
        ),
      );

      expect(mockNotify).not.toHaveBeenCalled();

      // Advance past stabilization window
      await act(async () => {
        vi.advanceTimersByTime(STABILIZATION_WINDOW_MS + 100);
      });

      // completedTasks goes from 3 to 5 — watermark updates silently
      mockDigestData = {
        runs: [makeRun({ runId: 'run-001', completedTasks: 5, taskCount: 10 })],
      };
      await act(async () => {
        rerender(
          <NotificationProvider>
            <span>child</span>
          </NotificationProvider>,
        );
      });

      // No per-task "Tasks Completed" notification should fire (flood fix).
      // The terminal "Run Completed" notification covers this use case.
      expect(mockNotify).not.toHaveBeenCalled();
    });

    // -------------------------------------------------------------------
    // 7. Waiting state notification after stabilization
    // -------------------------------------------------------------------
    it('fires a persistent breakpoint notification when a run transitions to waiting after stabilization', async () => {
      mockDigestData = {
        runs: [makeRun({ runId: 'run-001', status: 'pending' })],
      };

      const { rerender } = await act(async () =>
        render(
          <NotificationProvider>
            <span>child</span>
          </NotificationProvider>,
        ),
      );

      expect(mockNotify).not.toHaveBeenCalled();

      // Advance past stabilization window
      await act(async () => {
        vi.advanceTimersByTime(STABILIZATION_WINDOW_MS + 100);
      });

      // Run transitions to waiting
      mockDigestData = {
        runs: [
          makeRun({
            runId: 'run-001',
            status: 'waiting',
            breakpointQuestion: 'Approve deployment?',
          }),
        ],
      };
      await act(async () => {
        rerender(
          <NotificationProvider>
            <span>child</span>
          </NotificationProvider>,
        );
      });

      expect(mockNotify).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(
        expect.stringContaining('needs attention'),
        'Approve deployment?',
        'warning',
        expect.objectContaining({ href: '/runs/run-001', persistent: true }),
      );
    });

    // -------------------------------------------------------------------
    // 8. Breakpoint resolved notification
    // -------------------------------------------------------------------
    it('fires "Breakpoint Resolved" when pendingBreakpoints drops to 0 after stabilization', async () => {
      // Seed with a run that already has a pending breakpoint
      mockDigestData = {
        runs: [
          makeRun({
            runId: 'run-001',
            status: 'waiting',
            pendingBreakpoints: 1,
          }),
        ],
      };

      const { rerender } = await act(async () =>
        render(
          <NotificationProvider>
            <span>child</span>
          </NotificationProvider>,
        ),
      );

      expect(mockNotify).not.toHaveBeenCalled();

      // Advance past stabilization window
      await act(async () => {
        vi.advanceTimersByTime(STABILIZATION_WINDOW_MS + 100);
      });

      // Breakpoint resolved: pendingBreakpoints drops from 1 to 0
      mockDigestData = {
        runs: [
          makeRun({
            runId: 'run-001',
            status: 'pending',
            pendingBreakpoints: 0,
          }),
        ],
      };
      await act(async () => {
        rerender(
          <NotificationProvider>
            <span>child</span>
          </NotificationProvider>,
        );
      });

      expect(mockNotify).toHaveBeenCalledWith(
        'Breakpoint Resolved',
        expect.stringContaining('approved'),
        'success',
        expect.objectContaining({ href: '/runs/run-001' }),
      );
    });
  });
});
