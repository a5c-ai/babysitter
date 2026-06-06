/**
 * JS/TS REPL Tool (GAP-TOOLS-007).
 *
 * Provides sandboxed JavaScript expression evaluation using Node's
 * built-in `vm` module. Designed for safe, isolated evaluation of
 * expressions within agent workflows.
 */

import { createContext, runInNewContext, type Context } from 'node:vm';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReplResult {
  output: string;
  error?: string;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Evaluate a JavaScript expression in a sandboxed context.
 * Returns the result as a string, or captures the error.
 */
export function evaluateExpression(
  code: string,
  timeoutMs: number = 5000,
  sandbox?: Context,
): ReplResult {
  const start = performance.now();

  try {
    const ctx = sandbox ?? createReplSandbox();
    const result = runInNewContext(code, ctx, { timeout: timeoutMs });
    const durationMs = Math.round(performance.now() - start);

    return {
      output: formatValue(result),
      durationMs,
    };
  } catch (err) {
    const durationMs = Math.round(performance.now() - start);
    const message = err instanceof Error ? err.message : String(err);

    return {
      output: '',
      error: message,
      durationMs,
    };
  }
}

/**
 * Format a REPL result for display.
 */
export function formatReplResult(result: ReplResult): string {
  if (result.error) {
    return `Error (${result.durationMs}ms): ${result.error}`;
  }
  return `${result.output} (${result.durationMs}ms)`;
}

/**
 * Create a reusable sandbox context with optional global bindings.
 * The sandbox provides basic JavaScript builtins but no Node.js APIs
 * (no require, no process, no filesystem access).
 */
export function createReplSandbox(
  globals?: Record<string, unknown>,
): Context {
  const sandbox: Record<string, unknown> = {
    // Safe builtins
    Math,
    Date,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Map,
    Set,
    WeakMap,
    WeakSet,
    Promise,
    Symbol,
    Error,
    TypeError,
    RangeError,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    encodeURIComponent,
    decodeURIComponent,
    encodeURI,
    decodeURI,
    console: {
      log: (...args: unknown[]) => args.map(formatValue).join(' '),
    },
    ...globals,
  };

  return createContext(sandbox);
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function formatValue(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
