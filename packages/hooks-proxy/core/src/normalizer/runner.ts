import { exec } from 'child_process';
import type { UnifiedHookEvent } from '../types/event';
import type { UnifiedHookResult } from '../types/result';
import type { HandlerRef, HookPlanEntry } from '../types/plan';
import type { CanonicalPhase } from '../types/lifecycle';
import { HandlerError, HandlerLoadError } from './errors';

/**
 * Error handling policy for handler failures.
 *
 * - fail-open: handler error is logged, empty result returned
 * - fail-closed: handler error propagates
 * - fail-open-bootstrap-only: fail-open only for session.start phase
 */
export type ErrorPolicy = 'fail-open' | 'fail-closed' | 'fail-open-bootstrap-only';

/**
 * A handler function that processes a hook event and returns a result.
 */
export type HandlerFn = (event: UnifiedHookEvent) => Promise<UnifiedHookResult> | UnifiedHookResult;

/**
 * Options for runPlan execution.
 */
export interface RunPlanOptions {
  /** Error policy override per phase. */
  errorPolicies?: Partial<Record<string, ErrorPolicy>>;
  /** Default error policy if not specified per phase. */
  defaultPolicy?: ErrorPolicy;
  /** Timeout in milliseconds per handler. */
  handlerTimeoutMs?: number;
  /** Module loader override (for testing). Defaults to require(). */
  loadModule?: (source: string) => Record<string, unknown>;
}

/**
 * Default error policies by canonical phase.
 */
const DEFAULT_PHASE_POLICIES: Partial<Record<CanonicalPhase, ErrorPolicy>> = {
  'session.start': 'fail-open',
  'tool.before': 'fail-open',
  'tool.after': 'fail-open',
  'turn.stop': 'fail-open',
};

/**
 * Get the effective error policy for a phase.
 */
function getEffectivePolicy(
  phase: string,
  options?: RunPlanOptions,
): ErrorPolicy {
  // Explicit override
  if (options?.errorPolicies?.[phase] != null) {
    return options.errorPolicies[phase]!;
  }
  // Default policy option
  if (options?.defaultPolicy != null) {
    return options.defaultPolicy;
  }
  // Built-in defaults
  return DEFAULT_PHASE_POLICIES[phase as CanonicalPhase] ?? 'fail-open';
}

/**
 * Create an error result.
 */
function errorResult(err: unknown): UnifiedHookResult {
  return {
    decision: 'noop',
    reason: err instanceof Error ? err.message : String(err),
    metadata: {
      error: true,
      errorCode: err instanceof HandlerError ? err.code : 'HANDLER_ERROR',
    },
  };
}

/**
 * Execute a shell command handler.
 */
function runShellHandler(
  command: string,
  event: UnifiedHookEvent,
  timeoutMs?: number,
): Promise<UnifiedHookResult> {
  return new Promise((resolve, reject) => {
    const child = exec(
      command,
      {
        env: { ...process.env, HOOKS_PROXY_EVENT: JSON.stringify(event) },
        timeout: timeoutMs ?? 30000,
      },
      (error, stdout, _stderr) => {
        if (error) {
          reject(new HandlerError(
            `Shell handler failed: ${error.message}`,
            { source: command, handler: 'shell', code: 'SHELL_ERROR', cause: error },
          ));
          return;
        }

        // Try to parse stdout as JSON result
        const trimmed = stdout.trim();
        if (trimmed) {
          try {
            const parsed = JSON.parse(trimmed) as UnifiedHookResult;
            resolve(parsed);
            return;
          } catch {
            // Not JSON, treat as message
          }
        }

        resolve({
          decision: 'noop',
          reason: trimmed || undefined,
        });
      },
    );
    // Feed event as stdin
    if (child.stdin) {
      child.stdin.write(JSON.stringify(event));
      child.stdin.end();
    }
  });
}

/**
 * Default module loader using require().
 */
function defaultLoadModule(source: string): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(source) as Record<string, unknown>;
}

/**
 * Execute a JS module handler by loading it and calling the named export.
 */
async function runModuleHandler(
  source: string,
  handlerName: string,
  event: UnifiedHookEvent,
  loadModule: (source: string) => Record<string, unknown> = defaultLoadModule,
): Promise<UnifiedHookResult> {
  let mod: Record<string, unknown>;
  try {
    mod = loadModule(source);
  } catch (err) {
    throw new HandlerLoadError({ source, handler: handlerName, cause: err });
  }

  const fn = mod[handlerName];
  if (typeof fn !== 'function') {
    throw new HandlerLoadError({
      source,
      handler: handlerName,
      cause: new Error(`Export "${handlerName}" is not a function`),
    });
  }

  const result = await (fn as HandlerFn)(event);

  if (result && typeof result === 'object') {
    return result;
  }

  return { decision: 'noop' };
}

/**
 * Determine if a handler ref points to a shell command or a JS module.
 */
function isModuleHandler(ref: HandlerRef): boolean {
  const s = ref.source;
  return (
    s.endsWith('.js') ||
    s.endsWith('.ts') ||
    s.endsWith('.cjs') ||
    s.endsWith('.mjs') ||
    s.startsWith('./') ||
    s.startsWith('../') ||
    s.startsWith('/') ||
    /^[A-Za-z]:[\\/]/.test(s) ||
    s.includes('node_modules')
  );
}

/**
 * Execute a single handler (shell command or JS module) with the normalized event.
 */
export async function runHandler(
  event: UnifiedHookEvent,
  handler: HandlerRef,
  options?: { loadModule?: (source: string) => Record<string, unknown> },
): Promise<UnifiedHookResult> {
  if (isModuleHandler(handler)) {
    return runModuleHandler(handler.source, handler.handler, event, options?.loadModule);
  }
  return runShellHandler(handler.source, event);
}

/**
 * Execute a hook plan: ordered sequential fan-out.
 *
 * Each HookPlanEntry has a single handler. Entries are executed in order.
 * All handlers receive the same base event.
 * Error handling follows the configured policy for the phase.
 */
export async function runPlan(
  event: UnifiedHookEvent,
  plan: HookPlanEntry[],
  options?: RunPlanOptions,
): Promise<UnifiedHookResult[]> {
  const results: UnifiedHookResult[] = [];

  for (const entry of plan) {
    const policy = getEffectivePolicy(entry.phase, options);

    try {
      const result = await runHandler(event, entry.handler, { loadModule: options?.loadModule });
      results.push(result);
    } catch (err) {
      const shouldFailOpen = resolveFailOpen(policy, event.phase);

      if (shouldFailOpen) {
        results.push(errorResult(err));
      } else {
        throw err;
      }
    }
  }

  return results;
}

/**
 * Resolve whether to fail-open based on policy and phase.
 */
function resolveFailOpen(policy: ErrorPolicy, phase: string): boolean {
  switch (policy) {
    case 'fail-open':
      return true;
    case 'fail-closed':
      return false;
    case 'fail-open-bootstrap-only':
      return phase === 'session.start';
    default:
      return true;
  }
}
