import { describe, expect, it } from 'vitest';

import { HooksMuxToolHookBridge, NoopToolHookBridge } from '../hooks.js';
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

describe('HooksMuxToolHookBridge', () => {
  it('maps beforeToolUse to a hooks-mux PreToolUse event', async () => {
    const events: unknown[] = [];
    const bridge = new HooksMuxToolHookBridge({
      adapter: 'codex',
      engine: {
        async processNormalizedEvent(event) {
          events.push(event);
          return {
            mergedResult: {
              decision: 'allow',
              metadata: { checked: true },
            },
          };
        },
      },
    });

    const result = await bridge.beforeToolUse(
      makeContext({ toolName: 'special_tool', input: { a: 1 }, sessionId: 'sess-1', runId: 'run-1' }),
      makeDescriptor({ name: 'special_tool', source: 'mcp', server: 'srv-1' }),
    );

    expect(result).toMatchObject({ decision: 'allow', metadata: { checked: true } });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      version: 'a5c.hooks.v1',
      adapter: 'codex',
      phase: 'tool.before',
      rawEventName: 'PreToolUse',
      execution: {
        sessionId: 'sess-1',
        nativeEventName: 'PreToolUse',
        toolName: 'special_tool',
      },
      payload: {
        toolName: 'special_tool',
        input: { a: 1 },
        runId: 'run-1',
      },
    });
  });

  it('maps afterToolUse to a hooks-mux PostToolUse event with result payload', async () => {
    const events: unknown[] = [];
    const bridge = new HooksMuxToolHookBridge({
      engine: {
        async processNormalizedEvent(event) {
          events.push(event);
          return { mergedResult: { decision: 'noop' } };
        },
      },
    });

    await bridge.afterToolUse(
      makeContext({ toolName: 'test_tool' }),
      makeDescriptor(),
      makeResult({ output: { ok: true } }),
    );

    expect(events[0]).toMatchObject({
      phase: 'tool.after',
      rawEventName: 'PostToolUse',
      payload: {
        result: {
          output: { ok: true },
        },
      },
    });
  });

  it('normalizes hooks-mux block decisions to tool-mux deny decisions', async () => {
    const bridge = new HooksMuxToolHookBridge({
      engine: {
        async processNormalizedEvent() {
          return { mergedResult: { decision: 'block', reason: 'policy' } };
        },
      },
    });

    await expect(bridge.beforeToolUse(makeContext(), makeDescriptor())).resolves.toMatchObject({
      decision: 'deny',
      reason: 'policy',
    });
  });
});
