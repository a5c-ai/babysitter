import { describe, it, expect } from 'vitest';
import { runPlan } from '../../normalizer/runner';
import { HandlerError } from '../../normalizer/errors';
import type { UnifiedHookEvent } from '../../types/event';
import type { HookPlanEntry } from '../../types/plan';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(phase: string = 'tool.before'): UnifiedHookEvent {
  return {
    version: 'a5c.hooks.v1',
    adapter: 'test',
    phase,
    rawEventName: 'TestHook',
    supportLevel: 'native',
    execution: {
      sessionId: 'test-session',
      adapter: 'test',
      nativeEventName: 'TestHook',
      persistedEnv: {},
      contextVars: {},
      metadata: {},
    },
    payload: {},
    env: { input: {}, persisted: {} },
    raw: null,
  };
}

function makePlanEntry(source: string, phase: string = 'tool.before'): HookPlanEntry {
  return {
    id: `entry-${source}`,
    pluginId: source,
    phase,
    priority: 100,
    handler: { source, handler: 'handler' },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('handler-crash failure modes', () => {
  describe('fail-open policy (default for tool.before)', () => {
    it('logs and continues when handler throws an error', async () => {
      const event = makeEvent('tool.before');
      const plan = [makePlanEntry('./crash.js', 'tool.before')];

      const results = await runPlan(event, plan, {
        defaultPolicy: 'fail-open',
        loadModule: () => ({
          handler: () => { throw new Error('Handler exploded!'); },
        }),
      });

      expect(results).toHaveLength(1);
      expect(results[0].decision).toBe('noop');
      expect(results[0].metadata?.error).toBe(true);
      expect(results[0].reason).toContain('Handler exploded!');
    });

    it('handles handler that returns undefined gracefully', async () => {
      const event = makeEvent('tool.before');
      const plan = [makePlanEntry('./undef.js', 'tool.before')];

      const results = await runPlan(event, plan, {
        defaultPolicy: 'fail-open',
        loadModule: () => ({
          handler: () => undefined,
        }),
      });

      // undefined return gets converted to { decision: 'noop' }
      expect(results).toHaveLength(1);
      expect(results[0].decision).toBe('noop');
    });

    it('handles handler that returns a non-object (number)', async () => {
      const event = makeEvent('tool.before');
      const plan = [makePlanEntry('./number.js', 'tool.before')];

      const results = await runPlan(event, plan, {
        defaultPolicy: 'fail-open',
        loadModule: () => ({
          handler: () => 42,
        }),
      });

      // Non-object return gets converted to { decision: 'noop' }
      expect(results).toHaveLength(1);
      expect(results[0].decision).toBe('noop');
    });

    it('continues to next handler after a crash', async () => {
      const event = makeEvent('tool.before');
      const plan = [
        makePlanEntry('./crash.js', 'tool.before'),
        makePlanEntry('./ok.js', 'tool.before'),
      ];

      const modules: Record<string, Record<string, unknown>> = {
        './crash.js': {
          handler: () => { throw new Error('boom'); },
        },
        './ok.js': {
          handler: () => ({ decision: 'allow' as const, reason: 'all good' }),
        },
      };

      const results = await runPlan(event, plan, {
        defaultPolicy: 'fail-open',
        loadModule: (source: string) => {
          const mod = modules[source];
          if (!mod) throw new Error(`Module not found: ${source}`);
          return mod;
        },
      });

      expect(results).toHaveLength(2);
      expect(results[0].metadata?.error).toBe(true);
      expect(results[1].decision).toBe('allow');
      expect(results[1].reason).toBe('all good');
    });
  });

  describe('fail-closed policy', () => {
    it('propagates error when handler throws', async () => {
      const event = makeEvent('tool.before');
      const plan = [makePlanEntry('./crash.js', 'tool.before')];

      await expect(
        runPlan(event, plan, {
          defaultPolicy: 'fail-closed',
          loadModule: () => ({
            handler: () => { throw new Error('Critical failure'); },
          }),
        }),
      ).rejects.toThrow('Critical failure');
    });

    it('propagates HandlerError for module load failures', async () => {
      const event = makeEvent('tool.before');
      const plan = [makePlanEntry('./missing.js', 'tool.before')];

      await expect(
        runPlan(event, plan, {
          defaultPolicy: 'fail-closed',
          loadModule: () => { throw new Error('Module not found'); },
        }),
      ).rejects.toThrow();
    });

    it('stops executing remaining handlers after a failure', async () => {
      const event = makeEvent('tool.before');
      let secondHandlerCalled = false;
      const plan = [
        makePlanEntry('./crash.js', 'tool.before'),
        makePlanEntry('./second.js', 'tool.before'),
      ];

      const modules: Record<string, Record<string, unknown>> = {
        './crash.js': {
          handler: () => { throw new Error('first fails'); },
        },
        './second.js': {
          handler: () => { secondHandlerCalled = true; return { decision: 'allow' as const }; },
        },
      };

      await expect(
        runPlan(event, plan, {
          defaultPolicy: 'fail-closed',
          loadModule: (source: string) => {
            const mod = modules[source];
            if (!mod) throw new Error(`Module not found: ${source}`);
            return mod;
          },
        }),
      ).rejects.toThrow('first fails');

      expect(secondHandlerCalled).toBe(false);
    });
  });

  describe('fail-open-bootstrap-only policy', () => {
    it('fails open for session.start phase', async () => {
      const event = makeEvent('session.start');
      const plan = [makePlanEntry('./crash.js', 'session.start')];

      const results = await runPlan(event, plan, {
        defaultPolicy: 'fail-open-bootstrap-only',
        loadModule: () => ({
          handler: () => { throw new Error('bootstrap error'); },
        }),
      });

      expect(results).toHaveLength(1);
      expect(results[0].metadata?.error).toBe(true);
    });

    it('fails closed for non-bootstrap phases', async () => {
      const event = makeEvent('tool.before');
      const plan = [makePlanEntry('./crash.js', 'tool.before')];

      await expect(
        runPlan(event, plan, {
          defaultPolicy: 'fail-open-bootstrap-only',
          loadModule: () => ({
            handler: () => { throw new Error('non-bootstrap error'); },
          }),
        }),
      ).rejects.toThrow('non-bootstrap error');
    });
  });

  describe('phasePolicies override', () => {
    it('uses per-phase policy override before defaultPolicy', async () => {
      const event = makeEvent('tool.before');
      const plan = [makePlanEntry('./crash.js', 'tool.before')];

      // defaultPolicy is fail-closed, but phasePolicies overrides tool.before to fail-open
      const results = await runPlan(event, plan, {
        defaultPolicy: 'fail-closed',
        phasePolicies: { 'tool.before': 'fail-open' },
        loadModule: () => ({
          handler: () => { throw new Error('should be caught'); },
        }),
      });

      expect(results).toHaveLength(1);
      expect(results[0].metadata?.error).toBe(true);
    });

    it('phasePolicies fail-closed overrides default fail-open', async () => {
      const event = makeEvent('session.start');
      const plan = [makePlanEntry('./crash.js', 'session.start')];

      await expect(
        runPlan(event, plan, {
          defaultPolicy: 'fail-open',
          phasePolicies: { 'session.start': 'fail-closed' },
          loadModule: () => ({
            handler: () => { throw new Error('forced closed'); },
          }),
        }),
      ).rejects.toThrow('forced closed');
    });
  });

  describe('handler with export not a function', () => {
    it('fails when handler export is not a function', async () => {
      const event = makeEvent('tool.before');
      const plan = [makePlanEntry('./bad-export.js', 'tool.before')];

      // Under fail-open, should produce error result
      const results = await runPlan(event, plan, {
        defaultPolicy: 'fail-open',
        loadModule: () => ({
          handler: 'not-a-function',
        }),
      });

      expect(results).toHaveLength(1);
      expect(results[0].metadata?.error).toBe(true);
      expect(results[0].metadata?.errorCode).toBe('HANDLER_LOAD');
    });
  });
});
