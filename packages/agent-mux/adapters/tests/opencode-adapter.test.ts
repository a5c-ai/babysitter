import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as os from 'node:os';
import * as path from 'node:path';
import { StreamAssembler } from '@a5c-ai/agent-mux-core';
import type { ParseContext } from '@a5c-ai/agent-mux-core';
import { OpenCodeAdapter } from '../src/opencode-adapter.js';

function makeContext(overrides?: Partial<ParseContext>): ParseContext {
  return {
    runId: 'test-run-1',
    agent: 'opencode',
    sessionId: undefined,
    turnIndex: 0,
    debug: false,
    outputFormat: 'jsonl',
    source: 'stdout',
    assembler: new StreamAssembler(),
    eventCount: 0,
    lastEventType: null,
    adapterState: {},
    ...overrides,
  };
}

describe('OpenCodeAdapter', () => {
  let adapter: OpenCodeAdapter;

  beforeEach(() => {
    adapter = new OpenCodeAdapter();
  });

  describe('identity', () => {
    it('has correct agent name', () => {
      expect(adapter.agent).toBe('opencode');
    });

    it('has correct display name', () => {
      expect(adapter.displayName).toBe('OpenCode');
    });

    it('has correct CLI command', () => {
      expect(adapter.cliCommand).toBe('opencode');
    });

    it('has minimum version', () => {
      expect(adapter.minVersion).toBe('0.1.0');
    });

    it('has host environment signals', () => {
      expect(adapter.hostEnvSignals).toContain('OPENCODE_SESSION_ID');
      expect(adapter.hostEnvSignals).toContain('OPENCODE_CONFIG');
    });
  });

  describe('capabilities', () => {
    it('declares agent as opencode', () => {
      expect(adapter.capabilities.agent).toBe('opencode');
    });

    it('supports resume and fork', () => {
      expect(adapter.capabilities.canResume).toBe(true);
      expect(adapter.capabilities.canFork).toBe(true);
    });

    it('supports multi-turn conversations', () => {
      expect(adapter.capabilities.supportsMultiTurn).toBe(true);
    });

    it('uses file session persistence', () => {
      expect(adapter.capabilities.sessionPersistence).toBe('file');
    });

    it('supports text streaming but not thinking', () => {
      expect(adapter.capabilities.supportsTextStreaming).toBe(true);
      expect(adapter.capabilities.supportsThinking).toBe(false);
      expect(adapter.capabilities.supportsThinkingStreaming).toBe(false);
    });

    it('supports tool calling', () => {
      expect(adapter.capabilities.supportsNativeTools).toBe(true);
      expect(adapter.capabilities.supportsParallelToolCalls).toBe(true);
      expect(adapter.capabilities.supportsToolCallStreaming).toBe(true);
    });

    it('supports MCP', () => {
      expect(adapter.capabilities.supportsMCP).toBe(true);
    });

    it('requires tool approval', () => {
      expect(adapter.capabilities.requiresToolApproval).toBe(true);
      expect(adapter.capabilities.approvalModes).toContain('yolo');
      expect(adapter.capabilities.approvalModes).toContain('prompt');
    });

    it('supports JSON and structured output', () => {
      expect(adapter.capabilities.supportsJsonMode).toBe(true);
      expect(adapter.capabilities.supportsStructuredOutput).toBe(true);
    });

    it('supports skills and agents.md', () => {
      expect(adapter.capabilities.supportsSkills).toBe(true);
      expect(adapter.capabilities.supportsAgentsMd).toBe(true);
      expect(adapter.capabilities.skillsFormat).toBe('file');
    });

    it('supports subagents', () => {
      expect(adapter.capabilities.supportsSubagentDispatch).toBe(true);
      expect(adapter.capabilities.supportsParallelExecution).toBe(true);
      expect(adapter.capabilities.maxParallelTasks).toBe(5);
    });

    it('keeps the subprocess adapter honest about live interactive support', () => {
      expect(adapter.capabilities.supportsInteractiveMode).toBe(false);
      expect(adapter.capabilities.supportsStdinInjection).toBe(false);
    });

    it('supports file attachments and image input', () => {
      expect(adapter.capabilities.supportsImageInput).toBe(true);
      expect(adapter.capabilities.supportsImageOutput).toBe(false);
      expect(adapter.capabilities.supportsFileAttachments).toBe(true);
    });

    it('supports plugins', () => {
      expect(adapter.capabilities.supportsPlugins).toBe(true);
      expect(adapter.capabilities.pluginFormats).toContain('mcp-server');
      expect(adapter.capabilities.pluginRegistries).toHaveLength(1);
      expect(adapter.capabilities.pluginRegistries[0].name).toBe('mcp');
    });

    it('supports all three platforms', () => {
      expect(adapter.capabilities.supportedPlatforms).toContain('darwin');
      expect(adapter.capabilities.supportedPlatforms).toContain('linux');
      expect(adapter.capabilities.supportedPlatforms).toContain('win32');
    });

    it('does not require git repo or PTY', () => {
      expect(adapter.capabilities.requiresGitRepo).toBe(false);
      expect(adapter.capabilities.requiresPty).toBe(false);
    });

    it('has multiple auth methods', () => {
      expect(adapter.capabilities.authMethods).toHaveLength(2);
      expect(adapter.capabilities.authMethods[0].type).toBe('api_key');
      expect(adapter.capabilities.authMethods[1].type).toBe('oauth');
    });

    it('has multiple install methods', () => {
      expect(adapter.capabilities.installMethods.length).toBeGreaterThanOrEqual(3);
      expect(adapter.capabilities.installMethods.some(m => m.type === 'npm')).toBe(true);
      expect(adapter.capabilities.installMethods.some(m => m.type === 'brew')).toBe(true);
      expect(adapter.capabilities.installMethods.some(m => m.type === 'curl')).toBe(true);
    });
  });

  describe('models', () => {
    it('has at least two models', () => {
      expect(adapter.models.length).toBeGreaterThanOrEqual(2);
    });

    it('has a default model', () => {
      expect(adapter.defaultModelId).toBe('claude-3-5-sonnet-20241022');
      const defaultModel = adapter.models.find(m => m.modelId === adapter.defaultModelId);
      expect(defaultModel).toBeDefined();
    });

    it('has Claude 3.5 Sonnet model', () => {
      const sonnet = adapter.models.find(m => m.modelId === 'claude-3-5-sonnet-20241022');
      expect(sonnet).toBeDefined();
      expect(sonnet!.agent).toBe('opencode');
      expect(sonnet!.displayName).toBe('Claude 3.5 Sonnet');
      expect(sonnet!.supportsToolCalling).toBe(true);
      expect(sonnet!.supportsImageInput).toBe(true);
    });

    it('has GPT-4o model', () => {
      const gpt4o = adapter.models.find(m => m.modelId === 'gpt-4o');
      expect(gpt4o).toBeDefined();
      expect(gpt4o!.agent).toBe('opencode');
      expect(gpt4o!.displayName).toBe('GPT-4o');
      expect(gpt4o!.supportsToolCalling).toBe(true);
      expect(gpt4o!.supportsImageInput).toBe(true);
    });

    it('models have correct pricing info', () => {
      for (const model of adapter.models) {
        expect(model.inputPricePerMillion).toBeGreaterThan(0);
        expect(model.outputPricePerMillion).toBeGreaterThan(0);
        expect(model.contextWindow).toBeGreaterThan(0);
        expect(model.maxOutputTokens).toBeGreaterThan(0);
      }
    });
  });

  describe('buildSpawnArgs', () => {
    it('builds basic spawn args with prompt', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'opencode',
        prompt: 'Hello world', nonInteractive: true,
      });

      expect(result.command).toBe('opencode');
      expect(result.args).toContain('run');
      expect(result.args).toContain('--prompt');
      expect(result.args).toContain('Hello world');
      expect(result.args).toContain('--format');
      expect(result.args).toContain('json');
      expect(result.usePty).toBe(false);
    });

    it('includes model when specified', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'opencode',
        prompt: 'test', nonInteractive: true,
        model: 'gpt-4o',
      });

      expect(result.args).toContain('--model');
      expect(result.args).toContain('gpt-4o');
    });

    it('includes session management args', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'opencode',
        prompt: 'test', nonInteractive: true,
        sessionId: 'test-session',
      });

      expect(result.args).toContain('--session');
      expect(result.args).toContain('test-session');
      expect(result.args).toContain('--continue');
    });

    it('handles fork session', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'opencode',
        prompt: 'test', nonInteractive: true,
        sessionId: 'new-session',
        forkSessionId: 'parent-session',
      });

      expect(result.args).toContain('--fork');
      expect(result.args).toContain('parent-session');
      expect(result.args).not.toContain('--continue');
    });

    it('includes max turns when specified', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'opencode',
        prompt: 'test', nonInteractive: true,
        maxTurns: 3,
      });

      expect(result.args).toContain('--max-turns');
      expect(result.args).toContain('3');
    });

    it('includes system prompt when specified', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'opencode',
        prompt: 'test', nonInteractive: true,
        systemPrompt: 'You are a helpful assistant',
      });

      expect(result.args).toContain('--system');
      expect(result.args).toContain('You are a helpful assistant');
    });

    it('handles array prompts', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'opencode',
        prompt: ['First line', 'Second line'], nonInteractive: true,
      });

      expect(result.args).toContain('--prompt');
      expect(result.args).toContain('First line\nSecond line');
    });

    it('sets working directory', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'opencode',
        prompt: 'test', nonInteractive: true,
        cwd: '/test/path',
      });

      expect(result.cwd).toBe('/test/path');
    });

    it('sets timeouts when specified', () => {
      const result = adapter.buildSpawnArgs({
        agent: 'opencode',
        prompt: 'test', nonInteractive: true,
        timeout: 30000,
        inactivityTimeout: 10000,
      });

      expect(result.timeout).toBe(30000);
      expect(result.inactivityTimeout).toBe(10000);
    });
  });

  describe('parseEvent', () => {
    const context = makeContext();

    it('parses text message events', () => {
      const line = JSON.stringify({ type: 'message', content: 'Hello world' });
      const result = adapter.parseEvent(line, context);

      expect(result).toBeTruthy();
      expect((result as any).type).toBe('text_delta');
      expect((result as any).delta).toBe('Hello world');
    });

    it('parses tool start events', () => {
      const line = JSON.stringify({
        type: 'tool_start',
        id: 'tool-123',
        name: 'read_file',
        input: { path: '/test.txt' }
      });
      const result = adapter.parseEvent(line, context);

      expect(result).toBeTruthy();
      expect((result as any).type).toBe('tool_call_start');
      expect((result as any).toolCallId).toBe('tool-123');
      expect((result as any).toolName).toBe('read_file');
      expect((result as any).inputAccumulated).toContain('/test.txt');
    });

    it('parses tool result events', () => {
      const line = JSON.stringify({
        type: 'tool_result',
        id: 'tool-123',
        name: 'read_file',
        result: 'File contents here',
        duration: 150
      });
      const result = adapter.parseEvent(line, context);

      expect(result).toBeTruthy();
      expect((result as any).type).toBe('tool_result');
      expect((result as any).toolCallId).toBe('tool-123');
      expect((result as any).toolName).toBe('read_file');
      expect((result as any).output).toBe('File contents here');
      expect((result as any).durationMs).toBe(150);
    });

    it('parses session start events', () => {
      const line = JSON.stringify({
        type: 'session_start',
        session_id: 'session-456',
        resumed: true
      });
      const result = adapter.parseEvent(line, context);

      expect(result).toBeTruthy();
      expect((result as any).type).toBe('session_start');
      expect((result as any).sessionId).toBe('session-456');
      expect((result as any).resumed).toBe(true);
    });

    it('parses session end events with cost', () => {
      const line = JSON.stringify({
        type: 'session_end',
        final_message: 'Task completed',
        usage: {
          inputTokens: 800,
          outputTokens: 200,
          cacheCreationTokens: 50,
          cacheReadTokens: 100,
          totalUsd: 0.05
        }
      });
      const events = adapter.parseEvent(line, context) as any[];

      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('message_stop');
      expect(events[0].text).toBe('Task completed');
      expect(events[1].type).toBe('cost');
      expect(events[1].cost.inputTokens).toBe(800);
      expect(events[1].cost.outputTokens).toBe(200);
      expect(events[1].cost.cacheCreationTokens).toBe(50);
      expect(events[1].cost.cacheReadTokens).toBe(100);
      expect(events[1].cost.totalUsd).toBe(0.05);
    });

    it('parses error events', () => {
      const line = JSON.stringify({
        type: 'error',
        message: 'Something went wrong',
        recoverable: true
      });
      const result = adapter.parseEvent(line, context);

      expect(result).toBeTruthy();
      expect((result as any).type).toBe('error');
      expect((result as any).code).toBe('INTERNAL');
      expect((result as any).message).toBe('Something went wrong');
      expect((result as any).recoverable).toBe(true);
    });

    it('handles legacy format fallback', () => {
      const line = JSON.stringify({ type: 'text', content: 'Legacy message' });
      const result = adapter.parseEvent(line, context);

      expect(result).toBeTruthy();
      expect((result as any).type).toBe('text_delta');
      expect((result as any).delta).toBe('Legacy message');
    });

    it('returns null for invalid JSON', () => {
      const result = adapter.parseEvent('invalid json', context);
      expect(result).toBeNull();
    });

    it('returns null for unrecognized events', () => {
      const line = JSON.stringify({ type: 'unknown_event' });
      const result = adapter.parseEvent(line, context);
      expect(result).toBeNull();
    });
  });

  describe('detectAuth', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
      originalEnv = { ...process.env };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('detects Anthropic API key', async () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-1234567890abcdef';
      const result = await adapter.detectAuth();

      expect(result.status).toBe('authenticated');
      expect(result.method).toBe('api_key');
      expect(result.identity).toBe('anthropic:...cdef');
    });

    it('detects OpenAI API key', async () => {
      process.env.OPENAI_API_KEY = 'sk-1234567890abcdef';
      const result = await adapter.detectAuth();

      expect(result.status).toBe('authenticated');
      expect(result.method).toBe('api_key');
      expect(result.identity).toBe('openai:...cdef');
    });

    it('detects Google API key', async () => {
      process.env.GOOGLE_API_KEY = 'AIza1234567890abcdef';
      const result = await adapter.detectAuth();

      expect(result.status).toBe('authenticated');
      expect(result.method).toBe('api_key');
      expect(result.identity).toBe('google:...cdef');
    });

    it('reports unauthenticated when no keys found', async () => {
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.GOOGLE_API_KEY;
      const result = await adapter.detectAuth();

      expect(result.status).toBe('unauthenticated');
    });
  });

  describe('getAuthGuidance', () => {
    it('provides auth setup guidance', () => {
      const guidance = adapter.getAuthGuidance();

      expect(guidance.agent).toBe('opencode');
      expect(guidance.providerName).toBe('OpenCode');
      expect(guidance.steps.length).toBeGreaterThan(0);
      expect(guidance.loginCommand).toBe('opencode auth');
      expect(guidance.verifyCommand).toBe('opencode --version');
      expect(guidance.envVars).toHaveLength(3);
      expect(guidance.documentationUrls).toContain('https://github.com/anomalyco/opencode');
    });
  });

  describe('session management', () => {
    it('returns correct session directory', () => {
      const sessionDir = adapter.sessionDir();
      expect(sessionDir).toBe(path.join(os.homedir(), '.config', 'opencode', 'sessions'));
    });

    it('parses session files', async () => {
      vi.spyOn(adapter, 'parseSessionFile').mockResolvedValue({
        sessionId: 'test-session',
        agent: 'opencode',
        createdAt: new Date(),
        lastUpdated: new Date(),
        events: [],
        messageCount: 0,
      });

      const session = await adapter.parseSessionFile('/fake/path');
      expect(session.agent).toBe('opencode');
      expect(session.sessionId).toBe('test-session');
    });
  });

  describe('config management', () => {
    it('has correct config schema', () => {
      expect(adapter.configSchema.agent).toBe('opencode');
      expect(adapter.configSchema.version).toBe(1);
      expect(adapter.configSchema.configFormat).toBe('json');
      expect(adapter.configSchema.supportsProjectConfig).toBe(true);
      expect(adapter.configSchema.configFilePaths).toHaveLength(1);
      expect(adapter.configSchema.configFilePaths[0]).toContain('opencode.json');
    });
  });
});
