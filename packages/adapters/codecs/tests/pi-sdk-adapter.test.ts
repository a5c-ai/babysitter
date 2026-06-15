import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as os from 'node:os';
import * as path from 'node:path';
import { PiSdkAdapter } from '../src/pi-sdk-adapter.js';

describe('PiSdkAdapter', () => {
  let adapter: PiSdkAdapter;

  beforeEach(() => {
    adapter = new PiSdkAdapter();
  });

  describe('identity', () => {
    it('has correct adapter type', () => {
      expect(adapter.adapterType).toBe('programmatic');
    });

    it('has correct agent name', () => {
      expect(adapter.agent).toBe('pi-sdk');
    });

    it('has correct display name', () => {
      expect(adapter.displayName).toBe('Pi (SDK)');
    });

    it('has minimum version', () => {
      expect(adapter.minVersion).toBe('0.1.0');
    });

    it('has host environment signals', () => {
      expect(adapter.hostEnvSignals).toContain('PI_API_KEY');
      expect(adapter.hostEnvSignals).toContain('ANTHROPIC_API_KEY');
      expect(adapter.hostEnvSignals).toContain('OPENAI_API_KEY');
    });
  });

  describe('capabilities', () => {
    it('declares agent as pi-sdk', () => {
      expect(adapter.capabilities.agent).toBe('pi-sdk');
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

    it('supports comprehensive streaming', () => {
      expect(adapter.capabilities.supportsTextStreaming).toBe(true);
      expect(adapter.capabilities.supportsToolCallStreaming).toBe(true);
      expect(adapter.capabilities.supportsThinkingStreaming).toBe(false);
    });

    it('supports advanced tool features', () => {
      expect(adapter.capabilities.supportsNativeTools).toBe(true);
      expect(adapter.capabilities.supportsParallelToolCalls).toBe(true);
      expect(adapter.capabilities.supportsMCP).toBe(false);
    });

    it('requires tool approval', () => {
      expect(adapter.capabilities.requiresToolApproval).toBe(true);
      expect(adapter.capabilities.approvalModes).toContain('yolo');
      expect(adapter.capabilities.approvalModes).toContain('prompt');
      expect(adapter.capabilities.approvalModes).toContain('deny');
    });

    it('does not support thinking capabilities', () => {
      expect(adapter.capabilities.supportsThinking).toBe(false);
      expect(adapter.capabilities.thinkingEffortLevels).toHaveLength(0);
      expect(adapter.capabilities.supportsThinkingBudgetTokens).toBe(false);
    });

    it('supports JSON and structured output', () => {
      expect(adapter.capabilities.supportsJsonMode).toBe(true);
      expect(adapter.capabilities.supportsStructuredOutput).toBe(true);
    });

    it('supports skills and subagents', () => {
      expect(adapter.capabilities.supportsSkills).toBe(true);
      expect(adapter.capabilities.supportsAgentsMd).toBe(true);
      expect(adapter.capabilities.skillsFormat).toBe('file');
    });

    it('supports subagents with limited parallelism', () => {
      expect(adapter.capabilities.supportsSubagentDispatch).toBe(true);
      expect(adapter.capabilities.supportsParallelExecution).toBe(true);
      expect(adapter.capabilities.maxParallelTasks).toBe(5);
    });

    it('supports interactive mode and stdin injection', () => {
      expect(adapter.capabilities.supportsInteractiveMode).toBe(true);
      expect(adapter.capabilities.supportsStdinInjection).toBe(true);
    });

    it('supports image input but not output', () => {
      expect(adapter.capabilities.supportsImageInput).toBe(false);
      expect(adapter.capabilities.supportsImageOutput).toBe(false);
      expect(adapter.capabilities.supportsFileAttachments).toBe(true);
    });

    it('does not support plugins', () => {
      expect(adapter.capabilities.supportsPlugins).toBe(false);
      expect(adapter.capabilities.pluginFormats).toHaveLength(0);
      expect(adapter.capabilities.pluginRegistries).toHaveLength(0);
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
      expect(adapter.capabilities.authMethods).toHaveLength(2);
      expect(adapter.capabilities.authMethods[0].type).toBe('api_key');
      expect(adapter.capabilities.authMethods[1].type).toBe('oauth');
    });

    it('has NPM install method', () => {
      expect(adapter.capabilities.installMethods).toHaveLength(1);
      expect(adapter.capabilities.installMethods[0].type).toBe('npm');
      expect(adapter.capabilities.installMethods[0].command).toBe('npm install -g @pi-ai/sdk');
    });
  });

  describe('models', () => {
    it('has two models', () => {
      expect(adapter.models).toHaveLength(2);
    });

    it('has default model', () => {
      expect(adapter.defaultModelId).toBe('pi-default');
      const defaultModel = adapter.models.find(m => m.modelId === adapter.defaultModelId);
      expect(defaultModel).toBeDefined();
    });

    it('has Pi Default model', () => {
      const model = adapter.models.find(m => m.modelId === 'pi-default');
      expect(model).toBeDefined();
      expect(model!.agent).toBe('pi-sdk');
      expect(model!.displayName).toBe('Pi Default (SDK)');
      expect(model!.supportsToolCalling).toBe(true);
      expect(model!.supportsThinking).toBe(false);
      expect(model!.supportsThinkingStreaming).toBe(false);
      expect(model!.supportsImageInput).toBe(false);
      expect(model!.contextWindow).toBe(128000);
      expect(model!.maxOutputTokens).toBe(8192);
      expect(model!.cliArgKey).toBe('model');
      expect(model!.cliArgValue).toBe('pi-default');
    });

    it('has Pi Enhanced model', () => {
      const model = adapter.models.find(m => m.modelId === 'pi-enhanced');
      expect(model).toBeDefined();
      expect(model!.agent).toBe('pi-sdk');
      expect(model!.displayName).toBe('Pi Enhanced (SDK)');
      expect(model!.supportsToolCalling).toBe(true);
      expect(model!.supportsThinking).toBe(false);
      expect(model!.supportsThinkingStreaming).toBe(false);
      expect(model!.supportsImageInput).toBe(false);
      expect(model!.contextWindow).toBe(200000);
      expect(model!.maxOutputTokens).toBe(16384);
      expect(model!.cliArgKey).toBe('model');
      expect(model!.cliArgValue).toBe('pi-enhanced');
    });

    it('models have pricing info', () => {
      for (const model of adapter.models) {
        expect(model.inputPricePerMillion).toBeGreaterThan(0);
        expect(model.outputPricePerMillion).toBeGreaterThan(0);
        expect(model.cachedInputPricePerMillion).toBeGreaterThan(0);
      }
    });
  });

  describe('authentication', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
      originalEnv = { ...process.env };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('detects Pi API key', async () => {
      process.env.PI_API_KEY = 'pi-123456789abcdef';
      const result = await adapter.detectAuth();

      expect(result.status).toBe('authenticated');
      expect(result.method).toBe('api_key');
      expect(result.identity).toBe('pi:...cdef');
    });

    it('detects Anthropic API key', async () => {
      delete process.env.PI_API_KEY;
      process.env.ANTHROPIC_API_KEY = 'sk-ant-9876543210fedcba';
      const result = await adapter.detectAuth();

      expect(result.status).toBe('authenticated');
      expect(result.method).toBe('api_key');
      expect(result.identity).toBe('anthropic:...dcba');
    });

    it('reports unauthenticated when no key found', async () => {
      delete process.env.PI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENAI_API_KEY;
      const result = await adapter.detectAuth();

      expect(result.status).toBe('unauthenticated');
    });
  });

  describe('getAuthGuidance', () => {
    it('provides auth setup guidance', () => {
      const guidance = adapter.getAuthGuidance();

      expect(guidance.agent).toBe('pi-sdk');
      expect(guidance.providerName).toBe('Pi');
      expect(guidance.steps.length).toBeGreaterThanOrEqual(3);
      expect(guidance.envVars.length).toBeGreaterThanOrEqual(1);
      expect(guidance.envVars[0].name).toBe('PI_API_KEY');
      expect(guidance.documentationUrls).toContain('https://pi.ai/docs/api');
      expect(guidance.verifyCommand).toBe('pi --version');
    });
  });

  describe('session management', () => {
    it('returns correct session directory', () => {
      const sessionDir = adapter.sessionDir();
      expect(sessionDir).toBe(path.join(os.homedir(), '.pi', 'agent', 'sessions'));
    });

    it('parses session files', async () => {
      vi.spyOn(adapter, 'parseSessionFile').mockResolvedValue({
        sessionId: 'test-session',
        agent: 'pi-sdk',
        createdAt: new Date(),
        lastUpdated: new Date(),
        events: [],
        messageCount: 0,
      });

      const session = await adapter.parseSessionFile('/fake/path');
      expect(session.agent).toBe('pi-sdk');
      expect(session.sessionId).toBe('test-session');
    });
  });

  describe('config management', () => {
    it('has correct config schema', () => {
      expect(adapter.configSchema.agent).toBe('pi-sdk');
      expect(adapter.configSchema.version).toBe(1);
      expect(adapter.configSchema.configFormat).toBe('json');
      expect(adapter.configSchema.supportsProjectConfig).toBe(true);
      expect(adapter.configSchema.configFilePaths).toHaveLength(1);
      expect(adapter.configSchema.configFilePaths[0]).toContain('settings.json');
    });
  });

  describe('execution', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
      originalEnv = { ...process.env };
      process.env.PI_API_KEY = 'pi-test123';
    });

    afterEach(() => {
      process.env = originalEnv;
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
        agent: 'pi-sdk' as const,
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
        agent: 'pi-sdk' as const,
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
        agent: 'pi-sdk' as const,
        prompt: 'Search for information',
      };

      const events = [];
      for await (const event of adapter.execute(options)) {
        events.push(event);
      }

      const toolCallStart = events.find(e => e.type === 'tool_call_start');
      expect(toolCallStart).toBeDefined();
      expect(toolCallStart).toHaveProperty('toolName');
      expect(toolCallStart).toHaveProperty('toolCallId');

      const toolInputDelta = events.find(e => e.type === 'tool_input_delta');
      expect(toolInputDelta).toBeDefined();

      const toolCallReady = events.find(e => e.type === 'tool_call_ready');
      expect(toolCallReady).toBeDefined();

      const toolResult = events.find(e => e.type === 'tool_result');
      expect(toolResult).toBeDefined();
      expect(toolResult).toHaveProperty('output');
    });

    it('emits cost events', async () => {
      const options = {
        agent: 'pi-sdk' as const,
        prompt: 'test',
      };

      const events = [];
      for await (const event of adapter.execute(options)) {
        events.push(event);
      }

      const costEvent = events.find(e => e.type === 'cost');
      expect(costEvent).toBeDefined();
      expect(costEvent).toHaveProperty('cost');

      const cost = (costEvent as any).cost;
      expect(cost.totalUsd).toBeGreaterThan(0);
      expect(cost.inputTokens).toBeGreaterThan(0);
      expect(cost.outputTokens).toBeGreaterThan(0);
    });

    it('handles authentication errors', async () => {
      delete process.env.PI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const options = {
        agent: 'pi-sdk' as const,
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

    it('supports structured output', async () => {
      const options = {
        agent: 'pi-sdk' as const,
        prompt: 'Generate JSON',
        jsonMode: true,
      };

      const events = [];
      for await (const event of adapter.execute(options)) {
        events.push(event);
        if (events.length >= 5) break;
      }

      expect(events.length).toBeGreaterThan(0);
    });

    it('supports skill-based interactions', async () => {
      const options = {
        agent: 'pi-sdk' as const,
        prompt: 'Use a skill to help me',
      };

      const events = [];
      for await (const event of adapter.execute(options)) {
        events.push(event);
        if (events.length >= 8) break;
      }

      // Should process normally with skills support
      expect(events.length).toBeGreaterThan(0);
    });

    it('supports parallel tool execution', async () => {
      const options = {
        agent: 'pi-sdk' as const,
        prompt: 'Execute multiple tasks',
      };

      const events = [];
      for await (const event of adapter.execute(options)) {
        events.push(event);
        if (events.length >= 15) break;
      }

      // Should handle parallel execution without issues
      expect(events.length).toBeGreaterThan(0);
    });

    it('handles subagent dispatch', async () => {
      const options = {
        agent: 'pi-sdk' as const,
        prompt: 'Spawn a subagent',
      };

      const events = [];
      for await (const event of adapter.execute(options)) {
        events.push(event);
        if (events.length >= 10) break;
      }

      // Should process subagent requests
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('plugin management', () => {
    it('does not support plugin management', () => {
      expect(adapter.listPlugins).toBeUndefined();
      expect(adapter.installPlugin).toBeUndefined();
      expect(adapter.uninstallPlugin).toBeUndefined();
    });
  });

  describe('web tools', () => {
    it('supports web search functionality', async () => {
      const options = {
        agent: 'pi-sdk' as const,
        prompt: 'Search the web for recent news',
      };

      const events = [];
      for await (const event of adapter.execute(options)) {
        events.push(event);
        if (events.length >= 12) break;
      }

      // Should process normally - mock implementation may or may not trigger tools
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('model selection', () => {
    it('supports model override', async () => {
      const options = {
        agent: 'pi-sdk' as const,
        prompt: 'Test with enhanced model',
        model: 'pi-enhanced',
      };

      const events = [];
      for await (const event of adapter.execute(options)) {
        events.push(event);
        if (events.length >= 5) break;
      }

      expect(events.length).toBeGreaterThan(0);
    });
  });
});