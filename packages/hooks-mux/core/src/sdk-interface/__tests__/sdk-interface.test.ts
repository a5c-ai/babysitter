import { describe, it, expect } from 'vitest';
import {
  parseHookResult,
  parseHookEvent,
  validateHookResult,
  validateHookEvent,
  HookEventBuilder,
  HookResultBuilder,
  readExecutionContext,
  isInHooksProxyContext,
  serializeEvent,
  serializeResult,
  HookOutputParseError,
} from '../index';
import type { UnifiedHookEvent } from '../../types/event';
import type { UnifiedHookResult } from '../../types/result';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function minimalEvent(): UnifiedHookEvent {
  return new HookEventBuilder('claude-code', 'tool.before')
    .setRawEventName('PreToolUse')
    .build();
}

function fullEvent(): UnifiedHookEvent {
  return new HookEventBuilder('claude-code', 'tool.before')
    .setSessionId('sess-123')
    .setRawEventName('PreToolUse')
    .setSupportLevel('native')
    .setPayload({ toolInput: { command: 'ls' } })
    .setCwd('/workspace')
    .setModel('claude-sonnet-4-20250514')
    .setToolName('Bash')
    .setToolCallId('tc-abc')
    .setPersistedEnv({ MY_VAR: 'hello' })
    .setContextVars({ run_id: 'r-1' })
    .setRaw({ original: true })
    .build();
}

// ---------------------------------------------------------------------------
// parseHookResult
// ---------------------------------------------------------------------------

describe('parseHookResult', () => {
  it('parses valid JSON result', () => {
    const input = JSON.stringify({ decision: 'allow', reason: 'ok' });
    const result = parseHookResult(input);
    expect(result.decision).toBe('allow');
    expect(result.reason).toBe('ok');
  });

  it('parses an empty object as valid (all fields optional)', () => {
    const result = parseHookResult('{}');
    expect(result).toEqual({});
  });

  it('throws HookOutputParseError on malformed JSON', () => {
    expect(() => parseHookResult('not json')).toThrow(HookOutputParseError);
    try {
      parseHookResult('{bad}');
    } catch (e) {
      expect(e).toBeInstanceOf(HookOutputParseError);
      expect((e as HookOutputParseError).code).toBe('INVALID_JSON');
    }
  });

  it('throws HookOutputParseError on invalid structure (array)', () => {
    expect(() => parseHookResult('[]')).toThrow(HookOutputParseError);
  });

  it('throws HookOutputParseError on invalid decision value', () => {
    expect(() => parseHookResult('{"decision":"explode"}')).toThrow(HookOutputParseError);
  });

  it('ignores extra fields', () => {
    const input = JSON.stringify({ decision: 'noop', extraField: 42 });
    const result = parseHookResult(input);
    expect(result.decision).toBe('noop');
  });
});

// ---------------------------------------------------------------------------
// parseHookEvent
// ---------------------------------------------------------------------------

describe('parseHookEvent', () => {
  it('parses valid event JSON', () => {
    const event = minimalEvent();
    const json = JSON.stringify(event);
    const parsed = parseHookEvent(json);
    expect(parsed.version).toBe('a5c.hooks.v1');
    expect(parsed.adapter).toBe('claude-code');
    expect(parsed.phase).toBe('tool.before');
  });

  it('throws on malformed JSON', () => {
    expect(() => parseHookEvent('{')).toThrow(HookOutputParseError);
  });

  it('throws on missing required fields', () => {
    const incomplete = JSON.stringify({ version: 'a5c.hooks.v1', adapter: 'x' });
    expect(() => parseHookEvent(incomplete)).toThrow(HookOutputParseError);
  });

  it('throws on wrong version', () => {
    const event = { ...minimalEvent(), version: 'wrong' };
    expect(() => parseHookEvent(JSON.stringify(event))).toThrow(HookOutputParseError);
  });

  it('throws on invalid supportLevel', () => {
    const event = { ...minimalEvent(), supportLevel: 'magic' };
    expect(() => parseHookEvent(JSON.stringify(event))).toThrow(HookOutputParseError);
  });
});

// ---------------------------------------------------------------------------
// validateHookResult
// ---------------------------------------------------------------------------

describe('validateHookResult', () => {
  it('returns true for empty object', () => {
    expect(validateHookResult({})).toBe(true);
  });

  it('returns true for full result', () => {
    const r: UnifiedHookResult = {
      decision: 'deny',
      reason: 'blocked',
      systemMessage: 'msg',
      additionalContext: 'ctx',
      followUpMessage: 'follow',
      continueSession: false,
      stopReason: 'user',
      suppressOutput: true,
      toolMutation: { mode: 'replace', value: { x: 1 } },
      persistEnv: { A: 'B' },
      unsetEnv: ['C'],
      contextVars: { D: 'E' },
      metadata: { key: 'val' },
    };
    expect(validateHookResult(r)).toBe(true);
  });

  it('returns false for null', () => {
    expect(validateHookResult(null)).toBe(false);
  });

  it('returns false for array', () => {
    expect(validateHookResult([])).toBe(false);
  });

  it('returns false for invalid decision string', () => {
    expect(validateHookResult({ decision: 'invalid' })).toBe(false);
  });

  it('returns false for non-string reason', () => {
    expect(validateHookResult({ reason: 123 })).toBe(false);
  });

  it('returns false for invalid toolMutation mode', () => {
    expect(validateHookResult({ toolMutation: { mode: 'bad', value: {} } })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateHookEvent
// ---------------------------------------------------------------------------

describe('validateHookEvent', () => {
  it('returns true for a valid event', () => {
    expect(validateHookEvent(minimalEvent())).toBe(true);
  });

  it('returns false for missing version', () => {
    const e = { ...minimalEvent() } as Record<string, unknown>;
    delete e.version;
    expect(validateHookEvent(e)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(validateHookEvent('string')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// HookEventBuilder
// ---------------------------------------------------------------------------

describe('HookEventBuilder', () => {
  it('builds a minimal event with defaults', () => {
    const event = new HookEventBuilder('codex', 'session.start').build();
    expect(event.version).toBe('a5c.hooks.v1');
    expect(event.adapter).toBe('codex');
    expect(event.phase).toBe('session.start');
    expect(event.rawEventName).toBe('session.start');
    expect(event.supportLevel).toBe('native');
    expect(event.payload).toEqual({});
    expect(event.env.input).toEqual({});
    expect(event.env.persisted).toEqual({});
  });

  it('builds a full event with all fields', () => {
    const event = fullEvent();
    expect(event.execution.sessionId).toBe('sess-123');
    expect(event.execution.cwd).toBe('/workspace');
    expect(event.execution.model).toBe('claude-sonnet-4-20250514');
    expect(event.execution.toolName).toBe('Bash');
    expect(event.execution.toolCallId).toBe('tc-abc');
    expect(event.execution.persistedEnv).toEqual({ MY_VAR: 'hello' });
    expect(event.execution.contextVars).toEqual({ run_id: 'r-1' });
    expect(event.payload).toEqual({ toolInput: { command: 'ls' } });
    expect(event.raw).toEqual({ original: true });
  });

  it('validates with validateHookEvent', () => {
    expect(validateHookEvent(fullEvent())).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// HookResultBuilder
// ---------------------------------------------------------------------------

describe('HookResultBuilder', () => {
  it('allow() sets decision', () => {
    const r = HookResultBuilder.allow('ok').build();
    expect(r.decision).toBe('allow');
    expect(r.reason).toBe('ok');
  });

  it('deny() sets decision', () => {
    const r = HookResultBuilder.deny('blocked').build();
    expect(r.decision).toBe('deny');
    expect(r.reason).toBe('blocked');
  });

  it('noop() sets decision', () => {
    const r = HookResultBuilder.noop().build();
    expect(r.decision).toBe('noop');
  });

  it('continue() sets decision', () => {
    const r = HookResultBuilder.continue().build();
    expect(r.decision).toBe('continue');
  });

  it('supports chaining all setters', () => {
    const r = HookResultBuilder.allow()
      .setReason('custom')
      .setSystemMessage('sys')
      .setAdditionalContext('ctx')
      .setFollowUpMessage('follow')
      .setContinueSession(false)
      .setStopReason('done')
      .setPersistEnv({ X: '1' })
      .addPersistEnv('Y', '2')
      .setUnsetEnv(['Z'])
      .setContextVars({ K: 'V' })
      .setToolMutation('patch', { field: 'val' })
      .setMetadata({ info: true })
      .build();

    expect(r.decision).toBe('allow');
    expect(r.reason).toBe('custom');
    expect(r.systemMessage).toBe('sys');
    expect(r.additionalContext).toBe('ctx');
    expect(r.followUpMessage).toBe('follow');
    expect(r.continueSession).toBe(false);
    expect(r.stopReason).toBe('done');
    expect(r.persistEnv).toEqual({ X: '1', Y: '2' });
    expect(r.unsetEnv).toEqual(['Z']);
    expect(r.contextVars).toEqual({ K: 'V' });
    expect(r.toolMutation).toEqual({ mode: 'patch', value: { field: 'val' } });
    expect(r.metadata).toEqual({ info: true });
  });

  it('toJSON() returns valid JSON string', () => {
    const json = HookResultBuilder.deny('no').toJSON();
    const parsed = JSON.parse(json);
    expect(parsed.decision).toBe('deny');
    expect(parsed.reason).toBe('no');
  });

  it('build() returns a copy (not mutable reference)', () => {
    const builder = HookResultBuilder.allow();
    const r1 = builder.build();
    builder.setReason('changed');
    const r2 = builder.build();
    expect(r1.reason).toBeUndefined();
    expect(r2.reason).toBe('changed');
  });
});

// ---------------------------------------------------------------------------
// readExecutionContext
// ---------------------------------------------------------------------------

describe('readExecutionContext', () => {
  it('reads all vars when present', () => {
    const env = {
      AGENT_SESSION_ID: 'sess-1',
      AGENT_TURN_ID: 'turn-1',
      AGENT_ADAPTER: 'claude-code',
      AGENT_WORKSPACE_ROOT: '/work',
      AGENT_TRANSCRIPT_PATH: '/transcripts/t.json',
      AGENT_CONTEXT_FILE: '/ctx.json',
    };
    const ctx = readExecutionContext(env);
    expect(ctx.sessionId).toBe('sess-1');
    expect(ctx.turnId).toBe('turn-1');
    expect(ctx.adapter).toBe('claude-code');
    expect(ctx.workspaceRoot).toBe('/work');
    expect(ctx.transcriptPath).toBe('/transcripts/t.json');
    expect(ctx.contextFile).toBe('/ctx.json');
  });

  it('returns null for missing vars', () => {
    const ctx = readExecutionContext({});
    expect(ctx.sessionId).toBeNull();
    expect(ctx.turnId).toBeNull();
    expect(ctx.adapter).toBeNull();
    expect(ctx.workspaceRoot).toBeNull();
    expect(ctx.transcriptPath).toBeNull();
    expect(ctx.contextFile).toBeNull();
    expect(ctx.capabilities).toBeNull();
  });

  it('handles partial env', () => {
    const ctx = readExecutionContext({ AGENT_SESSION_ID: 's' });
    expect(ctx.sessionId).toBe('s');
    expect(ctx.adapter).toBeNull();
  });

  it('parses AGENT_CAPABILITIES_JSON when present', () => {
    const capabilities = {
      name: 'claude',
      family: 'shell-hook',
      sessionIdQuality: 'native',
      supportsOrderedFanout: true,
      supportsNativeAdditionalContext: true,
      supportsBlock: true,
      supportsAsk: true,
      supportsToolInputMutation: true,
      supportsToolResultMutation: true,
      supportsPersistedEnv: true,
      envPersistenceMode: 'native_env_file',
      toolInterceptionScope: 'all',
    };
    const env = {
      AGENT_SESSION_ID: 'sess-1',
      AGENT_CAPABILITIES_JSON: JSON.stringify(capabilities),
    };
    const ctx = readExecutionContext(env);
    expect(ctx.capabilities).toEqual(capabilities);
    expect(ctx.capabilities!.name).toBe('claude');
    expect(ctx.capabilities!.supportsBlock).toBe(true);
    expect(ctx.capabilities!.envPersistenceMode).toBe('native_env_file');
  });

  it('returns null capabilities for malformed AGENT_CAPABILITIES_JSON', () => {
    const env = {
      AGENT_SESSION_ID: 'sess-1',
      AGENT_CAPABILITIES_JSON: 'not valid json{{{',
    };
    const ctx = readExecutionContext(env);
    expect(ctx.capabilities).toBeNull();
    // Other fields should still be parsed correctly
    expect(ctx.sessionId).toBe('sess-1');
  });

  it('round-trips capabilities through serialize and parse', () => {
    const original = {
      name: 'codex',
      family: 'shell-hook' as const,
      sessionIdQuality: 'derived' as const,
      supportsOrderedFanout: false,
      supportsNativeAdditionalContext: false,
      supportsBlock: false,
      supportsAsk: false,
      supportsToolInputMutation: false,
      supportsToolResultMutation: false,
      supportsPersistedEnv: true,
      envPersistenceMode: 'wrapper_only' as const,
      toolInterceptionScope: 'shell_only' as const,
      notes: ['experimental'],
    };
    const serialized = JSON.stringify(original);
    const env = { AGENT_CAPABILITIES_JSON: serialized };
    const ctx = readExecutionContext(env);

    expect(ctx.capabilities).toEqual(original);
    expect(ctx.capabilities!.name).toBe('codex');
    expect(ctx.capabilities!.supportsBlock).toBe(false);
    expect(ctx.capabilities!.envPersistenceMode).toBe('wrapper_only');
    expect(ctx.capabilities!.notes).toEqual(['experimental']);
  });
});

// ---------------------------------------------------------------------------
// isInHooksProxyContext
// ---------------------------------------------------------------------------

describe('isInHooksProxyContext', () => {
  it('returns true when AGENT_SESSION_ID is set', () => {
    expect(isInHooksProxyContext({ AGENT_SESSION_ID: 'sess-1' })).toBe(true);
  });

  it('returns false when AGENT_SESSION_ID is missing', () => {
    expect(isInHooksProxyContext({})).toBe(false);
  });

  it('returns false when AGENT_SESSION_ID is empty string', () => {
    expect(isInHooksProxyContext({ AGENT_SESSION_ID: '' })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Serializer round-trips
// ---------------------------------------------------------------------------

describe('serialize/parse round-trip', () => {
  it('event: build -> serialize -> parse -> compare', () => {
    const original = fullEvent();
    const json = serializeEvent(original);
    const parsed = parseHookEvent(json);

    expect(parsed.version).toBe(original.version);
    expect(parsed.adapter).toBe(original.adapter);
    expect(parsed.phase).toBe(original.phase);
    expect(parsed.rawEventName).toBe(original.rawEventName);
    expect(parsed.supportLevel).toBe(original.supportLevel);
    expect(parsed.execution.sessionId).toBe(original.execution.sessionId);
    expect(parsed.payload).toEqual(original.payload);
  });

  it('result: build -> serialize -> parse -> compare', () => {
    const original = HookResultBuilder.deny('test')
      .setPersistEnv({ A: '1' })
      .setContextVars({ B: '2' })
      .setToolMutation('replace', { x: true })
      .build();
    const json = serializeResult(original);
    const parsed = parseHookResult(json);

    expect(parsed.decision).toBe(original.decision);
    expect(parsed.reason).toBe(original.reason);
    expect(parsed.persistEnv).toEqual(original.persistEnv);
    expect(parsed.contextVars).toEqual(original.contextVars);
    expect(parsed.toolMutation).toEqual(original.toolMutation);
  });

  it('minimal result round-trips', () => {
    const original = HookResultBuilder.noop().build();
    const json = serializeResult(original);
    const parsed = parseHookResult(json);
    expect(parsed.decision).toBe('noop');
  });
});
