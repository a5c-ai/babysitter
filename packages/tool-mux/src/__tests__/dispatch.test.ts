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

    it('resolves server from a qualified tool identity', () => {
      registry.register(makeTool({
        name: 'lookup',
        source: 'mcp',
        sourceQualifier: 'docs',
        server: 'docs',
      }));

      const dispatcher = new ToolDispatcher({ registry });

      expect(dispatcher.resolveServer('mcp:docs:lookup')).toBe('docs');
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

    it('dispatches duplicate tool names by qualified identity', async () => {
      registry.register(makeTool({ name: 'fetch', source: 'plugin', sourceQualifier: 'plugin-a' }));
      registry.register(makeTool({ name: 'fetch', source: 'mcp', sourceQualifier: 'web', server: 'web' }));

      const dispatcher = new ToolDispatcher({ registry });
      const executor = vi.fn(async (tool: ToolDescriptor) => tool.sourceQualifier);

      const result = await dispatcher.dispatch(
        makeContext({ toolName: 'mcp:web:fetch', input: { url: 'https://example.com' } }),
        executor,
      );

      expect(result.output).toBe('web');
      expect(executor).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'mcp', sourceQualifier: 'web', server: 'web' }),
        expect.objectContaining({ toolName: 'mcp:web:fetch' }),
      );
    });

    it('uses dispatch policy server resolution to select duplicate bare tool names', async () => {
      registry.register(makeTool({ name: 'fetch', source: 'mcp', sourceQualifier: 'docs', server: 'docs' }));
      registry.register(makeTool({ name: 'fetch', source: 'mcp', sourceQualifier: 'web', server: 'web' }));

      const dispatcher = new ToolDispatcher({
        registry,
        policy: { rules: [{ match: 'fetch', server: 'web', priority: 10 }] },
      });
      const executor = vi.fn(async (tool: ToolDescriptor) => tool.server);

      const result = await dispatcher.dispatch(
        makeContext({ toolName: 'fetch', input: { url: 'https://example.com' } }),
        executor,
      );

      expect(result.output).toBe('web');
      expect(executor).toHaveBeenCalledWith(
        expect.objectContaining({ server: 'web', sourceQualifier: 'web' }),
        expect.objectContaining({ toolName: 'fetch' }),
      );
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
