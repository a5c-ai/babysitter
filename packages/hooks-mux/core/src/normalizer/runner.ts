import { exec, spawn } from 'child_process';
import type { UnifiedHookEvent } from '../types/event';
import type { UnifiedHookResult } from '../types/result';
import type { CommandHandlerRef, HandlerRef, HookPlanEntry } from '../types/plan';
import type { CanonicalPhase } from '../types/lifecycle';
import type { AdapterCapabilities } from '../types/adapter';
import { HandlerError, HandlerTimeoutError } from './errors';
import { evaluateWhen } from './plan-resolver';
import { runHttpHandler } from '../handlers/http';
import { runMcpToolHandler, type McpToolExecutor } from '../handlers/mcp-tool';
import { runPromptHandler, type PromptExecutor } from '../handlers/prompt';
import { runAgentHandler, type AgentExecutor } from '../handlers/agent';

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

export interface AsyncHandlerRecord {
  handlerId: string;
  pluginId: string;
  command: string;
  startedAt: string;
  finishedAt?: string;
  status: 'running' | 'completed' | 'exited' | 'error';
  exitCode?: number | null;
  stdout?: string;
  stderr?: string;
  error?: string;
  asyncRewake?: boolean;
  rewakeDeferred?: boolean;
}

export interface HandlerExecutors {
  mcpTool?: McpToolExecutor;
  prompt?: PromptExecutor;
  agent?: AgentExecutor;
}

export interface HandlerExecutionOptions {
  executors?: HandlerExecutors;
  currentDepth?: number;
  shell?: string;
}

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
  /** Skip all hook execution and return a noop diagnostic result. */
  disableAllHooks?: boolean;
  /** Injectable typed-handler executors supplied by host integrations. */
  executors?: HandlerExecutors;
  /** Current typed-handler recursion depth. */
  currentDepth?: number;
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

const CLAUDE_COMPAT_ENV_ALLOWLIST = new Set([
  'CLAUDE_ENV_FILE',
  'CLAUDE_EFFORT',
  'CLAUDE_PLUGIN_DATA',
  'CLAUDE_PROJECT_DIR',
]);

const asyncHandlerRecords = new Map<string, AsyncHandlerRecord>();

export function getAsyncHandlerRecords(): AsyncHandlerRecord[] {
  return [...asyncHandlerRecords.values()];
}

export function clearAsyncHandlerRecords(): void {
  asyncHandlerRecords.clear();
}

function isCommandHandler(handler: HandlerRef): handler is CommandHandlerRef {
  return handler.type == null || handler.type === 'command' || handler.type === 'shell';
}

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
    for (const [key, value] of Object.entries(event.execution.persistedEnv)) {
      if (!CLAUDE_COMPAT_ENV_ALLOWLIST.has(key)) {
        continue;
      }
      ctx[key] = value;
    }
  }

  if (!ctx['CLAUDE_PROJECT_DIR'] && event.execution.cwd) {
    ctx['CLAUDE_PROJECT_DIR'] = event.execution.cwd;
  }

  return ctx;
}

function buildHandlerEnv(event: UnifiedHookEvent, capabilities?: AdapterCapabilities): NodeJS.ProcessEnv {
  const execContextEnv = buildExecContextEnv(event, capabilities);
  return {
    ...process.env,
    ...execContextEnv,
    HOOKS_PROXY_EVENT: JSON.stringify(event),
  };
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
  shell?: string,
): Promise<UnifiedHookResult> {
  return new Promise((resolve, reject) => {
    const child = exec(
      command,
      {
        env: buildHandlerEnv(event, capabilities),
        shell,
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

function runAsyncShellHandler(
  entry: HookPlanEntry,
  command: string,
  event: UnifiedHookEvent,
  capabilities?: AdapterCapabilities,
  shell?: string,
): string {
  const recordId = `${entry.pluginId}:${entry.id}:${Date.now()}`;
  const stdoutChunks: Buffer[] = [];
  const stderrChunks: Buffer[] = [];
  asyncHandlerRecords.set(recordId, {
    handlerId: entry.id,
    pluginId: entry.pluginId,
    command,
    startedAt: new Date().toISOString(),
    status: 'running',
    asyncRewake: entry.asyncRewake || undefined,
    rewakeDeferred: entry.asyncRewake || undefined,
  });

  const child = spawn(command, {
    env: buildHandlerEnv(event, capabilities),
    shell: shell ?? true,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  child.stdout?.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
  child.stderr?.on('data', (chunk: Buffer) => stderrChunks.push(chunk));
  child.on('close', (code) => {
    asyncHandlerRecords.set(recordId, {
      ...asyncHandlerRecords.get(recordId)!,
      finishedAt: new Date().toISOString(),
      status: code === 0 ? 'completed' : 'exited',
      exitCode: code,
      stdout: Buffer.concat(stdoutChunks).toString('utf8'),
      stderr: Buffer.concat(stderrChunks).toString('utf8'),
    });
  });
  child.on('error', (error) => {
    asyncHandlerRecords.set(recordId, {
      ...asyncHandlerRecords.get(recordId)!,
      finishedAt: new Date().toISOString(),
      status: 'error',
      error: error.message,
      stdout: Buffer.concat(stdoutChunks).toString('utf8'),
      stderr: Buffer.concat(stderrChunks).toString('utf8'),
    });
  });
  child.unref();
  (child.stdout as { unref?: () => void } | null)?.unref?.();
  (child.stderr as { unref?: () => void } | null)?.unref?.();
  return recordId;
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
  shellOrOptions?: string | HandlerExecutionOptions,
): Promise<UnifiedHookResult> {
  const options = typeof shellOrOptions === 'string'
    ? { shell: shellOrOptions }
    : shellOrOptions;
  const context = {
    event,
    timeoutMs: timeoutMs ?? 30000,
    currentDepth: options?.currentDepth ?? 0,
  };

  if (isCommandHandler(handler)) {
    return runShellHandler(handler.source, event, timeoutMs, capabilities, options?.shell ?? handler.shell);
  }

  switch (handler.type) {
    case 'http':
      return runHttpHandler(handler, context);
    case 'mcp_tool':
      return runMcpToolHandler(handler, context, options?.executors?.mcpTool);
    case 'prompt':
      return runPromptHandler(handler, context, options?.executors?.prompt);
    case 'agent':
      return runAgentHandler(handler, context, options?.executors?.agent);
  }

  throw new HandlerError(`Unsupported handler type: ${String((handler as { type?: unknown }).type)}`, {
    source: String((handler as { type?: unknown }).type ?? 'unknown'),
    handler: 'unknown',
    code: 'UNSUPPORTED_HANDLER_TYPE',
  });
}

function onceContextKey(entry: HookPlanEntry): string {
  return `hooksMux.once.${entry.pluginId}.${entry.id}`;
}

function statusMetadata(entry: HookPlanEntry): Record<string, unknown> {
  return {
    handlerId: entry.id,
    ...(entry.statusMessage ? { statusMessage: entry.statusMessage } : {}),
  };
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

  if (options?.disableAllHooks) {
    return [{
      decision: 'noop',
      metadata: {
        disabled: true,
        reason: 'disableAllHooks',
      },
    }];
  }

  for (const entry of plan) {
    // Evaluate `when` condition — skip handler if any condition fails
    if (!evaluateWhen(entry.when, event) || !evaluateWhen(entry.if, event)) {
      continue;
    }

    const policy = getEffectivePolicy(entry.phase, options);
    const timeout = entry.timeoutMs ?? options?.handlerTimeoutMs;
    const shell = entry.shell ?? entry.handler.shell;

    if (entry.once && event.execution.contextVars[onceContextKey(entry)] === '1') {
      results.push({
        decision: 'noop',
        metadata: {
          ...statusMetadata(entry),
          once: true,
          duplicateSuppressed: true,
        },
      });
      continue;
    }

    if (entry.async && isCommandHandler(entry.handler)) {
      const asyncRecordId = runAsyncShellHandler(entry, entry.handler.source, event, options?.capabilities, shell);
      results.push({
        decision: 'noop',
        contextVars: entry.once ? { [onceContextKey(entry)]: '1' } : undefined,
        metadata: {
          ...statusMetadata(entry),
          async: true,
          asyncRecordId,
          once: entry.once || undefined,
          asyncRewake: entry.asyncRewake || undefined,
          rewakeDeferred: entry.asyncRewake || undefined,
        },
      });
      continue;
    }

    try {
      const result = await runHandler(event, entry.handler, timeout, options?.capabilities, {
        executors: options?.executors,
        currentDepth: options?.currentDepth,
        shell,
      });
      results.push({
        ...result,
        contextVars: entry.once
          ? { ...result.contextVars, [onceContextKey(entry)]: '1' }
          : result.contextVars,
        metadata: entry.statusMessage || entry.once
          ? {
              ...result.metadata,
              ...statusMetadata(entry),
              ...(entry.once ? { once: true } : {}),
            }
          : result.metadata,
      });
    } catch (err) {
      const shouldFailOpen = resolveFailOpen(policy, event.phase);

      if (shouldFailOpen) {
        const result = errorResult(err);
        results.push({
          ...result,
          metadata: {
            ...result.metadata,
            ...statusMetadata(entry),
          },
        });
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
