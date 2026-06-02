import { describe, it, expect, beforeAll } from 'vitest';
import { createAdapter } from '../adapter';
import { PI_PHASE_MAPPINGS, getPiPhaseMapping, getSupportedPhases } from '../mappings';
import { normalizePi, coerceInput, buildPayload, setAdapterName } from '../normalizer';
import { renderPiOutput, buildExtensionState } from '../renderer';
import { resolveSessionId } from '../session-resolver';
import * as fixtures from './fixtures/pi-payloads';

beforeAll(() => {
  setAdapterName('pi');
});

// ---------------------------------------------------------------------------
// Adapter capabilities
// ---------------------------------------------------------------------------

describe('createAdapter', () => {
  it('returns correct capability descriptor', () => {
    const caps = createAdapter('pi');

    expect(caps.name).toBe('pi');
    expect(caps.family).toBe('in-process');
    expect(caps.sessionIdQuality).toBe('native');
    expect(caps.supportsBlock).toBe(true);
    expect(caps.supportsAsk).toBe(false);
    expect(caps.supportsToolInputMutation).toBe(true);
    expect(caps.supportsToolResultMutation).toBe(false);
    expect(caps.supportsPersistedEnv).toBe(true);
    expect(caps.envPersistenceMode).toBe('runtime_hook');
    expect(caps.supportsNativeAdditionalContext).toBe(false);
    expect(caps.toolInterceptionScope).toBe('all');
  });
});

// ---------------------------------------------------------------------------
// Mappings
// ---------------------------------------------------------------------------

describe('mappings', () => {
  it('maps all Pi events to canonical phases', () => {
    const expected: Record<string, string> = {
      session_start: 'session.start',
      tool_call: 'tool.before',
      context: 'turn.before_agent',
      before_provider_request: 'model.before_request',
    };

    for (const [native, canonical] of Object.entries(expected)) {
      const mapping = getPiPhaseMapping(native);
      expect(mapping, `mapping for ${native}`).toBeDefined();
      expect(mapping!.canonicalPhase).toBe(canonical);
    }
  });

  it('returns undefined for unknown event names', () => {
    expect(getPiPhaseMapping('unknown_event')).toBeUndefined();
  });

  it('marks tool_call as blockable', () => {
    const mapping = getPiPhaseMapping('tool_call');
    expect(mapping!.blockCapability).toBe(true);
  });

  it('marks tool_call as mutable', () => {
    const mapping = getPiPhaseMapping('tool_call');
    expect(mapping!.mutationCapability).toBe(true);
  });

  it('marks session_start as non-blockable', () => {
    const mapping = getPiPhaseMapping('session_start');
    expect(mapping!.blockCapability).toBe(false);
  });

  it('marks context as non-blockable and non-mutable', () => {
    const mapping = getPiPhaseMapping('context');
    expect(mapping!.blockCapability).toBe(false);
    expect(mapping!.mutationCapability).toBe(false);
  });

  it('getSupportedPhases returns all mapped phases', () => {
    const phases = getSupportedPhases();
    expect(phases).toContain('session.start');
    expect(phases).toContain('tool.before');
    expect(phases).toContain('turn.before_agent');
    expect(phases).toContain('model.before_request');
    expect(phases.length).toBe(PI_PHASE_MAPPINGS.length);
  });
});

// ---------------------------------------------------------------------------
// Normalizer
// ---------------------------------------------------------------------------

describe('normalizePi', () => {
  describe('coerceInput', () => {
    it('handles object input directly', () => {
      const result = coerceInput({ key: 'value' });
      expect(result).toEqual({ key: 'value' });
    });

    it('returns empty object for null/undefined', () => {
      expect(coerceInput(null)).toEqual({});
      expect(coerceInput(undefined)).toEqual({});
    });

    it('wraps non-object input in raw field', () => {
      const result = coerceInput('a string');
      expect(result).toEqual({ raw: 'a string' });
    });

    it('wraps array input in raw field', () => {
      const result = coerceInput([1, 2, 3]);
      expect(result).toEqual({ raw: [1, 2, 3] });
    });
  });

  describe('session_start normalization', () => {
    it('normalizes session_start event', () => {
      const event = normalizePi('session_start', fixtures.SESSION_START);

      expect(event.version).toBe('a5c.hooks.v1');
      expect(event.adapter).toBe('pi');
      expect(event.phase).toBe('session.start');
      expect(event.rawEventName).toBe('session_start');
      expect(event.supportLevel).toBe('native');
      expect(event.execution.sessionId).toBe('pi_sess_abc123');
      expect(event.execution.cwd).toBe('/home/user/project');
      expect(event.execution.model).toBe('claude-sonnet-4-20250514');
      expect(event.payload.initialPrompt).toBe('Help me refactor the auth module');
    });

    it('normalizes minimal session_start', () => {
      const event = normalizePi('session_start', fixtures.SESSION_START_MINIMAL);
      expect(event.execution.sessionId).toBe('pi_sess_def456');
      expect(event.execution.cwd).toBeNull();
    });
  });

  describe('tool_call normalization', () => {
    it('normalizes Bash tool call', () => {
      const event = normalizePi('tool_call', fixtures.TOOL_CALL_BASH);

      expect(event.phase).toBe('tool.before');
      expect(event.execution.toolName).toBe('Bash');
      expect(event.execution.toolCallId).toBe('tc_pi_001');
      expect(event.payload.toolName).toBe('Bash');
      expect(event.payload.toolInput).toEqual({ command: 'npm test', description: 'Run tests' });
    });

    it('normalizes Edit tool call', () => {
      const event = normalizePi('tool_call', fixtures.TOOL_CALL_EDIT);

      expect(event.execution.toolName).toBe('Edit');
      expect(event.payload.toolName).toBe('Edit');
    });
  });

  describe('context normalization', () => {
    it('normalizes context event', () => {
      const event = normalizePi('context', fixtures.CONTEXT);

      expect(event.phase).toBe('turn.before_agent');
      expect(event.payload.contextContent).toBe('The project uses TypeScript with strict mode enabled.');
    });
  });

  describe('before_provider_request normalization', () => {
    it('normalizes before_provider_request event', () => {
      const event = normalizePi('before_provider_request', fixtures.BEFORE_PROVIDER_REQUEST);

      expect(event.phase).toBe('model.before_request');
      expect(event.payload.messages).toEqual([
        { role: 'user', content: 'Help me refactor the auth module' },
      ]);
      expect(event.payload.providerConfig).toEqual({
        maxTokens: 4096,
        temperature: 0,
      });
    });
  });

  describe('unknown events', () => {
    it('handles unknown event names gracefully', () => {
      const event = normalizePi('future_event', { sessionId: 'pi_x', custom_field: 'data' });

      expect(event.phase).toBe('unknown');
      expect(event.supportLevel).toBe('unsupported');
      expect(event.payload.custom_field).toBe('data');
    });
  });

  describe('extension-state handling', () => {
    it('splits extension-state into input and persisted buckets', () => {
      const extensionState = {
        HOOKS_PROXY_SESSION_ID: 'sess_override',
        HOOKS_PROXY_PERSIST_MY_KEY: 'my_value',
        PI_SESSION_ID: 'pi_native',
      };

      const event = normalizePi('session_start', fixtures.SESSION_START, extensionState);

      expect(event.env.input.HOOKS_PROXY_SESSION_ID).toBe('sess_override');
      expect(event.env.persisted.HOOKS_PROXY_PERSIST_MY_KEY).toBe('my_value');
      expect(event.env.input['PI_SESSION_ID']).toBeUndefined();
    });
  });

  describe('raw preservation', () => {
    it('preserves raw input in the raw field', () => {
      const event = normalizePi('tool_call', fixtures.TOOL_CALL_BASH);
      expect(event.raw).toBe(fixtures.TOOL_CALL_BASH);
    });
  });
});

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

describe('renderPiOutput', () => {
  describe('tool_call rendering', () => {
    it('renders allow decision', () => {
      const output = renderPiOutput({ decision: 'allow' }, 'tool_call');
      expect(output).toEqual({ decision: 'allow' });
    });

    it('renders deny decision with reason', () => {
      const output = renderPiOutput(
        { decision: 'deny', reason: 'Dangerous command' },
        'tool_call',
      );
      expect(output).toEqual({ decision: 'deny', reason: 'Dangerous command' });
    });

    it('renders tool input mutation', () => {
      const output = renderPiOutput(
        {
          decision: 'allow',
          toolMutation: { mode: 'replace', value: { command: 'npm test -- --coverage' } },
        },
        'tool_call',
      );
      expect(output).toEqual({
        decision: 'allow',
        toolInput: { command: 'npm test -- --coverage' },
      });
    });

    it('renders empty object for noop decision', () => {
      const output = renderPiOutput({ decision: 'noop' }, 'tool_call');
      expect(output).toEqual({});
    });

    it('renders empty object for ask decision (unsupported by Pi)', () => {
      const output = renderPiOutput({ decision: 'ask' }, 'tool_call');
      expect(output).toEqual({});
    });
  });

  describe('session_start rendering', () => {
    it('renders additional context', () => {
      const output = renderPiOutput(
        { additionalContext: 'Session initialized with project context.' },
        'session_start',
      );
      expect(output).toEqual({
        additionalContext: 'Session initialized with project context.',
      });
    });

    it('renders persist state from persistEnv', () => {
      const output = renderPiOutput(
        { persistEnv: { AGENT_SESSION_ID: 'sess_123', MY_KEY: 'val' } },
        'session_start',
      );
      expect(output).toEqual({
        persistState: { AGENT_SESSION_ID: 'sess_123', MY_KEY: 'val' },
      });
    });

    it('renders empty object when no fields set', () => {
      const output = renderPiOutput({}, 'session_start');
      expect(output).toEqual({});
    });
  });

  describe('context rendering', () => {
    it('renders additional context as contextContent', () => {
      const output = renderPiOutput(
        { additionalContext: 'Extra context for the turn.' },
        'context',
      );
      expect(output).toEqual({ contextContent: 'Extra context for the turn.' });
    });
  });

  describe('before_provider_request rendering', () => {
    it('renders system message', () => {
      const output = renderPiOutput(
        { systemMessage: 'You are a helpful assistant.' },
        'before_provider_request',
      );
      expect(output).toEqual({ systemMessage: 'You are a helpful assistant.' });
    });

    it('renders empty object when no system message', () => {
      const output = renderPiOutput({}, 'before_provider_request');
      expect(output).toEqual({});
    });
  });

  describe('generic event rendering', () => {
    it('renders additional context for unknown events', () => {
      const output = renderPiOutput(
        { additionalContext: 'Some context.' },
        'unknown_event',
      );
      expect(output).toEqual({ additionalContext: 'Some context.' });
    });
  });
});

describe('buildExtensionState', () => {
  it('copies env vars for extension-state persistence', () => {
    const state = buildExtensionState({
      AGENT_SESSION_ID: 'sess_123',
      MY_VAR: 'hello world',
    });

    expect(state).toEqual({
      AGENT_SESSION_ID: 'sess_123',
      MY_VAR: 'hello world',
    });
  });

  it('returns empty object for empty input', () => {
    expect(buildExtensionState({})).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// Session resolver
// ---------------------------------------------------------------------------

describe('resolveSessionId', () => {
  it('prefers explicit override over everything', () => {
    const result = resolveSessionId(
      { sessionId: 'native_id' },
      { AGENT_SESSION_ID: 'env_id', PI_SESSION_ID: 'pi_id' },
      'override_id',
    );
    expect(result).toEqual({ sessionId: 'override_id', source: 'explicit_override' });
  });

  it('prefers AGENT_SESSION_ID env over native sessionId', () => {
    const result = resolveSessionId(
      { sessionId: 'native_id' },
      { AGENT_SESSION_ID: 'env_id' },
    );
    expect(result).toEqual({ sessionId: 'env_id', source: 'explicit_env' });
  });

  it('falls back to native sessionId', () => {
    const result = resolveSessionId({ sessionId: 'native_id' }, {});
    expect(result).toEqual({ sessionId: 'native_id', source: 'native' });
  });

  it('falls back to PI_SESSION_ID from extension-state', () => {
    const result = resolveSessionId({}, { PI_SESSION_ID: 'pi_id' });
    expect(result).toEqual({ sessionId: 'pi_id', source: 'harness_env' });
  });

  it('returns null when no session ID is available', () => {
    const result = resolveSessionId({}, {});
    expect(result).toEqual({ sessionId: null, source: 'none' });
  });

  it('ignores empty native sessionId', () => {
    const result = resolveSessionId({ sessionId: '' }, {});
    expect(result).toEqual({ sessionId: null, source: 'none' });
  });
});
