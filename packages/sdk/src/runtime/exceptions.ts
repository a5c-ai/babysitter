import { EffectAction, SerializedEffectError } from "./types";
import { toParallelPendingPayload, type ParallelBatch } from "../tasks/batching";

// ============================================================================
// Error Categories
// ============================================================================

/**
 * Error category enum for classifying errors by their source and type.
 * This helps users understand the nature of errors and how to address them.
 */
export enum ErrorCategory {
  /** Configuration errors - issues with settings, environment, or setup */
  Configuration = "CONFIGURATION",
  /** Validation errors - input data or parameter validation failures */
  Validation = "VALIDATION",
  /** Runtime errors - errors during execution of processes or tasks */
  Runtime = "RUNTIME",
  /** External errors - failures from external services, APIs, or dependencies */
  External = "EXTERNAL",
  /** Internal errors - unexpected internal failures, bugs, or invariant violations */
  Internal = "INTERNAL",
}

/**
 * Human-readable descriptions for each error category
 */
export const ERROR_CATEGORY_DESCRIPTIONS: Record<ErrorCategory, string> = {
  [ErrorCategory.Configuration]: "Configuration or setup issue",
  [ErrorCategory.Validation]: "Input validation failure",
  [ErrorCategory.Runtime]: "Runtime execution error",
  [ErrorCategory.External]: "External service or dependency failure",
  [ErrorCategory.Internal]: "Internal error (please report as a bug)",
};

// ============================================================================
// Error Templates
// ============================================================================

/**
 * Context variables that can be interpolated into error templates
 */
export interface ErrorTemplateContext {
  [key: string]: string | number | boolean | undefined | null;
}

/**
 * Error template definition with message pattern and default context
 */
export interface ErrorTemplate {
  /** Template string with {{variable}} placeholders */
  pattern: string;
  /** Error category for this template */
  category: ErrorCategory;
  /** Default next steps for this error type */
  defaultNextSteps?: string[];
  /** Default suggestions for this error type */
  defaultSuggestions?: string[];
}

/**
 * Built-in error templates for common error scenarios
 */
export const ERROR_TEMPLATES = {
  MISSING_REQUIRED_FLAG: {
    pattern: "Missing required flag: {{flag}}",
    category: ErrorCategory.Validation,
    defaultNextSteps: ["Add the missing flag to your command", "Run with --help to see all available options"],
  },
  INVALID_FLAG_VALUE: {
    pattern: "Invalid value for {{flag}}: {{value}}. Expected {{expected}}",
    category: ErrorCategory.Validation,
    defaultNextSteps: ["Check the expected format for this flag", "Run with --help for usage information"],
  },
  FILE_NOT_FOUND: {
    pattern: "File not found: {{path}}",
    category: ErrorCategory.Configuration,
    defaultNextSteps: ["Verify the file path is correct", "Check that the file exists and is readable"],
  },
  PROCESS_NOT_FOUND: {
    pattern: "Process entry file not found: {{path}}",
    category: ErrorCategory.Configuration,
    defaultNextSteps: [
      "Ensure the path is correct and points to a valid JS/TS module",
      "Check that the file has been compiled if using TypeScript",
    ],
  },
  EXPORT_NOT_FOUND: {
    pattern: "Process module {{path}} does not export '{{exportName}}'",
    category: ErrorCategory.Configuration,
    defaultNextSteps: [
      "Check available exports in your module",
      "Use --entry {{path}}#default for default export",
    ],
    defaultSuggestions: ["Did you mean to use a different export name?"],
  },
  EFFECT_NOT_FOUND: {
    pattern: "Effect {{effectId}} not found at {{runDir}}",
    category: ErrorCategory.Validation,
    defaultNextSteps: ["Verify the effect ID is correct", "Run task:list to see available effects"],
  },
  EFFECT_WRONG_STATUS: {
    pattern: "Effect {{effectId}} is not {{expectedStatus}} (current status={{actualStatus}})",
    category: ErrorCategory.Validation,
    defaultNextSteps: ["Check the current effect status with task:show", "Ensure you're operating on the correct effect"],
  },
  RUN_NOT_FOUND: {
    pattern: "Run directory not found: {{runDir}}",
    category: ErrorCategory.Configuration,
    defaultNextSteps: ["Verify the run directory path", "Ensure the run has been created with run:create"],
  },
  JSON_PARSE_ERROR: {
    pattern: "Failed to parse {{file}} as JSON: {{error}}",
    category: ErrorCategory.Validation,
    defaultNextSteps: ["Check that the file contains valid JSON", "Validate JSON syntax with a linter"],
  },
  MISSING_PROCESS_CONTEXT: {
    pattern: "No active process context found on the current async call stack",
    category: ErrorCategory.Runtime,
    defaultNextSteps: [
      "Ensure you are calling this from within a babysitter process function",
      "Check that async context is properly maintained",
    ],
  },
  INVOCATION_COLLISION: {
    pattern: "Invocation key {{invocationKey}} is already in use within this run",
    category: ErrorCategory.Runtime,
    defaultNextSteps: [
      "Ensure unique invocation keys for each task invocation",
      "Check for duplicate task calls in your process",
    ],
  },
} as const satisfies Record<string, ErrorTemplate>;

export type ErrorTemplateKey = keyof typeof ERROR_TEMPLATES;

/**
 * Interpolates context variables into a template pattern
 */
export function interpolateTemplate(pattern: string, context: ErrorTemplateContext): string {
  return pattern.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = context[key as keyof ErrorTemplateContext];
    if (value === undefined || value === null) {
      return match; // Keep placeholder if no value provided
    }
    return String(value);
  });
}

/**
 * Creates an error message from a template and context
 */
export function createErrorMessage(templateKey: ErrorTemplateKey, context: ErrorTemplateContext): string {
  const template = ERROR_TEMPLATES[templateKey];
  return interpolateTemplate(template.pattern, context);
}

// ============================================================================
// "Did You Mean?" Suggestions
// ============================================================================

/**
 * Common typos and their corrections for CLI commands
 */
const COMMAND_TYPOS: Record<string, string[]> = {
  "run:create": ["run:creat", "run:craete", "runcreate", "create:run", "run-create"],
  "run:status": ["run:stat", "run:staus", "runstatus", "status:run", "run-status"],
  "run:iterate": ["run:iter", "run:itterate", "runiterate", "iterate:run", "run-iterate"],
  "run:events": ["run:event", "runevents", "events:run", "run-events"],
  "run:rebuild-state": ["run:rebuild", "run:rebuildstate", "rebuild-state", "run-rebuild-state"],
  "run:repair-journal": ["run:repair", "run:repairjournal", "repair-journal", "run-repair-journal"],
  "task:post": ["task:pst", "taskpost", "post:task", "task-post"],
  "task:list": ["task:lst", "tasklist", "list:task", "task-list", "tasks:list"],
  "task:show": ["task:shw", "taskshow", "show:task", "task-show"],
};

/**
 * Common typos and their corrections for CLI flags
 */
const FLAG_TYPOS: Record<string, string[]> = {
  "--runs-dir": ["--runsdir", "--run-dir", "--rundir", "-runs-dir"],
  "--process-id": ["--processid", "--process_id", "-process-id"],
  "--entry": ["--enrty", "--entyr", "-entry"],
  "--inputs": ["--input", "--inpust", "-inputs"],
  "--json": ["--JSON", "-json", "--jsn"],
  "--dry-run": ["--dryrun", "--dry_run", "-dry-run"],
  "--verbose": ["--verbos", "-verbose", "--vebrose"],
  "--status": ["--staus", "--stats", "-status"],
  "--pending": ["--peding", "-pending"],
};

/**
 * Computes Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Suggests corrections for a potentially misspelled command
 */
export function suggestCommand(input: string): string | undefined {
  const normalizedInput = input.toLowerCase().trim();

  // Check direct typo mappings first
  for (const [correct, typos] of Object.entries(COMMAND_TYPOS)) {
    if (typos.includes(normalizedInput)) {
      return correct;
    }
  }

  // Fall back to Levenshtein distance
  const commands = Object.keys(COMMAND_TYPOS);
  let bestMatch: string | undefined;
  let bestDistance = Infinity;

  for (const command of commands) {
    const distance = levenshteinDistance(normalizedInput, command);
    if (distance < bestDistance && distance <= 3) {
      bestDistance = distance;
      bestMatch = command;
    }
  }

  return bestMatch;
}

/**
 * Suggests corrections for a potentially misspelled flag
 */
export function suggestFlag(input: string): string | undefined {
  const normalizedInput = input.toLowerCase().trim();

  // Check direct typo mappings first
  for (const [correct, typos] of Object.entries(FLAG_TYPOS)) {
    if (typos.includes(normalizedInput)) {
      return correct;
    }
  }

  // Fall back to Levenshtein distance
  const flags = Object.keys(FLAG_TYPOS);
  let bestMatch: string | undefined;
  let bestDistance = Infinity;

  for (const flag of flags) {
    const distance = levenshteinDistance(normalizedInput, flag);
    if (distance < bestDistance && distance <= 3) {
      bestDistance = distance;
      bestMatch = flag;
    }
  }

  return bestMatch;
}

/**
 * Generic suggestion helper that finds the closest match from a list
 */
export function suggestFix(input: string, validOptions: string[], maxDistance = 3): string | undefined {
  const normalizedInput = input.toLowerCase().trim();
  let bestMatch: string | undefined;
  let bestDistance = Infinity;

  for (const option of validOptions) {
    const distance = levenshteinDistance(normalizedInput, option.toLowerCase());
    if (distance < bestDistance && distance <= maxDistance) {
      bestDistance = distance;
      bestMatch = option;
    }
  }

  return bestMatch;
}

// ============================================================================
// Error Details and Context
// ============================================================================

export interface BabysitterErrorDetails {
  [key: string]: unknown;
}

/**
 * Extended error options including category and suggestions
 */
export interface BabysitterErrorOptions {
  /** Error category for classification */
  category?: ErrorCategory;
  /** Suggested fixes or "did you mean" hints */
  suggestions?: string[];
  /** Actionable next steps for the user */
  nextSteps?: string[];
  /** Additional context details */
  details?: BabysitterErrorDetails;
  /** The original error if this wraps another error */
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

    // Handle backward compatibility: if options looks like old-style details object
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

  /**
   * Creates an error from a template
   */
  static fromTemplate(
    name: string,
    templateKey: ErrorTemplateKey,
    context: ErrorTemplateContext,
    additionalOptions?: Partial<BabysitterErrorOptions>
  ): BabysitterRuntimeError {
    const template = ERROR_TEMPLATES[templateKey] as ErrorTemplate;
    const message = interpolateTemplate(template.pattern, context);

    return new BabysitterRuntimeError(name, message, {
      category: additionalOptions?.category ?? template.category,
      suggestions: additionalOptions?.suggestions ?? template.defaultSuggestions ?? [],
      nextSteps: additionalOptions?.nextSteps ?? template.defaultNextSteps ?? [],
      details: { ...context, ...(additionalOptions?.details ?? {}) },
      cause: additionalOptions?.cause,
    });
  }
}

/**
 * Type guard to check if an object is BabysitterErrorOptions vs legacy details
 */
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

export class ParallelPendingError extends BabysitterIntrinsicError {
  readonly effects: EffectAction[];
  constructor(public readonly batch: ParallelBatch) {
    super("ParallelPendingError", "One or more parallel invocations are pending", {
      details: {
        payload: toParallelPendingPayload(batch),
        effects: batch.actions,
      },
    });
    this.effects = batch.actions;
  }
}

export class InvocationCollisionError extends BabysitterRuntimeError {
  constructor(public readonly invocationKey: string) {
    super("InvocationCollisionError", `Invocation key ${invocationKey} is already in use within this run`, {
      category: ErrorCategory.Runtime,
      details: { invocationKey },
      nextSteps: [
        "Ensure unique invocation keys for each task invocation",
        "Check for duplicate task calls in your process",
      ],
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
      nextSteps: [
        "Ensure you are calling this from within a babysitter process function",
        "Check that async context is properly maintained",
      ],
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
      nextSteps: [
        "Provide a valid duration (positive number of milliseconds)",
        "Or provide a valid Date object or ISO 8601 date string",
      ],
    });
  }
}

// ============================================================================
// Error Formatting Helpers
// ============================================================================

/**
 * Options for formatting errors
 */
export interface FormatErrorOptions {
  /** Whether to include ANSI color codes */
  colors?: boolean;
  /** Whether to include the stack trace */
  includeStack?: boolean;
  /** Prefix for the error output */
  prefix?: string;
}

/**
 * Formats an error with full context including category, suggestions, and next steps
 */
export function formatErrorWithContext(error: Error, options: FormatErrorOptions = {}): string {
  const { colors = false, includeStack = false, prefix = "" } = options;
  const lines: string[] = [];

  // Color helpers (no-op if colors disabled)
  const red = colors ? (s: string) => `\x1b[31m${s}\x1b[0m` : (s: string) => s;
  const yellow = colors ? (s: string) => `\x1b[33m${s}\x1b[0m` : (s: string) => s;
  const cyan = colors ? (s: string) => `\x1b[36m${s}\x1b[0m` : (s: string) => s;
  const dim = colors ? (s: string) => `\x1b[2m${s}\x1b[0m` : (s: string) => s;
  const bold = colors ? (s: string) => `\x1b[1m${s}\x1b[0m` : (s: string) => s;

  // Main error line
  const isBabysitterError = error instanceof BabysitterRuntimeError;
  const category = isBabysitterError ? error.category : ErrorCategory.Internal;
  const categoryLabel = ERROR_CATEGORY_DESCRIPTIONS[category];

  lines.push(`${prefix}${red(bold("Error:"))} ${error.message}`);
  lines.push(`${prefix}${dim(`[${error.name}] Category: ${categoryLabel}`)}`);

  // Suggestions ("Did you mean?")
  if (isBabysitterError && error.suggestions.length > 0) {
    lines.push("");
    lines.push(`${prefix}${yellow("Did you mean?")}`);
    for (const suggestion of error.suggestions) {
      lines.push(`${prefix}  - ${suggestion}`);
    }
  }

  // Next steps
  if (isBabysitterError && error.nextSteps.length > 0) {
    lines.push("");
    lines.push(`${prefix}${cyan("Next Steps:")}`);
    for (const step of error.nextSteps) {
      lines.push(`${prefix}  - ${step}`);
    }
  }

  // Stack trace
  if (includeStack && error.stack) {
    lines.push("");
    lines.push(`${prefix}${dim("Stack trace:")}`);
    const stackLines = error.stack.split("\n").slice(1); // Skip the error message line
    for (const stackLine of stackLines) {
      lines.push(`${prefix}${dim(stackLine)}`);
    }
  }

  return lines.join("\n");
}

/**
 * Formats next steps as a bulleted list
 */
export function formatNextSteps(nextSteps: string[], options: { prefix?: string; colors?: boolean } = {}): string {
  const { prefix = "", colors = false } = options;
  const cyan = colors ? (s: string) => `\x1b[36m${s}\x1b[0m` : (s: string) => s;

  if (nextSteps.length === 0) {
    return "";
  }

  const lines = [`${prefix}${cyan("Next Steps:")}`];
  for (const step of nextSteps) {
    lines.push(`${prefix}  - ${step}`);
  }
  return lines.join("\n");
}

/**
 * Structured error output for JSON formatting
 */
export interface StructuredError {
  name: string;
  message: string;
  category: ErrorCategory;
  categoryDescription: string;
  suggestions: string[];
  nextSteps: string[];
  details?: BabysitterErrorDetails;
  stack?: string;
}

/**
 * Converts an error to a structured JSON-serializable format
 */
export function toStructuredError(error: Error, includeStack = false): StructuredError {
  const isBabysitterError = error instanceof BabysitterRuntimeError;

  return {
    name: error.name,
    message: error.message,
    category: isBabysitterError ? error.category : ErrorCategory.Internal,
    categoryDescription:
      ERROR_CATEGORY_DESCRIPTIONS[isBabysitterError ? error.category : ErrorCategory.Internal],
    suggestions: isBabysitterError ? error.suggestions : [],
    nextSteps: isBabysitterError ? error.nextSteps : [],
    details: isBabysitterError ? error.details : undefined,
    stack: includeStack ? error.stack : undefined,
  };
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
  if (data?.stack) {
    err.stack = data.stack;
  }
  if (data?.data !== undefined) {
    (err as ErrorWithData).data = data.data;
  }
  return err;
}
