import { renderHook, act } from '@testing-library/react';
import { createMockProjectSummary } from '@/test/fixtures';
import { useProjects } from '../use-projects';

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

const mockProjects = [
  createMockProjectSummary({ projectName: 'project-a', totalRuns: 5 }),
  createMockProjectSummary({ projectName: 'project-b', totalRuns: 3 }),
];

describe('useProjects', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockEventSourceInstances = [];
    vi.stubGlobal('EventSource', MockEventSource);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ projects: mockProjects }), {
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

  it('fetches project list and returns data', async () => {
    const { result } = renderHook(() => useProjects());

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.projects).toHaveLength(2);
    expect(result.current.projects[0].projectName).toBe('project-a');
    expect(result.current.projects[1].projectName).toBe('project-b');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('calls /api/runs?mode=projects endpoint', async () => {
    renderHook(() => useProjects());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(fetch).toHaveBeenCalledWith('/api/runs?mode=projects', expect.anything());
  });

  it('uses custom interval', async () => {
    renderHook(() => useProjects(10000));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('returns empty projects array when data is null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(null), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.projects).toEqual([]);
  });

  it('handles fetch error', async () => {
    // Use 422 (non-retryable 4xx) to avoid retries from resilientFetch
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('HTTP 422', { status: 422 })
      )
    );

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.error).toBe('HTTP 422');
    expect(result.current.projects).toEqual([]);
  });

  it('does not refetch on disconnect or error SSE events', async () => {
    renderHook(() => useProjects());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    const callsAfterInit = (fetch as ReturnType<typeof vi.fn>).mock.calls.length;

    // Simulate disconnect event via EventSource
    const instance = mockEventSourceInstances[0];
    if (instance?.onmessage) {
      act(() => {
        instance.onmessage!(
          new MessageEvent('message', {
            data: JSON.stringify({ type: 'disconnect' }),
          })
        );
      });
    }

    // Wait past debounce window
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    // No additional fetch should have been triggered by disconnect
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsAfterInit);

    // Simulate error event
    if (instance?.onmessage) {
      act(() => {
        instance.onmessage!(
          new MessageEvent('message', {
            data: JSON.stringify({ type: 'error', error: 'test' }),
          })
        );
      });
    }

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    // Still no additional fetch
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsAfterInit);
  });

  it('refetches on update and new-run SSE events', async () => {
    renderHook(() => useProjects());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    const callsAfterInit = (fetch as ReturnType<typeof vi.fn>).mock.calls.length;

    const instance = mockEventSourceInstances[0];
    if (instance?.onmessage) {
      // Simulate update event
      act(() => {
        instance.onmessage!(
          new MessageEvent('message', {
            data: JSON.stringify({ type: 'update', runId: 'run-1' }),
          })
        );
      });
    }

    // Wait past debounce window (1500ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    const callsAfterFirstEvent = (fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    // Should have at least one additional fetch after the SSE event
    expect(callsAfterFirstEvent).toBeGreaterThan(callsAfterInit);

    if (instance?.onmessage) {
      // Simulate new-run event
      act(() => {
        instance.onmessage!(
          new MessageEvent('message', {
            data: JSON.stringify({ type: 'new-run', runId: 'run-2' }),
          })
        );
      });
    }

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    // Should have at least one more fetch after the second SSE event
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(callsAfterFirstEvent);
  });

  it('provides a refresh function', async () => {
    const { result } = renderHook(() => useProjects());

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
});
