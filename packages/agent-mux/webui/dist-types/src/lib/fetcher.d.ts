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
export type FetchResult<T> = {
    ok: true;
    data: T;
    status: number;
} | {
    ok: false;
    error: FetchError;
};
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
export declare function resilientFetch<T>(url: string, options?: FetchOptions): Promise<FetchResult<T>>;
