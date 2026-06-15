import { describe, expect, it, beforeEach } from 'vitest';
import {
  createAdapter,
  ANTIGRAVITY_PHASE_MAPPINGS,
  getAntigravityPhaseMapping,
  getSupportedPhases,
  normalizeAntigravity,
  parseStdin,
  buildExecutionContext,
  buildPayload,
  setAdapterName,
  renderAntigravityOutput,
  resolveSessionId,
  deriveSessionId,
} from '../src/index';

describe('Antigravity adapter', () => {
  beforeEach(() => {
    setAdapterName('antigravity');
  });

  describe('createAdapter', () => {
    it('creates adapter with correct name', () => {
      const adapter = createAdapter();
      expect(adapter.name).toBe('antigravity');
    });

    it('creates adapter with workflow-hook family', () => {
      const adapter = createAdapter();
      expect(adapter.family).toBe('workflow-hook');
    });

    it('creates adapter with derived session ID quality', () => {
      const adapter = createAdapter();
      expect(adapter.sessionIdQuality).toBe('derived');
    });

    it('supports ordered fanout', () => {
      const adapter = createAdapter();
      expect(adapter.supportsOrderedFanout).toBe(true);
    });

    it('supports native additional context', () => {
      const adapter = createAdapter();
      expect(adapter.supportsNativeAdditionalContext).toBe(true);
    });

    it('supports block capability', () => {
      const adapter = createAdapter();
      expect(adapter.supportsBlock).toBe(true);
    });

    it('supports tool input mutation but not result mutation', () => {
      const adapter = createAdapter();
      expect(adapter.supportsToolInputMutation).toBe(true);
      expect(adapter.supportsToolResultMutation).toBe(false);
    });

    it('accepts custom adapter name', () => {
      const adapter = createAdapter('custom-antigravity');
      expect(adapter.name).toBe('custom-antigravity');
    });
  });

  describe('phase mappings', () => {
    it('contains expected canonical phases', () => {
      const phases = getSupportedPhases();
      expect(phases).toContain('session.start');
      expect(phases).toContain('turn.stop');
    });

    it('maps BeforeTool to tool.before', () => {
      const mapping = getAntigravityPhaseMapping('BeforeTool');
      expect(mapping).toBeDefined();
      expect(mapping!.canonicalPhase).toBe('tool.before');
      expect(mapping!.supportLevel).toBe('native');
    });

    it('maps AfterTool to tool.after', () => {
      const mapping = getAntigravityPhaseMapping('AfterTool');
      expect(mapping).toBeDefined();
      expect(mapping!.canonicalPhase).toBe('tool.after');
    });

    it('maps SessionStart to session.start (emulated)', () => {
      const mapping = getAntigravityPhaseMapping('SessionStart');
      expect(mapping).toBeDefined();
      expect(mapping!.canonicalPhase).toBe('session.start');
      expect(mapping!.supportLevel).toBe('emulated');
    });

    it('maps Stop to turn.stop (emulated)', () => {
      const mapping = getAntigravityPhaseMapping('Stop');
      expect(mapping).toBeDefined();
      expect(mapping!.canonicalPhase).toBe('turn.stop');
      expect(mapping!.supportLevel).toBe('emulated');
    });

    it('returns undefined for unknown events', () => {
      expect(getAntigravityPhaseMapping('NonExistentEvent')).toBeUndefined();
    });

    it('has no duplicate native hook names', () => {
      const seen = new Set<string>();
      for (const m of ANTIGRAVITY_PHASE_MAPPINGS) {
        expect(seen.has(m.nativeHook)).toBe(false);
        seen.add(m.nativeHook);
      }
    });
  });

  describe('parseStdin', () => {
    it('parses null to empty object', () => {
      expect(parseStdin(null)).toEqual({});
    });

    it('parses JSON string to object', () => {
      expect(parseStdin('{"cwd":"/tmp"}')).toEqual({ cwd: '/tmp' });
    });

    it('wraps non-object JSON in raw field', () => {
      expect(parseStdin('"hello"')).toEqual({ raw: 'hello' });
    });

    it('wraps invalid JSON in raw field', () => {
      expect(parseStdin('not-json')).toEqual({ raw: 'not-json' });
    });

    it('passes through objects directly', () => {
      const obj = { cwd: '/tmp', model: 'gemini-3.5-flash' };
      expect(parseStdin(obj)).toBe(obj);
    });
  });

  describe('normalizeAntigravity', () => {
    it('normalizes a SessionStart event', () => {
      const event = normalizeAntigravity('SessionStart', { prompt: 'hello', cwd: '/project' });
      expect(event.version).toBe('a5c.hooks.v1');
      expect(event.adapter).toBe('antigravity');
      expect(event.phase).toBe('session.start');
      expect(event.rawEventName).toBe('SessionStart');
      expect(event.payload.initialPrompt).toBe('hello');
    });

    it('normalizes a BeforeTool event', () => {
      const event = normalizeAntigravity('BeforeTool', {
        toolName: 'write_file',
        toolInput: { path: '/tmp/test.txt' },
        toolCallId: 'call-123',
      });
      expect(event.phase).toBe('tool.before');
      expect(event.payload.toolName).toBe('write_file');
      expect(event.payload.toolInput).toEqual({ path: '/tmp/test.txt' });
      expect(event.payload.toolCallId).toBe('call-123');
    });

    it('normalizes an AfterTool event', () => {
      const event = normalizeAntigravity('AfterTool', {
        toolName: 'read_file',
        toolResult: 'file contents',
      });
      expect(event.phase).toBe('tool.after');
      expect(event.payload.toolResponse).toBe('file contents');
    });

    it('sets unknown phase for unrecognized events', () => {
      const event = normalizeAntigravity('CustomEvent', { data: 'test' });
      expect(event.phase).toBe('unknown');
      expect(event.supportLevel).toBe('unsupported');
    });

    it('includes provider metadata when present', () => {
      const event = normalizeAntigravity('SessionStart', {
        provider: 'claude',
        model: 'claude-sonnet-4-6-20250514',
        cwd: '/project',
      });
      expect(event.execution.metadata.provider).toBe('claude');
      expect(event.execution.model).toBe('claude-sonnet-4-6-20250514');
    });

    it('includes skillPath metadata when present', () => {
      const event = normalizeAntigravity('BeforeModel', {
        skillPath: '/skills/my-skill/SKILL.md',
      });
      expect(event.execution.metadata.skillPath).toBe('/skills/my-skill/SKILL.md');
    });

    it('splits env into input and persisted buckets', () => {
      const event = normalizeAntigravity('SessionStart', {}, {
        HOOKS_PROXY_TURN_ID: 'turn-1',
        HOOKS_PROXY_PERSIST_FOO: 'bar',
        OTHER_VAR: 'ignored',
      });
      expect(event.env.input).toEqual({ HOOKS_PROXY_TURN_ID: 'turn-1' });
      expect(event.env.persisted).toEqual({ HOOKS_PROXY_PERSIST_FOO: 'bar' });
    });
  });

  describe('buildPayload', () => {
    it('extracts BeforeModel payload fields', () => {
      const payload = buildPayload('BeforeModel', {
        request: { model: 'gemini-3.5-flash' },
        messages: [{ role: 'user', content: 'hi' }],
      });
      expect(payload.llmRequest).toEqual({ model: 'gemini-3.5-flash' });
      expect(payload.messages).toEqual([{ role: 'user', content: 'hi' }]);
    });

    it('extracts AfterModel payload fields', () => {
      const payload = buildPayload('AfterModel', {
        response: { text: 'response' },
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      });
      expect(payload.llmResponse).toEqual({ text: 'response' });
      expect(payload.usage).toEqual({ promptTokens: 10, completionTokens: 20, totalTokens: 30 });
    });

    it('extracts AfterAgent payload fields', () => {
      const payload = buildPayload('AfterAgent', {
        lastMessage: 'done',
        reason: 'completed',
      });
      expect(payload.lastAssistantMessage).toBe('done');
      expect(payload.reason).toBe('completed');
    });

    it('passes through unknown event fields minus common fields', () => {
      const payload = buildPayload('CustomWorkflow', {
        cwd: '/skip',
        model: 'skip',
        skillPath: 'skip',
        provider: 'skip',
        customField: 'keep',
      });
      expect(payload).toEqual({ customField: 'keep' });
    });
  });

  describe('renderAntigravityOutput', () => {
    it('renders BeforeTool deny decision', () => {
      const output = renderAntigravityOutput(
        { decision: 'deny', reason: 'blocked' },
        'BeforeTool',
      );
      expect(output.decision).toBe('deny');
      expect(output.reason).toBe('blocked');
    });

    it('renders BeforeTool allow decision', () => {
      const output = renderAntigravityOutput(
        { decision: 'allow' },
        'BeforeTool',
      );
      expect(output.decision).toBe('allow');
    });

    it('renders BeforeModel block on deny', () => {
      const output = renderAntigravityOutput(
        { decision: 'deny', reason: 'not allowed' },
        'BeforeModel',
      );
      expect(output.block).toBe(true);
      expect(output.reason).toBe('not allowed');
    });

    it('renders AfterAgent with continuation', () => {
      const output = renderAntigravityOutput(
        { continueSession: true, followUpMessage: 'next task', reason: 'more work' },
        'AfterAgent',
      );
      expect(output.continueSession).toBe(true);
      expect(output.followUpMessage).toBe('next task');
      expect(output.reason).toBe('more work');
    });

    it('renders BeforeToolSelection with selectedTools', () => {
      const output = renderAntigravityOutput(
        { toolMutation: { value: ['read_file', 'write_file'] } },
        'BeforeToolSelection',
      );
      expect(output.selectedTools).toEqual(['read_file', 'write_file']);
    });

    it('renders additionalContext for SessionStart', () => {
      const output = renderAntigravityOutput(
        { additionalContext: 'project context' },
        'SessionStart',
      );
      expect(output.additionalContext).toBe('project context');
    });

    it('renders generic output for unknown events', () => {
      const output = renderAntigravityOutput(
        { additionalContext: 'extra info' },
        'UnknownEvent',
      );
      expect(output.additionalContext).toBe('extra info');
    });
  });

  describe('session resolver', () => {
    it('prefers AGENT_SESSION_ID from env', () => {
      const id = resolveSessionId({}, { AGENT_SESSION_ID: 'explicit-id' });
      expect(id).toBe('explicit-id');
    });

    it('prefers HOOKS_PROXY_SESSION_ID over ANTIGRAVITY_SESSION_ID', () => {
      const id = resolveSessionId({}, {
        HOOKS_PROXY_SESSION_ID: 'proxy-id',
        ANTIGRAVITY_SESSION_ID: 'ag-id',
      });
      expect(id).toBe('proxy-id');
    });

    it('uses ANTIGRAVITY_SESSION_ID when no explicit IDs', () => {
      const id = resolveSessionId({}, { ANTIGRAVITY_SESSION_ID: 'ag-session' });
      expect(id).toBe('ag-session');
    });

    it('derives session ID from cwd in stdin', () => {
      const id = resolveSessionId({ cwd: '/project' }, {});
      expect(id).toBeDefined();
      expect(id).toMatch(/^antigravity-derived-/);
    });

    it('derives session ID from PWD env when no cwd in stdin', () => {
      const id = resolveSessionId({}, { PWD: '/project' });
      expect(id).toBeDefined();
      expect(id).toMatch(/^antigravity-derived-/);
    });

    it('returns null when no signals available', () => {
      const id = resolveSessionId({}, {});
      expect(id).toBeNull();
    });

    it('deriveSessionId produces stable IDs for same input within a time bucket', () => {
      const id1 = deriveSessionId('/project');
      const id2 = deriveSessionId('/project');
      expect(id1).toBe(id2);
    });

    it('deriveSessionId produces different IDs for different workspaces', () => {
      const id1 = deriveSessionId('/project-a');
      const id2 = deriveSessionId('/project-b');
      expect(id1).not.toBe(id2);
    });
  });

  describe('setAdapterName', () => {
    it('changes adapter name in normalized events', () => {
      setAdapterName('custom-ag');
      const event = normalizeAntigravity('SessionStart', { cwd: '/tmp' });
      expect(event.adapter).toBe('custom-ag');
    });
  });
});
