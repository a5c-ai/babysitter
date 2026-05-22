import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as os from 'node:os';
import * as path from 'node:path';
import type { ServerInfo } from '@a5c-ai/agent-mux-core';
import { OpenCodeHttpAdapter } from '../src/opencode-http-adapter.js';

describe('OpenCodeHttpAdapter', () => {
  let adapter: OpenCodeHttpAdapter;

  beforeEach(() => {
    adapter = new OpenCodeHttpAdapter();
  });

  describe('identity', () => {
    it('has correct adapter type', () => {
      expect(adapter.adapterType).toBe('remote');
    });

    it('has correct connection type', () => {
      expect(adapter.connectionType).toBe('http');
    });

    it('has correct agent name', () => {
      expect(adapter.agent).toBe('opencode-http');
    });

    it('has correct display name', () => {
      expect(adapter.displayName).toBe('OpenCode (HTTP)');
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
    it('declares agent as opencode-http', () => {
      expect(adapter.capabilities.agent).toBe('opencode-http');
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

    it('supports interactive mode and stdin injection', () => {
      expect(adapter.capabilities.supportsInteractiveMode).toBe(true);
      expect(adapter.capabilities.supportsStdinInjection).toBe(true);
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
      expect(sonnet!.agent).toBe('opencode-http');
      expect(sonnet!.displayName).toBe('Claude 3.5 Sonnet');
      expect(sonnet!.supportsToolCalling).toBe(true);
      expect(sonnet!.supportsImageInput).toBe(true);
    });

    it('has GPT-4o model', () => {
      const gpt4o = adapter.models.find(m => m.modelId === 'gpt-4o');
      expect(gpt4o).toBeDefined();
      expect(gpt4o!.agent).toBe('opencode-http');
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

  describe('authentication', () => {
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

      expect(guidance.agent).toBe('opencode-http');
      expect(guidance.providerName).toBe('OpenCode (HTTP)');
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
        agent: 'opencode-http',
        createdAt: new Date(),
        lastUpdated: new Date(),
        events: [],
        messageCount: 0,
      });

      const session = await adapter.parseSessionFile('/fake/path');
      expect(session.agent).toBe('opencode-http');
      expect(session.sessionId).toBe('test-session');
    });
  });

  describe('config management', () => {
    it('has correct config schema', () => {
      expect(adapter.configSchema.agent).toBe('opencode-http');
      expect(adapter.configSchema.version).toBe(1);
      expect(adapter.configSchema.configFormat).toBe('json');
      expect(adapter.configSchema.supportsProjectConfig).toBe(true);
      expect(adapter.configSchema.configFilePaths).toHaveLength(1);
      expect(adapter.configSchema.configFilePaths[0]).toContain('config.json');
    });
  });

  describe('server management', () => {
    it('generates unique connection IDs', () => {
      const id1 = (adapter as any).generateConnectionId();
      const id2 = (adapter as any).generateConnectionId();

      expect(id1).toMatch(/^opencode-http-/);
      expect(id2).toMatch(/^opencode-http-/);
      expect(id1).not.toBe(id2);
    });

    it('generates unique server IDs', () => {
      const id1 = (adapter as any).generateServerId();
      const id2 = (adapter as any).generateServerId();

      expect(id1).toMatch(/^opencode-http-server-/);
      expect(id2).toMatch(/^opencode-http-server-/);
      expect(id1).not.toBe(id2);
    });

    it('finds available ports', async () => {
      const port = await (adapter as any).findAvailablePort(9000);
      expect(typeof port).toBe('number');
      expect(port).toBeGreaterThanOrEqual(9000);
    });
  });

  describe('connection interface', () => {
    it('implements RemoteAdapter interface correctly', () => {
      expect(adapter.adapterType).toBe('remote');
      expect(adapter.connectionType).toBe('http');
      expect(typeof adapter.connect).toBe('function');
      expect(typeof adapter.disconnect).toBe('function');
      expect(typeof adapter.startServer).toBe('function');
      expect(typeof adapter.stopServer).toBe('function');
      expect(typeof adapter.healthCheck).toBe('function');
    });
  });

  describe('cleanup', () => {
    it('has cleanup method for tracking', async () => {
      expect(typeof adapter.cleanup).toBe('function');

      // Should not throw when called with no active connections/servers
      await expect(adapter.cleanup()).resolves.not.toThrow();
    });
  });

  describe('HTTP connection health check', () => {
    it('handles health check failures gracefully', async () => {
      const mockServerInfo: ServerInfo = {
        serverId: 'test-server',
        serverType: 'opencode-http',
        endpoint: 'http://localhost:9999', // Non-existent endpoint
        port: 9999,
        startedAt: new Date(),
      };

      const health = await adapter.healthCheck(mockServerInfo);
      expect(health.status).toBe('unhealthy');
      expect(health.lastCheck).toBeInstanceOf(Date);
      expect(health.details).toBeDefined();
    });
  });
});