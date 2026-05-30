import { describe, expect, it, vi } from 'vitest';

import { NoopToolHookBridge, ProductionToolHookBridge } from '../hooks.js';
import type { ToolHookBridge, ToolHookResult } from '../hooks.js';
import type { ToolCallContext, ToolCallResult, ToolDescriptor } from '../types.js';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function makeContext(overrides: Partial<ToolCallContext> = {}): ToolCallContext {
  return {
    toolName: 'test_tool',
    input: { key: 'value' },
    ...overrides,
  };
}

function makeDescriptor(overrides: Partial<ToolDescriptor> = {}): ToolDescriptor {
  return {
    name: 'test_tool',
    description: 'A test tool',
    source: 'builtin',
    ...overrides,
  };
}

function makeResult(overrides: Partial<ToolCallResult> = {}): ToolCallResult {
  return {
    output: 'ok',
    durationMs: 42,
    ...overrides,
  };
}

/* ========================================================================== */
/*  Hooks                                                                     */
/* ========================================================================== */

describe('NoopToolHookBridge', () => {
  const noop = new NoopToolHookBridge();

  it('beforeToolUse returns undefined (implicitly allowed)', async () => {
    const result = await noop.beforeToolUse(makeContext(), makeDescriptor());
    expect(result).toBeUndefined();
  });

  it('afterToolUse resolves without error', async () => {
    const result = await noop.afterToolUse(
      makeContext(),
      makeDescriptor(),
      makeResult(),
    );
    expect(result).toBeUndefined();
  });
});

describe('Custom ToolHookBridge', () => {
  it('can deny tool use with a reason', async () => {
    const denyBridge: ToolHookBridge = {
      async beforeToolUse(): Promise<ToolHookResult> {
        return { decision: 'deny', reason: 'Forbidden by policy' };
      },
      async afterToolUse() {
        return undefined;
      },
    };

    const result = await denyBridge.beforeToolUse(makeContext(), makeDescriptor());
    expect(result).toBeDefined();
    expect(result!.decision).toBe('deny');
    expect(result!.reason).toBe('Forbidden by policy');
  });

  it('receives correct context and descriptor in beforeToolUse', async () => {
    let capturedContext: ToolCallContext | undefined;
    let capturedDescriptor: ToolDescriptor | undefined;

    const captureBridge: ToolHookBridge = {
      async beforeToolUse(ctx, desc) {
        capturedContext = ctx;
        capturedDescriptor = desc;
        return { decision: 'allow' };
      },
      async afterToolUse() {
        return undefined;
      },
    };

    const ctx = makeContext({ toolName: 'special_tool', caller: 'agent-1', runId: 'run-99' });
    const desc = makeDescriptor({ name: 'special_tool', source: 'mcp', server: 'srv-5' });

    await captureBridge.beforeToolUse(ctx, desc);

    expect(capturedContext).toBeDefined();
    expect(capturedContext!.toolName).toBe('special_tool');
    expect(capturedContext!.caller).toBe('agent-1');
    expect(capturedContext!.runId).toBe('run-99');

    expect(capturedDescriptor).toBeDefined();
    expect(capturedDescriptor!.name).toBe('special_tool');
    expect(capturedDescriptor!.source).toBe('mcp');
    expect(capturedDescriptor!.server).toBe('srv-5');
  });

  it('afterToolUse receives the execution result', async () => {
    let capturedResult: ToolCallResult | undefined;

    const captureBridge: ToolHookBridge = {
      async beforeToolUse() {
        return undefined;
      },
      async afterToolUse(_ctx, _desc, result) {
        capturedResult = result;
        return undefined;
      },
    };

    const res = makeResult({ output: { data: [1, 2, 3] }, durationMs: 150 });
    await captureBridge.afterToolUse(makeContext(), makeDescriptor(), res);

    expect(capturedResult).toBeDefined();
    expect(capturedResult!.output).toEqual({ data: [1, 2, 3] });
    expect(capturedResult!.durationMs).toBe(150);
  });
});

describe('ProductionToolHookBridge', () => {
  it('maps deny and block hook decisions to dispatcher denial results', async () => {
    const bridge = new ProductionToolHookBridge({
      processHook: async () => ({ decision: 'block', reason: 'blocked by PreToolUse' }),
    });

    const result = await bridge.beforeToolUse(makeContext(), makeDescriptor());

    expect(result).toEqual({
      decision: 'deny',
      reason: 'blocked by PreToolUse',
      metadata: expect.objectContaining({ phase: 'tool.before' }),
    });
  });

  it('emits PostToolUse audit events for success and failure results', async () => {
    const processHook = vi.fn(async (): Promise<ToolHookResult> => ({ decision: 'allow' }));
    const bridge = new ProductionToolHookBridge({ processHook });

    await bridge.afterToolUse(makeContext(), makeDescriptor(), makeResult({ output: 'ok' }));
    await bridge.afterToolUse(makeContext(), makeDescriptor(), makeResult({ error: 'boom' }));

    expect(processHook).toHaveBeenNthCalledWith(1, expect.objectContaining({
      phase: 'tool.after',
      payload: expect.objectContaining({ result: expect.objectContaining({ output: 'ok' }) }),
    }));
    expect(processHook).toHaveBeenNthCalledWith(2, expect.objectContaining({
      phase: 'tool.after_failure',
      payload: expect.objectContaining({ result: expect.objectContaining({ error: 'boom' }) }),
    }));
  });

  it('fails open when the hook processor throws', async () => {
    const bridge = new ProductionToolHookBridge({
      processHook: async () => {
        throw new Error('hook exploded');
      },
    });

    const result = await bridge.beforeToolUse(makeContext(), makeDescriptor());

    expect(result).toEqual({
      decision: 'allow',
      reason: 'hook exploded',
      metadata: expect.objectContaining({ hookError: true }),
    });
  });
});
