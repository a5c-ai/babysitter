import { EffectAction, SerializedEffectError } from "./types";
import { toParallelPendingPayload, type ParallelBatch } from "../tasks/batching";
export { suggestCommand, suggestFlag, suggestFix } from "./errorSuggestions";

// Re-export templates and formatting from extracted module
export {
  ERROR_TEMPLATES,
  interpolateTemplate,
  createErrorMessage,
  formatErrorWithContext,
  formatNextSteps,
  toStructuredError,
} from "./errorTemplates";
export type {
  ErrorTemplateContext,
  ErrorTemplate,
  ErrorTemplateKey,
  FormatErrorOptions,
  StructuredError,
} from "./errorTemplates";

// ============================================================================
// Error Categories
// ============================================================================

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

// ============================================================================
// Error Details and Context
// ============================================================================

export interface BabysitterErrorDetails {
  [key: string]: unknown;
}

export interface BabysitterErrorOptions {
  category?: ErrorCategory;
  suggestions?: string[];
  nextSteps?: string[];
  details?: BabysitterErrorDetails;
  cause?: Error;
}

// ============================================================================
// Core Error Classes
// ============================================================================

export class BabysitterRuntimeError extends Error {
  readonly details?: BabysitterErrorDetails;
  readonly category: ErrorCategory;
  readonly suggestions: string[];
  readonly nextSteps: string[];

  constructor(name: string, message: string, options?: BabysitterErrorOptions | BabysitterErrorDetails) {
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
      if (opts?.cause) { this.cause = opts.cause; }
    }
  }

  static fromTemplate(
    name: string,
    templateKey: string,
    context: Record<string, string | number | boolean | undefined | null>,
    additionalOptions?: Partial<BabysitterErrorOptions>
  ): BabysitterRuntimeError {
    // Lazy-load to avoid circular dependency between exceptions.ts and errorTemplates.ts
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const templates = require("./errorTemplates") as typeof import("./errorTemplates");
    const template = templates.ERROR_TEMPLATES[templateKey as keyof typeof templates.ERROR_TEMPLATES];
    const message = templates.interpolateTemplate(template.pattern, context);
    return new BabysitterRuntimeError(name, message, {
      category: additionalOptions?.category ?? template.category,
      suggestions: additionalOptions?.suggestions ?? (template as Record<string, unknown>).defaultSuggestions as string[] ?? [],
      nextSteps: additionalOptions?.nextSteps ?? template.defaultNextSteps ?? [],
      details: { ...context, ...(additionalOptions?.details ?? {}) },
      cause: additionalOptions?.cause,
    });
  }
}

function isErrorOptions(obj: unknown): obj is BabysitterErrorOptions {
  if (!obj || typeof obj !== "object") return false;
  const keys = Object.keys(obj);
  const optionKeys = ["category", "suggestions", "nextSteps", "details", "cause"];
  return keys.some((key) => optionKeys.includes(key));
}

export class BabysitterIntrinsicError extends BabysitterRuntimeError {
  readonly isIntrinsic = true;
  constructor(name: string, message: string, options?: BabysitterErrorOptions | BabysitterErrorDetails) {
    super(name, message, options);
  }
}

export class EffectRequestedError extends BabysitterIntrinsicError {
  constructor(public readonly action: EffectAction) {
    super("EffectRequestedError", `Effect ${action.effectId} requested`, { details: { action } });
  }
}

export class EffectPendingError extends BabysitterIntrinsicError {
  constructor(public readonly action: EffectAction) {
    super("EffectPendingError", `Effect ${action.effectId} pending`, { details: { action } });
  }
}

export class EffectCancelledError extends BabysitterIntrinsicError {
  constructor(public readonly effectId: string, public readonly reason?: string) {
    super("EffectCancelledError", `Effect ${effectId} cancelled${reason ? `: ${reason}` : ""}`, { details: { effectId, reason } });
  }
}

export class ParallelPendingError extends BabysitterIntrinsicError {
  readonly effects: EffectAction[];
  constructor(public readonly batch: ParallelBatch) {
    super("ParallelPendingError", "One or more parallel invocations are pending", {
      details: { payload: toParallelPendingPayload(batch), effects: batch.actions },
    });
    this.effects = batch.actions;
  }
}

export class InvocationCollisionError extends BabysitterRuntimeError {
  constructor(public readonly invocationKey: string) {
    super("InvocationCollisionError", `Invocation key ${invocationKey} is already in use within this run`, {
      category: ErrorCategory.Runtime, details: { invocationKey },
      nextSteps: ["Ensure unique invocation keys for each task invocation", "Check for duplicate task calls in your process"],
    });
  }
}

export class RunFailedError extends BabysitterRuntimeError {
  constructor(message: string, options?: BabysitterErrorOptions | BabysitterErrorDetails) {
    super("RunFailedError", message, options);
  }
}

export class MissingProcessContextError extends BabysitterRuntimeError {
  constructor() {
    super("MissingProcessContextError", "No active process context found on the current async call stack", {
      category: ErrorCategory.Runtime,
      nextSteps: ["Ensure you are calling this from within a babysitter process function", "Check that async context is properly maintained"],
    });
  }
}

export class InvalidTaskDefinitionError extends BabysitterRuntimeError {
  constructor(reason: string) {
    super("InvalidTaskDefinitionError", reason, {
      category: ErrorCategory.Validation,
      nextSteps: ["Review the task definition requirements", "Check the task schema documentation"],
    });
  }
}

export class InvalidSleepTargetError extends BabysitterRuntimeError {
  constructor(value: string | number) {
    super("InvalidSleepTargetError", `Invalid sleep target: ${value}`, {
      category: ErrorCategory.Validation,
      nextSteps: ["Provide a valid duration (positive number of milliseconds)", "Or provide a valid Date object or ISO 8601 date string"],
    });
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

export function isIntrinsicError(error: unknown): error is BabysitterIntrinsicError {
  return Boolean(error && typeof error === "object" && (error as BabysitterIntrinsicError).isIntrinsic);
}

export function isBabysitterError(error: unknown): error is BabysitterRuntimeError {
  return error instanceof BabysitterRuntimeError;
}

type ErrorWithData = Error & { data?: unknown };

export function rehydrateSerializedError(data?: SerializedEffectError): Error {
  const name = data?.name ?? "TaskError";
  const message = data?.message ?? "Task failed";
  const err = new Error(message);
  err.name = name;
  if (data?.stack) err.stack = data.stack;
  if (data?.data !== undefined) (err as ErrorWithData).data = data.data;
  return err;
}
