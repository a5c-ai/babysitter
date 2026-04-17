import { describe, it, expect } from 'vitest';
import { normalizeEvent } from '../../normalizer/normalize';
import { resolveHookPlan } from '../../normalizer/plan-resolver';
import { runPlan } from '../../normalizer/runner';
import { mergeResults } from '../../merge-engine/merge';
import type { PhaseMapping } from '../../types/lifecycle';
import type { UnifiedHookEvent } from '../../types/event';
import type { UnifiedHookResult } from '../../types/result';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ADAPTER_MAPPINGS: PhaseMapping[] = [
  {
    canonicalPhase: 'tool.before',
    nativeHook: 'PreToolUse',
    supportLevel: 'native',
    blockCapability: true,
    mutationCapability: true,
    scope: 'tool',
  },
];

/** Create a mock module that adds env vars to persistEnv. */
function makeMockModule(
  envVars: Record<string, string>,
  extras: Partial<UnifiedHookResult> = {},
): Record<string, unknown> {
  return {
    handler: (_event: UnifiedHookEvent): UnifiedHookResult => ({
      decision: 'allow',
      persistEnv: envVars,
      ...extras,
    }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('invoke-fanout integration: normalizeEvent -> resolveHookPlan -> runPlan -> mergeResults', () => {
  it('wires the full pipeline with 3 mock handlers that each add env vars', async () => {
    // Step 1: normalizeEvent
    const event = normalizeEvent({
      adapter: 'claude',
      rawEventName: 'PreToolUse',
      stdinPayload: { tool: 'Bash', input: { command: 'ls' } },
      env: { HOOKS_PROXY_SESSION_ID: 'sess-1' },
      adapterMappings: ADAPTER_MAPPINGS,
    });

    expect(event.version).toBe('a5c.hooks.v1');
    expect(event.phase).toBe('tool.before');
    expect(event.adapter).toBe('claude');

    // Step 2: resolveHookPlan with 3 module handlers
    const plan = resolveHookPlan({
      phase: 'tool.before',
      handlerModules: [
        './handler-a.js#handler',
        './handler-b.js#handler',
        './handler-c.js#handler',
      ],
    });

    expect(plan).toHaveLength(3);

    // Step 3: runPlan with mock module loader
    const modules: Record<string, Record<string, unknown>> = {
      './handler-a.js': makeMockModule({ PLUGIN_A_KEY: 'val-a' }),
      './handler-b.js': makeMockModule({ PLUGIN_B_KEY: 'val-b' }, { additionalContext: 'context from B' }),
      './handler-c.js': makeMockModule({ PLUGIN_C_KEY: 'val-c' }, { reason: 'handler-c ok' }),
    };

    const results = await runPlan(event, plan, {
      loadModule: (source: string) => {
        const mod = modules[source];
        if (!mod) throw new Error(`Module not found: ${source}`);
        return mod;
      },
    });

    expect(results).toHaveLength(3);

    // Step 4: mergeResults
    const merged = mergeResults(results);

    expect(merged.decision).toBe('allow');
    expect(merged.persistEnv).toEqual({
      PLUGIN_A_KEY: 'val-a',
      PLUGIN_B_KEY: 'val-b',
      PLUGIN_C_KEY: 'val-c',
    });
    expect(merged.additionalContext).toBe('context from B');
    expect(merged.reason).toBe('handler-c ok');
    expect(merged.diagnostics.handlerCount).toBe(3);
    expect(merged.diagnostics.handlerOrder).toEqual([0, 1, 2]);
  });

  it('preserves handler execution order: priority determines merge order', async () => {
    const event = normalizeEvent({
      adapter: 'claude',
      rawEventName: 'PreToolUse',
      stdinPayload: {},
      adapterMappings: ADAPTER_MAPPINGS,
    });

    const plan = resolveHookPlan({
      phase: 'tool.before',
      handlers: [
        { source: './last.js', handler: 'handler', priority: 200 },
        { source: './first.js', handler: 'handler', priority: 10 },
        { source: './middle.js', handler: 'handler', priority: 100 },
      ],
    });

    // Plan should be sorted by priority
    expect(plan[0].handler.source).toBe('./first.js');
    expect(plan[1].handler.source).toBe('./middle.js');
    expect(plan[2].handler.source).toBe('./last.js');

    const modules: Record<string, Record<string, unknown>> = {
      './first.js': makeMockModule({ SHARED: 'first' }),
      './middle.js': makeMockModule({ SHARED: 'middle' }),
      './last.js': makeMockModule({ SHARED: 'last' }),
    };

    const results = await runPlan(event, plan, {
      loadModule: (source: string) => {
        const mod = modules[source];
        if (!mod) throw new Error(`Module not found: ${source}`);
        return mod;
      },
    });

    // With default last-writer-wins, the last handler (highest priority number = last exec) wins
    const merged = mergeResults(results);
    expect(merged.persistEnv.SHARED).toBe('last');
  });
});
