import { exec } from 'child_process';
import type { UnifiedHookEvent } from '../types/event';
import type { UnifiedHookResult } from '../types/result';
import type { HandlerRef, HookPlanEntry } from '../types/plan';
import type { CanonicalPhase } from '../types/lifecycle';
import type { AdapterCapabilities } from '../types/adapter';
import { HandlerError, HandlerTimeoutError } from './errors';
import { evaluateWhen } from './plan-resolver';

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
  /** Per-phase error policy overrides (checked before errorPolicies and defaultPolicy). */
  phasePolicies?: Record<string, ErrorPolicy>;
  /** Timeout in milliseconds per handler. */
  handlerTimeoutMs?: number;
  /** Adapter capabilities to inject as AGENT_CAPABILITIES_JSON into handler subprocess env. */
  capabilities?: AdapterCapabilities;
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
  // Per-phase policy override (highest priority)
  if (options?.phasePolicies?.[phase] != null) {
    return options.phasePolicies[phase];
  }
  // Explicit override
  if (options?.errorPolicies?.[phase] != null) {
    return options.errorPolicies[phase];
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
 * Build execution context environment variables from the unified event.
 *
 * These are injected into the child process environment so handlers
 * can access session/execution context without parsing stdin.
 */
function buildExecContextEnv(event: UnifiedHookEvent, capabilities?: AdapterCapabilities): Record<string, string> {
  const ctx: Record<string, string> = {};

  if (event.execution.sessionId) ctx['AGENT_SESSION_ID'] = event.execution.sessionId;
  if (event.execution.turnId) ctx['AGENT_TURN_ID'] = event.execution.turnId;
  if (event.execution.adapter) ctx['AGENT_ADAPTER'] = event.execution.adapter;
  if (event.execution.cwd) ctx['AGENT_WORKSPACE_ROOT'] = event.execution.cwd;
  if (event.execution.transcriptPath) ctx['AGENT_TRANSCRIPT_PATH'] = event.execution.transcriptPath;

  // Inject adapter capabilities as JSON for downstream consumers
  if (capabilities) {
    ctx['AGENT_CAPABILITIES_JSON'] = JSON.stringify(capabilities);
  }

  // Merge persisted env from the session store
  if (event.execution.persistedEnv) {
    Object.assign(ctx, event.execution.persistedEnv);
  }

  return ctx;
}

/**
 * Execute a shell command handler as a child process.
 *
 * The handler receives:
 * - The normalized event JSON on stdin
 * - Execution context env vars injected into the subprocess environment
 * - HOOKS_PROXY_EVENT env var with the full event JSON
 *
 * The handler's stdout is parsed as JSON (the result).
 * stderr is captured for diagnostics/logging.
 */
function runShellHandler(
  command: string,
  event: UnifiedHookEvent,
  timeoutMs?: number,
  capabilities?: AdapterCapabilities,
): Promise<UnifiedHookResult> {
  return new Promise((resolve, reject) => {
    const execContextEnv = buildExecContextEnv(event, capabilities);

    const child = exec(
      command,
      {
        env: {
          ...process.env,
          ...execContextEnv,
          HOOKS_PROXY_EVENT: JSON.stringify(event),
        },
        timeout: timeoutMs ?? 30000,
      },
      (error, stdout, _stderr) => {
        if (error) {
          // Detect timeout: Node's child_process sets `killed` and `signal`
          // when the process is terminated due to timeout
          if (error.killed || error.signal === 'SIGTERM') {
            reject(new HandlerTimeoutError({
              source: command,
              handler: 'shell',
              timeoutMs: timeoutMs ?? 30000,
            }));
            return;
          }
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
 * Execute a single handler as a shell command child process.
 *
 * All handlers are spawned as child processes. The handler.source
 * is the shell command to execute.
 *
 * @param event - The normalized hook event.
 * @param handler - The handler reference to execute.
 * @param timeoutMs - Optional per-handler timeout in milliseconds.
 */
export async function runHandler(
  event: UnifiedHookEvent,
  handler: HandlerRef,
  timeoutMs?: number,
  capabilities?: AdapterCapabilities,
): Promise<UnifiedHookResult> {
  return runShellHandler(handler.source, event, timeoutMs, capabilities);
}

/**
 * Execute a hook plan: ordered sequential fan-out.
 *
 * Each HookPlanEntry has a single handler. Entries are executed in order.
 * All handlers receive the same base event.
 * Error handling follows the configured policy for the phase.
 *
 * Entries with a `when` condition are evaluated against the event;
 * if any condition does not match, the handler is skipped.
 *
 * Entries with a `timeoutMs` override use that value as the per-handler
 * timeout; otherwise the global `handlerTimeoutMs` option applies.
 */
export async function runPlan(
  event: UnifiedHookEvent,
  plan: HookPlanEntry[],
  options?: RunPlanOptions,
): Promise<UnifiedHookResult[]> {
  const results: UnifiedHookResult[] = [];

  for (const entry of plan) {
    // Evaluate `when` condition — skip handler if any condition fails
    if (!evaluateWhen(entry.when, event)) {
      continue;
    }

    const policy = getEffectivePolicy(entry.phase, options);
    const timeout = entry.timeoutMs ?? options?.handlerTimeoutMs;

    try {
      const result = await runHandler(event, entry.handler, timeout, options?.capabilities);
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
