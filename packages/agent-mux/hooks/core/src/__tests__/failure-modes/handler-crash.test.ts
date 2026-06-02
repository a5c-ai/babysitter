import { describe, it, expect } from 'vitest';
import { runPlan } from '../../normalizer/runner';
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

function makePlanEntry(command: string, phase: string = 'tool.before'): HookPlanEntry {
  return {
    id: `entry-${command}`,
    pluginId: command,
    phase,
    priority: 100,
    handler: { source: command, handler: 'shell' },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('handler-crash failure modes', () => {
  describe('fail-open policy (default for tool.before)', () => {
    it('logs and continues when handler exits with non-zero code', async () => {
      const event = makeEvent('tool.before');
      const plan = [makePlanEntry('node -e "process.exit(1)"', 'tool.before')];

      const results = await runPlan(event, plan, {
        defaultPolicy: 'fail-open',
      });

      expect(results).toHaveLength(1);
      expect(results[0].decision).toBe('noop');
      expect(results[0].metadata?.error).toBe(true);
    });

    it('handles handler that outputs nothing gracefully', async () => {
      const event = makeEvent('tool.before');
      const plan = [makePlanEntry('node -e ""', 'tool.before')];

      const results = await runPlan(event, plan, {
        defaultPolicy: 'fail-open',
      });

      // Empty output gets converted to { decision: 'noop' }
      expect(results).toHaveLength(1);
      expect(results[0].decision).toBe('noop');
    });

    it('handles handler that outputs non-JSON text', async () => {
      const event = makeEvent('tool.before');
      const plan = [makePlanEntry('node -e "console.log(\'hello world\')"', 'tool.before')];

      const results = await runPlan(event, plan, {
        defaultPolicy: 'fail-open',
      });

      // Non-JSON output gets converted to { decision: 'noop', reason: 'hello world' }
      expect(results).toHaveLength(1);
      expect(results[0].decision).toBe('noop');
      expect(results[0].reason).toBe('hello world');
    });

    it('continues to next handler after a crash', async () => {
      const event = makeEvent('tool.before');
      const plan = [
        makePlanEntry('node -e "process.exit(1)"', 'tool.before'),
        makePlanEntry('node -e "console.log(JSON.stringify({decision:\'allow\',reason:\'all good\'}))"', 'tool.before'),
      ];

      const results = await runPlan(event, plan, {
        defaultPolicy: 'fail-open',
      });

      expect(results).toHaveLength(2);
      expect(results[0].metadata?.error).toBe(true);
      expect(results[1].decision).toBe('allow');
      expect(results[1].reason).toBe('all good');
    });
  });

  describe('fail-closed policy', () => {
    it('propagates error when handler exits with non-zero code', async () => {
      const event = makeEvent('tool.before');
      const plan = [makePlanEntry('node -e "process.exit(1)"', 'tool.before')];

      await expect(
        runPlan(event, plan, {
          defaultPolicy: 'fail-closed',
        }),
      ).rejects.toThrow();
    });

    it('stops executing remaining handlers after a failure', async () => {
      const event = makeEvent('tool.before');
      const plan = [
        makePlanEntry('node -e "process.exit(1)"', 'tool.before'),
        makePlanEntry('node -e "console.log(JSON.stringify({decision:\'allow\'}))"', 'tool.before'),
      ];

      await expect(
        runPlan(event, plan, {
          defaultPolicy: 'fail-closed',
        }),
      ).rejects.toThrow();
    });
  });

  describe('fail-open-bootstrap-only policy', () => {
    it('fails open for session.start phase', async () => {
      const event = makeEvent('session.start');
      const plan = [makePlanEntry('node -e "process.exit(1)"', 'session.start')];

      const results = await runPlan(event, plan, {
        defaultPolicy: 'fail-open-bootstrap-only',
      });

      expect(results).toHaveLength(1);
      expect(results[0].metadata?.error).toBe(true);
    });

    it('fails closed for non-bootstrap phases', async () => {
      const event = makeEvent('tool.before');
      const plan = [makePlanEntry('node -e "process.exit(1)"', 'tool.before')];

      await expect(
        runPlan(event, plan, {
          defaultPolicy: 'fail-open-bootstrap-only',
        }),
      ).rejects.toThrow();
    });
  });

  describe('phasePolicies override', () => {
    it('uses per-phase policy override before defaultPolicy', async () => {
      const event = makeEvent('tool.before');
      const plan = [makePlanEntry('node -e "process.exit(1)"', 'tool.before')];

      // defaultPolicy is fail-closed, but phasePolicies overrides tool.before to fail-open
      const results = await runPlan(event, plan, {
        defaultPolicy: 'fail-closed',
        phasePolicies: { 'tool.before': 'fail-open' },
      });

      expect(results).toHaveLength(1);
      expect(results[0].metadata?.error).toBe(true);
    });

    it('phasePolicies fail-closed overrides default fail-open', async () => {
      const event = makeEvent('session.start');
      const plan = [makePlanEntry('node -e "process.exit(1)"', 'session.start')];

      await expect(
        runPlan(event, plan, {
          defaultPolicy: 'fail-open',
          phasePolicies: { 'session.start': 'fail-closed' },
        }),
      ).rejects.toThrow();
    });
  });

  describe('handler receives event on stdin', () => {
    it('receives the normalized event JSON on stdin', async () => {
      const event = makeEvent('tool.before');
      // Handler reads stdin and echoes back the phase from the event
      const plan = [makePlanEntry(
        'node -e "let d=\'\';process.stdin.on(\'data\',c=>d+=c);process.stdin.on(\'end\',()=>{const e=JSON.parse(d);console.log(JSON.stringify({decision:\'allow\',reason:e.phase}))})"',
        'tool.before',
      )];

      const results = await runPlan(event, plan, {
        defaultPolicy: 'fail-open',
      });

      expect(results).toHaveLength(1);
      expect(results[0].decision).toBe('allow');
      expect(results[0].reason).toBe('tool.before');
    });
  });

  describe('handler receives execution context env vars', () => {
    it('receives AGENT_SESSION_ID and AGENT_ADAPTER in environment', async () => {
      const event = makeEvent('tool.before');
      // Handler reads env vars and returns them in the result
      const plan = [makePlanEntry(
        'node -e "console.log(JSON.stringify({decision:\'allow\',metadata:{sid:process.env.AGENT_SESSION_ID,adapter:process.env.AGENT_ADAPTER}}))"',
        'tool.before',
      )];

      const results = await runPlan(event, plan, {
        defaultPolicy: 'fail-open',
      });

      expect(results).toHaveLength(1);
      expect(results[0].decision).toBe('allow');
      expect(results[0].metadata?.sid).toBe('test-session');
      expect(results[0].metadata?.adapter).toBe('test');
    });
  });

  describe('handler stdout is parsed as JSON result', () => {
    it('parses valid JSON stdout as the handler result', async () => {
      const event = makeEvent('tool.before');
      const plan = [makePlanEntry(
        'node -e "console.log(JSON.stringify({decision:\'deny\',reason:\'blocked\'}))"',
        'tool.before',
      )];

      const results = await runPlan(event, plan, {
        defaultPolicy: 'fail-open',
      });

      expect(results).toHaveLength(1);
      expect(results[0].decision).toBe('deny');
      expect(results[0].reason).toBe('blocked');
    });
  });
});
