import { describe, it, expect, beforeAll } from 'vitest';
import { createAdapter } from '../adapter';
import {
  OPENCLAW_PHASE_MAPPINGS,
  OPENCLAW_PLUGIN_MAPPINGS,
  OPENCLAW_GATEWAY_MAPPINGS,
  getOpenClawPhaseMapping,
  getSupportedPhases,
  getSupportedPluginPhases,
  classifyHookOrigin,
} from '../mappings';
import { normalizeOpenClaw, parseEventData, buildPayload, setAdapterName } from '../normalizer';
import { renderOpenClawOutput } from '../renderer';
import { resolveSessionId } from '../session-resolver';
import * as fixtures from './fixtures/openclaw-events';

beforeAll(() => {
  setAdapterName('openclaw');
});

// ---------------------------------------------------------------------------
// Adapter capabilities
// ---------------------------------------------------------------------------

describe('createAdapter', () => {
  it('returns correct capability descriptor', () => {
    const caps = createAdapter('openclaw');

    expect(caps.name).toBe('openclaw');
    expect(caps.family).toBe('in-process');
    expect(caps.sessionIdQuality).toBe('derived');
    expect(caps.supportsBlock).toBe(true);
    expect(caps.supportsAsk).toBe(false);
    expect(caps.supportsToolInputMutation).toBe(true);
    expect(caps.supportsToolResultMutation).toBe(false);
    expect(caps.supportsPersistedEnv).toBe(false);
    expect(caps.envPersistenceMode).toBe('runtime_hook');
    expect(caps.supportsNativeAdditionalContext).toBe(false);
    expect(caps.toolInterceptionScope).toBe('all');
  });

  it('includes notes about gateway vs plugin distinction', () => {
    const caps = createAdapter('openclaw');
    expect(caps.notes).toBeDefined();
    expect(caps.notes!.some((n) => n.includes('Gateway hooks'))).toBe(true);
    expect(caps.notes!.some((n) => n.includes('Plugin hooks'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Mappings
// ---------------------------------------------------------------------------

describe('mappings', () => {
  describe('plugin hooks', () => {
    it('maps all plugin events to canonical phases', () => {
      const expected: Record<string, string> = {
        'plugin.session.start': 'session.start',
        'plugin.session.end': 'session.end',
        'plugin.tool.before': 'tool.before',
        'plugin.tool.after': 'tool.after',
        'plugin.turn.stop': 'turn.stop',
        'plugin.prompt.submitted': 'turn.user_prompt_submitted',
      };

      for (const [native, canonical] of Object.entries(expected)) {
        const mapping = getOpenClawPhaseMapping(native);
        expect(mapping, `mapping for ${native}`).toBeDefined();
        expect(mapping!.canonicalPhase).toBe(canonical);
        expect(mapping!.supportLevel).toBe('native');
      }
    });

    it('marks plugin.tool.before as blockable and mutable', () => {
      const mapping = getOpenClawPhaseMapping('plugin.tool.before');
      expect(mapping!.blockCapability).toBe(true);
      expect(mapping!.mutationCapability).toBe(true);
    });

    it('marks plugin.turn.stop as blockable', () => {
      const mapping = getOpenClawPhaseMapping('plugin.turn.stop');
      expect(mapping!.blockCapability).toBe(true);
    });

    it('marks plugin.tool.after as non-blockable', () => {
      const mapping = getOpenClawPhaseMapping('plugin.tool.after');
      expect(mapping!.blockCapability).toBe(false);
    });
  });

  describe('gateway hooks', () => {
    it('maps gateway events with lossy support level', () => {
      const gatewayEvents = [
        'gateway.request.received',
        'gateway.request.routed',
        'gateway.request.completed',
        'gateway.auth.check',
      ];

      for (const native of gatewayEvents) {
        const mapping = getOpenClawPhaseMapping(native);
        expect(mapping, `mapping for ${native}`).toBeDefined();
        expect(mapping!.supportLevel).toBe('lossy');
        expect(mapping!.scope).toBe('gateway');
      }
    });

    it('maps gateway events to canonical phases but with lossy fidelity', () => {
      const mapping = getOpenClawPhaseMapping('gateway.request.received');
      expect(mapping!.canonicalPhase).toBe('session.start');
      expect(mapping!.supportLevel).toBe('lossy');
    });
  });

  describe('classifyHookOrigin', () => {
    it('classifies gateway hooks', () => {
      expect(classifyHookOrigin('gateway.request.received')).toBe('gateway');
      expect(classifyHookOrigin('gateway.auth.check')).toBe('gateway');
    });

    it('classifies plugin hooks', () => {
      expect(classifyHookOrigin('plugin.session.start')).toBe('plugin');
      expect(classifyHookOrigin('plugin.tool.before')).toBe('plugin');
    });

    it('classifies unknown events as plugin', () => {
      expect(classifyHookOrigin('custom.event')).toBe('plugin');
    });
  });

  describe('getSupportedPluginPhases', () => {
    it('returns only plugin-mapped phases', () => {
      const phases = getSupportedPluginPhases();
      expect(phases).toContain('session.start');
      expect(phases).toContain('tool.before');
      expect(phases.length).toBe(OPENCLAW_PLUGIN_MAPPINGS.length);
    });
  });

  describe('getSupportedPhases', () => {
    it('returns all mapped phases (plugin + gateway)', () => {
      const phases = getSupportedPhases();
      expect(phases.length).toBe(OPENCLAW_PHASE_MAPPINGS.length);
      expect(phases.length).toBe(
        OPENCLAW_PLUGIN_MAPPINGS.length + OPENCLAW_GATEWAY_MAPPINGS.length,
      );
    });
  });

  it('returns undefined for unknown event names', () => {
    expect(getOpenClawPhaseMapping('unknown.event')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Normalizer
// ---------------------------------------------------------------------------

describe('normalizeOpenClaw', () => {
  describe('parseEventData', () => {
    it('parses JSON string input', () => {
      const result = parseEventData('{"key": "value"}');
      expect(result).toEqual({ key: 'value' });
    });

    it('handles object input directly', () => {
      const result = parseEventData({ key: 'value' });
      expect(result).toEqual({ key: 'value' });
    });

    it('wraps non-object JSON in raw field', () => {
      const result = parseEventData('"just a string"');
      expect(result).toEqual({ raw: 'just a string' });
    });

    it('wraps unparseable string in raw field', () => {
      const result = parseEventData('not json');
      expect(result).toEqual({ raw: 'not json' });
    });

    it('returns empty object for null/undefined', () => {
      expect(parseEventData(null)).toEqual({});
      expect(parseEventData(undefined)).toEqual({});
    });
  });

  describe('plugin hook normalization', () => {
    it('normalizes plugin.session.start', () => {
      const event = normalizeOpenClaw('plugin.session.start', fixtures.PLUGIN_SESSION_START);

      expect(event.version).toBe('a5c.hooks.v1');
      expect(event.adapter).toBe('openclaw');
      expect(event.phase).toBe('session.start');
      expect(event.rawEventName).toBe('plugin.session.start');
      expect(event.supportLevel).toBe('native');
      expect(event.execution.sessionId).toBe('oc-sess-abc123');
      expect(event.execution.cwd).toBe('/home/user/project');
      expect(event.execution.model).toBe('gpt-4o');
      expect(event.execution.metadata.origin).toBe('plugin');
      expect(event.execution.metadata.pluginId).toBe('my-plugin');
      expect(event.payload.source).toBe('startup');
      expect(event.payload.initialPrompt).toBe('Help me build a REST API');
    });

    it('normalizes plugin.session.end', () => {
      const event = normalizeOpenClaw('plugin.session.end', fixtures.PLUGIN_SESSION_END);
      expect(event.phase).toBe('session.end');
      expect(event.execution.metadata.origin).toBe('plugin');
    });

    it('normalizes plugin.tool.before', () => {
      const event = normalizeOpenClaw('plugin.tool.before', fixtures.PLUGIN_TOOL_BEFORE);

      expect(event.phase).toBe('tool.before');
      expect(event.execution.toolName).toBe('execute_bash');
      expect(event.execution.toolCallId).toBe('tc-001');
      expect(event.payload.toolName).toBe('execute_bash');
      expect(event.payload.toolInput).toEqual({ command: 'npm test' });
      expect(event.execution.metadata.origin).toBe('plugin');
    });

    it('normalizes plugin.tool.after', () => {
      const event = normalizeOpenClaw('plugin.tool.after', fixtures.PLUGIN_TOOL_AFTER);

      expect(event.phase).toBe('tool.after');
      expect(event.payload.toolResponse).toBe('All 15 tests passed.');
      expect(event.execution.metadata.origin).toBe('plugin');
    });

    it('normalizes plugin.turn.stop', () => {
      const event = normalizeOpenClaw('plugin.turn.stop', fixtures.PLUGIN_TURN_STOP);

      expect(event.phase).toBe('turn.stop');
      expect(event.payload.reason).toBe('end_turn');
      expect(event.payload.lastMessage).toBe('I have completed the API implementation.');
      expect(event.execution.metadata.origin).toBe('plugin');
    });

    it('normalizes plugin.prompt.submitted', () => {
      const event = normalizeOpenClaw('plugin.prompt.submitted', fixtures.PLUGIN_PROMPT_SUBMITTED);

      expect(event.phase).toBe('turn.user_prompt_submitted');
      expect(event.payload.prompt).toBe('Now add authentication middleware');
    });
  });

  describe('gateway hook normalization', () => {
    it('normalizes gateway.request.received with lossy support', () => {
      const event = normalizeOpenClaw(
        'gateway.request.received',
        fixtures.GATEWAY_REQUEST_RECEIVED,
      );

      expect(event.phase).toBe('session.start');
      expect(event.supportLevel).toBe('lossy');
      expect(event.execution.metadata.origin).toBe('gateway');
      expect(event.execution.metadata.correlationId).toBe('gw-corr-xyz789');
      expect(event.payload.requestId).toBe('req-001');
      expect(event.payload.route).toBe('/api/v1/chat');
      expect(event.payload.method).toBe('POST');
    });

    it('normalizes gateway.request.completed with lossy support', () => {
      const event = normalizeOpenClaw(
        'gateway.request.completed',
        fixtures.GATEWAY_REQUEST_COMPLETED,
      );

      expect(event.phase).toBe('session.end');
      expect(event.supportLevel).toBe('lossy');
      expect(event.execution.metadata.origin).toBe('gateway');
      expect(event.payload.statusCode).toBe(200);
    });

    it('normalizes gateway.auth.check', () => {
      const event = normalizeOpenClaw('gateway.auth.check', fixtures.GATEWAY_AUTH_CHECK);

      expect(event.phase).toBe('tool.permission_request');
      expect(event.supportLevel).toBe('lossy');
      expect(event.execution.metadata.origin).toBe('gateway');
      expect(event.payload.authResult).toBe('passed');
    });

    it('uses correlationId as session ID for gateway events', () => {
      const event = normalizeOpenClaw(
        'gateway.request.received',
        fixtures.GATEWAY_REQUEST_RECEIVED,
      );

      expect(event.execution.sessionId).toBe('gw-corr-xyz789');
    });
  });

  describe('unknown events', () => {
    it('handles unknown event names gracefully', () => {
      const event = normalizeOpenClaw('custom.event', {
        sessionId: 'sess-x',
        customField: 'data',
      });

      expect(event.phase).toBe('unknown');
      expect(event.supportLevel).toBe('unsupported');
      expect(event.payload.customField).toBe('data');
    });
  });

  describe('environment handling', () => {
    it('splits env into input and persisted buckets', () => {
      const env = {
        HOOKS_PROXY_SESSION_ID: 'sess_override',
        HOOKS_PROXY_PERSIST_MY_KEY: 'my_value',
        PATH: '/usr/bin',
      };

      const event = normalizeOpenClaw(
        'plugin.session.start',
        fixtures.PLUGIN_SESSION_START,
        env,
      );

      expect(event.env.input.HOOKS_PROXY_SESSION_ID).toBe('sess_override');
      expect(event.env.persisted.HOOKS_PROXY_PERSIST_MY_KEY).toBe('my_value');
      expect(event.env.input['PATH']).toBeUndefined();
    });
  });

  describe('raw preservation', () => {
    it('preserves raw event data in the raw field', () => {
      const event = normalizeOpenClaw('plugin.turn.stop', fixtures.PLUGIN_TURN_STOP);
      expect(event.raw).toBe(fixtures.PLUGIN_TURN_STOP);
    });
  });
});

// ---------------------------------------------------------------------------
// buildPayload
// ---------------------------------------------------------------------------

describe('buildPayload', () => {
  it('extracts plugin session start fields', () => {
    const payload = buildPayload('plugin.session.start', {
      source: 'startup',
      initialPrompt: 'hello',
      pluginId: 'p1',
      sessionId: 'ignored-in-payload',
    });

    expect(payload.source).toBe('startup');
    expect(payload.initialPrompt).toBe('hello');
    expect(payload.pluginId).toBe('p1');
    expect(payload['sessionId']).toBeUndefined();
  });

  it('extracts gateway request received fields', () => {
    const payload = buildPayload('gateway.request.received', {
      requestId: 'req-1',
      route: '/api',
      method: 'GET',
      correlationId: 'ignored-in-payload',
    });

    expect(payload.requestId).toBe('req-1');
    expect(payload.route).toBe('/api');
    expect(payload.method).toBe('GET');
    expect(payload['correlationId']).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

describe('renderOpenClawOutput', () => {
  describe('plugin.tool.before rendering', () => {
    it('renders allow decision', () => {
      const output = renderOpenClawOutput({ decision: 'allow' }, 'plugin.tool.before');
      expect(output).toEqual({ decision: 'allow' });
    });

    it('renders deny decision with reason', () => {
      const output = renderOpenClawOutput(
        { decision: 'deny', reason: 'Blocked by policy' },
        'plugin.tool.before',
      );
      expect(output).toEqual({ decision: 'deny', reason: 'Blocked by policy' });
    });

    it('renders tool mutation', () => {
      const output = renderOpenClawOutput(
        { decision: 'allow', toolMutation: { mode: 'replace', value: { command: 'npm run test:safe' } } },
        'plugin.tool.before',
      );
      expect(output).toEqual({
        decision: 'allow',
        toolInput: { command: 'npm run test:safe' },
      });
    });

    it('renders empty object for noop decision', () => {
      const output = renderOpenClawOutput({ decision: 'noop' }, 'plugin.tool.before');
      expect(output).toEqual({});
    });
  });

  describe('plugin.tool.after rendering', () => {
    it('renders metadata', () => {
      const output = renderOpenClawOutput(
        { metadata: { executionTime: 1200 } },
        'plugin.tool.after',
      );
      expect(output).toEqual({ metadata: { executionTime: 1200 } });
    });

    it('renders empty object when no metadata', () => {
      const output = renderOpenClawOutput({}, 'plugin.tool.after');
      expect(output).toEqual({});
    });
  });

  describe('plugin.turn.stop rendering', () => {
    it('renders continue session', () => {
      const output = renderOpenClawOutput(
        { continueSession: true, followUpMessage: 'Run the linter too.' },
        'plugin.turn.stop',
      );
      expect(output).toEqual({
        continueSession: true,
        followUpMessage: 'Run the linter too.',
      });
    });

    it('renders stop reason', () => {
      const output = renderOpenClawOutput(
        { stopReason: 'Hook decided to stop' },
        'plugin.turn.stop',
      );
      expect(output).toEqual({ reason: 'Hook decided to stop' });
    });

    it('prefers stopReason over reason', () => {
      const output = renderOpenClawOutput(
        { stopReason: 'specific stop', reason: 'generic' },
        'plugin.turn.stop',
      );
      expect(output).toEqual({ reason: 'specific stop' });
    });
  });

  describe('plugin.session.start rendering', () => {
    it('renders metadata', () => {
      const output = renderOpenClawOutput(
        { metadata: { initialized: true } },
        'plugin.session.start',
      );
      expect(output).toEqual({ metadata: { initialized: true } });
    });
  });

  describe('gateway.auth.check rendering', () => {
    it('renders allow as allowed: true', () => {
      const output = renderOpenClawOutput({ decision: 'allow' }, 'gateway.auth.check');
      expect(output).toEqual({ allowed: true });
    });

    it('renders deny as allowed: false with reason', () => {
      const output = renderOpenClawOutput(
        { decision: 'deny', reason: 'Unauthorized' },
        'gateway.auth.check',
      );
      expect(output).toEqual({ allowed: false, reason: 'Unauthorized' });
    });
  });

  describe('generic event rendering', () => {
    it('renders metadata for unknown events', () => {
      const output = renderOpenClawOutput(
        { metadata: { custom: 'data' } },
        'gateway.request.received',
      );
      expect(output).toEqual({ metadata: { custom: 'data' } });
    });

    it('renders empty object for empty result', () => {
      const output = renderOpenClawOutput({}, 'gateway.request.received');
      expect(output).toEqual({});
    });
  });
});

// ---------------------------------------------------------------------------
// Session resolver
// ---------------------------------------------------------------------------

describe('resolveSessionId', () => {
  it('prefers explicit flag over everything', () => {
    const result = resolveSessionId(
      { sessionId: 'plugin-id', correlationId: 'gw-id' },
      { AGENT_SESSION_ID: 'env-id' },
      'flag-id',
    );
    expect(result).toEqual({ sessionId: 'flag-id', source: 'explicit_flag' });
  });

  it('prefers env over plugin/gateway session IDs', () => {
    const result = resolveSessionId(
      { sessionId: 'plugin-id', correlationId: 'gw-id' },
      { AGENT_SESSION_ID: 'env-id' },
    );
    expect(result).toEqual({ sessionId: 'env-id', source: 'explicit_env' });
  });

  it('prefers plugin sessionId over gateway correlationId', () => {
    const result = resolveSessionId(
      { sessionId: 'plugin-id', correlationId: 'gw-id' },
      {},
    );
    expect(result).toEqual({ sessionId: 'plugin-id', source: 'plugin' });
  });

  it('falls back to gateway correlationId', () => {
    const result = resolveSessionId({ correlationId: 'gw-id' }, {});
    expect(result).toEqual({ sessionId: 'gw-id', source: 'gateway_correlation' });
  });

  it('returns null when no session ID is available', () => {
    const result = resolveSessionId({}, {});
    expect(result).toEqual({ sessionId: null, source: 'none' });
  });

  it('ignores empty plugin sessionId', () => {
    const result = resolveSessionId({ sessionId: '' }, {});
    expect(result).toEqual({ sessionId: null, source: 'none' });
  });

  it('ignores empty correlationId', () => {
    const result = resolveSessionId({ correlationId: '' }, {});
    expect(result).toEqual({ sessionId: null, source: 'none' });
  });
});
