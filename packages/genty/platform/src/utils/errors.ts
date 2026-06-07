/**
 * Genty platform error types.
 *
 * These mirror the BabysitterRuntimeError / ErrorCategory from babysitter-sdk,
 * re-exported under genty-native names so the platform package can avoid
 * importing directly from the SDK.
 */

// ── Error Categories ──────────────────────────────────────────────────────

export enum ErrorCategory {
  Configuration = "CONFIGURATION",
  Validation = "VALIDATION",
  Runtime = "RUNTIME",
  External = "EXTERNAL",
  Internal = "INTERNAL",
}

export const ERROR_CATEGORY_DESCRIPTIONS: Record<ErrorCategory, string> = {
  [ErrorCategory.Configuration]: "Configuration or setup issue",
  [ErrorCategory.Validation]: "Input validation failure",
  [ErrorCategory.Runtime]: "Runtime execution error",
  [ErrorCategory.External]: "External service or dependency failure",
  [ErrorCategory.Internal]: "Internal error (please report as a bug)",
};

// ── Error Details ─────────────────────────────────────────────────────────

export interface GentyErrorDetails {
  [key: string]: unknown;
}

export interface GentyErrorOptions {
  category?: ErrorCategory;
  suggestions?: string[];
  nextSteps?: string[];
  details?: GentyErrorDetails;
  cause?: Error;
}

// ── Core Error Class ──────────────────────────────────────────────────────

function isErrorOptions(obj: unknown): obj is GentyErrorOptions {
  if (!obj || typeof obj !== "object") return false;
  const keys = Object.keys(obj);
  const optionKeys = ["category", "suggestions", "nextSteps", "details", "cause"];
  return keys.some((k) => optionKeys.includes(k));
}

/**
 * Base runtime error for the genty platform.
 *
 * API-compatible with BabysitterRuntimeError so existing catch blocks
 * and error-inspection code continue to work without changes.
 */
export class GentyRuntimeError extends Error {
  readonly details?: GentyErrorDetails;
  readonly category: ErrorCategory;
  readonly suggestions: string[];
  readonly nextSteps: string[];

  constructor(name: string, message: string, options?: GentyErrorOptions | GentyErrorDetails) {
    super(message);
    this.name = name;
    if (options && !isErrorOptions(options)) {
      this.details = options;
      this.category = ErrorCategory.Runtime;
      this.suggestions = [];
      this.nextSteps = [];
    } else {
      const opts = options;
      this.details = opts?.details;
      this.category = opts?.category ?? ErrorCategory.Runtime;
      this.suggestions = opts?.suggestions ?? [];
      this.nextSteps = opts?.nextSteps ?? [];
      if (opts?.cause) {
        this.cause = opts.cause;
      }
    }
  }
}

/**
 * Backward-compatible alias.
 * Existing code that references BabysitterRuntimeError will keep compiling.
 */
export { GentyRuntimeError as BabysitterRuntimeError };

/**
 * Type guard for GentyRuntimeError instances.
 */
export function isGentyError(err: unknown): err is GentyRuntimeError {
  return err instanceof GentyRuntimeError;
}

/** @deprecated Use isGentyError instead */
export { isGentyError as isBabysitterError };
