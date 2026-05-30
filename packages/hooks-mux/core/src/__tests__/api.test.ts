import { describe, it, expect, beforeEach } from 'vitest';
import { clearRegistries, registerHandler, runNormalized } from '../api';
import type { UnifiedHookEvent } from '../types/event';

function makeEvent(): UnifiedHookEvent {
  return {
    version: 'a5c.hooks.v1',
    adapter: 'test',
    phase: 'tool.before',
    rawEventName: 'PreToolUse',
    supportLevel: 'native',
    execution: {
      sessionId: 'session-api',
      adapter: 'test',
      cwd: '/workspace',
      nativeEventName: 'PreToolUse',
      persistedEnv: {},
      contextVars: {},
      metadata: {},
    },
    payload: {
      tool_name: 'mcp__filesystem__read_file',
    },
    env: { input: {}, persisted: {} },
    raw: null,
  };
}

describe('runNormalized public API', () => {
  beforeEach(() => {
    clearRegistries();
  });

  it('uses the shared plan runner for when/if matching and status metadata', async () => {
    registerHandler({
      id: 'api-handler',
      pluginId: 'plugin-api',
      phase: 'tool.before',
      priority: 1,
      when: { 'payload.tool_name': 'mcp__.*' },
      if: { 'execution.adapter': 'test' },
      statusMessage: 'Running API hook',
      handler: {
        source: 'node -e "console.log(JSON.stringify({decision:\'noop\',metadata:{ran:true}}))"',
        handler: 'api-handler',
      },
    });

    const result = await runNormalized(makeEvent());

    expect(result.metadata).toMatchObject({
      ran: true,
      handlerId: 'api-handler',
      statusMessage: 'Running API hook',
    });
  });

  it('honors disableAllHooks through the public API', async () => {
    registerHandler({
      id: 'disabled-handler',
      pluginId: 'plugin-api',
      phase: 'tool.before',
      priority: 1,
      handler: {
        source: 'node -e "console.log(JSON.stringify({decision:\'deny\'}))"',
        handler: 'disabled-handler',
      },
    });

    const result = await runNormalized(makeEvent(), { disableAllHooks: true });

    expect(result.decision).toBe('noop');
    expect(result.metadata).toMatchObject({
      disabled: true,
      reason: 'disableAllHooks',
    });
  });

  it('honors once suppression through the public API', async () => {
    registerHandler({
      id: 'once-handler',
      pluginId: 'plugin-api',
      phase: 'tool.before',
      priority: 1,
      once: true,
      handler: {
        source: 'node -e "console.log(JSON.stringify({decision:\'noop\',metadata:{ran:true}}))"',
        handler: 'once-handler',
      },
    });

    const first = await runNormalized(makeEvent());
    expect(first.contextVars).toEqual({
      'hooksMux.once.plugin-api.once-handler': '1',
    });

    const secondEvent = makeEvent();
    secondEvent.execution.contextVars = first.contextVars;

    const second = await runNormalized(secondEvent);
    expect(second.metadata).toMatchObject({
      once: true,
      duplicateSuppressed: true,
      handlerId: 'once-handler',
    });
    expect(second.metadata.ran).toBeUndefined();
  });
});
