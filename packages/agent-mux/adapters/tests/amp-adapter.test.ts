import { describe, it, expect, beforeEach } from 'vitest';
import { AmpAdapter } from '../src/amp-adapter.js';
import type { RunOptions } from '@a5c-ai/agent-mux-core';

describe('AmpAdapter', () => {
  let adapter: AmpAdapter;

  beforeEach(() => {
    adapter = new AmpAdapter();
  });

  describe('constructor', () => {
    it('initializes with correct agent identifier', () => {
      expect(adapter.agent).toBe('amp');
      expect(adapter.displayName).toBe('Sourcegraph Amp');
      expect(adapter.cliCommand).toBe('amp');
      expect(adapter.minVersion).toBe('2.0.0');
    });

    it('has correct host environment signals', () => {
      expect(adapter.hostEnvSignals).toEqual(['SOURCEGRAPH_ACCESS_TOKEN', 'AMP_CONFIG_PATH']);
    });
  });

  describe('capabilities', () => {
    it('declares comprehensive capabilities', () => {
      const caps = adapter.capabilities;
      expect(caps.agent).toBe('amp');
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
      expect(caps.maxParallelTasks).toBe(8);
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
      expect(caps.authMethods[1].type).toBe('browser_login');
    });

    it('defines installation methods', () => {
      const caps = adapter.capabilities;
      expect(caps.installMethods).toHaveLength(3);
      expect(caps.installMethods[0].type).toBe('npm');
      expect(caps.installMethods[0].command).toBe('npm install -g @sourcegraph/amp-cli');
    });
  });

  describe('models', () => {
    it('includes Amp Oracle as default model', () => {
      const models = adapter.models;
      const oracle = models.find(m => m.modelId === 'amp-oracle');
      expect(oracle).toBeDefined();
      expect(oracle?.displayName).toBe('Amp Oracle (Multi-Model)');
      expect(oracle?.modelAlias).toBe('oracle');
      expect(oracle?.contextWindow).toBe(200000);
      expect(oracle?.maxOutputTokens).toBe(8192);
      expect(adapter.defaultModelId).toBe('amp-oracle');
    });

    it('includes Claude 3.5 Sonnet model', () => {
      const models = adapter.models;
      const claude = models.find(m => m.modelId === 'claude-3-5-sonnet-20241022');
      expect(claude).toBeDefined();
      expect(claude?.displayName).toBe('Claude 3.5 Sonnet');
      expect(claude?.modelAlias).toBe('claude-sonnet');
    });

    it('includes GPT-4o model', () => {
      const models = adapter.models;
      const gpt4o = models.find(m => m.modelId === 'gpt-4o');
      expect(gpt4o).toBeDefined();
      expect(gpt4o?.displayName).toBe('GPT-4o');
      expect(gpt4o?.contextWindow).toBe(128000);
    });

    it('includes Gemini 1.5 Pro model', () => {
      const models = adapter.models;
      const gemini = models.find(m => m.modelId === 'gemini-1.5-pro');
      expect(gemini).toBeDefined();
      expect(gemini?.displayName).toBe('Gemini 1.5 Pro');
      expect(gemini?.contextWindow).toBe(2000000);
    });
  });

  describe('buildSpawnArgs', () => {
    it('builds a headless chat command by default (amp does not support stdin injection)', () => {
      const options: RunOptions = {
        agent: 'amp',
        prompt: 'Hello, world!',
      };

      const spawnArgs = adapter.buildSpawnArgs(options);
      expect(spawnArgs.command).toBe('amp');
      expect(spawnArgs.args).toContain('chat');
      expect(spawnArgs.args).toContain('--output');
      expect(spawnArgs.args).toContain('jsonl');
      expect(spawnArgs.args).toContain('--stream');
      expect(spawnArgs.args).toContain('--headless');
      expect(spawnArgs.args).toContain('--prompt');
      expect(spawnArgs.args).toContain('Hello, world!');
      expect(spawnArgs.stdin).toBeUndefined();
    });

    it('also uses headless --prompt mode when explicitly non-interactive', () => {
      const spawnArgs = adapter.buildSpawnArgs({
        agent: 'amp',
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
        agent: 'amp',
        sessionId: 'test-session-456',
        prompt: 'Continue conversation',
      };

      const spawnArgs = adapter.buildSpawnArgs(options);
      expect(spawnArgs.args).toContain('resume');
      expect(spawnArgs.args).toContain('test-session-456');
    });

    it('includes model selection', () => {
      const options: RunOptions = {
        agent: 'amp',
        prompt: 'Test',
        model: 'oracle',
      };

      const spawnArgs = adapter.buildSpawnArgs(options);
      expect(spawnArgs.args).toContain('--model');
      expect(spawnArgs.args).toContain('oracle');
    });

    it('includes system prompt', () => {
      const options: RunOptions = {
        agent: 'amp',
        prompt: 'Test',
        systemPrompt: 'You are a helpful assistant',
      };

      const spawnArgs = adapter.buildSpawnArgs(options);
      expect(spawnArgs.args).toContain('--system');
      expect(spawnArgs.args).toContain('You are a helpful assistant');
    });

    it('includes auto-approve for yolo mode', () => {
      const options: RunOptions = {
        agent: 'amp',
        prompt: 'Test',
        approvalMode: 'yolo',
      };

      const spawnArgs = adapter.buildSpawnArgs(options);
      expect(spawnArgs.args).toContain('--auto-approve');
    });

    it('includes max turns', () => {
      const options: RunOptions = {
        agent: 'amp',
        prompt: 'Test',
        maxTurns: 10,
      };

      const spawnArgs = adapter.buildSpawnArgs(options);
      expect(spawnArgs.args).toContain('--max-turns');
      expect(spawnArgs.args).toContain('10');
    });

    it('includes working directory', () => {
      const options: RunOptions = {
        agent: 'amp',
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
        agent: 'amp',
        prompt: 'Test',
        env: { SOURCEGRAPH_ACCESS_TOKEN: 'test-token' },
      };

      const spawnArgs = adapter.buildSpawnArgs(options);
      expect(spawnArgs.env).toMatchObject({ SOURCEGRAPH_ACCESS_TOKEN: 'test-token' });
    });
  });

  describe('parseEvent', () => {
    const mockContext = { runId: 'test-run-789' };

    it('parses session_start event', () => {
      const line = JSON.stringify({
        type: 'session_start',
        sessionId: 'session-789',
      });

      const event = adapter.parseEvent(line, mockContext);
      expect(event).toMatchObject({
        type: 'session_start',
        agent: 'amp',
        runId: 'test-run-789',
        sessionId: 'session-789',
        resumed: false,
      });
    });

    it('parses text_delta event', () => {
      const line = JSON.stringify({
        type: 'text_delta',
        content: 'Hello from Amp',
        accumulated: 'Hello from Amp',
      });

      const event = adapter.parseEvent(line, mockContext);
      expect(event).toMatchObject({
        type: 'text_delta',
        agent: 'amp',
        runId: 'test-run-789',
        delta: 'Hello from Amp',
        accumulated: 'Hello from Amp',
      });
    });

    it('parses tool_call_start event', () => {
      const line = JSON.stringify({
        type: 'tool_call_start',
        id: 'tool-789',
        tool: 'code_search',
      });

      const event = adapter.parseEvent(line, mockContext);
      expect(event).toMatchObject({
        type: 'tool_call_start',
        agent: 'amp',
        runId: 'test-run-789',
        toolCallId: 'tool-789',
        toolName: 'code_search',
      });
    });

    it('parses tool_result event', () => {
      const line = JSON.stringify({
        type: 'tool_result',
        id: 'tool-789',
        tool: 'code_search',
        result: 'Found 5 matches',
        duration: 250,
      });

      const event = adapter.parseEvent(line, mockContext);
      expect(event).toMatchObject({
        type: 'tool_result',
        agent: 'amp',
        runId: 'test-run-789',
        toolCallId: 'tool-789',
        toolName: 'code_search',
        output: 'Found 5 matches',
        durationMs: 250,
      });
    });

    it('returns null for subagent_start event (not yet mapped)', () => {
      const line = JSON.stringify({
        type: 'subagent_start',
        id: 'subagent-123',
        subagent_type: 'oracle',
        task: 'Multi-model routing for complex query',
      });

      const event = adapter.parseEvent(line, mockContext);
      expect(event).toBeNull();
    });

    it('returns null for subagent_result event (not yet mapped)', () => {
      const line = JSON.stringify({
        type: 'subagent_result',
        id: 'subagent-123',
        subagent_type: 'librarian',
        result: 'Code analysis complete',
        duration: 800,
      });

      const event = adapter.parseEvent(line, mockContext);
      expect(event).toBeNull();
    });

    it('parses cost event', () => {
      const line = JSON.stringify({
        type: 'cost',
        totalUsd: 0.075,
        inputTokens: 1500,
        outputTokens: 800,
        thinkingTokens: 200,
      });

      const event = adapter.parseEvent(line, mockContext);
      expect(event).toMatchObject({
        type: 'cost',
        agent: 'amp',
        runId: 'test-run-789',
        cost: {
          totalUsd: 0.075,
          inputTokens: 1500,
          outputTokens: 800,
          thinkingTokens: 200,
        },
      });
    });

    it('parses error event', () => {
      const line = JSON.stringify({
        type: 'error',
        code: 'SOURCEGRAPH_AUTH_FAILED',
        message: 'Invalid access token',
        recoverable: true,
        fatal: false,
      });

      const event = adapter.parseEvent(line, mockContext);
      expect(event).toMatchObject({
        type: 'error',
        agent: 'amp',
        runId: 'test-run-789',
        code: 'SOURCEGRAPH_AUTH_FAILED',
        message: 'Invalid access token',
        recoverable: true,
      });
    });

    it('parses session_end event', () => {
      const line = JSON.stringify({
        type: 'session_end',
        sessionId: 'session-789',
        reason: 'completed',
        turnCount: 5,
      });

      const event = adapter.parseEvent(line, mockContext);
      expect(event).toMatchObject({
        type: 'session_end',
        agent: 'amp',
        runId: 'test-run-789',
        sessionId: 'session-789',
        turnCount: 5,
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
      expect(sessionDir).toMatch(/\.config[/\\]amp[/\\]sessions/);
    });
  });

  describe('authentication guidance', () => {
    it('provides setup guidance', () => {
      const guidance = adapter.getAuthGuidance();
      expect(guidance.providerName).toBe('Sourcegraph Amp');
      expect(guidance.steps).toHaveLength(4);
      expect(guidance.steps[0].description).toContain('Sourcegraph account');
      expect(guidance.loginCommand).toBe('amp auth login');
      expect(guidance.verifyCommand).toBe('amp --version');
    });
  });

  describe('configuration schema', () => {
    it('defines configuration schema', () => {
      const schema = adapter.configSchema;
      expect(schema.agent).toBe('amp');
      expect(schema.version).toBe(1);
      expect(schema.configFormat).toBe('json');
      expect(schema.supportsProjectConfig).toBe(false);
    });
  });
});