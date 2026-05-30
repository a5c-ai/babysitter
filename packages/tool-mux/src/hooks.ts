/**
 * Tool hook bridge — interface and no-op implementation.
 *
 * This module defines the contract that integrates tool-mux dispatch
 * with the hooks-mux lifecycle (PreToolUse / PostToolUse).  The
 * production implementation will delegate to the hooks-mux engine;
 * for now a no-op bridge is provided so the rest of tool-mux can
 * develop and test without a hard runtime dependency on hooks-mux.
 */

import type { ToolCallContext, ToolCallResult, ToolDescriptor } from './types.js';

/* ------------------------------------------------------------------ */
/*  Hook result (mirrors hooks-mux UnifiedHookResult subset)           */
/* ------------------------------------------------------------------ */

export interface ToolHookResult {
  decision?: 'allow' | 'deny' | 'block' | 'ask' | 'continue' | 'noop';
  reason?: string;
  toolMutation?: {
    mode: 'replace' | 'patch';
    value: unknown;
  };
  metadata?: Record<string, unknown>;
}

export interface ToolHookEvent {
  phase: 'tool.before' | 'tool.after' | 'tool.after_failure';
  context: ToolCallContext;
  descriptor: ToolDescriptor;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export type ToolHookProcessor = (event: ToolHookEvent) => Promise<ToolHookResult | undefined>;

export interface ProductionToolHookBridgeOptions {
  processHook: ToolHookProcessor;
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

/* ------------------------------------------------------------------ */
/*  No-op implementation                                               */
/* ------------------------------------------------------------------ */

/**
 * A bridge that does nothing — hooks are allowed to be absent.
 * Swap this out for a real hooks-mux adapter when integrating.
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

export class ProductionToolHookBridge implements ToolHookBridge {
  private readonly processHook: ToolHookProcessor;

  constructor(options: ProductionToolHookBridgeOptions) {
    this.processHook = options.processHook;
  }

  async beforeToolUse(
    context: ToolCallContext,
    descriptor: ToolDescriptor,
  ): Promise<ToolHookResult | undefined> {
    try {
      const result = await this.processHook({
        phase: 'tool.before',
        context,
        descriptor,
        payload: {
          toolName: descriptor.name,
          input: context.input,
          source: descriptor.source,
          sourceQualifier: descriptor.sourceQualifier,
          server: descriptor.server,
        },
      });
      if (result?.decision === 'block') {
        return {
          ...result,
          decision: 'deny',
          metadata: { ...result.metadata, phase: 'tool.before' },
        };
      }
      return result ? { ...result, metadata: { ...result.metadata, phase: 'tool.before' } } : undefined;
    } catch (error) {
      return {
        decision: 'allow',
        reason: error instanceof Error ? error.message : String(error),
        metadata: { hookError: true, phase: 'tool.before' },
      };
    }
  }

  async afterToolUse(
    context: ToolCallContext,
    descriptor: ToolDescriptor,
    result: ToolCallResult,
  ): Promise<ToolHookResult | undefined> {
    const phase = result.error ? 'tool.after_failure' : 'tool.after';
    try {
      return await this.processHook({
        phase,
        context,
        descriptor,
        payload: {
          toolName: descriptor.name,
          input: context.input,
          result,
          source: descriptor.source,
          sourceQualifier: descriptor.sourceQualifier,
          server: descriptor.server,
        },
      });
    } catch (error) {
      return {
        decision: 'noop',
        reason: error instanceof Error ? error.message : String(error),
        metadata: { hookError: true, phase },
      };
    }
  }
}
