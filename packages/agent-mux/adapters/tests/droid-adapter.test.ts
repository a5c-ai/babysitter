import { describe, it, expect, beforeEach } from 'vitest';
import { DroidAdapter } from '../src/droid-adapter.js';
import type { RunOptions } from '@a5c-ai/agent-mux-comm';

describe('DroidAdapter', () => {
  let adapter: DroidAdapter;

  beforeEach(() => {
    adapter = new DroidAdapter();
  });

  describe('constructor', () => {
    it('initializes with correct agent identifier', () => {
      expect(adapter.agent).toBe('droid');
      expect(adapter.displayName).toBe('Factory Droid');
      expect(adapter.cliCommand).toBe('droid');
      expect(adapter.minVersion).toBe('1.0.0');
    });

    it('has correct host environment signals', () => {
      expect(adapter.hostEnvSignals).toEqual(['DROID_API_KEY', 'DROID_CONFIG_PATH']);
    });
  });

  describe('capabilities', () => {
    it('declares comprehensive capabilities', () => {
      const caps = adapter.capabilities;
      expect(caps.agent).toBe('droid');
      expect(caps.canResume).toBe(true);
      expect(caps.canFork).toBe(true);
      expect(caps.supportsMultiTurn).toBe(true);
      expect(caps.sessionPersistence).toBe('file');
      expect(caps.supportsTextStreaming).toBe(true);
      expect(caps.supportsToolCallStreaming).toBe(true);
      expect(caps.supportsNativeTools).toBe(true);
      expect(caps.supportsMCP).toBe(true);
      expect(caps.supportsSubagentDispatch).toBe(true);
      expect(caps.supportsParallelExecution).toBe(true);
      expect(caps.maxParallelTasks).toBe(10);
      expect(caps.requiresToolApproval).toBe(true);
      expect(caps.approvalModes).toEqual(['yolo', 'prompt']);
    });

    it('has correct platform support', () => {
      const caps = adapter.capabilities;
      expect(caps.supportedPlatforms).toEqual(['darwin', 'linux', 'win32']);
      expect(caps.requiresGitRepo).toBe(false);
      expect(caps.requiresPty).toBe(false);
    });

    it('defines authentication methods', () => {
      const caps = adapter.capabilities;
      expect(caps.authMethods).toHaveLength(2);
      expect(caps.authMethods[0].type).toBe('api_key');
      expect(caps.authMethods[1].type).toBe('oauth');
    });

    it('defines installation methods', () => {
      const caps = adapter.capabilities;
      expect(caps.installMethods).toHaveLength(3);
      expect(caps.installMethods[0].type).toBe('npm');
      expect(caps.installMethods[0].command).toBe('npm install -g @factory/cli');
    });
  });

  describe('models', () => {
    it('includes GPT-5 Turbo as default model', () => {
      const models = adapter.models;
      const gpt5 = models.find(m => m.modelId === 'gpt-5-turbo');
      expect(gpt5).toBeDefined();
      expect(gpt5?.displayName).toBe('GPT-5 Turbo');
      expect(gpt5?.contextWindow).toBe(256000);
      expect(gpt5?.maxOutputTokens).toBe(16384);
      expect(adapter.defaultModelId).toBe('gpt-5-turbo');
    });

    it('includes Claude 3.5 Sonnet model', () => {
      const models = adapter.models;
      const claude = models.find(m => m.modelId === 'claude-3-5-sonnet-20241022');
      expect(claude).toBeDefined();
      expect(claude?.displayName).toBe('Claude 3.5 Sonnet');
      expect(claude?.modelAlias).toBe('claude-sonnet');
    });

    it('includes Gemini 2.0 Flash model', () => {
      const models = adapter.models;
      const gemini = models.find(m => m.modelId === 'gemini-2-flash');
      expect(gemini).toBeDefined();
      expect(gemini?.displayName).toBe('Gemini 2.0 Flash');
      expect(gemini?.contextWindow).toBe(1000000);
    });
  });

  describe('buildSpawnArgs', () => {
    it('builds an interactive chat command by default', () => {
      const options: RunOptions = {
        agent: 'droid',
        prompt: 'Hello, world!',
      };

      const spawnArgs = adapter.buildSpawnArgs(options);
      expect(spawnArgs.command).toBe('droid');
      expect(spawnArgs.args).toContain('chat');
      expect(spawnArgs.args).toContain('--output');
      expect(spawnArgs.args).toContain('jsonl');
      expect(spawnArgs.args).toContain('--stream');
      expect(spawnArgs.args).not.toContain('--headless');
      expect(spawnArgs.args).not.toContain('--prompt');
      expect(spawnArgs.stdin).toBe('Hello, world!\n');
    });

    it('uses headless --prompt mode only when explicitly non-interactive', () => {
      const spawnArgs = adapter.buildSpawnArgs({
        agent: 'droid',
        prompt: 'Hello, world!',
        nonInteractive: true,
      });

      expect(spawnArgs.args).toContain('--headless');
      expect(spawnArgs.args).toContain('--prompt');
      expect(spawnArgs.args).toContain('Hello, world!');
      expect(spawnArgs.stdin).toBeUndefined();
    });

    it('builds resume command with session ID', () => {
      const options: RunOptions = {
        agent: 'droid',
        sessionId: 'test-session-123',
        prompt: 'Continue conversation',
      };

      const spawnArgs = adapter.buildSpawnArgs(options);
      expect(spawnArgs.args).toContain('resume');
      expect(spawnArgs.args).toContain('test-session-123');
    });

    it('includes model selection', () => {
      const options: RunOptions = {
        agent: 'droid',
        prompt: 'Test',
        model: 'claude-sonnet',
      };

      const spawnArgs = adapter.buildSpawnArgs(options);
      expect(spawnArgs.args).toContain('--model');
      expect(spawnArgs.args).toContain('claude-sonnet');
    });

    it('includes system prompt', () => {
      const options: RunOptions = {
        agent: 'droid',
        prompt: 'Test',
        systemPrompt: 'You are a helpful assistant',
      };

      const spawnArgs = adapter.buildSpawnArgs(options);
      expect(spawnArgs.args).toContain('--system');
      expect(spawnArgs.args).toContain('You are a helpful assistant');
    });

    it('includes auto-approve for yolo mode', () => {
      const options: RunOptions = {
        agent: 'droid',
        prompt: 'Test',
        approvalMode: 'yolo',
      };

      const spawnArgs = adapter.buildSpawnArgs(options);
      expect(spawnArgs.args).toContain('--auto-approve');
    });

    it('includes max turns', () => {
      const options: RunOptions = {
        agent: 'droid',
        prompt: 'Test',
        maxTurns: 5,
      };

      const spawnArgs = adapter.buildSpawnArgs(options);
      expect(spawnArgs.args).toContain('--max-turns');
      expect(spawnArgs.args).toContain('5');
    });

    it('includes working directory', () => {
      const options: RunOptions = {
        agent: 'droid',
        prompt: 'Test',
        cwd: '/path/to/project',
      };

      const spawnArgs = adapter.buildSpawnArgs(options);
      expect(spawnArgs.args).toContain('--cwd');
      expect(spawnArgs.args).toContain('/path/to/project');
      expect(spawnArgs.cwd).toBe('/path/to/project');
    });

    it('includes environment variables', () => {
      const options: RunOptions = {
        agent: 'droid',
        prompt: 'Test',
        env: { CUSTOM_VAR: 'value' },
      };

      const spawnArgs = adapter.buildSpawnArgs(options);
      expect(spawnArgs.env).toMatchObject({ CUSTOM_VAR: 'value' });
    });
  });

  describe('parseEvent', () => {
    const mockContext = { runId: 'test-run-123' };

    it('parses session_start event', () => {
      const line = JSON.stringify({
        type: 'session_start',
        sessionId: 'session-456',
      });

      const event = adapter.parseEvent(line, mockContext);
      expect(event).toMatchObject({
        type: 'session_start',
        agent: 'droid',
        runId: 'test-run-123',
        sessionId: 'session-456',
        resumed: false,
      });
    });

    it('parses text_delta event', () => {
      const line = JSON.stringify({
        type: 'text_delta',
        content: 'Hello',
        accumulated: 'Hello',
      });

      const event = adapter.parseEvent(line, mockContext);
      expect(event).toMatchObject({
        type: 'text_delta',
        agent: 'droid',
        runId: 'test-run-123',
        delta: 'Hello',
        accumulated: 'Hello',
      });
    });

    it('parses tool_call_start event', () => {
      const line = JSON.stringify({
        type: 'tool_call_start',
        id: 'tool-123',
        tool: 'file_read',
      });

      const event = adapter.parseEvent(line, mockContext);
      expect(event).toMatchObject({
        type: 'tool_call_start',
        agent: 'droid',
        runId: 'test-run-123',
        toolCallId: 'tool-123',
        toolName: 'file_read',
      });
    });

    it('parses tool_result event', () => {
      const line = JSON.stringify({
        type: 'tool_result',
        id: 'tool-123',
        tool: 'file_read',
        result: 'File contents here',
        duration: 150,
      });

      const event = adapter.parseEvent(line, mockContext);
      expect(event).toMatchObject({
        type: 'tool_result',
        agent: 'droid',
        runId: 'test-run-123',
        toolCallId: 'tool-123',
        toolName: 'file_read',
        output: 'File contents here',
        durationMs: 150,
      });
    });

    it('parses cost event', () => {
      const line = JSON.stringify({
        type: 'cost',
        totalUsd: 0.042,
        inputTokens: 1000,
        outputTokens: 500,
      });

      const event = adapter.parseEvent(line, mockContext);
      expect(event).toMatchObject({
        type: 'cost',
        agent: 'droid',
        runId: 'test-run-123',
        cost: {
          totalUsd: 0.042,
          inputTokens: 1000,
          outputTokens: 500,
          thinkingTokens: 0,
        },
      });
    });

    it('parses error event', () => {
      const line = JSON.stringify({
        type: 'error',
        code: 'AUTH_FAILED',
        message: 'Authentication required',
        recoverable: true,
        fatal: false,
      });

      const event = adapter.parseEvent(line, mockContext);
      expect(event).toMatchObject({
        type: 'error',
        agent: 'droid',
        runId: 'test-run-123',
        code: 'AUTH_FAILED',
        message: 'Authentication required',
        recoverable: true,
      });
    });

    it('returns null for empty lines', () => {
      expect(adapter.parseEvent('', mockContext)).toBeNull();
      expect(adapter.parseEvent('   ', mockContext)).toBeNull();
    });

    it('returns null for invalid JSON', () => {
      expect(adapter.parseEvent('not json', mockContext)).toBeNull();
      expect(adapter.parseEvent('{ invalid }', mockContext)).toBeNull();
    });

    it('returns null for unknown event types', () => {
      const line = JSON.stringify({
        type: 'unknown_event',
        data: 'something',
      });

      expect(adapter.parseEvent(line, mockContext)).toBeNull();
    });
  });

  describe('session management', () => {
    it('provides correct session directory', () => {
      const sessionDir = adapter.sessionDir();
      expect(sessionDir).toMatch(/\.config[/\\]droid[/\\]sessions/);
    });
  });

  describe('authentication guidance', () => {
    it('provides setup guidance', () => {
      const guidance = adapter.getAuthGuidance();
      expect(guidance.providerName).toBe('Factory AI Droid');
      expect(guidance.steps).toHaveLength(4);
      expect(guidance.steps[0].description).toContain('Factory AI account');
      expect(guidance.loginCommand).toBe('droid auth login');
      expect(guidance.verifyCommand).toBe('droid --version');
    });
  });

  describe('configuration schema', () => {
    it('defines configuration schema', () => {
      const schema = adapter.configSchema;
      expect(schema.agent).toBe('droid');
      expect(schema.version).toBe(1);
      expect(schema.configFormat).toBe('json');
      expect(schema.supportsProjectConfig).toBe(true);
    });
  });
});
