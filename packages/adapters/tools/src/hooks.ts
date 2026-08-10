/**
 * Tool hook bridge implementations.
 *
 * The bridge contract keeps tools-adapter independent from a concrete hooks-adapter
 * package instance while allowing callers to pass a hooks-adapter-compatible engine.
 */

import type { ToolCallContext, ToolCallResult, ToolDescriptor } from './types.js';

/* ------------------------------------------------------------------ */
/*  Hook result (mirrors hooks-adapter UnifiedHookResult subset)           */
/* ------------------------------------------------------------------ */

export interface ToolHookResult {
  decision?: 'allow' | 'deny' | 'ask' | 'continue' | 'noop';
  reason?: string;
  toolMutation?: {
    mode: 'replace' | 'patch';
    value: unknown;
  };
  metadata?: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/*  Bridge interface                                                    */
/* ------------------------------------------------------------------ */

export interface ToolHookBridge {
  /**
   * Invoked immediately before a tool is executed.
   * Returning a result with `decision: 'deny'` will short-circuit
   * execution and surface the denial reason to the caller.
   */
  beforeToolUse(
    context: ToolCallContext,
    descriptor: ToolDescriptor,
  ): Promise<ToolHookResult | undefined>;

  /**
   * Invoked immediately after a tool finishes (success or failure).
   * The result is informational — the hook cannot retroactively
   * block the call, but it can record telemetry, mutate state, etc.
   */
  afterToolUse(
    context: ToolCallContext,
    descriptor: ToolDescriptor,
    result: ToolCallResult,
  ): Promise<ToolHookResult | undefined>;
}

export interface HooksMuxLikeResult {
  decision?: 'allow' | 'deny' | 'block' | 'retry' | 'ask' | 'defer' | 'continue' | 'noop';
  reason?: string;
  toolMutation?: {
    mode: 'replace' | 'patch';
    value: unknown;
  };
  metadata?: Record<string, unknown>;
}

export interface HooksMuxLikeEngineResult {
  mergedResult?: HooksMuxLikeResult;
  result?: HooksMuxLikeResult;
}

export interface HooksMuxLikeEngine {
  processNormalizedEvent(event: HooksMuxToolEvent): Promise<HooksMuxLikeEngineResult> | HooksMuxLikeEngineResult;
}

export interface HooksMuxToolHookBridgeOptions {
  engine: HooksMuxLikeEngine;
  adapter?: string;
  env?: {
    input?: Record<string, string>;
    persisted?: Record<string, string>;
  };
  metadata?: Record<string, unknown>;
}

export interface HooksMuxToolEvent {
  version: 'a5c.hooks.v1';
  adapter: string;
  phase: 'tool.before' | 'tool.after';
  rawEventName: 'PreToolUse' | 'PostToolUse';
  supportLevel: 'native';
  execution: {
    sessionId: string | null;
    nativeEventName: 'PreToolUse' | 'PostToolUse';
    adapter: string;
    toolName: string;
    toolCallId?: string | null;
    source?: string | null;
    metadata: Record<string, unknown>;
    persistedEnv: Record<string, string>;
    contextVars: Record<string, string>;
  };
  payload: Record<string, unknown>;
  env: {
    input: Record<string, string>;
    persisted: Record<string, string>;
  };
  raw: unknown;
}

/* ------------------------------------------------------------------ */
/*  No-op implementation                                               */
/* ------------------------------------------------------------------ */

/**
 * A bridge that does nothing — hooks are allowed to be absent.
 * Swap this out for a real hooks-adapter adapter when integrating.
 */
export class NoopToolHookBridge implements ToolHookBridge {
  async beforeToolUse(
    _context: ToolCallContext,
    _descriptor: ToolDescriptor,
  ): Promise<ToolHookResult | undefined> {
    return undefined;
  }

  async afterToolUse(
    _context: ToolCallContext,
    _descriptor: ToolDescriptor,
    _result: ToolCallResult,
  ): Promise<ToolHookResult | undefined> {
    return undefined;
  }
}

export class HooksMuxToolHookBridge implements ToolHookBridge {
  private readonly engine: HooksMuxLikeEngine;
  private readonly adapter: string;
  private readonly env: {
    input: Record<string, string>;
    persisted: Record<string, string>;
  };
  private readonly metadata: Record<string, unknown>;

  constructor(options: HooksMuxToolHookBridgeOptions) {
    this.engine = options.engine;
    this.adapter = options.adapter ?? 'tools-adapter';
    this.env = {
      input: options.env?.input ?? {},
      persisted: options.env?.persisted ?? {},
    };
    this.metadata = options.metadata ?? {};
  }

  async beforeToolUse(
    context: ToolCallContext,
    descriptor: ToolDescriptor,
  ): Promise<ToolHookResult | undefined> {
    return this.processToolEvent('tool.before', 'PreToolUse', context, descriptor);
  }

  async afterToolUse(
    context: ToolCallContext,
    descriptor: ToolDescriptor,
    result: ToolCallResult,
  ): Promise<ToolHookResult | undefined> {
    return this.processToolEvent('tool.after', 'PostToolUse', context, descriptor, result);
  }

  private async processToolEvent(
    phase: 'tool.before' | 'tool.after',
    rawEventName: 'PreToolUse' | 'PostToolUse',
    context: ToolCallContext,
    descriptor: ToolDescriptor,
    result?: ToolCallResult,
  ): Promise<ToolHookResult | undefined> {
    const event = this.buildEvent(phase, rawEventName, context, descriptor, result);
    const engineResult = await this.engine.processNormalizedEvent(event);
    return normalizeHookResult(engineResult.mergedResult ?? engineResult.result);
  }

  private buildEvent(
    phase: 'tool.before' | 'tool.after',
    rawEventName: 'PreToolUse' | 'PostToolUse',
    context: ToolCallContext,
    descriptor: ToolDescriptor,
    result?: ToolCallResult,
  ): HooksMuxToolEvent {
    const payload: Record<string, unknown> = {
      toolName: context.toolName,
      input: context.input,
      descriptor,
      caller: context.caller,
      runId: context.runId,
      sessionId: context.sessionId,
      // Milestone D (AC-34a): carry the ACTUAL executing tool-call id so the policy
      // layer binds a CommandAuthorization to this exact call (not `runId`).
      toolCallId: context.toolCallId,
    };
    if (result) {
      payload.result = result;
    }

    return {
      version: 'a5c.hooks.v1',
      adapter: this.adapter,
      phase,
      rawEventName,
      supportLevel: 'native',
      execution: {
        sessionId: context.sessionId ?? null,
        nativeEventName: rawEventName,
        adapter: this.adapter,
        toolName: context.toolName,
        // Milestone D (AC-34a): the ACTUAL executing tool-call id when present. Fall
        // back to `runId` only as a legacy correlation hint — the policy binding uses
        // `context.toolCallId` (threaded above), never `runId`.
        toolCallId: context.toolCallId ?? context.runId ?? null,
        source: descriptor.source,
        metadata: {
          ...this.metadata,
          caller: context.caller,
          runId: context.runId,
          server: descriptor.server,
        },
        persistedEnv: this.env.persisted,
        contextVars: {},
      },
      payload,
      env: this.env,
      raw: payload,
    };
  }
}

/* ------------------------------------------------------------------ */
/*  Composite bridge (Milestone D GATE-1 composition)                  */
/* ------------------------------------------------------------------ */

/**
 * Compose two `ToolHookBridge`s so a policy verifier (e.g.
 * `PolicyVerifierHookBridge`) runs BEFORE an existing bridge in `beforeToolUse`: if
 * the first bridge returns `{ decision: 'deny' }` the call short-circuits (the second
 * bridge is not consulted); otherwise the second bridge's decision is returned. This
 * is how GATE 1 (§9.1) wraps or composes the existing hooks bridge — the policy
 * verifier is the LOAD-BEARING, un-bypassable line and cannot be relaxed by a later
 * bridge (a deny wins). `afterToolUse` runs both (first, then second) for telemetry.
 */
export class CompositeToolHookBridge implements ToolHookBridge {
  constructor(
    private readonly first: ToolHookBridge,
    private readonly second: ToolHookBridge,
  ) {}

  async beforeToolUse(
    context: ToolCallContext,
    descriptor: ToolDescriptor,
  ): Promise<ToolHookResult | undefined> {
    const firstResult = await this.first.beforeToolUse(context, descriptor);
    // A deny from the first (policy) bridge short-circuits — un-bypassable.
    if (firstResult?.decision === 'deny') return firstResult;
    const secondResult = await this.second.beforeToolUse(context, descriptor);
    // A deny from either bridge denies (most-restrictive wins).
    if (secondResult?.decision === 'deny') return secondResult;
    // Prefer an explicit decision from the second, else the first's.
    return secondResult ?? firstResult;
  }

  async afterToolUse(
    context: ToolCallContext,
    descriptor: ToolDescriptor,
    result: ToolCallResult,
  ): Promise<ToolHookResult | undefined> {
    await this.first.afterToolUse(context, descriptor, result);
    return this.second.afterToolUse(context, descriptor, result);
  }
}

function normalizeHookResult(result: HooksMuxLikeResult | undefined): ToolHookResult | undefined {
  if (!result) return undefined;
  const decision = result.decision === 'block' ? 'deny' : result.decision;
  if (
    decision !== 'allow' &&
    decision !== 'deny' &&
    decision !== 'ask' &&
    decision !== 'continue' &&
    decision !== 'noop' &&
    decision !== undefined
  ) {
    return {
      decision: 'deny',
      reason: result.reason ?? `Unsupported tool hook decision: ${result.decision}`,
      metadata: result.metadata,
    };
  }
  return {
    decision,
    reason: result.reason,
    toolMutation: result.toolMutation,
    metadata: result.metadata,
  };
}
