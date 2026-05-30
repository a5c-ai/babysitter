import { describe, expect, it, vi } from 'vitest';

import { ToolDispatcher } from '../dispatch.js';
import { ToolRegistry } from '../registry.js';
import {
  ToolExecutionError,
  serializeToolError,
} from '../types.js';
import type {
  ToolCallContext,
  ToolDescriptor,
  ToolExecutionPolicy,
  UnifiedToolEvent,
} from '../types.js';

function makeTool(overrides: Partial<ToolDescriptor> = {}): ToolDescriptor {
  return {
    name: 'contract_tool',
    description: 'Contract test tool',
    parameters: { type: 'object' },
    source: 'builtin',
    metadata: {
      category: 'utility',
      tags: ['contract'],
      cost: { unit: 'free' },
      rateLimit: { scope: 'tool', limit: 10, windowMs: 60_000 },
      requiresApproval: 'never',
      cache: { read: true, write: false, ttlMs: 1_000 },
    },
    ...overrides,
  };
}

describe('unified tool contract', () => {
  it('propagates AbortSignal and ordered update events through dispatch', async () => {
    const registry = new ToolRegistry();
    registry.register(makeTool());
    const dispatcher = new ToolDispatcher({ registry });
    const controller = new AbortController();
    const events: UnifiedToolEvent[] = [];
    const onUpdate = vi.fn((event: UnifiedToolEvent) => { events.push(event); });
    const context: ToolCallContext = {
      toolName: 'contract_tool',
      input: { value: 1 },
      signal: controller.signal,
      onUpdate,
    };

    const result = await dispatcher.dispatch(context, async (_tool, executionContext) => {
      expect(executionContext.signal).toBe(controller.signal);
      await executionContext.onUpdate?.({
        type: 'tool.stdout',
        callId: 'contract-call',
        chunk: 'hello',
        sequence: 1,
      });
      return { ok: true, output: 'done' };
    });

    expect(result.error).toBeUndefined();
    expect(result.output).toEqual({ ok: true, output: 'done' });
    expect(onUpdate).toHaveBeenCalledOnce();
    expect(events.map((event) => event.type)).toEqual(['tool.stdout']);
  });

  it('returns typed ToolExecutionError payloads instead of string-only errors', async () => {
    const registry = new ToolRegistry();
    registry.register(makeTool({ name: 'failing' }));
    const dispatcher = new ToolDispatcher({ registry });

    const result = await dispatcher.dispatch(
      { toolName: 'failing', input: {} },
      async () => {
        throw new ToolExecutionError('approval needed', {
          code: 'APPROVAL_REQUIRED',
          retryable: false,
          details: { policy: 'always' },
        });
      },
    );

    expect(result.error).toEqual({
      name: 'ToolExecutionError',
      message: 'approval needed',
      code: 'APPROVAL_REQUIRED',
      retryable: false,
      details: { policy: 'always' },
    });
  });

  it('accepts configurable execution policy limits on the dispatcher', () => {
    const registry = new ToolRegistry();
    const policy: ToolExecutionPolicy = {
      defaultTimeoutMs: 5_000,
      defaultMaxOutputBytes: 1_024,
      perTool: {
        contract_tool: { timeoutMs: 250, maxOutputBytes: 64 },
      },
      allowStreaming: true,
      enableReadOnlyCache: true,
    };

    const dispatcher = new ToolDispatcher({ registry, executionPolicy: policy });

    expect(dispatcher.getExecutionLimits('contract_tool')).toEqual({
      timeoutMs: 250,
      maxOutputBytes: 64,
    });
  });

  it('serializes unknown errors with a stable INTERNAL code', () => {
    expect(serializeToolError(new Error('plain failure'))).toEqual({
      name: 'ToolExecutionError',
      message: 'plain failure',
      code: 'INTERNAL',
      retryable: false,
    });
  });
});
