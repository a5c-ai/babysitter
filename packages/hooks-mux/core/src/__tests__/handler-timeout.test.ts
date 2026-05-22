import { describe, it, expect } from 'vitest';
import type { PhaseMapping } from '../types/lifecycle';
import type { UnifiedHookEvent } from '../types/event';
import { normalizeEvent } from '../normalizer/normalize';
import { runHandler, runPlan } from '../normalizer/runner';
import { HandlerTimeoutError } from '../normalizer/errors';

const CLAUDE_MAPPINGS: PhaseMapping[] = [
  { canonicalPhase: 'tool.before', nativeHook: 'PreToolUse', supportLevel: 'native', blockCapability: true, mutationCapability: true, scope: 'tool' },
];

function makeEvent(): UnifiedHookEvent {
  return normalizeEvent({
    adapter: 'claude',
    rawEventName: 'PreToolUse',
    stdinPayload: { tool_name: 'Bash' },
    adapterMappings: CLAUDE_MAPPINGS,
  });
}

describe('Handler timeout enforcement', () => {
  it('should throw HandlerTimeoutError when handler exceeds timeout', async () => {
    const event = makeEvent();

    // Handler that sleeps for 5 seconds but timeout is 500ms
    await expect(
      runHandler(
        event,
        {
          source: 'node -e "setTimeout(() => console.log(JSON.stringify({decision:\'allow\'})), 5000)"',
          handler: 'slow-handler',
          priority: 1,
        },
        500,
      ),
    ).rejects.toThrow(HandlerTimeoutError);
  }, 10000);

  it('should succeed when handler completes within timeout', async () => {
    const event = makeEvent();

    const result = await runHandler(
      event,
      {
        source: 'node -e "console.log(JSON.stringify({decision:\'allow\',reason:\'fast\'}))"',
        handler: 'fast-handler',
        priority: 1,
      },
      5000,
    );

    expect(result.decision).toBe('allow');
    expect(result.reason).toBe('fast');
  });

  describe('runPlan with entry-level timeoutMs', () => {
    it('should use entry timeoutMs to kill slow handler (fail-open)', async () => {
      const event = makeEvent();

      const results = await runPlan(
        event,
        [
          {
            id: 'slow',
            pluginId: 'plugin-slow',
            phase: 'tool.before',
            priority: 1,
            timeoutMs: 500,
            handler: {
              source: 'node -e "setTimeout(() => console.log(JSON.stringify({decision:\'allow\'})), 5000)"',
              handler: 'slow-handler',
              priority: 1,
            },
          },
        ],
        { defaultPolicy: 'fail-open' },
      );

      expect(results).toHaveLength(1);
      expect(results[0].decision).toBe('noop');
      expect(results[0].metadata?.error).toBe(true);
      expect(results[0].metadata?.errorCode).toBe('HANDLER_TIMEOUT');
    }, 10000);

    it('should propagate HandlerTimeoutError under fail-closed policy', async () => {
      const event = makeEvent();

      await expect(
        runPlan(
          event,
          [
            {
              id: 'slow',
              pluginId: 'plugin-slow',
              phase: 'tool.before',
              priority: 1,
              timeoutMs: 500,
              handler: {
                source: 'node -e "setTimeout(() => console.log(JSON.stringify({decision:\'allow\'})), 5000)"',
                handler: 'slow-handler',
                priority: 1,
              },
            },
          ],
          { defaultPolicy: 'fail-closed' },
        ),
      ).rejects.toThrow(HandlerTimeoutError);
    }, 10000);

    it('should use global handlerTimeoutMs when entry has no timeoutMs', async () => {
      const event = makeEvent();

      const results = await runPlan(
        event,
        [
          {
            id: 'slow',
            pluginId: 'plugin-slow',
            phase: 'tool.before',
            priority: 1,
            // no timeoutMs on entry
            handler: {
              source: 'node -e "setTimeout(() => console.log(JSON.stringify({decision:\'allow\'})), 5000)"',
              handler: 'slow-handler',
              priority: 1,
            },
          },
        ],
        { defaultPolicy: 'fail-open', handlerTimeoutMs: 500 },
      );

      expect(results).toHaveLength(1);
      expect(results[0].metadata?.error).toBe(true);
      expect(results[0].metadata?.errorCode).toBe('HANDLER_TIMEOUT');
    }, 10000);

    it('should prefer entry timeoutMs over global handlerTimeoutMs', async () => {
      const event = makeEvent();

      // Global timeout is very short (100ms) but entry has generous timeout
      const result = await runPlan(
        event,
        [
          {
            id: 'fast',
            pluginId: 'plugin-fast',
            phase: 'tool.before',
            priority: 1,
            timeoutMs: 5000, // generous entry timeout overrides global
            handler: {
              source: 'node -e "console.log(JSON.stringify({decision:\'allow\',reason:\'ok\'}))"',
              handler: 'fast-handler',
              priority: 1,
            },
          },
        ],
        { defaultPolicy: 'fail-open', handlerTimeoutMs: 100 },
      );

      expect(result).toHaveLength(1);
      expect(result[0].decision).toBe('allow');
    });
  });
});
