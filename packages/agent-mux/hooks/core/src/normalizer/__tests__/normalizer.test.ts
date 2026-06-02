import { describe, it, expect } from 'vitest';
import type { PhaseMapping } from '../../types/lifecycle';
import type { HandlerRef } from '../../types/plan';
import type { UnifiedHookEvent } from '../../types/event';
import { normalizeEvent, resolvePhaseMapping, splitEnv } from '../normalize';
import { resolveHookPlan, sortHandlers } from '../plan-resolver';
import { runHandler, runPlan } from '../runner';
import { NormalizationError } from '../errors';

// --- Adapter mappings fixture ---

const CLAUDE_MAPPINGS: PhaseMapping[] = [
  { canonicalPhase: 'session.start', nativeHook: 'SessionStart', supportLevel: 'native', blockCapability: false, mutationCapability: false, scope: 'session' },
  { canonicalPhase: 'session.end', nativeHook: 'SessionEnd', supportLevel: 'native', blockCapability: false, mutationCapability: false, scope: 'session' },
  { canonicalPhase: 'tool.before', nativeHook: 'PreToolUse', supportLevel: 'native', blockCapability: true, mutationCapability: true, scope: 'tool' },
  { canonicalPhase: 'tool.after', nativeHook: 'PostToolUse', supportLevel: 'native', blockCapability: false, mutationCapability: false, scope: 'tool' },
  { canonicalPhase: 'turn.stop', nativeHook: 'Stop', supportLevel: 'native', blockCapability: true, mutationCapability: false, scope: 'turn' },
  { canonicalPhase: 'notification', nativeHook: 'Notification', supportLevel: 'emulated', blockCapability: false, mutationCapability: false, scope: 'notification' },
];

// --- normalizeEvent ---

describe('normalizeEvent', () => {
  it('should normalize a known event with all fields', () => {
    const result = normalizeEvent({
      adapter: 'claude',
      rawEventName: 'PreToolUse',
      stdinPayload: { tool_name: 'Bash', tool_input: { command: 'ls' } },
      env: {
        HOOKS_PROXY_SESSION_ID: 'sess-123',
        HOOKS_PROXY_CWD: '/tmp/work',
        HOOKS_PROXY_MODEL: 'opus-4',
        HOOKS_PROXY_TURN_ID: 'turn-1',
      },
      adapterMappings: CLAUDE_MAPPINGS,
    });

    expect(result.version).toBe('a5c.hooks.v1');
    expect(result.adapter).toBe('claude');
    expect(result.phase).toBe('tool.before');
    expect(result.rawEventName).toBe('PreToolUse');
    expect(result.supportLevel).toBe('native');
    expect(result.execution.sessionId).toBe('sess-123');
    expect(result.execution.cwd).toBe('/tmp/work');
    expect(result.execution.adapter).toBe('claude');
    expect(result.execution.model).toBe('opus-4');
    expect(result.execution.turnId).toBe('turn-1');
    expect(result.execution.nativeEventName).toBe('PreToolUse');
    expect(result.payload['tool_name']).toBe('Bash');
    expect(result.raw).toBeDefined();
  });

  it('should handle unknown event name gracefully', () => {
    const result = normalizeEvent({
      adapter: 'claude',
      rawEventName: 'UnknownEvent',
      adapterMappings: CLAUDE_MAPPINGS,
    });

    expect(result.phase).toBe('unknown');
    expect(result.supportLevel).toBe('unsupported');
    expect(result.rawEventName).toBe('UnknownEvent');
  });

  it('should wrap non-object stdinPayload', () => {
    const result = normalizeEvent({
      adapter: 'claude',
      rawEventName: 'SessionStart',
      stdinPayload: 'raw-string-data',
      adapterMappings: CLAUDE_MAPPINGS,
    });

    expect(result.payload['raw']).toBe('raw-string-data');
  });

  it('should handle undefined stdinPayload', () => {
    const result = normalizeEvent({
      adapter: 'claude',
      rawEventName: 'SessionStart',
      stdinPayload: undefined,
      adapterMappings: CLAUDE_MAPPINGS,
    });

    expect(result.payload).toBeDefined();
    expect(result.payload['raw']).toBeUndefined();
  });

  it('should throw NormalizationError for missing adapter', () => {
    expect(() =>
      normalizeEvent({
        adapter: '',
        rawEventName: 'PreToolUse',
        adapterMappings: CLAUDE_MAPPINGS,
      }),
    ).toThrow(NormalizationError);
  });

  it('should throw NormalizationError for missing rawEventName', () => {
    expect(() =>
      normalizeEvent({
        adapter: 'claude',
        rawEventName: '',
        adapterMappings: CLAUDE_MAPPINGS,
      }),
    ).toThrow(NormalizationError);
  });

  it('should handle array stdinPayload by wrapping', () => {
    const result = normalizeEvent({
      adapter: 'claude',
      rawEventName: 'SessionStart',
      stdinPayload: [1, 2, 3],
      adapterMappings: CLAUDE_MAPPINGS,
    });

    expect(result.payload['raw']).toEqual([1, 2, 3]);
  });

  it('should populate env.input and env.persisted', () => {
    const result = normalizeEvent({
      adapter: 'claude',
      rawEventName: 'SessionStart',
      env: {
        HOOKS_PROXY_SESSION_ID: 'sess-1',
        HOOKS_PROXY_PERSIST_FOO: 'bar',
        PATH: '/usr/bin',
      },
      adapterMappings: CLAUDE_MAPPINGS,
    });

    expect(result.env.input['HOOKS_PROXY_SESSION_ID']).toBe('sess-1');
    expect(result.env.persisted['HOOKS_PROXY_PERSIST_FOO']).toBe('bar');
  });
});

// --- resolvePhaseMapping ---

describe('resolvePhaseMapping', () => {
  it('should find a known mapping', () => {
    const mapping = resolvePhaseMapping('PreToolUse', CLAUDE_MAPPINGS);
    expect(mapping).toBeDefined();
    expect(mapping!.canonicalPhase).toBe('tool.before');
    expect(mapping!.supportLevel).toBe('native');
  });

  it('should return undefined for unknown event', () => {
    const mapping = resolvePhaseMapping('DoesNotExist', CLAUDE_MAPPINGS);
    expect(mapping).toBeUndefined();
  });

  it('should match emulated support level', () => {
    const mapping = resolvePhaseMapping('Notification', CLAUDE_MAPPINGS);
    expect(mapping).toBeDefined();
    expect(mapping!.supportLevel).toBe('emulated');
  });
});

// --- splitEnv ---

describe('splitEnv', () => {
  it('should split env into input and persisted', () => {
    const { input, persisted } = splitEnv({
      HOOKS_PROXY_SESSION_ID: 'sess-1',
      HOOKS_PROXY_PERSIST_COUNTER: '5',
      HOOKS_PROXY_PERSIST_STATE: 'active',
      HOOKS_PROXY_MODEL: 'opus',
      PATH: '/usr/bin',
    });

    // Non-persist HOOKS_PROXY_ vars go into input
    expect(input).toEqual({
      HOOKS_PROXY_SESSION_ID: 'sess-1',
      HOOKS_PROXY_MODEL: 'opus',
    });

    // PERSIST vars go to persisted bucket only (not input)
    expect(persisted).toEqual({
      HOOKS_PROXY_PERSIST_COUNTER: '5',
      HOOKS_PROXY_PERSIST_STATE: 'active',
    });

    // PATH is not in either bucket
    expect(input['PATH']).toBeUndefined();
    expect(persisted['PATH']).toBeUndefined();
  });

  it('should return empty objects when no matching vars', () => {
    const { input, persisted } = splitEnv({ PATH: '/usr/bin', HOME: '/home/user' });
    expect(input).toEqual({});
    expect(persisted).toEqual({});
  });
});

// --- resolveHookPlan ---

describe('resolveHookPlan', () => {
  it('should resolve handlers from explicit refs', () => {
    const plan = resolveHookPlan({
      phase: 'tool.before',
      handlers: [
        { source: 'plugin-a', handler: 'check', priority: 10 },
        { source: 'plugin-b', handler: 'validate', priority: 5 },
      ],
    });

    expect(plan).toHaveLength(2);
    // Should be sorted: plugin-b (5) before plugin-a (10)
    expect(plan[0].handler.source).toBe('plugin-b');
    expect(plan[1].handler.source).toBe('plugin-a');
    expect(plan[0].phase).toBe('tool.before');
  });

  it('should return empty plan when no handlers match', () => {
    const plan = resolveHookPlan({
      phase: 'tool.before',
    });

    expect(plan).toHaveLength(0);
  });

  it('should handle multiple explicit handlers sorted by priority', () => {
    const plan = resolveHookPlan({
      phase: 'tool.before',
      handlers: [
        { source: 'echo check', handler: 'check', priority: 100 },
        { source: 'echo validate', handler: 'validate', priority: 10 },
      ],
    });

    expect(plan).toHaveLength(2);
    expect(plan[0].handler.source).toBe('echo validate');
    expect(plan[1].handler.source).toBe('echo check');
  });
});

// --- sortHandlers ---

describe('sortHandlers', () => {
  it('should sort by priority ascending', () => {
    const handlers: HandlerRef[] = [
      { source: 'a', handler: 'h', priority: 30 },
      { source: 'b', handler: 'h', priority: 10 },
      { source: 'c', handler: 'h', priority: 20 },
    ];

    const sorted = sortHandlers(handlers);
    expect(sorted.map((h) => h.source)).toEqual(['b', 'c', 'a']);
  });

  it('should tie-break by source (pluginId)', () => {
    const handlers: HandlerRef[] = [
      { source: 'charlie', handler: 'h', priority: 1 },
      { source: 'alpha', handler: 'h', priority: 1 },
      { source: 'bravo', handler: 'h', priority: 1 },
    ];

    const sorted = sortHandlers(handlers);
    expect(sorted.map((h) => h.source)).toEqual(['alpha', 'bravo', 'charlie']);
  });

  it('should tie-break by handler (id) after source', () => {
    const handlers: HandlerRef[] = [
      { source: 'same', handler: 'z-handler', priority: 1 },
      { source: 'same', handler: 'a-handler', priority: 1 },
      { source: 'same', handler: 'm-handler', priority: 1 },
    ];

    const sorted = sortHandlers(handlers);
    expect(sorted.map((h) => h.handler)).toEqual(['a-handler', 'm-handler', 'z-handler']);
  });

  it('should default priority to 1000 when not specified', () => {
    const handlers: HandlerRef[] = [
      { source: 'a', handler: 'h' },
      { source: 'b', handler: 'h', priority: 500 },
    ];

    const sorted = sortHandlers(handlers);
    expect(sorted[0].source).toBe('b');
    expect(sorted[1].source).toBe('a');
  });
});

// --- runHandler ---

describe('runHandler', () => {
  const makeEvent = (): UnifiedHookEvent =>
    normalizeEvent({
      adapter: 'claude',
      rawEventName: 'PreToolUse',
      stdinPayload: { tool_name: 'Bash' },
      adapterMappings: CLAUDE_MAPPINGS,
    });

  it('should run a shell command handler', async () => {
    const event = makeEvent();

    // Use a simple echo command that outputs JSON
    const result = await runHandler(event, {
      source: 'node -e "console.log(JSON.stringify({decision:\'allow\',reason:\'hello\'}))"',
      handler: 'shell',
      priority: 1,
    });

    expect(result.decision).toBe('allow');
    expect(result.reason).toBe('hello');
  });

  it('should receive normalized event JSON on stdin', async () => {
    const event = makeEvent();

    // Handler reads stdin and echoes back the adapter from the event
    const result = await runHandler(event, {
      source: 'node -e "let d=\'\';process.stdin.on(\'data\',c=>d+=c);process.stdin.on(\'end\',()=>{const e=JSON.parse(d);console.log(JSON.stringify({decision:\'allow\',reason:e.adapter}))})"',
      handler: 'shell',
      priority: 1,
    });

    expect(result.decision).toBe('allow');
    expect(result.reason).toBe('claude');
  });

  it('should throw HandlerError for failing shell command', async () => {
    const event = makeEvent();

    await expect(
      runHandler(event, {
        source: 'node -e "process.exit(1)"',
        handler: 'shell',
        priority: 1,
      }),
    ).rejects.toThrow();
  });

  it('should return noop for non-JSON stdout', async () => {
    const event = makeEvent();

    const result = await runHandler(event, {
      source: 'node -e "console.log(\'just a message\')"',
      handler: 'shell',
      priority: 1,
    });

    expect(result.decision).toBe('noop');
    expect(result.reason).toBe('just a message');
  });
});

// --- runPlan ---

describe('runPlan', () => {
  const makeEvent = (): UnifiedHookEvent =>
    normalizeEvent({
      adapter: 'claude',
      rawEventName: 'PreToolUse',
      stdinPayload: { tool_name: 'Bash' },
      adapterMappings: CLAUDE_MAPPINGS,
    });

  it('should execute handlers in sequential order', async () => {
    const event = makeEvent();
    const results = await runPlan(event, [
      {
        id: 'h1',
        pluginId: 'plugin-1',
        phase: 'tool.before',
        priority: 1,
        handler: {
          source: 'node -e "console.log(JSON.stringify({decision:\'noop\',metadata:{order:1}}))"',
          handler: 'shell',
          priority: 1,
        },
      },
      {
        id: 'h2',
        pluginId: 'plugin-2',
        phase: 'tool.before',
        priority: 2,
        handler: {
          source: 'node -e "console.log(JSON.stringify({decision:\'noop\',metadata:{order:2}}))"',
          handler: 'shell',
          priority: 2,
        },
      },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].metadata?.order).toBe(1);
    expect(results[1].metadata?.order).toBe(2);
  });

  it('should swallow errors with fail-open policy', async () => {
    const event = makeEvent();
    const results = await runPlan(
      event,
      [
        {
          id: 'h1',
          pluginId: 'plugin-1',
          phase: 'tool.before',
          priority: 1,
          handler: { source: 'node -e "process.exit(1)"', handler: 'shell', priority: 1 },
        },
      ],
      { defaultPolicy: 'fail-open' },
    );

    expect(results).toHaveLength(1);
    expect(results[0].decision).toBe('noop');
    expect(results[0].metadata?.error).toBe(true);
  });

  it('should propagate errors with fail-closed policy', async () => {
    const event = makeEvent();

    await expect(
      runPlan(
        event,
        [
          {
            id: 'h1',
            pluginId: 'plugin-1',
            phase: 'tool.before',
            priority: 1,
            handler: { source: 'node -e "process.exit(1)"', handler: 'shell', priority: 1 },
          },
        ],
        { defaultPolicy: 'fail-closed' },
      ),
    ).rejects.toThrow();
  });

  it('should use fail-open for session.start with fail-open-bootstrap-only policy', async () => {
    const sessionEvent = normalizeEvent({
      adapter: 'claude',
      rawEventName: 'SessionStart',
      adapterMappings: CLAUDE_MAPPINGS,
    });

    const results = await runPlan(
      sessionEvent,
      [
        {
          id: 'h1',
          pluginId: 'plugin-1',
          phase: 'session.start',
          priority: 1,
          handler: { source: 'node -e "process.exit(1)"', handler: 'shell', priority: 1 },
        },
      ],
      { defaultPolicy: 'fail-open-bootstrap-only' },
    );

    expect(results).toHaveLength(1);
    expect(results[0].metadata?.error).toBe(true);
  });

  it('should use fail-closed for non-bootstrap phases with fail-open-bootstrap-only policy', async () => {
    const event = makeEvent();

    await expect(
      runPlan(
        event,
        [
          {
            id: 'h1',
            pluginId: 'plugin-1',
            phase: 'tool.before',
            priority: 1,
            handler: { source: 'node -e "process.exit(1)"', handler: 'shell', priority: 1 },
          },
        ],
        { defaultPolicy: 'fail-open-bootstrap-only' },
      ),
    ).rejects.toThrow();
  });

  it('should apply default phase policies when no explicit policy given', async () => {
    const event = makeEvent(); // tool.before phase

    // tool.before defaults to fail-open
    const results = await runPlan(event, [
      {
        id: 'h1',
        pluginId: 'plugin-1',
        phase: 'tool.before',
        priority: 1,
        handler: { source: 'node -e "process.exit(1)"', handler: 'shell', priority: 1 },
      },
    ]);

    expect(results).toHaveLength(1);
    expect(results[0].metadata?.error).toBe(true);
  });

  it('should inject execution context env vars into handler subprocess', async () => {
    const event = makeEvent();
    event.execution.sessionId = 'test-sess-123';
    event.execution.adapter = 'claude';

    const results = await runPlan(event, [
      {
        id: 'h1',
        pluginId: 'plugin-1',
        phase: 'tool.before',
        priority: 1,
        handler: {
          source: 'node -e "console.log(JSON.stringify({decision:\'allow\',metadata:{sid:process.env.AGENT_SESSION_ID,adapter:process.env.AGENT_ADAPTER}}))"',
          handler: 'shell',
          priority: 1,
        },
      },
    ]);

    expect(results).toHaveLength(1);
    expect(results[0].decision).toBe('allow');
    expect(results[0].metadata?.sid).toBe('test-sess-123');
    expect(results[0].metadata?.adapter).toBe('claude');
  });
});
