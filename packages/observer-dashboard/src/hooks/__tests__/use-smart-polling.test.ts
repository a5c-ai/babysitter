import { renderHook, act } from '@testing-library/react';
import { useSmartPolling } from '../use-smart-polling';

// Track unsubscribers for cleanup
let activeUnsubscribers: Array<() => void> = [];

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

function mockFetchSuccess(data: unknown) {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

describe('useSmartPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockEventSourceInstances = [];
    vi.stubGlobal('EventSource', MockEventSource);
    vi.stubGlobal('fetch', mockFetchSuccess({ items: [1, 2, 3] }));
  });

  afterEach(() => {
    for (const unsub of activeUnsubscribers) {
      unsub();
    }
    activeUnsubscribers = [];
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('fetches data immediately on mount', async () => {
    const { result } = renderHook(() =>
      useSmartPolling<{ items: number[] }>('/api/data', { interval: 5000 })
    );

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.data).toEqual({ items: [1, 2, 3] });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('polls at specified interval', async () => {
    renderHook(() =>
      useSmartPolling('/api/data', { interval: 5000 })
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('does not fetch when enabled is false', async () => {
    const { result } = renderHook(() =>
      useSmartPolling('/api/data', { enabled: false })
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it('handles fetch errors', async () => {
    // Use 422 (not 404, because 404 is retryable in resilientFetch)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('HTTP 422', { status: 422 })
      )
    );

    const { result } = renderHook(() =>
      useSmartPolling('/api/data', { interval: 5000 })
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.error).toBe('HTTP 422');
    expect(result.current.loading).toBe(false);
  });

  it('triggers debounced refetch when SSE event matches filter', async () => {
    const sseFilter = vi.fn().mockReturnValue(true);

    renderHook(() =>
      useSmartPolling('/api/data', {
        interval: 5000,
        sseFilter,
      })
    );

    // Initial fetch
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const initialCallCount = (fetch as ReturnType<typeof vi.fn>).mock.calls.length;

    // Simulate SSE message via the EventSource
    const instance = mockEventSourceInstances[0];
    if (instance?.onmessage) {
      act(() => {
        instance.onmessage!(
          new MessageEvent('message', {
            data: JSON.stringify({ type: 'run_updated', runId: 'run-1' }),
          })
        );
      });
    }

    // Before debounce window (1500ms), no additional fetch
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(initialCallCount);

    // After debounce window completes (1500ms total)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    // Should have triggered an additional fetch after 1500ms debounce
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it('coalesces rapid SSE events within debounce window into single fetch', async () => {
    const sseFilter = vi.fn().mockReturnValue(true);

    renderHook(() =>
      useSmartPolling('/api/data', {
        interval: 5000,
        sseFilter,
      })
    );

    // Initial fetch
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const initialCallCount = (fetch as ReturnType<typeof vi.fn>).mock.calls.length;

    const instance = mockEventSourceInstances[0];
    if (instance?.onmessage) {
      // Fire 3 rapid SSE events within 100ms
      act(() => {
        instance.onmessage!(
          new MessageEvent('message', {
            data: JSON.stringify({ type: 'update', runId: 'run-1' }),
          })
        );
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });
      act(() => {
        instance.onmessage!(
          new MessageEvent('message', {
            data: JSON.stringify({ type: 'update', runId: 'run-2' }),
          })
        );
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });
      act(() => {
        instance.onmessage!(
          new MessageEvent('message', {
            data: JSON.stringify({ type: 'update', runId: 'run-3' }),
          })
        );
      });
    }

    // Wait for the debounce to fire (1500ms from last event)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    // Should only trigger ONE additional fetch despite 3 events
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(initialCallCount + 1);
  });

  it('does not refetch when SSE event does not match filter', async () => {
    const sseFilter = vi.fn().mockReturnValue(false);

    renderHook(() =>
      useSmartPolling('/api/data', {
        interval: 5000,
        sseFilter,
      })
    );

    // Initial fetch
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const callCount = (fetch as ReturnType<typeof vi.fn>).mock.calls.length;

    // Simulate SSE message that does NOT match filter
    const instance = mockEventSourceInstances[0];
    if (instance?.onmessage) {
      act(() => {
        instance.onmessage!(
          new MessageEvent('message', {
            data: JSON.stringify({ type: 'run_updated', runId: 'run-2' }),
          })
        );
      });
    }

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // No additional fetch should have happened
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
  });

  it('provides a manual refresh function', async () => {
    const { result } = renderHook(() =>
      useSmartPolling('/api/data', { interval: 5000 })
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.refresh();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('cleans up polling on unmount', async () => {
    const { unmount } = renderHook(() =>
      useSmartPolling('/api/data', {
        interval: 5000,
      })
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    const callsAfterMount = (fetch as ReturnType<typeof vi.fn>).mock.calls.length;

    unmount();

    // Advance time - no more fetches should happen
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000);
    });

    expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsAfterMount);
  });
});
