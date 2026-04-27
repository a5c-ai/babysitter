import { renderHook, act } from '@testing-library/react';
import { usePolling } from '../use-polling';

/**
 * Create a Response-like object that resilientFetch can consume.
 * Uses real Response constructor for correct headers/ok/status behavior,
 * but wraps json() to resolve immediately (avoids fake-timer issues with
 * the real ReadableStream-based body parsing).
 */
function makeResponse(body: string, init: ResponseInit): Response {
  const res = new Response(body, init);
  // Override json() so it resolves on the next microtask tick rather than
  // going through the ReadableStream path that can stall under fake timers.
  const parsed = JSON.parse(body);
  Object.defineProperty(res, 'json', {
    value: () => Promise.resolve(parsed),
  });
  return res;
}

function mockFetchSuccess(data: unknown) {
  return vi.fn().mockImplementation(() =>
    Promise.resolve(
      makeResponse(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  );
}

function mockFetchFailure(status: number) {
  return vi.fn().mockImplementation(() =>
    Promise.resolve(
      new Response(`HTTP ${status}`, {
        status,
        headers: { 'Content-Type': 'text/plain' },
      })
    )
  );
}

describe('usePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', mockFetchSuccess({ items: [1, 2, 3] }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('fetches data immediately on mount', async () => {
    const { result } = renderHook(() =>
      usePolling<{ items: number[] }>('/api/data')
    );

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.data).toEqual({ items: [1, 2, 3] });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledWith('/api/data', expect.anything());
  });

  it('polls at the specified interval', async () => {
    renderHook(() =>
      usePolling('/api/data', { interval: 5000 })
    );

    // Initial fetch
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetch).toHaveBeenCalledTimes(1);

    // After one interval
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(fetch).toHaveBeenCalledTimes(2);

    // After another interval
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('uses default interval of 2000ms', async () => {
    renderHook(() => usePolling('/api/data'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('does not poll when enabled is false', async () => {
    const { result } = renderHook(() =>
      usePolling('/api/data', { enabled: false })
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it('does not fetch when url is empty', async () => {
    const { result } = renderHook(() => usePolling(''));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it('handles fetch error', async () => {
    // Use 422 (non-retryable 4xx) to avoid retries — resilientFetch retries 5xx and 404
    vi.stubGlobal('fetch', mockFetchFailure(422));

    const { result } = renderHook(() => usePolling('/api/data'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.error).toBe('HTTP 422');
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it('handles network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network error')));

    // Use a long interval so the poll timer doesn't abort in-progress retries
    // resilientFetch retries network errors: attempt 0 + sleep(1s) + attempt 1 + sleep(2s) + attempt 2 = ~3s
    const { result } = renderHook(() => usePolling('/api/data', { interval: 30000 }));

    // Advance enough time for all retries to complete
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.loading).toBe(false);
  });

  it('clears error on successful fetch after error', async () => {
    // Use a 422 error (non-retryable 4xx) so the first call fails immediately,
    // then subsequent calls succeed
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response('Bad request', {
          status: 422,
          headers: { 'Content-Type': 'text/plain' },
        })
      )
      .mockImplementation(() =>
        Promise.resolve(
          makeResponse(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      );
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      usePolling('/api/data', { interval: 1000 })
    );

    // First fetch fails (422, no retry)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.error).toBe('Bad request');

    // Second fetch succeeds on next poll
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual({ ok: true });
  });

  it('provides a manual refresh function', async () => {
    const { result } = renderHook(() => usePolling('/api/data'));

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

  it('cleans up interval on unmount', async () => {
    const { unmount } = renderHook(() =>
      usePolling('/api/data', { interval: 1000 })
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetch).toHaveBeenCalledTimes(1);

    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    // Should not have been called again after unmount (only the initial fetch)
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('restarts polling when url changes', async () => {
    const { rerender } = renderHook(
      ({ url }) => usePolling(url, { interval: 1000 }),
      { initialProps: { url: '/api/data1' } }
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetch).toHaveBeenLastCalledWith('/api/data1', expect.anything());

    rerender({ url: '/api/data2' });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetch).toHaveBeenLastCalledWith('/api/data2', expect.anything());
  });

  it('restarts polling when enabled toggles', async () => {
    const { rerender, result: _result } = renderHook(
      ({ enabled }) => usePolling('/api/data', { enabled, interval: 1000 }),
      { initialProps: { enabled: false } }
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(fetch).not.toHaveBeenCalled();

    // Enable polling
    rerender({ enabled: true });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
