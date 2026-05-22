/**
 * Centralized error handling utilities.
 *
 * - `AppError` – typed error with HTTP status and machine-readable code.
 * - `normalizeError` – converts any thrown value (Error, string, object,
 *   undefined, etc.) into a consistent `{ message, code, status }` shape
 *   safe for API responses (never leaks stack traces).
 */
export declare class AppError extends Error {
    readonly code: string;
    readonly status: number;
    constructor(message: string, code: string, status: number);
}
export interface NormalizedError {
    message: string;
    code: string;
    status: number;
}
/**
 * Convert any thrown value into a consistent error shape.
 *
 * - `AppError` → preserves code & status.
 * - Standard `Error` → maps common system errors (ENOENT, EACCES, ENOTDIR)
 *   to appropriate HTTP status codes; defaults to 500.
 * - `string` → wraps as 500 internal error.
 * - Anything else (null, undefined, number, object) → generic 500.
 */
export declare function normalizeError(err: unknown): NormalizedError;
