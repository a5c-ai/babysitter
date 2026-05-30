import { ToolExecutionError, serializeToolError } from './types.js';
import type {
  ToolCallContext,
  ToolCallResult,
  ToolDescriptor,
  ToolDispatchPolicy,
  ToolDispatchRule,
  ToolExecutionPolicy,
  ToolExecutionLimits,
} from './types.js';
import type { ToolHookBridge } from './hooks.js';
import type { ToolRegistry } from './registry.js';

/* ------------------------------------------------------------------ */
/*  Minimal glob matcher (no external deps)                            */
/* ------------------------------------------------------------------ */

/**
 * Convert a simple glob pattern (supporting `*` and `?`) into a RegExp.
 *
 * This intentionally does NOT support `**`, brace expansion, or
 * character classes — tool names are flat identifiers, so `*` for
 * "any chars" and `?` for "single char" is sufficient.
 */
function globToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`);
}

/* ------------------------------------------------------------------ */
/*  ToolDispatcher                                                     */
/* ------------------------------------------------------------------ */

export type ToolExecutor = (
  tool: ToolDescriptor,
  context: ToolCallContext,
) => Promise<unknown>;

export interface ToolDispatcherOptions {
  registry: ToolRegistry;
  policy?: ToolDispatchPolicy;
  executionPolicy?: ToolExecutionPolicy;
  hooks?: ToolHookBridge;
}

/**
 * Resolves a tool call to the correct server using policy rules,
 * runs before/after hooks, and delegates actual execution to a
 * caller-supplied executor.
 */
export class ToolDispatcher {
  private readonly registry: ToolRegistry;
  private readonly policy: ToolDispatchPolicy;
  private readonly executionPolicy: ToolExecutionPolicy;
  private readonly hooks: ToolHookBridge | undefined;

  constructor(options: ToolDispatcherOptions) {
    this.registry = options.registry;
    this.policy = options.policy ?? { rules: [] };
    this.executionPolicy = options.executionPolicy ?? {
      defaultTimeoutMs: 120_000,
      defaultMaxOutputBytes: 50 * 1024 * 1024,
    };
    this.hooks = options.hooks;
  }

  /* ---------------------------------------------------------------- */
  /*  Policy helpers                                                   */
  /* ---------------------------------------------------------------- */

  /** Set or replace the full dispatch policy. */
  setPolicy(policy: ToolDispatchPolicy): void {
    this.policy.rules = policy.rules;
    this.policy.defaultServer = policy.defaultServer;
  }

  /** Add a single dispatch rule. */
  addRule(rule: ToolDispatchRule): void {
    this.policy.rules.push(rule);
    // Keep rules sorted by descending priority so resolution is stable.
    this.policy.rules.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  /* ---------------------------------------------------------------- */
  /*  Resolution                                                       */
  /* ---------------------------------------------------------------- */

  /**
   * Walk the policy rules (already sorted by priority) and return the
   * first matching server id, falling back to the tool's own server
   * field, then the policy default.
   */
  resolveServer(toolName: string): string | undefined {
    for (const rule of this.policy.rules) {
      if (globToRegex(rule.match).test(toolName)) {
        return rule.server;
      }
    }

    // Fall back to the descriptor's own server association.
    const descriptor = this.registry.get(toolName);
    if (descriptor?.server) {
      return descriptor.server;
    }

    return this.policy.defaultServer;
  }

  getExecutionLimits(toolName: string): ToolExecutionLimits {
    const perTool = this.executionPolicy.perTool?.[toolName] ?? {};
    return {
      timeoutMs: perTool.timeoutMs ?? this.executionPolicy.defaultTimeoutMs,
      maxOutputBytes: perTool.maxOutputBytes ?? this.executionPolicy.defaultMaxOutputBytes,
      ...(perTool.maxEvents !== undefined ? { maxEvents: perTool.maxEvents } : {}),
    };
  }

  /* ---------------------------------------------------------------- */
  /*  Dispatch                                                         */
  /* ---------------------------------------------------------------- */

  /**
   * Full dispatch lifecycle:
   *   1. Resolve descriptor + server
   *   2. beforeToolUse hook
   *   3. Execute via supplied executor
   *   4. afterToolUse hook
   *   5. Return result
   */
  async dispatch(
    context: ToolCallContext,
    executor: ToolExecutor,
  ): Promise<ToolCallResult> {
    const descriptor = this.registry.get(context.toolName);
    if (!descriptor) {
      return {
        output: null,
        durationMs: 0,
        error: `Tool not found: ${context.toolName}`,
      };
    }

    // --- before hook ---
    if (this.hooks) {
      const hookResult = await this.hooks.beforeToolUse(context, descriptor);
      if (hookResult?.decision === 'deny') {
        return {
          output: null,
          durationMs: 0,
          error: hookResult.reason ?? 'Tool use denied by hook',
        };
      }
    }

    // --- execute ---
    const start = Date.now();
    let output: unknown;
    let error: ToolCallResult['error'];

    try {
      output = await executor(descriptor, context);
    } catch (err: unknown) {
      error = err instanceof ToolExecutionError
        ? serializeToolError(err)
        : err instanceof Error ? err.message : String(err);
    }

    const durationMs = Date.now() - start;
    const result: ToolCallResult = { output, durationMs, error };

    // --- after hook ---
    if (this.hooks) {
      await this.hooks.afterToolUse(context, descriptor, result);
    }

    return result;
  }
}
