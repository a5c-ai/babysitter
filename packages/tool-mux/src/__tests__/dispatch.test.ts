import { describe, expect, it, beforeEach, vi } from 'vitest';

import { ToolDispatcher } from '../dispatch.js';
import type { ToolExecutor } from '../dispatch.js';
import { ToolRegistry } from '../registry.js';
import type {
  ToolCallContext,
  ToolDescriptor,
  ToolDispatchPolicy,
} from '../types.js';
import type { ToolHookBridge, ToolHookResult } from '../hooks.js';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function makeTool(overrides: Partial<ToolDescriptor> = {}): ToolDescriptor {
  return {
    name: 'test_tool',
    description: 'A test tool',
    parameters: { type: 'object' },
    source: 'builtin',
    ...overrides,
  };
}

function makeContext(overrides: Partial<ToolCallContext> = {}): ToolCallContext {
  return {
    toolName: 'test_tool',
    input: {},
    ...overrides,
  };
}

const noopExecutor: ToolExecutor = async (_tool, _ctx) => 'executed';

/* ========================================================================== */
/*  ToolDispatcher                                                            */
/* ========================================================================== */

describe('ToolDispatcher', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  /* ---------------------------------------------------------------------- */
  /*  resolveServer                                                          */
  /* ---------------------------------------------------------------------- */

  describe('resolveServer', () => {
    it('resolves with exact match rule', () => {
      registry.register(makeTool({ name: 'file_read', server: 'default' }));

      const dispatcher = new ToolDispatcher({
        registry,
        policy: {
          rules: [{ match: 'file_read', server: 'file-server', priority: 10 }],
        },
      });

      expect(dispatcher.resolveServer('file_read')).toBe('file-server');
    });

    it('resolves with glob pattern (wildcard)', () => {
      registry.register(makeTool({ name: 'file_read' }));

      const dispatcher = new ToolDispatcher({
        registry,
        policy: {
          rules: [{ match: 'file_*', server: 'file-server' }],
        },
      });

      expect(dispatcher.resolveServer('file_read')).toBe('file-server');
      expect(dispatcher.resolveServer('file_write')).toBe('file-server');
    });

    it('resolves with single-char glob pattern (?)', () => {
      const dispatcher = new ToolDispatcher({
        registry,
        policy: {
          rules: [{ match: 'tool_?', server: 'single-char-server' }],
        },
      });

      expect(dispatcher.resolveServer('tool_a')).toBe('single-char-server');
      expect(dispatcher.resolveServer('tool_ab')).toBeUndefined(); // two chars, no match
    });

    it('falls back to descriptor server when no rules match', () => {
      registry.register(makeTool({ name: 'my_tool', server: 'desc-server' }));

      const dispatcher = new ToolDispatcher({
        registry,
        policy: { rules: [] },
      });

      expect(dispatcher.resolveServer('my_tool')).toBe('desc-server');
    });

    it('falls back to defaultServer when no rules or descriptor match', () => {
      registry.register(makeTool({ name: 'orphan' }));

      const dispatcher = new ToolDispatcher({
        registry,
        policy: { rules: [], defaultServer: 'fallback' },
      });

      expect(dispatcher.resolveServer('orphan')).toBe('fallback');
    });

    it('returns undefined when nothing matches and no default is set', () => {
      const dispatcher = new ToolDispatcher({
        registry,
        policy: { rules: [] },
      });

      expect(dispatcher.resolveServer('unknown_tool')).toBeUndefined();
    });

    it('higher priority rule wins over lower priority', () => {
      const dispatcher = new ToolDispatcher({
        registry,
        policy: { rules: [] },
      });

      dispatcher.addRule({ match: 'file_*', server: 'low-priority', priority: 1 });
      dispatcher.addRule({ match: 'file_*', server: 'high-priority', priority: 100 });

      expect(dispatcher.resolveServer('file_read')).toBe('high-priority');
    });

    it('first matching rule wins among equal priorities', () => {
      const dispatcher = new ToolDispatcher({
        registry,
        policy: {
          rules: [
            { match: 'tool_*', server: 'server-a', priority: 5 },
            { match: 'tool_read', server: 'server-b', priority: 5 },
          ],
        },
      });

      // Both match 'tool_read', but the glob comes first (same priority, stable order)
      expect(dispatcher.resolveServer('tool_read')).toBe('server-a');
    });

    it('setPolicy replaces the entire dispatch policy', () => {
      const dispatcher = new ToolDispatcher({
        registry,
        policy: {
          rules: [{ match: 'old_*', server: 'old-server' }],
          defaultServer: 'old-default',
        },
      });

      expect(dispatcher.resolveServer('old_tool')).toBe('old-server');

      dispatcher.setPolicy({
        rules: [{ match: 'new_*', server: 'new-server' }],
        defaultServer: 'new-default',
      });

      expect(dispatcher.resolveServer('old_tool')).toBe('new-default');
      expect(dispatcher.resolveServer('new_tool')).toBe('new-server');
    });
  });

  /* ---------------------------------------------------------------------- */
  /*  dispatch                                                               */
  /* ---------------------------------------------------------------------- */

  describe('dispatch', () => {
    it('returns error result when tool is not registered', async () => {
      const dispatcher = new ToolDispatcher({ registry });
      const result = await dispatcher.dispatch(
        makeContext({ toolName: 'nonexistent' }),
        noopExecutor,
      );

      expect(result.error).toBe('Tool not found: nonexistent');
      expect(result.output).toBeNull();
      expect(result.durationMs).toBe(0);
    });

    it('executes tool and returns output with duration', async () => {
      registry.register(makeTool({ name: 'echo' }));

      const dispatcher = new ToolDispatcher({ registry });
      const executor: ToolExecutor = async () => 'hello world';

      const result = await dispatcher.dispatch(
        makeContext({ toolName: 'echo', input: { text: 'hi' } }),
        executor,
      );

      expect(result.output).toBe('hello world');
      expect(result.error).toBeUndefined();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('catches executor errors and returns them in the result', async () => {
      registry.register(makeTool({ name: 'failing' }));

      const dispatcher = new ToolDispatcher({ registry });
      const executor: ToolExecutor = async () => {
        throw new Error('kaboom');
      };

      const result = await dispatcher.dispatch(
        makeContext({ toolName: 'failing' }),
        executor,
      );

      expect(result.error).toBe('kaboom');
      expect(result.output).toBeUndefined();
    });

    it('denies execution when beforeToolUse hook returns deny', async () => {
      registry.register(makeTool({ name: 'blocked' }));

      const hooks: ToolHookBridge = {
        async beforeToolUse(): Promise<ToolHookResult> {
          return { decision: 'deny', reason: 'not allowed' };
        },
        async afterToolUse() {
          return undefined;
        },
      };

      const dispatcher = new ToolDispatcher({ registry, hooks });
      const executor = vi.fn(noopExecutor);

      const result = await dispatcher.dispatch(
        makeContext({ toolName: 'blocked' }),
        executor,
      );

      expect(result.error).toBe('not allowed');
      expect(result.output).toBeNull();
      expect(executor).not.toHaveBeenCalled();
    });

    it('calls afterToolUse hook with result after execution', async () => {
      registry.register(makeTool({ name: 'hooked' }));

      const afterSpy = vi.fn();
      const hooks: ToolHookBridge = {
        async beforeToolUse() {
          return undefined;
        },
        afterToolUse: afterSpy,
      };

      const dispatcher = new ToolDispatcher({ registry, hooks });

      await dispatcher.dispatch(
        makeContext({ toolName: 'hooked' }),
        noopExecutor,
      );

      expect(afterSpy).toHaveBeenCalledOnce();
      const [ctx, desc, res] = afterSpy.mock.calls[0];
      expect(ctx.toolName).toBe('hooked');
      expect(desc.name).toBe('hooked');
      expect(res.output).toBe('executed');
    });

    it('applies replace toolMutation from beforeToolUse before execution', async () => {
      registry.register(makeTool({ name: 'mutated' }));

      const hooks: ToolHookBridge = {
        async beforeToolUse(): Promise<ToolHookResult> {
          return {
            decision: 'allow',
            toolMutation: {
              mode: 'replace',
              value: { patched: true },
            },
          };
        },
        async afterToolUse() {
          return undefined;
        },
      };
      const executor = vi.fn(async (_tool: ToolDescriptor, ctx: ToolCallContext) => ctx.input);
      const dispatcher = new ToolDispatcher({ registry, hooks });

      const result = await dispatcher.dispatch(
        makeContext({ toolName: 'mutated', input: { original: true } }),
        executor,
      );

      expect(result.output).toEqual({ patched: true });
      expect(executor.mock.calls[0][1].input).toEqual({ patched: true });
    });

    it('applies patch toolMutation from beforeToolUse before execution and after hook', async () => {
      registry.register(makeTool({ name: 'patched' }));

      const afterSpy = vi.fn();
      const hooks: ToolHookBridge = {
        async beforeToolUse(): Promise<ToolHookResult> {
          return {
            decision: 'allow',
            toolMutation: {
              mode: 'patch',
              value: { injected: 'yes' },
            },
          };
        },
        afterToolUse: afterSpy,
      };
      const dispatcher = new ToolDispatcher({ registry, hooks });

      const result = await dispatcher.dispatch(
        makeContext({ toolName: 'patched', input: { original: true } }),
        async (_tool, ctx) => ctx.input,
      );

      expect(result.output).toEqual({ original: true, injected: 'yes' });
      expect(afterSpy.mock.calls[0][0].input).toEqual({ original: true, injected: 'yes' });
    });

    it('provides default deny message when hook reason is absent', async () => {
      registry.register(makeTool({ name: 'denied_no_reason' }));

      const hooks: ToolHookBridge = {
        async beforeToolUse(): Promise<ToolHookResult> {
          return { decision: 'deny' };
        },
        async afterToolUse() {
          return undefined;
        },
      };

      const dispatcher = new ToolDispatcher({ registry, hooks });

      const result = await dispatcher.dispatch(
        makeContext({ toolName: 'denied_no_reason' }),
        noopExecutor,
      );

      expect(result.error).toBe('Tool use denied by hook');
    });
  });
});
