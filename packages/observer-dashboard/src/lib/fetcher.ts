// ---------------------------------------------------------------------------
// resilientFetch  --  shared HTTP client with retry, timeout & abort support
// ---------------------------------------------------------------------------

/** Normalized error shape returned on failure. */
export interface FetchError {
  /** HTTP status code, or 0 for network / timeout / abort errors. */
  status: number;
  /** Human-readable description of what went wrong. */
  message: string;
  /** Whether the request was (or could have been) retried. */
  isRetryable: boolean;
  /** Whether the request was cancelled via an AbortSignal. */
  isAborted: boolean;
}

/** Options accepted by {@link resilientFetch}. */
export interface FetchOptions {
  /** Optional external AbortSignal (e.g. from a hook cleanup). */
  signal?: AbortSignal;
  /** Maximum number of retry attempts for retryable errors (default 2). */
  retries?: number;
  /** Base delay in ms for exponential backoff (default 1000). */
  retryDelay?: number;
  /** Request timeout in ms (default 10000). */
  timeout?: number;
  /** HTTP method (default "GET"). */
  method?: string;
  /** Additional request headers. */
  headers?: Record<string, string>;
  /** Request body (stringified JSON, form data, etc.). */
  body?: string;
}

/** Discriminated union representing a successful or failed fetch. */
export type FetchResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: FetchError };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isRetryableStatus(status: number): boolean {
  // 5xx server errors are always retryable.
  // 404 is retryable because Next.js dev server returns transient 404s
  // during HMR recompilation when API route handlers are momentarily unavailable.
  return status >= 500 || status === 404;
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

/**
 * Detect if response text is HTML rather than JSON.
 * Next.js dev server can return various HTML fragments during HMR:
 * - Full HTML pages (<!DOCTYPE html>, <html>)
 * - Error fragments (<pre>missing required error components...</pre>)
 * - Script-only recovery pages (<script>...)
 */
function looksLikeHtml(text: string): boolean {
  const trimmed = text.trimStart();
  return (
    trimmed.startsWith("<!DOCTYPE") ||
    trimmed.startsWith("<html") ||
    trimmed.startsWith("<pre") ||
    trimmed.startsWith("<script") ||
    trimmed.startsWith("<div") ||
    trimmed.startsWith("<head")
  );
}

/**
 * Sleep for `ms` milliseconds. Resolves early (with rejection) when the
 * provided signal is aborted so we don't keep waiting between retries after
 * the caller has cancelled the request.
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      reject(signal!.reason ?? new DOMException("Aborted", "AbortError"));
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Create a merged AbortSignal that fires when *either* the timeout elapses
 * **or** the external signal is aborted.  Returns the merged signal together
 * with a cleanup function that **must** be called after every attempt to
 * prevent timer leaks.
 */
function createMergedSignal(
  timeout: number,
  externalSignal?: AbortSignal,
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timer: ReturnType<typeof setTimeout> | undefined = setTimeout(() => {
    controller.abort(new DOMException("Request timed out", "TimeoutError"));
  }, timeout);

  const onExternalAbort = () => {
    clearTimeout(timer);
    controller.abort(
      externalSignal!.reason ??
        new DOMException("Aborted", "AbortError"),
    );
  };

  if (externalSignal?.aborted) {
    clearTimeout(timer);
    controller.abort(
      externalSignal.reason ??
        new DOMException("Aborted", "AbortError"),
    );
  } else {
    externalSignal?.addEventListener("abort", onExternalAbort, { once: true });
  }

  const cleanup = () => {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  };

  return { signal: controller.signal, cleanup };
}

// ---------------------------------------------------------------------------
// ETag cache — stores last ETag + response body per URL for 304 handling
// ---------------------------------------------------------------------------

interface ETagCacheEntry<T = unknown> {
  etag: string;
  data: T;
}

const etagCache = new Map<string, ETagCacheEntry>();

// Limit ETag cache size to avoid unbounded growth
const MAX_ETAG_CACHE_SIZE = 100;

function pruneEtagCache(): void {
  if (etagCache.size <= MAX_ETAG_CACHE_SIZE) return;
  // Delete the oldest entries (first inserted)
  const keysToDelete = Array.from(etagCache.keys()).slice(0, etagCache.size - MAX_ETAG_CACHE_SIZE);
  for (const key of keysToDelete) {
    etagCache.delete(key);
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Perform an HTTP fetch with built-in **retry**, **timeout**, **abort**,
 * and **ETag** support.  Returns a discriminated-union result so callers
 * never need to catch exceptions.
 *
 * ETag behaviour:
 * - On successful responses with an ETag header, the response data and ETag
 *   are cached.  On subsequent requests to the same URL, an `If-None-Match`
 *   header is sent.  If the server returns 304, the cached data is returned
 *   without re-parsing JSON, saving bandwidth and CPU.
 *
 * Retry behaviour:
 * - Network errors and 5xx responses are retried up to `options.retries`
 *   times (default 2) with exponential backoff starting at
 *   `options.retryDelay` ms (default 1000).
 * - 4xx (client) errors are **not** retried.
 *
 * Abort / timeout:
 * - An internal AbortController enforces `options.timeout` (default 10 000 ms).
 * - If `options.signal` is provided it is merged with the internal timeout
 *   signal; aborting either one cancels the in-flight request immediately.
 *
 * @example
 * ```ts
 * const result = await resilientFetch<Run[]>("/api/runs");
 * if (result.ok) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export async function resilientFetch<T>(
  url: string,
  options: FetchOptions = {},
): Promise<FetchResult<T>> {
  const {
    signal: externalSignal,
    retries = 2,
    retryDelay = 1000,
    timeout = 10_000,
    method = "GET",
    headers: userHeaders,
    body,
  } = options;

  // Build headers, injecting If-None-Match for ETag-based caching
  const mergedHeaders: Record<string, string> = { ...userHeaders };
  const cachedEntry = etagCache.get(url);
  if (cachedEntry && method === "GET") {
    mergedHeaders["If-None-Match"] = cachedEntry.etag;
  }

  let lastError: FetchError | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    // Create a per-attempt merged signal (timeout + external abort).
    const { signal, cleanup } = createMergedSignal(timeout, externalSignal);

    try {
      const response = await fetch(url, {
        method,
        headers: mergedHeaders,
        body,
        signal,
      });

      // 304 Not Modified — return cached data without re-parsing
      if (response.status === 304 && cachedEntry) {
        cleanup();
        return { ok: true, data: cachedEntry.data as T, status: 304 };
      }

      if (response.ok) {
        // Guard against HTML responses served with 200 status (e.g. Next.js
        // serving a page shell during HMR when the API route is recompiling).
        const contentType = response.headers.get("Content-Type") || "";
        if (!contentType.includes("application/json") && contentType.includes("text/html")) {
          cleanup();
          // Treat as retryable — the API route will be back after recompilation.
          lastError = {
            status: response.status,
            message: "Server temporarily unavailable (recompiling)",
            isRetryable: true,
            isAborted: false,
          };
          if (attempt < retries) {
            const delay = retryDelay * Math.pow(2, attempt);
            await sleep(delay, externalSignal);
          }
          continue;
        }

        let data: T;
        try {
          data = (await response.json()) as T;
        } catch {
          // JSON parse failed — likely an HTML response that slipped past the
          // content-type check (e.g. "missing required error components").
          // Treat as retryable since the API will recover after recompilation.
          cleanup();
          lastError = {
            status: response.status,
            message: "Server temporarily unavailable (recompiling)",
            isRetryable: true,
            isAborted: false,
          };
          if (attempt < retries) {
            const delay = retryDelay * Math.pow(2, attempt);
            try {
              await sleep(delay, externalSignal);
            } catch {
              return { ok: false, error: { status: 0, message: "Request aborted", isRetryable: false, isAborted: true } };
            }
          }
          continue;
        }

        // Cache the ETag and response data for future 304 handling
        const etag = response.headers.get("ETag");
        if (etag) {
          etagCache.set(url, { etag, data });
          pruneEtagCache();
        }

        cleanup();
        return { ok: true, data, status: response.status };
      }

      // Non-OK response -- build an error object.
      const retryable = isRetryableStatus(response.status);
      let errorMessage: string;
      try {
        const text = await response.text();
        // Detect HTML responses (e.g. Next.js 404 page or "missing required
        // error components" during HMR) and replace with a clean message.
        if (text && looksLikeHtml(text)) {
          errorMessage = `Server temporarily unavailable (HTTP ${response.status})`;
        } else {
          errorMessage = text || `HTTP ${response.status}`;
        }
      } catch {
        errorMessage = `HTTP ${response.status}`;
      }

      cleanup();

      lastError = {
        status: response.status,
        message: errorMessage,
        isRetryable: retryable,
        isAborted: false,
      };

      // 4xx errors are not retried -- return immediately.
      if (!retryable) {
        return { ok: false, error: lastError };
      }

      // If this was the final attempt, don't sleep -- fall through to return.
      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt);
        await sleep(delay, externalSignal);
      }
    } catch (err: unknown) {
      cleanup();

      // Determine if this was a timeout by inspecting the merged signal's
      // abort reason.  We set a DOMException with name "TimeoutError" as
      // the reason in createMergedSignal, so we can reliably distinguish
      // timeout from user-initiated abort regardless of how the environment
      // surfaces the thrown error.
      if (isAbortError(err) || (err instanceof DOMException && err.name === "TimeoutError")) {
        const reason = signal.reason;
        const isTimeout =
          reason instanceof DOMException && reason.name === "TimeoutError";

        return {
          ok: false,
          error: {
            status: 0,
            message: isTimeout ? "Request timed out" : "Request aborted",
            isRetryable: false,
            isAborted: !isTimeout,
          },
        };
      }

      // Network error -- retryable.
      lastError = {
        status: 0,
        message: err instanceof Error ? err.message : "Network error",
        isRetryable: true,
        isAborted: false,
      };

      if (attempt < retries) {
        try {
          const delay = retryDelay * Math.pow(2, attempt);
          await sleep(delay, externalSignal);
        } catch {
          // Sleep was aborted -- the caller cancelled.
          return {
            ok: false,
            error: {
              status: 0,
              message: "Request aborted",
              isRetryable: false,
              isAborted: true,
            },
          };
        }
      }
    }
  }

  // All retries exhausted.
  return {
    ok: false,
    error: lastError ?? {
      status: 0,
      message: "Unknown error",
      isRetryable: false,
      isAborted: false,
    },
  };
}
