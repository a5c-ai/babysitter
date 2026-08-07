/**
 * Centralized error handling utilities.
 *
 * - `AppError` – typed error with HTTP status and machine-readable code.
 * - `normalizeError` – converts any thrown value (Error, string, object,
 *   undefined, etc.) into a consistent `{ message, code, status }` shape
 *   safe for API responses (never leaks stack traces).
 */

export class AppError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;

    // Fix prototype chain for instanceof checks (TS class extending Error)
    Object.setPrototypeOf(this, AppError.prototype);
  }
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
export function normalizeError(err: unknown): NormalizedError {
  // Already a well-typed AppError
  if (err instanceof AppError) {
    return { message: err.message, code: err.code, status: err.status };
  }

  // Standard Error (or subclass)
  if (err instanceof Error) {
    const nodeErr = err as NodeJS.ErrnoException;

    // Map common Node.js filesystem error codes
    if (nodeErr.code === "ENOENT") {
      return { message: "Resource not found", code: "NOT_FOUND", status: 404 };
    }
    if (nodeErr.code === "EACCES" || nodeErr.code === "EPERM") {
      return { message: "Permission denied", code: "PERMISSION_DENIED", status: 403 };
    }
    if (nodeErr.code === "ENOTDIR" || nodeErr.code === "EISDIR") {
      return { message: "Invalid resource path", code: "INVALID_PATH", status: 400 };
    }

    // SyntaxError from JSON.parse
    if (err instanceof SyntaxError) {
      return { message: "Failed to parse data", code: "PARSE_ERROR", status: 400 };
    }

    return { message: err.message || "Internal server error", code: "INTERNAL_ERROR", status: 500 };
  }

  // Plain string throw
  if (typeof err === "string") {
    return { message: err, code: "INTERNAL_ERROR", status: 500 };
  }

  // Anything else (null, undefined, number, object without Error prototype)
  return { message: "An unexpected error occurred", code: "UNKNOWN_ERROR", status: 500 };
}
