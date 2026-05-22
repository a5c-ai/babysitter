import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ConfigManagerImpl,
  AdapterRegistryImpl,
  ProfileManagerImpl,
  AgentMuxError,
} from '../src/index.js';
import type { AgentAdapter, StoragePaths } from '../src/index.js';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

/**
 * Creates a minimal mock adapter with configurable config behavior.
 */
function mockAdapter(
  agent: string,
  config: Record<string, unknown> = {},
  defaultModelId?: string,
): AgentAdapter {
  let storedConfig = { ...config };

  return {
    agent,
    displayName: agent,
    cliCommand: agent,
    capabilities: {
      agent,
      displayName: agent,
      streaming: true,
      thinking: false,
      thinkingEffort: false,
      thinkingEffortLevels: [],
      thinkingBudget: false,
      maxTurns: false,
      systemPrompt: false,
      systemPromptMode: [],
      temperature: false,
      temperatureRange: undefined,
      topP: false,
      topK: false,
      maxOutputTokens: false,
      outputFormats: ['text'],
      attachments: false,
      imageAttachments: false,
      sessionPersistence: false,
      canResume: false,
      canFork: false,
      supportsMCP: false,
      approvalModes: ['prompt'],
      interactiveInput: false,
      agentDocs: false,
      outputChannel: 'stdout',
      authMethods: [],
      authFiles: [],
      pluginFormats: [],
      pluginRegistry: undefined,
      installMethods: [],
    },
    models: [],
    defaultModelId,
    configSchema: {
      version: 1,
      fields: [
        { path: 'model', label: 'Model', description: 'Default model', type: 'string', required: false, normalized: true, nativeKeyPath: 'model', scope: 'both' },
      ],
    },
    buildSpawnArgs: () => ({
      command: agent,
      args: [],
      env: {},
      cwd: '.',
      usePty: false,
    }),
    parseEvent: () => null,
    detectAuth: async () => ({ status: 'unknown' as const }),
    getAuthGuidance: () => ({ steps: [], envVars: [], links: [] }),
    sessionDir: () => '/tmp/sessions',
    parseSessionFile: async () => ({
      sessionId: 'x',
      agent,
      turnCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    listSessionFiles: async () => [],
    readConfig: async () => storedConfig,
    writeConfig: async (partial: Record<string, unknown>) => {
      storedConfig = { ...storedConfig, ...partial };
    },
  } as unknown as AgentAdapter;
}

function makeTmpPaths(): { paths: StoragePaths; tmpDir: string } {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-mux-cfg-'));
  const configDir = path.join(tmpDir, 'global');
  const projectConfigDir = path.join(tmpDir, 'project');

  const paths: StoragePaths = {
    configDir,
    projectConfigDir,
    globalConfigFile: path.join(configDir, 'config.json'),
    projectConfigFile: path.join(projectConfigDir, 'config.json'),
    globalProfilesDir: path.join(configDir, 'profiles'),
    projectProfilesDir: path.join(projectConfigDir, 'profiles'),
    authHintsFile: path.join(configDir, 'auth-hints.json'),
    runIndexFile: path.join(projectConfigDir, 'run-index.jsonl'),
  };

  return { paths, tmpDir };
}

describe('ConfigManagerImpl', () => {
  let registry: AdapterRegistryImpl;
  let profileManager: ProfileManagerImpl;
  let manager: ConfigManagerImpl;
  let tmpDir: string;

  beforeEach(() => {
    const tmp = makeTmpPaths();
    tmpDir = tmp.tmpDir;
    registry = new AdapterRegistryImpl();
    profileManager = new ProfileManagerImpl(tmp.paths);
    manager = new ConfigManagerImpl(registry, profileManager);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // ── get() ───────────────────────────────────────────────────────────

  describe('get()', () => {
    it('throws AGENT_NOT_FOUND for unknown agent', () => {
      expect(() => manager.get('nonexistent')).toThrow(AgentMuxError);
      expect(() => manager.get('nonexistent')).toThrow(/Unknown agent/);
    });

    it('returns a default config for registered agent', () => {
      registry.register(mockAdapter('claude'));
      const config = manager.get('claude');
      expect(config).toBeDefined();
    });

    it('returns cached config on subsequent calls', () => {
      registry.register(mockAdapter('claude'));
      const config1 = manager.get('claude');
      const config2 = manager.get('claude');
      expect(config1).toBe(config2);
    });
  });

  // ── getField() ──────────────────────────────────────────────────────

  describe('getField()', () => {
    it('returns undefined for non-existent field', () => {
      registry.register(mockAdapter('claude'));
      expect(manager.getField('claude', 'nonexistent')).toBeUndefined();
    });

    it('throws AGENT_NOT_FOUND for unknown agent', () => {
      expect(() => manager.getField('nonexistent', 'model')).toThrow(AgentMuxError);
    });
  });

  // ── set() ───────────────────────────────────────────────────────────

  describe('set()', () => {
    it('throws AGENT_NOT_FOUND for unknown agent', async () => {
      await expect(manager.set('nonexistent', {})).rejects.toMatchObject({
        code: 'AGENT_NOT_FOUND',
      });
    });

    it('updates the cache after writing', async () => {
      registry.register(mockAdapter('claude'));
      await manager.set('claude', { model: 'sonnet' } as any);
      const config = manager.get('claude');
      expect((config as any).model).toBe('sonnet');
    });
  });

  // ── setField() ──────────────────────────────────────────────────────

  describe('setField()', () => {
    it('sets a simple field', async () => {
      registry.register(mockAdapter('claude'));
      await manager.setField('claude', 'model', 'opus');
      expect(manager.getField('claude', 'model')).toBe('opus');
    });

    it('sets a nested field via dot notation', async () => {
      registry.register(mockAdapter('claude'));
      await manager.setField('claude', 'native.theme', 'dark');
      expect(manager.getField('claude', 'native.theme')).toBe('dark');
    });
  });

  // ── schema() ────────────────────────────────────────────────────────

  describe('schema()', () => {
    it('returns adapter config schema', () => {
      registry.register(mockAdapter('claude'));
      const schema = manager.schema('claude');
      expect(schema).toBeDefined();
      expect(schema.version).toBe(1);
    });

    it('throws AGENT_NOT_FOUND for unknown agent', () => {
      expect(() => manager.schema('nonexistent')).toThrow(AgentMuxError);
    });
  });

  // ── validate() ──────────────────────────────────────────────────────

  describe('validate()', () => {
    it('returns valid for any config (basic impl)', () => {
      registry.register(mockAdapter('claude'));
      const result = manager.validate('claude', {});
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('throws AGENT_NOT_FOUND for unknown agent', () => {
      expect(() => manager.validate('nonexistent', {})).toThrow(AgentMuxError);
    });
  });

  // ── getMcpServers() ─────────────────────────────────────────────────

  describe('getMcpServers()', () => {
    it('returns empty array when no MCP servers configured', () => {
      registry.register(mockAdapter('claude'));
      const servers = manager.getMcpServers('claude');
      expect(servers).toEqual([]);
    });

    it('throws AGENT_NOT_FOUND for unknown agent', () => {
      expect(() => manager.getMcpServers('nonexistent')).toThrow(AgentMuxError);
    });
  });

  // ── getModelSelection() ─────────────────────────────────────────────

  describe('getModelSelection()', () => {
    it('returns configured and effective model information', async () => {
      registry.register(mockAdapter('claude', {}, 'sonnet'));
      await manager.setModelSelection('claude', { model: 'opus', provider: 'anthropic' });
      const selection = manager.getModelSelection('claude');
      expect(selection.configuredModel).toBe('opus');
      expect(selection.configuredProvider).toBe('anthropic');
      expect(selection.defaultModel).toBe('sonnet');
      expect(selection.effectiveModel).toBe('opus');
    });

    it('falls back to adapter default when config is unset', () => {
      registry.register(mockAdapter('claude', {}, 'sonnet'));
      const selection = manager.getModelSelection('claude');
      expect(selection.configuredModel).toBeNull();
      expect(selection.defaultModel).toBe('sonnet');
      expect(selection.effectiveModel).toBe('sonnet');
    });
  });

  // ── setModelSelection() ─────────────────────────────────────────────

  describe('setModelSelection()', () => {
    it('updates model and provider fields together', async () => {
      registry.register(mockAdapter('claude', {}, 'sonnet'));
      await manager.setModelSelection('claude', { model: 'opus', provider: 'anthropic' });
      expect(manager.getField('claude', 'model')).toBe('opus');
      expect(manager.getField('claude', 'provider')).toBe('anthropic');
    });
  });

  // ── addMcpServer() ──────────────────────────────────────────────────

  describe('addMcpServer()', () => {
    it('adds an MCP server to the config', async () => {
      registry.register(mockAdapter('claude'));
      const server = {
        name: 'my-server',
        transport: 'stdio' as const,
        command: 'node',
        args: ['server.js'],
      };
      await manager.addMcpServer('claude', server);
      const servers = manager.getMcpServers('claude');
      expect(servers).toHaveLength(1);
      expect(servers[0]!.name).toBe('my-server');
    });

    it('throws CONFIG_ERROR when server name already exists', async () => {
      registry.register(mockAdapter('claude'));
      const server = {
        name: 'dupe',
        transport: 'stdio' as const,
        command: 'node',
      };
      await manager.addMcpServer('claude', server);
      await expect(manager.addMcpServer('claude', server)).rejects.toMatchObject({
        code: 'CONFIG_ERROR',
      });
    });
  });

  // ── removeMcpServer() ───────────────────────────────────────────────

  describe('removeMcpServer()', () => {
    it('removes an MCP server from the config', async () => {
      registry.register(mockAdapter('claude'));
      const server = {
        name: 'to-remove',
        transport: 'stdio' as const,
        command: 'node',
      };
      await manager.addMcpServer('claude', server);
      expect(manager.getMcpServers('claude')).toHaveLength(1);

      await manager.removeMcpServer('claude', 'to-remove');
      expect(manager.getMcpServers('claude')).toHaveLength(0);
    });

    it('throws CONFIG_ERROR when server name not found', async () => {
      registry.register(mockAdapter('claude'));
      await expect(
        manager.removeMcpServer('claude', 'nonexistent'),
      ).rejects.toMatchObject({
        code: 'CONFIG_ERROR',
      });
    });
  });

  // ── reload() ────────────────────────────────────────────────────────

  describe('reload()', () => {
    it('clears cache for a specific agent', async () => {
      registry.register(mockAdapter('claude'));
      const config1 = manager.get('claude');
      await manager.reload('claude');
      const config2 = manager.get('claude');
      expect(config1).not.toBe(config2); // Different object references
    });

    it('clears all caches when no agent specified', async () => {
      registry.register(mockAdapter('claude'));
      registry.register(mockAdapter('codex'));
      manager.get('claude');
      manager.get('codex');

      await manager.reload();

      // Both caches cleared - next get returns new objects
      const c1 = manager.get('claude');
      const c2 = manager.get('codex');
      expect(c1).toBeDefined();
      expect(c2).toBeDefined();
    });

    it('throws AGENT_NOT_FOUND for unknown agent', async () => {
      await expect(manager.reload('nonexistent')).rejects.toMatchObject({
        code: 'AGENT_NOT_FOUND',
      });
    });
  });

  // ── profiles() ──────────────────────────────────────────────────────

  describe('profiles()', () => {
    it('returns the ProfileManager instance', () => {
      expect(manager.profiles()).toBe(profileManager);
    });
  });
});

// Need afterEach import
import { afterEach } from 'vitest';
