/**
 * Programmatic hooks engine for in-process harnesses.
 *
 * Provides a clean library API for harnesses that call hooks in-process
 * (Pi, Oh-My-Pi, OpenCode, OpenClaw) rather than via CLI stdin/stdout.
 *
 * Spec section 19.3.
 */

import type { UnifiedHookEvent } from '../types/event';
import type { UnifiedHookResult } from '../types/result';
import type { AdapterCapabilities } from '../types/adapter';
import type { PhaseMapping } from '../types/lifecycle';
import { normalizeEvent } from '../normalizer/normalize';
import { evaluateWhen } from '../normalizer/plan-resolver';
import { mergeResults, type MergedExecutionResult } from '../merge-engine';
import { loadSession, saveSession } from '../session-store/store';
import type { SessionState } from '../types/session';
import type { HookMiddleware } from './middleware';

// ---------------------------------------------------------------------------
// Public types (compact to stay under 400 lines)
// ---------------------------------------------------------------------------

export type PortableHookHandler = (event: UnifiedHookEvent) => Promise<UnifiedHookResult> | UnifiedHookResult;

export interface ProgrammaticEngineConfig {
  adapter: string;
  capabilities: AdapterCapabilities;
  phaseMappings?: PhaseMapping[];
  sessionDir?: string;
}

export interface RegisteredHandler {
  id: string;
  pluginId: string;
  phase: string;
  priority: number;
  handler: PortableHookHandler;
  when?: Record<string, unknown>;
  if?: Record<string, unknown>;
  timeoutMs?: number;
}

export interface EngineResult {
  mergedResult: MergedExecutionResult;
  handlersExecuted: string[];
  diagnostics: { adapterName: string; phase: string; handlerCount: number; executionTimeMs: number; conflicts: string[] };
}

export interface ProcessEventInput {
  nativeEventName: string;
  payload: Record<string, unknown>;
  env?: Record<string, string | undefined>;
  sessionId?: string;
}

/** The programmatic hooks engine interface. */
export interface HooksEngine {
  registerHandler(handler: RegisteredHandler): void;
  removeHandler(id: string): void;
  processEvent(input: ProcessEventInput): Promise<EngineResult>;
  processNormalizedEvent(event: UnifiedHookEvent): Promise<EngineResult>;
  bootstrap(sessionId: string, metadata?: Record<string, unknown>): Promise<void>;
  getHandlers(): RegisteredHandler[];
  getHandlersForPhase(phase: string): RegisteredHandler[];
  use(middleware: HookMiddleware): void;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Sort handlers by priority (ascending), tie-break by pluginId, then id.
 */
function sortRegisteredHandlers(handlers: RegisteredHandler[]): RegisteredHandler[] {
  return [...handlers].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const sp = a.pluginId.localeCompare(b.pluginId);
    if (sp !== 0) return sp;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Execute a single handler with an optional timeout.
 */
async function executeHandler(
  handler: RegisteredHandler,
  event: UnifiedHookEvent,
): Promise<UnifiedHookResult> {
  if (handler.timeoutMs != null && handler.timeoutMs > 0) {
    return Promise.race([
      Promise.resolve(handler.handler(event)),
      new Promise<UnifiedHookResult>((_resolve, reject) => {
        setTimeout(
          () => reject(new Error(`Handler "${handler.id}" timed out after ${handler.timeoutMs}ms`)),
          handler.timeoutMs,
        );
      }),
    ]);
  }
  return handler.handler(event);
}

/**
 * Create a programmatic hooks engine for in-process hook execution.
 *
 * Usage:
 * ```typescript
 * import { createHooksEngine } from '@a5c-ai/agent-mux-hooks-core';
 *
 * const engine = createHooksEngine({
 *   adapter: 'pi',
 *   capabilities: piCapabilities,
 * });
 *
 * engine.registerHandler({
 *   id: 'my-plugin-session-start',
 *   pluginId: 'my-plugin',
 *   phase: 'session.start',
 *   priority: 10,
 *   handler: async (event) => ({
 *     persistEnv: { MY_PLUGIN_READY: '1' },
 *   }),
 * });
 *
 * const result = await engine.processEvent({
 *   nativeEventName: 'session_start',
 *   payload: { sessionId: 'abc', cwd: '/project' },
 * });
 * ```
 */
export function createHooksEngine(config: ProgrammaticEngineConfig): HooksEngine {
  const handlers: RegisteredHandler[] = [];
  const middlewares: HookMiddleware[] = [];

  /**
   * Build the middleware-wrapped execution function.
   * Middleware is applied in registration order (first registered = outermost).
   */
  function buildExecutionChain(
    event: UnifiedHookEvent,
    coreExecutor: () => Promise<UnifiedHookResult>,
  ): () => Promise<UnifiedHookResult> {
    let chain = coreExecutor;
    // Apply middlewares in reverse so the first-registered middleware is outermost
    for (let i = middlewares.length - 1; i >= 0; i--) {
      const mw = middlewares[i];
      const next = chain;
      chain = () => mw(event, next);
    }
    return chain;
  }

  /**
   * Core execution: run matching handlers sequentially, merge results.
   */
  async function runHandlers(event: UnifiedHookEvent): Promise<{
    mergedResult: MergedExecutionResult;
    handlersExecuted: string[];
  }> {
    const matchingHandlers = sortRegisteredHandlers(
      handlers.filter((h) => h.phase === event.phase),
    );

    const results: UnifiedHookResult[] = [];
    const executed: string[] = [];

    for (const handler of matchingHandlers) {
      // Evaluate `when` conditions
      if (!evaluateWhen(handler.when, event) || !evaluateWhen(handler.if, event)) {
        continue;
      }

      try {
        const result = await executeHandler(handler, event);
        results.push(result);
        executed.push(handler.id);
      } catch (_err) {
        // Fail-open: handler errors produce a noop result
        results.push({
          decision: 'noop',
          reason: _err instanceof Error ? _err.message : String(_err),
          metadata: { error: true, handlerId: handler.id },
        });
        executed.push(handler.id);
      }
    }

    const mergedResult = mergeResults(results);
    return { mergedResult, handlersExecuted: executed };
  }

  /**
   * Update session store with merged persistEnv and contextVars.
   */
  async function updateSessionFromResult(
    mergedResult: MergedExecutionResult,
    sessionId: string | null | undefined,
    adapterName: string,
  ): Promise<void> {
    if (!sessionId) return;

    const hasPersistEnv = Object.keys(mergedResult.persistEnv).length > 0;
    const hasContextVars = Object.keys(mergedResult.contextVars).length > 0;
    if (!hasPersistEnv && !hasContextVars) return;

    try {
      let session = await loadSession(sessionId, config.sessionDir);
      if (!session) {
        // Create a new session
        session = {
          version: 'a5c.hooks.session.v1',
          sessionId,
          adapter: adapterName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          persistedEnv: {},
          contextVars: {},
          contextFragments: [],
          metadata: {},
        };
      }

      if (hasPersistEnv) {
        session.persistedEnv = { ...session.persistedEnv, ...mergedResult.persistEnv };
      }
      if (hasContextVars) {
        session.contextVars = { ...session.contextVars, ...mergedResult.contextVars };
      }
      session.updatedAt = new Date().toISOString();

      // Remove unset keys
      for (const key of mergedResult.unsetEnv) {
        delete session.persistedEnv[key];
      }

      await saveSession(session, config.sessionDir);
    } catch (_err) {
      // Session persistence is best-effort; do not fail the pipeline
    }
  }

  /**
   * Extract conflict descriptions from merge diagnostics.
   */
  function extractConflicts(mergedResult: MergedExecutionResult): string[] {
    const conflicts: string[] = [];
    if (mergedResult.diagnostics.conflicts) {
      for (const c of mergedResult.diagnostics.conflicts) {
        conflicts.push(`${c.field}: ${c.resolution}`);
      }
    }
    return conflicts;
  }

  const engine: HooksEngine = {
    registerHandler(handler: RegisteredHandler): void {
      // Replace existing handler with same id
      const existingIndex = handlers.findIndex((h) => h.id === handler.id);
      if (existingIndex !== -1) {
        handlers[existingIndex] = handler;
      } else {
        handlers.push(handler);
      }
    },

    removeHandler(id: string): void {
      const index = handlers.findIndex((h) => h.id === id);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    },

    async processEvent(input: ProcessEventInput): Promise<EngineResult> {
      // Clean env: filter out undefined values
      const cleanEnv: Record<string, string> = {};
      if (input.env) {
        for (const [key, value] of Object.entries(input.env)) {
          if (value !== undefined) {
            cleanEnv[key] = value;
          }
        }
      }

      // Normalize the event
      const event = normalizeEvent({
        adapter: config.adapter,
        rawEventName: input.nativeEventName,
        stdinPayload: input.payload,
        env: cleanEnv,
        adapterMappings: config.phaseMappings ?? [],
      });

      // Override sessionId if explicitly provided
      if (input.sessionId) {
        event.execution.sessionId = input.sessionId;
      }

      // Inject adapter capabilities into execution metadata
      if (config.capabilities) {
        event.execution.metadata['AGENT_CAPABILITIES_JSON'] = JSON.stringify(config.capabilities);
      }

      return engine.processNormalizedEvent(event);
    },

    async processNormalizedEvent(event: UnifiedHookEvent): Promise<EngineResult> {
      const startTime = Date.now();

      // Run handlers to get the core result
      const { mergedResult, handlersExecuted } = await runHandlers(event);

      // If middlewares are present, run the chain to allow them to transform the result
      let finalMergedResult = mergedResult;
      if (middlewares.length > 0) {
        const chain = buildExecutionChain(event, async () => {
          // Return the already-computed merged result as a UnifiedHookResult
          return {
            decision: mergedResult.decision,
            reason: mergedResult.reason || undefined,
            persistEnv: Object.keys(mergedResult.persistEnv).length > 0 ? mergedResult.persistEnv : undefined,
            unsetEnv: mergedResult.unsetEnv.length > 0 ? mergedResult.unsetEnv : undefined,
            contextVars: Object.keys(mergedResult.contextVars).length > 0 ? mergedResult.contextVars : undefined,
            additionalContext: mergedResult.additionalContext || undefined,
            systemMessage: mergedResult.systemMessage || undefined,
            toolMutation: mergedResult.toolMutation,
            continueSession: mergedResult.continueSession,
            stopReason: mergedResult.stopReason || undefined,
            suppressOutput: mergedResult.suppressOutput || undefined,
            followUpMessage: mergedResult.followUpMessage || undefined,
            metadata: Object.keys(mergedResult.metadata).length > 0 ? mergedResult.metadata : undefined,
          };
        });
        const middlewareResult = await chain();
        // Re-merge through the merge engine to get a proper MergedExecutionResult
        finalMergedResult = mergeResults([middlewareResult]);
      }

      // Update session store
      await updateSessionFromResult(
        finalMergedResult,
        event.execution.sessionId,
        config.adapter,
      );

      const executionTimeMs = Date.now() - startTime;

      return {
        mergedResult: finalMergedResult,
        handlersExecuted,
        diagnostics: {
          adapterName: config.adapter,
          phase: event.phase,
          handlerCount: handlersExecuted.length,
          executionTimeMs,
          conflicts: extractConflicts(finalMergedResult),
        },
      };
    },

    async bootstrap(sessionId: string, metadata?: Record<string, unknown>): Promise<void> {
      const now = new Date().toISOString();
      const session: SessionState = {
        version: 'a5c.hooks.session.v1',
        sessionId,
        adapter: config.adapter,
        createdAt: now,
        updatedAt: now,
        persistedEnv: {},
        contextVars: {},
        contextFragments: [],
        metadata: metadata ?? {},
      };
      await saveSession(session, config.sessionDir);
    },

    getHandlers(): RegisteredHandler[] {
      return [...handlers];
    },

    getHandlersForPhase(phase: string): RegisteredHandler[] {
      return handlers.filter((h) => h.phase === phase);
    },

    use(middleware: HookMiddleware): void {
      middlewares.push(middleware);
    },
  };

  return engine;
}
