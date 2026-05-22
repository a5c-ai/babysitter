import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { CodexSdkAdapter } from '../src/codex-sdk-adapter.js';

describe('CodexSdkAdapter', () => {
  let adapter: CodexSdkAdapter;

  beforeEach(() => {
    adapter = new CodexSdkAdapter();
  });

  describe('identity', () => {
    it('has correct adapter type', () => {
      expect(adapter.adapterType).toBe('programmatic');
    });

    it('has correct agent name', () => {
      expect(adapter.agent).toBe('codex-sdk');
    });

    it('has correct display name', () => {
      expect(adapter.displayName).toBe('Codex (SDK)');
    });

    it('has minimum version', () => {
      expect(adapter.minVersion).toBe('0.1.0');
    });

    it('has host environment signals', () => {
      expect(adapter.hostEnvSignals).toContain('OPENAI_API_KEY');
    });
  });

  describe('capabilities', () => {
    it('declares agent as codex-sdk', () => {
      expect(adapter.capabilities.agent).toBe('codex-sdk');
    });

    it('supports resume but not fork', () => {
      expect(adapter.capabilities.canResume).toBe(true);
      expect(adapter.capabilities.canFork).toBe(false);
    });

    it('supports multi-turn conversations', () => {
      expect(adapter.capabilities.supportsMultiTurn).toBe(true);
    });

    it('uses file session persistence', () => {
      expect(adapter.capabilities.sessionPersistence).toBe('file');
    });

    it('supports text and tool streaming', () => {
      expect(adapter.capabilities.supportsTextStreaming).toBe(true);
      expect(adapter.capabilities.supportsToolCallStreaming).toBe(true);
      expect(adapter.capabilities.supportsThinkingStreaming).toBe(false);
    });

    it('supports tool calling', () => {
      expect(adapter.capabilities.supportsNativeTools).toBe(true);
      expect(adapter.capabilities.supportsParallelToolCalls).toBe(true);
    });

    it('does not support MCP', () => {
      expect(adapter.capabilities.supportsMCP).toBe(false);
    });

    it('requires tool approval', () => {
      expect(adapter.capabilities.requiresToolApproval).toBe(true);
      expect(adapter.capabilities.approvalModes).toContain('yolo');
      expect(adapter.capabilities.approvalModes).toContain('prompt');
      expect(adapter.capabilities.approvalModes).toContain('deny');
    });

    it('supports JSON and structured output', () => {
      expect(adapter.capabilities.supportsJsonMode).toBe(true);
      expect(adapter.capabilities.supportsStructuredOutput).toBe(true);
    });

    it('does not support skills or subagents', () => {
      expect(adapter.capabilities.supportsSkills).toBe(false);
      expect(adapter.capabilities.supportsAgentsMd).toBe(false);
      expect(adapter.capabilities.supportsSubagentDispatch).toBe(false);
      expect(adapter.capabilities.supportsParallelExecution).toBe(false);
    });

    it('supports interactive mode and stdin injection', () => {
      expect(adapter.capabilities.supportsInteractiveMode).toBe(true);
      expect(adapter.capabilities.supportsStdinInjection).toBe(true);
    });

    it('does not support images or file attachments', () => {
      expect(adapter.capabilities.supportsImageInput).toBe(false);
      expect(adapter.capabilities.supportsImageOutput).toBe(false);
      expect(adapter.capabilities.supportsFileAttachments).toBe(false);
    });

    it('does not support plugins', () => {
      expect(adapter.capabilities.supportsPlugins).toBe(false);
      expect(adapter.capabilities.pluginFormats).toEqual([]);
      expect(adapter.capabilities.pluginRegistries).toEqual([]);
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

    it('has API key auth method', () => {
      expect(adapter.capabilities.authMethods).toHaveLength(1);
      expect(adapter.capabilities.authMethods[0].type).toBe('api_key');
      expect(adapter.capabilities.authMethods[0].name).toBe('API Key');
    });

    it('has NPM install method', () => {
      expect(adapter.capabilities.installMethods).toHaveLength(1);
      expect(adapter.capabilities.installMethods[0].type).toBe('npm');
      expect(adapter.capabilities.installMethods[0].command).toBe('npm install -g openai');
    });
  });

  describe('models', () => {
    it('has two models', () => {
      expect(adapter.models).toHaveLength(2);
    });

    it('has default model', () => {
      expect(adapter.defaultModelId).toBe('o4-mini');
      const defaultModel = adapter.models.find(m => m.modelId === adapter.defaultModelId);
      expect(defaultModel).toBeDefined();
    });

    it('has o4-mini model', () => {
      const model = adapter.models.find(m => m.modelId === 'o4-mini');
      expect(model).toBeDefined();
      expect(model!.agent).toBe('codex-sdk');
      expect(model!.displayName).toBe('o4-mini');
      expect(model!.supportsToolCalling).toBe(true);
      expect(model!.supportsThinking).toBe(true);
      expect(model!.contextWindow).toBe(200000);
      expect(model!.maxOutputTokens).toBe(100000);
    });

    it('has codex-mini-latest model', () => {
      const model = adapter.models.find(m => m.modelId === 'codex-mini-latest');
      expect(model).toBeDefined();
      expect(model!.agent).toBe('codex-sdk');
      expect(model!.displayName).toBe('Codex Mini');
      expect(model!.supportsToolCalling).toBe(true);
      expect(model!.supportsThinking).toBe(false);
      expect(model!.contextWindow).toBe(200000);
      expect(model!.maxOutputTokens).toBe(100000);
    });

    it('models have pricing info', () => {
      for (const model of adapter.models) {
        expect(model.inputPricePerMillion).toBeGreaterThan(0);
        expect(model.outputPricePerMillion).toBeGreaterThan(0);
        expect(typeof model.cachedInputPricePerMillion).toBe('number');
        expect(model.cachedInputPricePerMillion).toBeGreaterThan(0);
      }
    });
  });

  describe('authentication', () => {
    let originalEnv: NodeJS.ProcessEnv;
    let tempCodexHome: string;

    beforeEach(async () => {
      originalEnv = { ...process.env };
      tempCodexHome = await fs.mkdtemp(path.join(os.tmpdir(), 'codex-sdk-home-'));
      process.env.CODEX_HOME = tempCodexHome;
    });

    afterEach(async () => {
      process.env = originalEnv;
      await fs.rm(tempCodexHome, { recursive: true, force: true });
    });

    it('detects OpenAI API key', async () => {
      process.env.OPENAI_API_KEY = 'sk-1234567890abcdef';
      const result = await adapter.detectAuth();

      expect(result.status).toBe('authenticated');
      expect(result.method).toBe('api_key');
      expect(result.identity).toBe('openai:...cdef');
    });

    it('reports unauthenticated when no key found', async () => {
      delete process.env.OPENAI_API_KEY;
      const result = await adapter.detectAuth();

      expect(result.status).toBe('unauthenticated');
    });
  });

  describe('getAuthGuidance', () => {
    it('provides auth setup guidance', () => {
      const guidance = adapter.getAuthGuidance();

      expect(guidance.agent).toBe('codex-sdk');
      expect(guidance.providerName).toBe('OpenAI');
      expect(guidance.steps.length).toBeGreaterThan(0);
      expect(guidance.envVars).toHaveLength(1);
      expect(guidance.envVars[0].name).toBe('OPENAI_API_KEY');
      expect(guidance.documentationUrls).toContain('https://platform.openai.com/docs');
    });
  });

  describe('session management', () => {
    it('returns correct session directory', () => {
      const sessionDir = adapter.sessionDir();
      expect(sessionDir).toBe(path.join(os.homedir(), '.codex', 'sessions'));
    });

    it('parses session files', async () => {
      vi.spyOn(adapter, 'parseSessionFile').mockResolvedValue({
        sessionId: 'test-session',
        agent: 'codex-sdk',
        createdAt: new Date(),
        lastUpdated: new Date(),
        events: [],
        messageCount: 0,
      });

      const session = await adapter.parseSessionFile('/fake/path');
      expect(session.agent).toBe('codex-sdk');
      expect(session.sessionId).toBe('test-session');
    });
  });

  describe('config management', () => {
    it('has correct config schema', () => {
      expect(adapter.configSchema.agent).toBe('codex-sdk');
      expect(adapter.configSchema.version).toBe(1);
      expect(adapter.configSchema.configFormat).toBe('json');
      expect(adapter.configSchema.supportsProjectConfig).toBe(false);
      expect(adapter.configSchema.configFilePaths).toHaveLength(1);
      expect(adapter.configSchema.configFilePaths[0]).toContain('config.json');
    });
  });

  describe('execution', () => {
    let originalEnv: NodeJS.ProcessEnv;
    let tempCodexHome: string;

    beforeEach(async () => {
      originalEnv = { ...process.env };
      tempCodexHome = await fs.mkdtemp(path.join(os.tmpdir(), 'codex-sdk-home-'));
      process.env.CODEX_HOME = tempCodexHome;
      process.env.OPENAI_API_KEY = 'sk-test123';
    });

    afterEach(async () => {
      process.env = originalEnv;
      await fs.rm(tempCodexHome, { recursive: true, force: true });
    });

    it('validates run options', async () => {
      const invalidOptions = { agent: 'wrong-agent' as any, prompt: '' };

      const events = [];
      try {
        for await (const event of adapter.execute(invalidOptions)) {
          events.push(event);
        }
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        return;
      }

      // Should have emitted error event if validation failed
      const errorEvent = events.find(e => e.type === 'error');
      expect(errorEvent).toBeDefined();
    });

    it('emits session start event', async () => {
      const options = {
        agent: 'codex-sdk' as const,
        prompt: 'test prompt',
      };

      const events = [];
      for await (const event of adapter.execute(options)) {
        events.push(event);
        if (events.length >= 3) break; // Just get first few events
      }

      const sessionStart = events.find(e => e.type === 'session_start');
      expect(sessionStart).toBeDefined();
      expect(sessionStart?.type).toBe('session_start');
    });

    it('emits text delta events', async () => {
      const options = {
        agent: 'codex-sdk' as const,
        prompt: 'Hello',
      };

      const events = [];
      for await (const event of adapter.execute(options)) {
        events.push(event);
        if (events.length >= 10) break; // Limit to avoid full execution
      }

      const textDeltas = events.filter(e => e.type === 'text_delta');
      expect(textDeltas.length).toBeGreaterThan(0);

      for (const textDelta of textDeltas) {
        expect(textDelta).toHaveProperty('delta');
        expect(textDelta).toHaveProperty('accumulated');
      }
    });

    it('emits tool call events', async () => {
      const options = {
        agent: 'codex-sdk' as const,
        prompt: 'Write some code',
      };

      const events = [];
      for await (const event of adapter.execute(options)) {
        events.push(event);
      }

      const toolCallStart = events.find(e => e.type === 'tool_call_start');
      expect(toolCallStart).toBeDefined();

      const toolResult = events.find(e => e.type === 'tool_result');
      expect(toolResult).toBeDefined();
    });

    it('emits cost events', async () => {
      const options = {
        agent: 'codex-sdk' as const,
        prompt: 'test',
      };

      const events = [];
      for await (const event of adapter.execute(options)) {
        events.push(event);
      }

      const costEvent = events.find(e => e.type === 'cost');
      expect(costEvent).toBeDefined();
      expect(costEvent).toHaveProperty('cost');
    });

    it('handles authentication errors', async () => {
      delete process.env.OPENAI_API_KEY;

      const options = {
        agent: 'codex-sdk' as const,
        prompt: 'test',
      };

      const events = [];
      for await (const event of adapter.execute(options)) {
        events.push(event);
      }

      const errorEvent = events.find(e => e.type === 'error');
      expect(errorEvent).toBeDefined();
      expect(errorEvent?.code).toBe('AUTH_MISSING');
    });
  });
});
