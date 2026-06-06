/**
 * Error templates and formatting utilities.
 * Extracted from exceptions.ts for max-lines compliance.
 *
 * IMPORTANT: This file must NOT import from exceptions.ts to avoid circular
 * dependencies. It duplicates ErrorCategory values as string literals.
 */

// Duplicate ErrorCategory values to break circular dependency.
// These MUST stay in sync with the ErrorCategory enum in exceptions.ts.
const CAT_CONFIGURATION = "CONFIGURATION";
const CAT_VALIDATION = "VALIDATION";
const CAT_RUNTIME = "RUNTIME";
const CAT_INTERNAL = "INTERNAL";

type CategoryString = "CONFIGURATION" | "VALIDATION" | "RUNTIME" | "EXTERNAL" | "INTERNAL";

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  CONFIGURATION: "Configuration or setup issue",
  VALIDATION: "Input validation failure",
  RUNTIME: "Runtime execution error",
  EXTERNAL: "External service or dependency failure",
  INTERNAL: "Internal error (please report as a bug)",
};

// ============================================================================
// Error Templates
// ============================================================================

export interface ErrorTemplateContext {
  [key: string]: string | number | boolean | undefined | null;
}

export interface ErrorTemplate {
  pattern: string;
  category: CategoryString;
  defaultNextSteps?: string[];
  defaultSuggestions?: string[];
}

export const ERROR_TEMPLATES = {
  MISSING_REQUIRED_FLAG: {
    pattern: "Missing required flag: {{flag}}",
    category: CAT_VALIDATION,
    defaultNextSteps: ["Add the missing flag to your command", "Run with --help to see all available options"],
  },
  INVALID_FLAG_VALUE: {
    pattern: "Invalid value for {{flag}}: {{value}}. Expected {{expected}}",
    category: CAT_VALIDATION,
    defaultNextSteps: ["Check the expected format for this flag", "Run with --help for usage information"],
  },
  FILE_NOT_FOUND: {
    pattern: "File not found: {{path}}",
    category: CAT_CONFIGURATION,
    defaultNextSteps: ["Verify the file path is correct", "Check that the file exists and is readable"],
  },
  PROCESS_NOT_FOUND: {
    pattern: "Process entry file not found: {{path}}",
    category: CAT_CONFIGURATION,
    defaultNextSteps: [
      "Ensure the path is correct and points to a valid JS/TS module",
      "Check that the file has been compiled if using TypeScript",
    ],
  },
  EXPORT_NOT_FOUND: {
    pattern: "Process module {{path}} does not export '{{exportName}}'",
    category: CAT_CONFIGURATION,
    defaultNextSteps: [
      "Check available exports in your module",
      "Use --entry {{path}}#default for default export",
    ],
    defaultSuggestions: ["Did you mean to use a different export name?"],
  },
  EFFECT_NOT_FOUND: {
    pattern: "Effect {{effectId}} not found at {{runDir}}",
    category: CAT_VALIDATION,
    defaultNextSteps: ["Verify the effect ID is correct", "Run task:list to see available effects"],
  },
  EFFECT_WRONG_STATUS: {
    pattern: "Effect {{effectId}} is not {{expectedStatus}} (current status={{actualStatus}})",
    category: CAT_VALIDATION,
    defaultNextSteps: ["Check the current effect status with task:show", "Ensure you're operating on the correct effect"],
  },
  RUN_NOT_FOUND: {
    pattern: "Run directory not found: {{runDir}}",
    category: CAT_CONFIGURATION,
    defaultNextSteps: ["Verify the run directory path", "Ensure the run has been created with run:create"],
  },
  JSON_PARSE_ERROR: {
    pattern: "Failed to parse {{file}} as JSON: {{error}}",
    category: CAT_VALIDATION,
    defaultNextSteps: ["Check that the file contains valid JSON", "Validate JSON syntax with a linter"],
  },
  MISSING_PROCESS_CONTEXT: {
    pattern: "No active process context found on the current async call stack",
    category: CAT_RUNTIME,
    defaultNextSteps: [
      "Ensure you are calling this from within a babysitter process function",
      "Check that async context is properly maintained",
    ],
  },
  INVOCATION_COLLISION: {
    pattern: "Invocation key {{invocationKey}} is already in use within this run",
    category: CAT_RUNTIME,
    defaultNextSteps: [
      "Ensure unique invocation keys for each task invocation",
      "Check for duplicate task calls in your process",
    ],
  },
} as const satisfies Record<string, ErrorTemplate>;

export type ErrorTemplateKey = keyof typeof ERROR_TEMPLATES;

export function interpolateTemplate(pattern: string, context: ErrorTemplateContext): string {
  return pattern.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = context[key as keyof ErrorTemplateContext];
    if (value === undefined || value === null) return match;
    return String(value);
  });
}

export function createErrorMessage(templateKey: ErrorTemplateKey, context: ErrorTemplateContext): string {
  const template = ERROR_TEMPLATES[templateKey];
  return interpolateTemplate(template.pattern, context);
}

// ============================================================================
// Error Formatting Helpers
// ============================================================================

export interface FormatErrorOptions {
  colors?: boolean;
  includeStack?: boolean;
  prefix?: string;
}

/** Shape we duck-type against to avoid importing BabysitterRuntimeError (circular) */
interface BabysitterLikeError extends Error {
  category?: string;
  suggestions?: string[];
  nextSteps?: string[];
  details?: Record<string, unknown>;
}

function asBabysitterLike(error: Error): BabysitterLikeError | undefined {
  const e = error as BabysitterLikeError;
  if ("category" in e && "suggestions" in e && "nextSteps" in e) return e;
  return undefined;
}

export function formatErrorWithContext(error: Error, options: FormatErrorOptions = {}): string {
  const { colors = false, includeStack = false, prefix = "" } = options;
  const lines: string[] = [];

  const red = colors ? (s: string) => `\x1b[31m${s}\x1b[0m` : (s: string) => s;
  const yellow = colors ? (s: string) => `\x1b[33m${s}\x1b[0m` : (s: string) => s;
  const cyan = colors ? (s: string) => `\x1b[36m${s}\x1b[0m` : (s: string) => s;
  const dim = colors ? (s: string) => `\x1b[2m${s}\x1b[0m` : (s: string) => s;
  const bold = colors ? (s: string) => `\x1b[1m${s}\x1b[0m` : (s: string) => s;

  const bErr = asBabysitterLike(error);
  const category = bErr?.category ?? CAT_INTERNAL;
  const categoryLabel = CATEGORY_DESCRIPTIONS[category] ?? "Unknown error category";

  lines.push(`${prefix}${red(bold("Error:"))} ${error.message}`);
  lines.push(`${prefix}${dim(`[${error.name}] Category: ${categoryLabel}`)}`);

  if (bErr?.suggestions && bErr.suggestions.length > 0) {
    lines.push("");
    lines.push(`${prefix}${yellow("Did you mean?")}`);
    for (const suggestion of bErr.suggestions) lines.push(`${prefix}  - ${suggestion}`);
  }

  if (bErr?.nextSteps && bErr.nextSteps.length > 0) {
    lines.push("");
    lines.push(`${prefix}${cyan("Next Steps:")}`);
    for (const step of bErr.nextSteps) lines.push(`${prefix}  - ${step}`);
  }

  if (includeStack && error.stack) {
    lines.push("");
    lines.push(`${prefix}${dim("Stack trace:")}`);
    for (const stackLine of error.stack.split("\n").slice(1)) lines.push(`${prefix}${dim(stackLine)}`);
  }

  return lines.join("\n");
}

export function formatNextSteps(nextSteps: string[], options: { prefix?: string; colors?: boolean } = {}): string {
  const { prefix = "", colors = false } = options;
  const cyan = colors ? (s: string) => `\x1b[36m${s}\x1b[0m` : (s: string) => s;
  if (nextSteps.length === 0) return "";
  const lines = [`${prefix}${cyan("Next Steps:")}`];
  for (const step of nextSteps) lines.push(`${prefix}  - ${step}`);
  return lines.join("\n");
}

export interface StructuredError {
  name: string;
  message: string;
  category: string;
  categoryDescription: string;
  suggestions: string[];
  nextSteps: string[];
  details?: Record<string, unknown>;
  stack?: string;
}

export function toStructuredError(error: Error, includeStack = false): StructuredError {
  const bErr = asBabysitterLike(error);
  const category = bErr?.category ?? CAT_INTERNAL;
  return {
    name: error.name,
    message: error.message,
    category,
    categoryDescription: CATEGORY_DESCRIPTIONS[category] ?? "Unknown error category",
    suggestions: bErr?.suggestions ?? [],
    nextSteps: bErr?.nextSteps ?? [],
    details: bErr?.details,
    stack: includeStack ? error.stack : undefined,
  };
}
