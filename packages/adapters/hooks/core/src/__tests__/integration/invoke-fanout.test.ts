import { describe, it, expect } from 'vitest';
import { normalizeEvent } from '../../normalizer/normalize';
import { resolveHookPlan } from '../../normalizer/plan-resolver';
import { runPlan } from '../../normalizer/runner';
import { mergeResults } from '../../merge-engine/merge';
import type { PhaseMapping } from '../../types/lifecycle';

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

/**
 * Build a shell command handler that outputs a JSON result with persistEnv.
 * Uses Base64 encoding to avoid shell quoting issues across platforms.
 */
function makeShellHandler(
  envVars: Record<string, string>,
  extras: Record<string, unknown> = {},
): string {
  const result = JSON.stringify({
    decision: 'allow',
    persistEnv: envVars,
    ...extras,
  });
  const b64 = Buffer.from(result).toString('base64');
  return `node -e "console.log(Buffer.from('${b64}','base64').toString())"`;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('invoke-fanout integration: normalizeEvent -> resolveHookPlan -> runPlan -> mergeResults', () => {
  it('wires the full pipeline with 3 shell handlers that each add env vars', async () => {
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

    // Step 2: resolveHookPlan with 3 explicit handlers
    const cmdA = makeShellHandler({ PLUGIN_A_KEY: 'val-a' });
    const cmdB = makeShellHandler({ PLUGIN_B_KEY: 'val-b' }, { additionalContext: 'context from B' });
    const cmdC = makeShellHandler({ PLUGIN_C_KEY: 'val-c' }, { reason: 'handler-c ok' });

    const plan = resolveHookPlan({
      phase: 'tool.before',
      handlers: [
        { source: cmdA, handler: 'shell', priority: 100 },
        { source: cmdB, handler: 'shell', priority: 101 },
        { source: cmdC, handler: 'shell', priority: 102 },
      ],
    });

    expect(plan).toHaveLength(3);

    // Step 3: runPlan
    const results = await runPlan(event, plan);

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

    const cmdFirst = makeShellHandler({ SHARED: 'first' });
    const cmdMiddle = makeShellHandler({ SHARED: 'middle' });
    const cmdLast = makeShellHandler({ SHARED: 'last' });

    const plan = resolveHookPlan({
      phase: 'tool.before',
      handlers: [
        { source: cmdLast, handler: 'shell', priority: 200 },
        { source: cmdFirst, handler: 'shell', priority: 10 },
        { source: cmdMiddle, handler: 'shell', priority: 100 },
      ],
    });

    // Plan should be sorted by priority
    expect(plan[0].handler.priority).toBe(10);
    expect(plan[1].handler.priority).toBe(100);
    expect(plan[2].handler.priority).toBe(200);

    const results = await runPlan(event, plan);

    // With default last-writer-wins, the last handler (highest priority number = last exec) wins
    const merged = mergeResults(results);
    expect(merged.persistEnv.SHARED).toBe('last');
  });
});
