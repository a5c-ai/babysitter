import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHooksEngine } from '../engine';
import type { HooksEngine, RegisteredHandler, ProgrammaticEngineConfig } from '../engine';
import type { HookMiddleware } from '../middleware';
import type { UnifiedHookEvent } from '../../types/event';
import type { UnifiedHookResult } from '../../types/result';
import type { PhaseMapping } from '../../types/lifecycle';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const TEST_PHASE_MAPPINGS: PhaseMapping[] = [
  {
    canonicalPhase: 'session.start',
    nativeHook: 'session_start',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'session',
  },
  {
    canonicalPhase: 'tool.before',
    nativeHook: 'tool_call',
    supportLevel: 'native',
    blockCapability: true,
    mutationCapability: true,
    scope: 'tool',
  },
  {
    canonicalPhase: 'tool.after',
    nativeHook: 'tool_result',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'tool',
  },
];

function createTestConfig(overrides?: Partial<ProgrammaticEngineConfig>): ProgrammaticEngineConfig {
  return {
    adapter: 'test-adapter',
    capabilities: {
      name: 'test-adapter',
      family: 'in-process',
      sessionIdQuality: 'native',
      supportsOrderedFanout: true,
      supportsNativeAdditionalContext: false,
      supportsBlock: true,
      supportsAsk: false,
      supportsToolInputMutation: true,
      supportsToolResultMutation: false,
      supportsPersistedEnv: true,
      envPersistenceMode: 'runtime_hook',
      toolInterceptionScope: 'all',
      hostTools: [
        {
          name: 'RunCommand',
          category: 'shell',
          description: 'Run a command through the host.',
          availability: 'built-in',
        },
      ],
    },
    phaseMappings: TEST_PHASE_MAPPINGS,
    ...overrides,
  };
}

function createTestHandler(overrides?: Partial<RegisteredHandler>): RegisteredHandler {
  return {
    id: 'test-handler',
    pluginId: 'test-plugin',
    phase: 'session.start',
    priority: 100,
    handler: async () => ({ decision: 'noop' as const }),
    ...overrides,
  };
}

function buildTestEvent(phase: string = 'session.start'): UnifiedHookEvent {
  return {
    version: 'a5c.hooks.v1',
    adapter: 'test-adapter',
    phase,
    rawEventName: phase === 'session.start' ? 'session_start' : 'tool_call',
    supportLevel: 'native',
    execution: {
      sessionId: null,
      adapter: 'test-adapter',
      cwd: '/test',
      nativeEventName: phase === 'session.start' ? 'session_start' : 'tool_call',
      persistedEnv: {},
      contextVars: {},
      metadata: {},
    },
    payload: {},
    env: { input: {}, persisted: {} },
    raw: null,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createHooksEngine', () => {
  let engine: HooksEngine;
  let sessionDir: string;

  beforeEach(() => {
    sessionDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hooks-engine-test-'));
    engine = createHooksEngine(createTestConfig({ sessionDir }));
  });

  afterEach(() => {
    fs.rmSync(sessionDir, { recursive: true, force: true });
  });

  // -----------------------------------------------------------------------
  // Basic handler registration and execution
  // -----------------------------------------------------------------------

  describe('registerHandler + processEvent', () => {
    it('should register a handler and process an event through it', async () => {
      engine.registerHandler(createTestHandler({
        handler: async () => ({
          decision: 'allow',
          reason: 'test passed',
          persistEnv: { TEST_KEY: 'test_value' },
        }),
      }));

      const result = await engine.processEvent({
        nativeEventName: 'session_start',
        payload: { sessionId: 'test-session' },
      });

      expect(result.mergedResult.decision).toBe('allow');
      expect(result.mergedResult.reason).toBe('test passed');
      expect(result.mergedResult.persistEnv).toEqual({ TEST_KEY: 'test_value' });
      expect(result.handlersExecuted).toEqual(['test-handler']);
      expect(result.diagnostics.adapterName).toBe('test-adapter');
      expect(result.diagnostics.phase).toBe('session.start');
      expect(result.diagnostics.handlerCount).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // Priority ordering
  // -----------------------------------------------------------------------

  describe('handler priority ordering', () => {
    it('should execute handlers in priority order (ascending)', async () => {
      const executionOrder: string[] = [];

      engine.registerHandler(createTestHandler({
        id: 'high-priority',
        pluginId: 'plugin-a',
        priority: 50,
        handler: async () => {
          executionOrder.push('high-priority');
          return { decision: 'noop' };
        },
      }));

      engine.registerHandler(createTestHandler({
        id: 'low-priority',
        pluginId: 'plugin-b',
        priority: 200,
        handler: async () => {
          executionOrder.push('low-priority');
          return { decision: 'noop' };
        },
      }));

      engine.registerHandler(createTestHandler({
        id: 'medium-priority',
        pluginId: 'plugin-a',
        priority: 100,
        handler: async () => {
          executionOrder.push('medium-priority');
          return { decision: 'noop' };
        },
      }));

      await engine.processEvent({
        nativeEventName: 'session_start',
        payload: {},
      });

      expect(executionOrder).toEqual(['high-priority', 'medium-priority', 'low-priority']);
    });

    it('should tie-break by pluginId then id', async () => {
      const executionOrder: string[] = [];

      engine.registerHandler(createTestHandler({
        id: 'handler-b',
        pluginId: 'plugin-b',
        priority: 100,
        handler: async () => {
          executionOrder.push('plugin-b:handler-b');
          return { decision: 'noop' };
        },
      }));

      engine.registerHandler(createTestHandler({
        id: 'handler-a',
        pluginId: 'plugin-a',
        priority: 100,
        handler: async () => {
          executionOrder.push('plugin-a:handler-a');
          return { decision: 'noop' };
        },
      }));

      await engine.processEvent({
        nativeEventName: 'session_start',
        payload: {},
      });

      expect(executionOrder).toEqual(['plugin-a:handler-a', 'plugin-b:handler-b']);
    });
  });

  // -----------------------------------------------------------------------
  // When conditions
  // -----------------------------------------------------------------------

  describe('when conditions', () => {
    it('should skip handler when condition does not match', async () => {
      const handlerCalled = vi.fn();

      engine.registerHandler(createTestHandler({
        when: { 'execution.adapter': 'different-adapter' },
        handler: async () => {
          handlerCalled();
          return { decision: 'deny' };
        },
      }));

      const result = await engine.processEvent({
        nativeEventName: 'session_start',
        payload: {},
      });

      expect(handlerCalled).not.toHaveBeenCalled();
      expect(result.mergedResult.decision).toBe('noop');
    });

    it('should execute handler when condition matches', async () => {
      engine.registerHandler(createTestHandler({
        when: { 'execution.adapter': 'test-adapter' },
        handler: async () => ({ decision: 'allow' }),
      }));

      const result = await engine.processEvent({
        nativeEventName: 'session_start',
        payload: {},
      });

      expect(result.mergedResult.decision).toBe('allow');
      expect(result.handlersExecuted).toEqual(['test-handler']);
    });
  });

  // -----------------------------------------------------------------------
  // Bootstrap
  // -----------------------------------------------------------------------

  describe('bootstrap', () => {
    it('should create a session file', async () => {
      await engine.bootstrap('test-session-123', { project: 'test' });

      // Verify session was saved by checking the directory has a session file
      const files = fs.readdirSync(sessionDir, { recursive: true }) as string[];
      const sessionFiles = files.filter((f: string) => f.endsWith('.json'));
      expect(sessionFiles.length).toBeGreaterThanOrEqual(1);
    });
  });

  // -----------------------------------------------------------------------
  // processNormalizedEvent
  // -----------------------------------------------------------------------

  describe('processNormalizedEvent', () => {
    it('should skip normalization and process a pre-built event', async () => {
      engine.registerHandler(createTestHandler({
        handler: async (event) => ({
          decision: 'allow',
          reason: `adapter=${event.adapter}`,
        }),
      }));

      const event = buildTestEvent();
      const result = await engine.processNormalizedEvent(event);

      expect(result.mergedResult.decision).toBe('allow');
      expect(result.mergedResult.reason).toBe('adapter=test-adapter');
    });
  });

  // -----------------------------------------------------------------------
  // getHandlers / getHandlersForPhase
  // -----------------------------------------------------------------------

  describe('getHandlers', () => {
    it('should return all registered handlers', () => {
      engine.registerHandler(createTestHandler({ id: 'h1', phase: 'session.start' }));
      engine.registerHandler(createTestHandler({ id: 'h2', phase: 'tool.before' }));

      const all = engine.getHandlers();
      expect(all).toHaveLength(2);
      expect(all.map((h) => h.id)).toEqual(['h1', 'h2']);
    });
  });

  describe('getHandlersForPhase', () => {
    it('should return only handlers matching the phase', () => {
      engine.registerHandler(createTestHandler({ id: 'h1', phase: 'session.start' }));
      engine.registerHandler(createTestHandler({ id: 'h2', phase: 'tool.before' }));
      engine.registerHandler(createTestHandler({ id: 'h3', phase: 'session.start' }));

      const sessionHandlers = engine.getHandlersForPhase('session.start');
      expect(sessionHandlers).toHaveLength(2);
      expect(sessionHandlers.map((h) => h.id)).toEqual(['h1', 'h3']);

      const toolHandlers = engine.getHandlersForPhase('tool.before');
      expect(toolHandlers).toHaveLength(1);
      expect(toolHandlers[0].id).toBe('h2');
    });
  });

  // -----------------------------------------------------------------------
  // removeHandler
  // -----------------------------------------------------------------------

  describe('removeHandler', () => {
    it('should remove a handler by id', () => {
      engine.registerHandler(createTestHandler({ id: 'to-remove' }));
      engine.registerHandler(createTestHandler({ id: 'to-keep' }));

      expect(engine.getHandlers()).toHaveLength(2);

      engine.removeHandler('to-remove');

      const remaining = engine.getHandlers();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('to-keep');
    });

    it('should be a no-op when removing non-existent handler', () => {
      engine.registerHandler(createTestHandler({ id: 'exists' }));
      engine.removeHandler('does-not-exist');
      expect(engine.getHandlers()).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // Empty handlers (noop)
  // -----------------------------------------------------------------------

  describe('empty handlers', () => {
    it('should return noop result when no handlers are registered', async () => {
      const result = await engine.processEvent({
        nativeEventName: 'session_start',
        payload: {},
      });

      expect(result.mergedResult.decision).toBe('noop');
      expect(result.handlersExecuted).toEqual([]);
      expect(result.diagnostics.handlerCount).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // Handler error (fail-open)
  // -----------------------------------------------------------------------

  describe('handler throws', () => {
    it('should fail open and produce a noop result with error metadata', async () => {
      engine.registerHandler(createTestHandler({
        handler: async () => {
          throw new Error('Something went wrong');
        },
      }));

      const result = await engine.processEvent({
        nativeEventName: 'session_start',
        payload: {},
      });

      // Fail-open: should not throw, should produce a noop result
      expect(result.mergedResult.decision).toBe('noop');
      expect(result.mergedResult.reason).toContain('Something went wrong');
      expect(result.handlersExecuted).toEqual(['test-handler']);
    });

    it('should continue executing remaining handlers after one throws', async () => {
      engine.registerHandler(createTestHandler({
        id: 'failing-handler',
        priority: 10,
        handler: async () => {
          throw new Error('I fail');
        },
      }));

      engine.registerHandler(createTestHandler({
        id: 'succeeding-handler',
        priority: 20,
        handler: async () => ({
          decision: 'allow',
          reason: 'I succeed',
        }),
      }));

      const result = await engine.processEvent({
        nativeEventName: 'session_start',
        payload: {},
      });

      expect(result.handlersExecuted).toEqual(['failing-handler', 'succeeding-handler']);
      // 'allow' is more restrictive than 'noop', so it wins
      expect(result.mergedResult.decision).toBe('allow');
    });
  });

  // -----------------------------------------------------------------------
  // Session persistence
  // -----------------------------------------------------------------------

  describe('session persistence', () => {
    it('should save persistEnv to session store', async () => {
      engine.registerHandler(createTestHandler({
        handler: async () => ({
          persistEnv: { MY_KEY: 'my_value', OTHER_KEY: 'other_value' },
        }),
      }));

      await engine.processEvent({
        nativeEventName: 'session_start',
        payload: {},
        sessionId: 'persist-test-session',
      });

      // Verify by loading the session file
      const { loadSession } = await import('../../session-store/store');
      const session = await loadSession('persist-test-session', sessionDir);

      expect(session).not.toBeNull();
      expect(session!.persistedEnv).toEqual({
        MY_KEY: 'my_value',
        OTHER_KEY: 'other_value',
      });
      expect(session!.adapter).toBe('test-adapter');
    });

    it('should save contextVars to session store', async () => {
      engine.registerHandler(createTestHandler({
        handler: async () => ({
          contextVars: { 'my-plugin.version': '2.0' },
        }),
      }));

      await engine.processEvent({
        nativeEventName: 'session_start',
        payload: {},
        sessionId: 'ctx-vars-session',
      });

      const { loadSession } = await import('../../session-store/store');
      const session = await loadSession('ctx-vars-session', sessionDir);

      expect(session).not.toBeNull();
      expect(session!.contextVars).toEqual({ 'my-plugin.version': '2.0' });
    });
  });

  // -----------------------------------------------------------------------
  // Middleware
  // -----------------------------------------------------------------------

  describe('middleware', () => {
    it('should wrap handler execution with middleware', async () => {
      const middlewareLog: string[] = [];

      const loggingMiddleware: HookMiddleware = async (event, next) => {
        middlewareLog.push('before');
        const result = await next();
        middlewareLog.push('after');
        return result;
      };

      engine.use(loggingMiddleware);

      engine.registerHandler(createTestHandler({
        handler: async () => {
          middlewareLog.push('handler');
          return { decision: 'allow' };
        },
      }));

      await engine.processEvent({
        nativeEventName: 'session_start',
        payload: {},
      });

      // Handler runs first (core execution), then middleware wraps the result retrieval
      expect(middlewareLog).toContain('handler');
      expect(middlewareLog).toContain('before');
      expect(middlewareLog).toContain('after');
      // Middleware before/after should be in order
      const beforeIdx = middlewareLog.indexOf('before');
      const afterIdx = middlewareLog.indexOf('after');
      expect(afterIdx).toBeGreaterThan(beforeIdx);
    });

    it('should allow middleware to transform the result', async () => {
      const transformingMiddleware: HookMiddleware = async (_event, next) => {
        const result = await next();
        return {
          ...result,
          additionalContext: 'injected by middleware',
        };
      };

      engine.use(transformingMiddleware);

      engine.registerHandler(createTestHandler({
        handler: async () => ({ decision: 'allow' }),
      }));

      const result = await engine.processEvent({
        nativeEventName: 'session_start',
        payload: {},
      });

      expect(result.mergedResult.additionalContext).toBe('injected by middleware');
    });

    it('should allow middleware to short-circuit', async () => {
      const blockingMiddleware: HookMiddleware = async (_event, _next) => {
        return { decision: 'deny', reason: 'blocked by middleware' };
      };

      engine.use(blockingMiddleware);

      const handlerCalled = vi.fn();
      engine.registerHandler(createTestHandler({
        handler: async () => {
          handlerCalled();
          return { decision: 'allow' };
        },
      }));

      const result = await engine.processEvent({
        nativeEventName: 'session_start',
        payload: {},
      });

      expect(result.mergedResult.decision).toBe('deny');
      expect(result.mergedResult.reason).toBe('blocked by middleware');
    });
  });

  // -----------------------------------------------------------------------
  // Handler replacement
  // -----------------------------------------------------------------------

  describe('handler replacement', () => {
    it('should replace existing handler with same id', async () => {
      engine.registerHandler(createTestHandler({
        id: 'replaceable',
        handler: async () => ({ decision: 'deny' }),
      }));

      engine.registerHandler(createTestHandler({
        id: 'replaceable',
        handler: async () => ({ decision: 'allow', reason: 'replaced' }),
      }));

      expect(engine.getHandlers()).toHaveLength(1);

      const result = await engine.processEvent({
        nativeEventName: 'session_start',
        payload: {},
      });

      expect(result.mergedResult.decision).toBe('allow');
      expect(result.mergedResult.reason).toBe('replaced');
    });
  });

  // -----------------------------------------------------------------------
  // Phase filtering
  // -----------------------------------------------------------------------

  describe('phase filtering', () => {
    it('should only run handlers matching the event phase', async () => {
      const toolHandlerCalled = vi.fn();
      const sessionHandlerCalled = vi.fn();

      engine.registerHandler(createTestHandler({
        id: 'session-handler',
        phase: 'session.start',
        handler: async () => {
          sessionHandlerCalled();
          return { decision: 'noop' };
        },
      }));

      engine.registerHandler(createTestHandler({
        id: 'tool-handler',
        phase: 'tool.before',
        handler: async () => {
          toolHandlerCalled();
          return { decision: 'deny' };
        },
      }));

      // Fire session.start event -- only session handler should run
      await engine.processEvent({
        nativeEventName: 'session_start',
        payload: {},
      });

      expect(sessionHandlerCalled).toHaveBeenCalledTimes(1);
      expect(toolHandlerCalled).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Merge semantics
  // -----------------------------------------------------------------------

  describe('merge semantics', () => {
    it('should merge persistEnv from multiple handlers', async () => {
      engine.registerHandler(createTestHandler({
        id: 'h1',
        priority: 10,
        handler: async () => ({
          persistEnv: { KEY_A: 'value_a' },
        }),
      }));

      engine.registerHandler(createTestHandler({
        id: 'h2',
        priority: 20,
        handler: async () => ({
          persistEnv: { KEY_B: 'value_b' },
        }),
      }));

      const result = await engine.processEvent({
        nativeEventName: 'session_start',
        payload: {},
      });

      expect(result.mergedResult.persistEnv).toEqual({
        KEY_A: 'value_a',
        KEY_B: 'value_b',
      });
    });

    it('should use most restrictive decision across handlers', async () => {
      engine.registerHandler(createTestHandler({
        id: 'permissive',
        priority: 10,
        handler: async () => ({ decision: 'allow' }),
      }));

      engine.registerHandler(createTestHandler({
        id: 'restrictive',
        priority: 20,
        handler: async () => ({ decision: 'deny' }),
      }));

      const result = await engine.processEvent({
        nativeEventName: 'session_start',
        payload: {},
      });

      expect(result.mergedResult.decision).toBe('deny');
    });
  });

  // -----------------------------------------------------------------------
  // Capabilities propagation
  // -----------------------------------------------------------------------

  describe('capabilities propagation', () => {
    it('should inject AGENT_CAPABILITIES_JSON into event execution metadata', async () => {
      let capturedMetadata: Record<string, unknown> = {};

      engine.registerHandler(createTestHandler({
        handler: async (event) => {
          capturedMetadata = { ...event.execution.metadata };
          return { decision: 'noop' };
        },
      }));

      await engine.processEvent({
        nativeEventName: 'session_start',
        payload: {},
      });

      expect(capturedMetadata['AGENT_CAPABILITIES_JSON']).toBeDefined();
      const parsed = JSON.parse(capturedMetadata['AGENT_CAPABILITIES_JSON'] as string);
      expect(parsed.name).toBe('test-adapter');
      expect(parsed.family).toBe('in-process');
      expect(parsed.supportsBlock).toBe(true);
      expect(parsed.supportsToolInputMutation).toBe(true);
      expect(parsed.envPersistenceMode).toBe('runtime_hook');
      expect(parsed.hostTools).toEqual([
        {
          name: 'RunCommand',
          category: 'shell',
          description: 'Run a command through the host.',
          availability: 'built-in',
        },
      ]);
    });
  });

  // -----------------------------------------------------------------------
  // Execution time tracking
  // -----------------------------------------------------------------------

  describe('diagnostics', () => {
    it('should track execution time', async () => {
      engine.registerHandler(createTestHandler({
        handler: async () => ({ decision: 'noop' }),
      }));

      const result = await engine.processEvent({
        nativeEventName: 'session_start',
        payload: {},
      });

      expect(result.diagnostics.executionTimeMs).toBeGreaterThanOrEqual(0);
    });
  });
});
