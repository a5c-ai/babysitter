import { describe, it, expect } from 'vitest';
import type { PhaseMapping } from '../types/lifecycle';
import type { UnifiedHookEvent } from '../types/event';
import { normalizeEvent } from '../normalizer/normalize';
import { evaluateWhen, getNestedValue } from '../normalizer/plan-resolver';
import { runPlan } from '../normalizer/runner';

const CLAUDE_MAPPINGS: PhaseMapping[] = [
  { canonicalPhase: 'tool.before', nativeHook: 'PreToolUse', supportLevel: 'native', blockCapability: true, mutationCapability: true, scope: 'tool' },
  { canonicalPhase: 'session.start', nativeHook: 'SessionStart', supportLevel: 'native', blockCapability: false, mutationCapability: false, scope: 'session' },
  { canonicalPhase: 'turn.stop', nativeHook: 'Stop', supportLevel: 'native', blockCapability: true, mutationCapability: false, scope: 'turn' },
];

function makeEvent(overrides?: Partial<{ rawEventName: string; adapter: string; payload: Record<string, unknown> }>): UnifiedHookEvent {
  return normalizeEvent({
    adapter: overrides?.adapter ?? 'claude',
    rawEventName: overrides?.rawEventName ?? 'PreToolUse',
    stdinPayload: overrides?.payload ?? { tool_name: 'Bash', tool_input: { command: 'ls' } },
    env: {
      HOOKS_PROXY_SESSION_ID: 'sess-123',
    },
    adapterMappings: CLAUDE_MAPPINGS,
  });
}

// --- getNestedValue ---

describe('getNestedValue', () => {
  it('should resolve top-level keys', () => {
    expect(getNestedValue({ phase: 'tool.before' }, 'phase')).toBe('tool.before');
  });

  it('should resolve nested dot-notation keys', () => {
    const obj = { execution: { adapter: 'claude', model: 'opus' } };
    expect(getNestedValue(obj, 'execution.adapter')).toBe('claude');
    expect(getNestedValue(obj, 'execution.model')).toBe('opus');
  });

  it('should resolve deeply nested keys', () => {
    const obj = { a: { b: { c: { d: 42 } } } };
    expect(getNestedValue(obj, 'a.b.c.d')).toBe(42);
  });

  it('should return undefined for missing keys', () => {
    expect(getNestedValue({ a: 1 }, 'b')).toBeUndefined();
    expect(getNestedValue({ a: { b: 1 } }, 'a.c')).toBeUndefined();
  });

  it('should return undefined when traversing through null', () => {
    expect(getNestedValue({ a: null }, 'a.b')).toBeUndefined();
  });

  it('should return undefined when traversing through primitive', () => {
    expect(getNestedValue({ a: 'string' }, 'a.b')).toBeUndefined();
  });

  it('should handle empty path by returning the whole object', () => {
    const obj = { a: 1 };
    // '' splits to [''] which is a single empty-string key
    expect(getNestedValue(obj, '')).toBeUndefined();
  });
});

// --- evaluateWhen ---

describe('evaluateWhen', () => {
  it('should return true when when is undefined', () => {
    const event = makeEvent();
    expect(evaluateWhen(undefined, event)).toBe(true);
  });

  it('should return true when when is empty object', () => {
    const event = makeEvent();
    expect(evaluateWhen({}, event)).toBe(true);
  });

  it('should match a top-level event field', () => {
    const event = makeEvent();
    expect(evaluateWhen({ phase: 'tool.before' }, event)).toBe(true);
    expect(evaluateWhen({ phase: 'session.start' }, event)).toBe(false);
  });

  it('should match nested field via dot-notation', () => {
    const event = makeEvent();
    expect(evaluateWhen({ 'execution.adapter': 'claude' }, event)).toBe(true);
    expect(evaluateWhen({ 'execution.adapter': 'codex' }, event)).toBe(false);
  });

  it('should require ALL conditions to match (AND semantics)', () => {
    const event = makeEvent();
    // Both match
    expect(evaluateWhen({
      phase: 'tool.before',
      'execution.adapter': 'claude',
    }, event)).toBe(true);
    // One matches, one does not
    expect(evaluateWhen({
      phase: 'tool.before',
      'execution.adapter': 'codex',
    }, event)).toBe(false);
  });

  it('should match payload fields', () => {
    const event = makeEvent({ payload: { tool_name: 'Bash' } });
    expect(evaluateWhen({ 'payload.tool_name': 'Bash' }, event)).toBe(true);
    expect(evaluateWhen({ 'payload.tool_name': 'Edit' }, event)).toBe(false);
  });

  it('should match pipe-separated OR string conditions', () => {
    const event = makeEvent({ payload: { tool_name: 'Edit' } });

    expect(evaluateWhen({ 'payload.tool_name': 'Edit|Write' }, event)).toBe(true);
    expect(evaluateWhen({ 'payload.tool_name': 'Bash|Read' }, event)).toBe(false);
  });

  it('should match slash-delimited regex string conditions', () => {
    const event = makeEvent({ payload: { tool_name: 'mcp__filesystem__read_file' } });

    expect(evaluateWhen({ 'payload.tool_name': '/^mcp__.*__read_file$/' }, event)).toBe(true);
    expect(evaluateWhen({ 'payload.tool_name': '/^mcp__.*__write_file$/' }, event)).toBe(false);
  });

  it('should match Claude-style bare regex string conditions', () => {
    const event = makeEvent({ payload: { tool_name: 'mcp__filesystem__read_file' } });

    expect(evaluateWhen({ 'payload.tool_name': 'mcp__.*' }, event)).toBe(true);
    expect(evaluateWhen({ 'payload.tool_name': 'mcp__.*__write_file$' }, event)).toBe(false);
  });

  it('should preserve exact matching before bare regex fallback', () => {
    const event = makeEvent({ payload: { tool_name: 'toolXbefore' } });

    expect(evaluateWhen({ 'payload.tool_name': 'tool.before' }, event)).toBe(false);
  });

  it('should support bare regex negation conditions', () => {
    const safe = makeEvent({ payload: { tool_input: { command: 'ls -la' } } });
    const dangerous = makeEvent({ payload: { tool_input: { command: 'rm -rf /tmp/example' } } });

    expect(evaluateWhen({ 'payload.tool_input.command': '^(?!rm\\b).*' }, safe)).toBe(true);
    expect(evaluateWhen({ 'payload.tool_input.command': '^(?!rm\\b).*' }, dangerous)).toBe(false);
  });

  it('should support negated string conditions', () => {
    const event = makeEvent({ payload: { tool_name: 'Read' } });

    expect(evaluateWhen({ 'payload.tool_name': '!Bash' }, event)).toBe(true);
    expect(evaluateWhen({ 'payload.tool_name': '!Read' }, event)).toBe(false);
    expect(evaluateWhen({ 'payload.missing': '!Bash' }, event)).toBe(true);
  });

  it('should fail for non-existent nested path', () => {
    const event = makeEvent();
    expect(evaluateWhen({ 'execution.nonexistent': 'value' }, event)).toBe(false);
  });
});

// --- runPlan with when conditions ---

describe('runPlan with when conditions', () => {
  it('should skip entries whose when condition does not match', async () => {
    const event = makeEvent();

    const results = await runPlan(event, [
      {
        id: 'h1',
        pluginId: 'plugin-1',
        phase: 'tool.before',
        priority: 1,
        when: { phase: 'session.start' }, // does NOT match
        handler: {
          source: 'node -e "console.log(JSON.stringify({decision:\'allow\',metadata:{id:1}}))"',
          handler: 'shell',
          priority: 1,
        },
      },
      {
        id: 'h2',
        pluginId: 'plugin-2',
        phase: 'tool.before',
        priority: 2,
        when: { phase: 'tool.before' }, // DOES match
        handler: {
          source: 'node -e "console.log(JSON.stringify({decision:\'allow\',metadata:{id:2}}))"',
          handler: 'shell',
          priority: 2,
        },
      },
    ]);

    // Only h2 should have run
    expect(results).toHaveLength(1);
    expect(results[0].metadata?.id).toBe(2);
  });

  it('should run entries without when condition', async () => {
    const event = makeEvent();

    const results = await runPlan(event, [
      {
        id: 'h1',
        pluginId: 'plugin-1',
        phase: 'tool.before',
        priority: 1,
        // no when
        handler: {
          source: 'node -e "console.log(JSON.stringify({decision:\'noop\',metadata:{ran:true}}))"',
          handler: 'shell',
          priority: 1,
        },
      },
    ]);

    expect(results).toHaveLength(1);
    expect(results[0].metadata?.ran).toBe(true);
  });

  it('should skip all entries when none match', async () => {
    const event = makeEvent();

    const results = await runPlan(event, [
      {
        id: 'h1',
        pluginId: 'plugin-1',
        phase: 'tool.before',
        priority: 1,
        when: { 'execution.adapter': 'gemini' },
        handler: {
          source: 'node -e "console.log(JSON.stringify({decision:\'allow\'}))"',
          handler: 'shell',
          priority: 1,
        },
      },
    ]);

    expect(results).toHaveLength(0);
  });

  it('should support multi-key when with dot-notation', async () => {
    const event = makeEvent();

    const results = await runPlan(event, [
      {
        id: 'h1',
        pluginId: 'plugin-1',
        phase: 'tool.before',
        priority: 1,
        when: { phase: 'tool.before', 'execution.adapter': 'claude' },
        handler: {
          source: 'node -e "console.log(JSON.stringify({decision:\'allow\',metadata:{matched:true}}))"',
          handler: 'shell',
          priority: 1,
        },
      },
    ]);

    expect(results).toHaveLength(1);
    expect(results[0].metadata?.matched).toBe(true);
  });

  it('should require optional if conditions to match in addition to when', async () => {
    const event = makeEvent({ payload: { tool_name: 'Write' } });

    const results = await runPlan(event, [
      {
        id: 'skip',
        pluginId: 'plugin-skip',
        phase: 'tool.before',
        priority: 1,
        when: { phase: 'tool.before' },
        if: { 'payload.tool_name': 'Read' },
        handler: {
          source: 'node -e "console.log(JSON.stringify({decision:\'noop\',metadata:{id:\'skip\'}}))"',
          handler: 'shell',
          priority: 1,
        },
      },
      {
        id: 'run',
        pluginId: 'plugin-run',
        phase: 'tool.before',
        priority: 2,
        when: { phase: 'tool.before' },
        if: { 'payload.tool_name': 'Edit|Write' },
        handler: {
          source: 'node -e "console.log(JSON.stringify({decision:\'noop\',metadata:{id:\'run\'}}))"',
          handler: 'shell',
          priority: 2,
        },
      },
    ]);

    expect(results).toHaveLength(1);
    expect(results[0].metadata?.id).toBe('run');
  });
});
