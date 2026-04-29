import { renderHook, act } from '@testing-library/react';
import { createMockRun, createMockTaskEffect, createMockTaskDetail } from '@/test/fixtures';
import { useRunDetail, useTaskDetail } from '../use-run-detail';

type MockEventSourceInstance = {
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  close: ReturnType<typeof vi.fn>;
  readyState: number;
  url: string;
};

let mockEventSourceInstances: MockEventSourceInstance[] = [];

class MockEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  close = vi.fn();
  readyState = MockEventSource.OPEN;
  url: string;

  constructor(url: string) {
    this.url = url;
    mockEventSourceInstances.push(this);
  }
}

describe('useRunDetail', () => {
  const mockRun = createMockRun({
    runId: 'run-123',
    tasks: [
      createMockTaskEffect({ effectId: 'eff-1', kind: 'node', status: 'resolved' }),
      createMockTaskEffect({ effectId: 'eff-2', kind: 'agent', status: 'resolved' }),
    ],
  });

  beforeEach(() => {
    vi.useFakeTimers();
    mockEventSourceInstances = [];
    vi.stubGlobal('EventSource', MockEventSource);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ run: mockRun }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('fetches run detail and returns run data', async () => {
    const { result } = renderHook(() => useRunDetail('run-123'));

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.run).toEqual(mockRun);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('calls the correct API endpoint', async () => {
    renderHook(() => useRunDetail('run-123'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(fetch).toHaveBeenCalledWith('/api/runs/run-123?maxEvents=50', expect.anything());
  });

  it('returns null run when data is not loaded', () => {
    const { result } = renderHook(() => useRunDetail('run-123'));

    // Before data loads
    expect(result.current.run).toBeNull();
  });

  it('detects hasBreakpointWaiting when breakpoint task is requested', async () => {
    const runWithBreakpoint = createMockRun({
      runId: 'run-bp',
      tasks: [
        createMockTaskEffect({ effectId: 'eff-1', kind: 'node', status: 'resolved' }),
        createMockTaskEffect({ effectId: 'eff-bp', kind: 'breakpoint', status: 'requested' }),
      ],
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ run: runWithBreakpoint }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    const { result } = renderHook(() => useRunDetail('run-bp'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.hasBreakpointWaiting).toBe(true);
  });

  it('hasBreakpointWaiting is false when no breakpoints are requested', async () => {
    const { result } = renderHook(() => useRunDetail('run-123'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.hasBreakpointWaiting).toBe(false);
  });

  it('hasBreakpointWaiting is false when run is null', () => {
    const { result } = renderHook(() => useRunDetail('run-123'));

    // Before data loads
    expect(result.current.hasBreakpointWaiting).toBe(false);
  });

  it('handles fetch error', async () => {
    // Use 422 (non-retryable) to avoid retries from resilientFetch (404 is retryable)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('HTTP 422', { status: 422 })
      )
    );

    const { result } = renderHook(() => useRunDetail('run-123'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.error).toBe('HTTP 422');
    expect(result.current.run).toBeNull();
  });

  it('provides a refresh function', async () => {
    const { result } = renderHook(() => useRunDetail('run-123'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    const callsAfterMount = vi.mocked(fetch).mock.calls.length;

    await act(async () => {
      result.current.refresh();
      await vi.advanceTimersByTimeAsync(0);
    });
    // refresh() should trigger at least one additional fetch
    expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThan(callsAfterMount);
  });

  it('accepts custom polling interval', async () => {
    renderHook(() => useRunDetail('run-123', 10000));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe('useTaskDetail', () => {
  const mockTask = createMockTaskDetail({
    effectId: 'eff-42',
    kind: 'shell',
    status: 'resolved',
  });

  beforeEach(() => {
    vi.useFakeTimers();
    mockEventSourceInstances = [];
    vi.stubGlobal('EventSource', MockEventSource);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ task: mockTask }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('fetches task detail when effectId is provided', async () => {
    const { result } = renderHook(() => useTaskDetail('run-123', 'eff-42'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.task).toEqual(mockTask);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('calls correct API endpoint', async () => {
    renderHook(() => useTaskDetail('run-123', 'eff-42'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(fetch).toHaveBeenCalledWith('/api/runs/run-123/tasks/eff-42', expect.anything());
  });

  it('does not fetch when effectId is null', async () => {
    const { result } = renderHook(() => useTaskDetail('run-123', null));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.task).toBeNull();
  });

  it('returns null task when data is not loaded', () => {
    const { result } = renderHook(() => useTaskDetail('run-123', 'eff-42'));

    expect(result.current.task).toBeNull();
  });

  it('handles fetch error', async () => {
    // Use 422 (non-retryable) to avoid retries from resilientFetch (404 is retryable)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('HTTP 422', { status: 422 })
      )
    );

    const { result } = renderHook(() => useTaskDetail('run-123', 'eff-42'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.error).toBe('HTTP 422');
    expect(result.current.task).toBeNull();
  });
});
