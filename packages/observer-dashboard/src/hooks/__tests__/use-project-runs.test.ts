import { renderHook, act } from '@testing-library/react';
import { createMockRun } from '@/test/fixtures';
import { useProjectRuns } from '../use-project-runs';

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

const mockRuns = [
  createMockRun({ runId: 'run-1', projectName: 'my-project' }),
  createMockRun({ runId: 'run-2', projectName: 'my-project' }),
];

describe('useProjectRuns', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockEventSourceInstances = [];
    vi.stubGlobal('EventSource', MockEventSource);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              runs: mockRuns,
              totalCount: 2,
              project: 'my-project',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        )
      )
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('fetches project runs and returns data', async () => {
    const { result } = renderHook(() => useProjectRuns('my-project'));

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.runs).toHaveLength(2);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('constructs URL with correct query params', async () => {
    renderHook(() =>
      useProjectRuns('my-project', {
        limit: 20,
        offset: 10,
        search: 'test',
        status: 'completed',
      })
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('project=my-project');
    expect(calledUrl).toContain('limit=20');
    expect(calledUrl).toContain('offset=10');
    expect(calledUrl).toContain('search=test');
    expect(calledUrl).toContain('status=completed');
  });

  it('uses default limit and offset', async () => {
    renderHook(() => useProjectRuns('my-project'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('limit=10');
    expect(calledUrl).toContain('offset=0');
  });

  it('returns empty runs when enabled is false', async () => {
    const { result } = renderHook(() =>
      useProjectRuns('my-project', { enabled: false })
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.runs).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it('handles fetch error', async () => {
    // Use a 422 error to avoid retries from resilientFetch (404 and 5xx are retryable)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response('HTTP 422', { status: 422 })
        )
      )
    );

    const { result } = renderHook(() => useProjectRuns('my-project'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.error).toBe('HTTP 422');
    expect(result.current.runs).toEqual([]);
  });

  it('provides a refresh function', async () => {
    const { result } = renderHook(() => useProjectRuns('my-project'));

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
