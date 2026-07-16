import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resilientFetch, type FetchError } from '../fetcher';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convenience to create a minimal Response-like object from `fetch`. */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function textResponse(text: string, status: number): Response {
  return new Response(text, { status });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('resilientFetch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // Successful fetch
  // -----------------------------------------------------------------------
  describe('successful fetch', () => {
    it('returns parsed JSON data on 200', async () => {
      const payload = { items: [1, 2, 3] };
      vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(payload));

      const result = await resilientFetch<typeof payload>('/api/data');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(payload);
        expect(result.status).toBe(200);
      }
    });

    it('returns typed data on 201', async () => {
      const payload = { id: 'abc' };
      vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(payload, 201));

      const result = await resilientFetch<typeof payload>('/api/items', {
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(payload);
        expect(result.status).toBe(201);
      }
    });

    it('passes method, headers, and body to fetch', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ ok: true }));

      await resilientFetch('/api/action', {
        method: 'PUT',
        headers: { Authorization: 'Bearer token' },
        body: '{"x":1}',
      });

      expect(fetch).toHaveBeenCalledTimes(1);
      const [url, init] = vi.mocked(fetch).mock.calls[0];
      expect(url).toBe('/api/action');
      expect(init?.method).toBe('PUT');
      expect(init?.headers).toEqual({ Authorization: 'Bearer token' });
      expect(init?.body).toBe('{"x":1}');
    });
  });

  // -----------------------------------------------------------------------
  // Retry on 5xx
  // -----------------------------------------------------------------------
  describe('retry on 5xx', () => {
    it('retries on 500 and succeeds on second attempt', async () => {
      const payload = { recovered: true };
      vi.mocked(fetch)
        .mockResolvedValueOnce(textResponse('Internal Server Error', 500))
        .mockResolvedValueOnce(jsonResponse(payload));

      const promise = resilientFetch<typeof payload>('/api/data', {
        retries: 2,
        retryDelay: 1000,
      });

      // First attempt fails with 500 -> sleep(1000)
      await vi.advanceTimersByTimeAsync(1000);

      const result = await promise;

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(payload);
      }
    });

    it('retries on 503 up to maxRetries then returns error', async () => {
      // Use mockImplementation so each call gets a fresh Response (body can
      // only be consumed once per Response object).
      vi.mocked(fetch).mockImplementation(
        () => Promise.resolve(textResponse('Service Unavailable', 503)),
      );

      const promise = resilientFetch('/api/data', {
        retries: 2,
        retryDelay: 100,
      });

      // attempt 0 fails -> sleep(100)
      await vi.advanceTimersByTimeAsync(100);
      // attempt 1 fails -> sleep(200)
      await vi.advanceTimersByTimeAsync(200);
      // attempt 2 fails -> no more retries

      const result = await promise;

      expect(fetch).toHaveBeenCalledTimes(3); // initial + 2 retries
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.status).toBe(503);
        expect(result.error.isRetryable).toBe(true);
        expect(result.error.isAborted).toBe(false);
        expect(result.error.message).toBe('Service Unavailable');
      }
    });

    it('retries network errors with exponential backoff', async () => {
      const payload = { ok: true };
      vi.mocked(fetch)
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(jsonResponse(payload));

      const promise = resilientFetch<typeof payload>('/api/data', {
        retries: 2,
        retryDelay: 100,
      });

      // attempt 0 fails (network) -> sleep(100)
      await vi.advanceTimersByTimeAsync(100);
      // attempt 1 fails (network) -> sleep(200) (exponential)
      await vi.advanceTimersByTimeAsync(200);

      const result = await promise;

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(result.ok).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // No retry on 4xx
  // -----------------------------------------------------------------------
  describe('no retry on 4xx', () => {
    it('does not retry 400 Bad Request', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        textResponse('Bad Request', 400),
      );

      const result = await resilientFetch('/api/data');

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.status).toBe(400);
        expect(result.error.isRetryable).toBe(false);
        expect(result.error.message).toBe('Bad Request');
      }
    });

    it('retries 404 Not Found (retryable for HMR)', async () => {
      // 404 is retryable because Next.js dev server returns transient 404s
      // during HMR recompilation when API route handlers are momentarily unavailable.
      vi.mocked(fetch).mockImplementation(
        () => Promise.resolve(textResponse('Not Found', 404)),
      );

      const promise = resilientFetch('/api/missing', {
        retries: 2,
        retryDelay: 100,
      });

      // attempt 0 fails -> sleep(100)
      await vi.advanceTimersByTimeAsync(100);
      // attempt 1 fails -> sleep(200)
      await vi.advanceTimersByTimeAsync(200);
      // attempt 2 fails -> no more retries

      const result = await promise;

      expect(fetch).toHaveBeenCalledTimes(3); // initial + 2 retries
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.status).toBe(404);
        expect(result.error.isRetryable).toBe(true);
      }
    });

    it('does not retry 422 Unprocessable Entity', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        textResponse('Validation failed', 422),
      );

      const result = await resilientFetch('/api/data');

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.status).toBe(422);
        expect(result.error.isRetryable).toBe(false);
      }
    });
  });

  // -----------------------------------------------------------------------
  // Abort signal cancellation
  // -----------------------------------------------------------------------
  describe('abort signal', () => {
    it('returns aborted error when external signal is already aborted', async () => {
      const controller = new AbortController();
      controller.abort();

      const result = await resilientFetch('/api/data', {
        signal: controller.signal,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.isAborted).toBe(true);
        expect(result.error.message).toBe('Request aborted');
      }
    });

    it('cancels in-flight request when signal is aborted', async () => {
      const controller = new AbortController();

      // Make fetch hang until aborted
      vi.mocked(fetch).mockImplementationOnce(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
          }),
      );

      const promise = resilientFetch('/api/data', {
        signal: controller.signal,
        retries: 0,
      });

      // Abort after a short delay
      controller.abort();

      const result = await promise;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.isAborted).toBe(true);
        expect(result.error.message).toBe('Request aborted');
        expect(result.error.status).toBe(0);
      }
    });

    it('aborts during retry sleep and returns aborted error', async () => {
      const controller = new AbortController();

      vi.mocked(fetch).mockResolvedValueOnce(
        textResponse('Internal Server Error', 500),
      );

      const promise = resilientFetch('/api/data', {
        signal: controller.signal,
        retries: 2,
        retryDelay: 5000,
      });

      // Let the first attempt complete and enter retry sleep
      await vi.advanceTimersByTimeAsync(0);

      // Abort while sleeping between retries
      controller.abort();

      const result = await promise;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.isAborted).toBe(true);
        expect(result.error.message).toBe('Request aborted');
      }
    });

    it('aborts during retry sleep after a network error', async () => {
      const controller = new AbortController();

      // First attempt throws a network error
      vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const promise = resilientFetch('/api/data', {
        signal: controller.signal,
        retries: 2,
        retryDelay: 5000,
      });

      // Let the first attempt complete and enter the network-error retry sleep
      await vi.advanceTimersByTimeAsync(0);

      // Abort while sleeping between retries
      controller.abort();

      const result = await promise;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.isAborted).toBe(true);
        expect(result.error.message).toBe('Request aborted');
      }
    });
  });

  // -----------------------------------------------------------------------
  // Timeout
  // -----------------------------------------------------------------------
  describe('timeout', () => {
    it('returns timeout error when request exceeds timeout', async () => {
      // Make fetch hang indefinitely
      vi.mocked(fetch).mockImplementationOnce(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted', 'AbortError'));
            });
          }),
      );

      const promise = resilientFetch('/api/slow', {
        timeout: 3000,
        retries: 0,
      });

      await vi.advanceTimersByTimeAsync(3000);

      const result = await promise;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Request timed out');
        expect(result.error.isAborted).toBe(false);
        expect(result.error.status).toBe(0);
      }
    });

    it('uses default 10s timeout', async () => {
      vi.mocked(fetch).mockImplementationOnce(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted', 'AbortError'));
            });
          }),
      );

      const promise = resilientFetch('/api/slow', { retries: 0 });

      // Advance just under 10s -- should still be pending
      await vi.advanceTimersByTimeAsync(9999);
      // Now cross the 10s threshold
      await vi.advanceTimersByTimeAsync(1);

      const result = await promise;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Request timed out');
      }
    });
  });

  // -----------------------------------------------------------------------
  // Error normalization
  // -----------------------------------------------------------------------
  describe('error normalization', () => {
    it('normalizes network TypeError to FetchError', async () => {
      vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));

      const promise = resilientFetch('/api/data', {
        retries: 0,
      });

      const result = await promise;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.status).toBe(0);
        expect(result.error.message).toBe('Failed to fetch');
        expect(result.error.isRetryable).toBe(true);
        expect(result.error.isAborted).toBe(false);
      }
    });

    it('includes response body text as error message for HTTP errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        textResponse('{"error":"quota_exceeded"}', 429),
      );

      const result = await resilientFetch('/api/data');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.status).toBe(429);
        expect(result.error.message).toBe('{"error":"quota_exceeded"}');
      }
    });

    it('falls back to HTTP status text when body is empty', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response('', { status: 401 }),
      );

      const result = await resilientFetch('/api/data');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.status).toBe(401);
        expect(result.error.message).toBe('HTTP 401');
      }
    });

    it('returns consistent shape for all error paths', async () => {
      // Network error path
      vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Network down'));

      const result = await resilientFetch('/api/data', { retries: 0 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        const err: FetchError = result.error;
        expect(err).toHaveProperty('status');
        expect(err).toHaveProperty('message');
        expect(err).toHaveProperty('isRetryable');
        expect(err).toHaveProperty('isAborted');
        expect(typeof err.status).toBe('number');
        expect(typeof err.message).toBe('string');
        expect(typeof err.isRetryable).toBe('boolean');
        expect(typeof err.isAborted).toBe('boolean');
      }
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------
  describe('edge cases', () => {
    it('works with retries set to 0 (no retries)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        textResponse('Server Error', 500),
      );

      const result = await resilientFetch('/api/data', { retries: 0 });

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.status).toBe(500);
      }
    });

    it('returns error when response.json() throws on 200 OK (non-JSON body)', async () => {
      // Server returns 200 with a non-JSON body (e.g. plain text / HTML)
      // The implementation treats JSON parse failures as "server temporarily
      // unavailable (recompiling)" and marks them retryable, since this
      // commonly happens during Next.js HMR recompilation.
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response('not json', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        }),
      );

      const result = await resilientFetch('/api/data', { retries: 0 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.status).toBe(200);
        expect(result.error.isRetryable).toBe(true);
        expect(result.error.isAborted).toBe(false);
        expect(result.error.message).toContain('Server temporarily unavailable');
      }
    });

    it('defaults to GET method', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ ok: true }));

      await resilientFetch('/api/data');

      const [, init] = vi.mocked(fetch).mock.calls[0];
      expect(init?.method).toBe('GET');
    });
  });
});
