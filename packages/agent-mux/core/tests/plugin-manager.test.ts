import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PluginManagerImpl,
  AdapterRegistryImpl,
  AgentMuxError,
  CapabilityError,
} from '../src/index.js';
import type {
  AgentAdapter,
  AgentCapabilities,
  ModelCapabilities,
  InstalledPlugin as AdapterInstalledPlugin,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

function createMockCapabilities(
  agent: string,
  supportsPlugins = false,
): AgentCapabilities {
  return {
    agent,
    canResume: false,
    canFork: false,
    supportsMultiTurn: false,
    sessionPersistence: 'none',
    supportsTextStreaming: true,
    supportsToolCallStreaming: false,
    supportsThinkingStreaming: false,
    supportsNativeTools: false,
    supportsMCP: false,
    supportsParallelToolCalls: false,
    requiresToolApproval: false,
    approvalModes: ['prompt'],
    runtimeHooks: {
      preToolUse: 'unsupported',
      postToolUse: 'unsupported',
      sessionStart: 'unsupported',
      sessionEnd: 'unsupported',
      stop: 'unsupported',
      userPromptSubmit: 'unsupported',
    },
    supportsThinking: false,
    thinkingEffortLevels: [],
    supportsThinkingBudgetTokens: false,
    supportsJsonMode: false,
    supportsStructuredOutput: false,
    structuredSessionTransport: 'none',
    sessionControlPlane: 'self-managed',
    supportsSkills: false,
    supportsAgentsMd: false,
    skillsFormat: null,
    supportsSubagentDispatch: false,
    supportsParallelExecution: false,
    supportsInteractiveMode: false,
    supportsStdinInjection: false,
    supportsImageInput: false,
    supportsImageOutput: false,
    supportsFileAttachments: false,
    supportsPlugins,
    pluginFormats: supportsPlugins ? ['npm-package'] : [],
    pluginRegistries: supportsPlugins
      ? [{ name: 'npm', url: 'https://registry.npmjs.org', searchable: true }]
      : [],
    supportedPlatforms: ['darwin', 'linux', 'win32'],
    requiresGitRepo: false,
    requiresPty: false,
    authMethods: [],
    authFiles: [],
    installMethods: [],
  };
}

function createMockModel(agent: string): ModelCapabilities {
  return {
    agent,
    modelId: `${agent}-default`,
    displayName: `${agent}-default`,
    deprecated: false,
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsThinking: false,
    supportsToolCalling: true,
    supportsParallelToolCalls: false,
    supportsToolCallStreaming: false,
    supportsJsonMode: false,
    supportsStructuredOutput: false,
    supportsTextStreaming: true,
    supportsThinkingStreaming: false,
    supportsImageInput: false,
    supportsImageOutput: false,
    supportsFileInput: false,
    cliArgKey: '--model',
    cliArgValue: `${agent}-default`,
    lastUpdated: '2025-01-01T00:00:00Z',
    source: 'bundled',
  };
}

function createMockAdapter(
  agent: string,
  supportsPlugins = false,
  pluginMethods?: {
    listPlugins?: () => Promise<AdapterInstalledPlugin[]>;
    installPlugin?: (pluginId: string, options?: unknown) => Promise<AdapterInstalledPlugin>;
    uninstallPlugin?: (pluginId: string) => Promise<void>;
    searchPlugins?: (query: string, options?: unknown) => Promise<unknown[]>;
  },
): AgentAdapter {
  return {
    agent,
    displayName: agent,
    cliCommand: agent,
    capabilities: createMockCapabilities(agent, supportsPlugins),
    models: [createMockModel(agent)],
    configSchema: { version: 1, fields: [] },
    buildSpawnArgs: () => ({
      command: agent,
      args: [],
      env: {},
      cwd: '.',
      usePty: false,
    }),
    parseEvent: () => null,
    detectAuth: async () => ({
      status: 'unknown' as const,
    }),
    getAuthGuidance: () => ({
      steps: [],
      envVars: [],
      links: [],
    }),
    sessionDir: () => '/tmp',
    parseSessionFile: async () => ({
      sessionId: 'x',
      agent,
      turnCount: 0,
      messages: [],
      createdAt: new Date().toISOString(),
    }),
    listSessionFiles: async () => [],
    readConfig: async () => ({}),
    writeConfig: async () => {},
    ...pluginMethods,
  } as unknown as AgentAdapter;
}

function createLegacyInstalledPlugin(
  overrides: Partial<AdapterInstalledPlugin> = {},
): AdapterInstalledPlugin {
  return {
    pluginId: 'plugin',
    name: 'Plugin',
    version: '1.0.0',
    ...overrides,
  } as AdapterInstalledPlugin;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PluginManagerImpl', () => {
  let registry: AdapterRegistryImpl;
  let manager: PluginManagerImpl;

  beforeEach(() => {
    registry = new AdapterRegistryImpl();
    manager = new PluginManagerImpl(registry);
  });

  // ── Capability Gating ──────────────────────────────────────────────

  describe('capability gating', () => {
    it('throws AGENT_NOT_FOUND for unknown agents', async () => {
      await expect(manager.list('unknown-agent')).rejects.toThrow(AgentMuxError);
      await expect(manager.list('unknown-agent')).rejects.toMatchObject({
        code: 'AGENT_NOT_FOUND',
      });
    });

    it('throws CapabilityError when supportsPlugins is false', async () => {
      const adapter = createMockAdapter('codex', false);
      registry.register(adapter);

      await expect(manager.list('codex')).rejects.toThrow(CapabilityError);
      await expect(manager.list('codex')).rejects.toMatchObject({
        code: 'CAPABILITY_ERROR',
        capability: 'plugins',
      });
    });

    it('throws CapabilityError for install when supportsPlugins is false', async () => {
      const adapter = createMockAdapter('gemini', false);
      registry.register(adapter);

      await expect(
        manager.install('gemini', 'some-plugin'),
      ).rejects.toThrow(CapabilityError);
    });

    it('throws CapabilityError for uninstall when supportsPlugins is false', async () => {
      const adapter = createMockAdapter('copilot', false);
      registry.register(adapter);

      await expect(
        manager.uninstall('copilot', 'some-plugin'),
      ).rejects.toThrow(CapabilityError);
    });

    it('throws CapabilityError for update when supportsPlugins is false', async () => {
      const adapter = createMockAdapter('codex', false);
      registry.register(adapter);

      await expect(
        manager.update('codex', 'some-plugin'),
      ).rejects.toThrow(CapabilityError);
    });

    it('throws CapabilityError for updateAll when supportsPlugins is false', async () => {
      const adapter = createMockAdapter('codex', false);
      registry.register(adapter);

      await expect(manager.updateAll('codex')).rejects.toThrow(CapabilityError);
    });

    it('throws CapabilityError for isInstalled when supportsPlugins is false', async () => {
      const adapter = createMockAdapter('codex', false);
      registry.register(adapter);

      await expect(
        manager.isInstalled('codex', 'some-plugin'),
      ).rejects.toThrow(CapabilityError);
    });
  });

  // ── list() ─────────────────────────────────────────────────────────

  describe('list()', () => {
    it('normalizes installed plugins and sorts them by installedAt descending', async () => {
      const mockPlugins: AdapterInstalledPlugin[] = [
        createLegacyInstalledPlugin({
          pluginId: 'plugin-a',
          name: 'Plugin A',
          version: '1.0.0',
          installedAt: '2024-01-01T00:00:00.000Z' as unknown as Date,
        }),
        createLegacyInstalledPlugin({
          pluginId: 'plugin-b',
          name: 'Plugin B',
          version: '2.0.0',
          enabled: false,
          format: 'skill-file',
          installedAt: new Date('2024-02-01T00:00:00.000Z'),
        }),
      ];
      const listPlugins = vi.fn().mockResolvedValue(mockPlugins);
      const adapter = createMockAdapter('opencode', true, { listPlugins });
      registry.register(adapter);

      const result = await manager.list('opencode');

      expect(listPlugins).toHaveBeenCalledOnce();
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        pluginId: 'plugin-b',
        agent: 'opencode',
        format: 'skill-file',
        enabled: false,
      });
      expect(result[0].installedAt).toBeInstanceOf(Date);
      expect(result[1]).toMatchObject({
        pluginId: 'plugin-a',
        agent: 'opencode',
        format: 'npm-package',
        enabled: true,
      });
      expect(result[1].installedAt).toBeInstanceOf(Date);
    });

    it('returns empty array when adapter has no listPlugins', async () => {
      const adapter = createMockAdapter('opencode', true);
      registry.register(adapter);

      const result = await manager.list('opencode');

      expect(result).toEqual([]);
    });
  });

  // ── install() ──────────────────────────────────────────────────────

  describe('install()', () => {
    it('normalizes the installed plugin returned by the adapter', async () => {
      const installed: AdapterInstalledPlugin = createLegacyInstalledPlugin({
        pluginId: 'my-plugin',
        name: 'My Plugin',
        version: '1.0.0',
      });
      const installPlugin = vi.fn().mockResolvedValue(installed);
      const adapter = createMockAdapter('opencode', true, { installPlugin });
      registry.register(adapter);

      const result = await manager.install('opencode', 'my-plugin', { version: '1.0.0' });

      expect(installPlugin).toHaveBeenCalledWith('my-plugin', { version: '1.0.0' });
      expect(result).toMatchObject({
        pluginId: 'my-plugin',
        version: '1.0.0',
        agent: 'opencode',
        format: 'npm-package',
        enabled: true,
      });
      expect(result.installedAt).toBeInstanceOf(Date);
    });

    it('throws PLUGIN_ERROR when adapter has no installPlugin', async () => {
      const adapter = createMockAdapter('opencode', true);
      registry.register(adapter);

      await expect(
        manager.install('opencode', 'some-plugin'),
      ).rejects.toMatchObject({
        code: 'PLUGIN_ERROR',
      });
    });
  });

  // ── uninstall() ────────────────────────────────────────────────────

  describe('uninstall()', () => {
    it('delegates to adapter.uninstallPlugin()', async () => {
      const uninstallPlugin = vi.fn().mockResolvedValue(undefined);
      const adapter = createMockAdapter('opencode', true, { uninstallPlugin });
      registry.register(adapter);

      await manager.uninstall('opencode', 'my-plugin');

      expect(uninstallPlugin).toHaveBeenCalledWith('my-plugin', undefined);
    });

    it('throws PLUGIN_ERROR when adapter has no uninstallPlugin', async () => {
      const adapter = createMockAdapter('opencode', true);
      registry.register(adapter);

      await expect(
        manager.uninstall('opencode', 'some-plugin'),
      ).rejects.toMatchObject({
        code: 'PLUGIN_ERROR',
      });
    });
  });

  // ── update() ───────────────────────────────────────────────────────

  describe('update()', () => {
    it('updates an installed plugin and returns a normalized result', async () => {
      const listPlugins = vi.fn().mockResolvedValue([
        createLegacyInstalledPlugin({
          pluginId: 'my-plugin',
          name: 'My Plugin',
          version: '1.0.0',
          installedAt: new Date('2024-01-01T00:00:00.000Z'),
        }),
      ]);
      const updated: AdapterInstalledPlugin = createLegacyInstalledPlugin({
        pluginId: 'my-plugin',
        name: 'My Plugin',
        version: '2.0.0',
      });
      const installPlugin = vi.fn().mockResolvedValue(updated);
      const adapter = createMockAdapter('opencode', true, { listPlugins, installPlugin });
      registry.register(adapter);

      const result = await manager.update('opencode', 'my-plugin');

      expect(installPlugin).toHaveBeenCalledWith('my-plugin');
      expect(result).toMatchObject({
        pluginId: 'my-plugin',
        version: '2.0.0',
        agent: 'opencode',
        format: 'npm-package',
      });
    });

    it('throws PLUGIN_ERROR when the plugin is not currently installed', async () => {
      const listPlugins = vi.fn().mockResolvedValue([]);
      const installPlugin = vi.fn();
      const adapter = createMockAdapter('opencode', true, { listPlugins, installPlugin });
      registry.register(adapter);

      await expect(
        manager.update('opencode', 'missing-plugin'),
      ).rejects.toMatchObject({
        code: 'PLUGIN_ERROR',
      });
      expect(installPlugin).not.toHaveBeenCalled();
    });
  });

  // ── updateAll() ────────────────────────────────────────────────────

  describe('updateAll()', () => {
    it('updates all installed plugins', async () => {
      const plugins: AdapterInstalledPlugin[] = [
        createLegacyInstalledPlugin({
          pluginId: 'a',
          name: 'A',
          version: '1.0.0',
          installedAt: new Date('2024-01-01T00:00:00.000Z'),
        }),
        createLegacyInstalledPlugin({
          pluginId: 'b',
          name: 'B',
          version: '1.0.0',
          installedAt: new Date('2024-02-01T00:00:00.000Z'),
        }),
      ];
      const listPlugins = vi.fn().mockResolvedValue(plugins);
      const installPlugin = vi.fn(async (pluginId: string) => createLegacyInstalledPlugin({
        pluginId,
        name: pluginId.toUpperCase(),
        version: '2.0.0',
      }));

      const adapter = createMockAdapter('opencode', true, {
        listPlugins,
        installPlugin,
      });
      registry.register(adapter);

      const result = await manager.updateAll('opencode');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ pluginId: 'b', version: '2.0.0', agent: 'opencode' });
      expect(result[1]).toMatchObject({ pluginId: 'a', version: '2.0.0', agent: 'opencode' });
    });

    it('returns empty array when no plugins are installed', async () => {
      const listPlugins = vi.fn().mockResolvedValue([]);
      const adapter = createMockAdapter('opencode', true, { listPlugins });
      registry.register(adapter);

      const result = await manager.updateAll('opencode');
      expect(result).toEqual([]);
    });

    it('throws PLUGIN_ERROR with failed plugin ids when any update fails', async () => {
      const listPlugins = vi.fn().mockResolvedValue([
        createLegacyInstalledPlugin({ pluginId: 'a', name: 'A', version: '1.0.0' }),
        createLegacyInstalledPlugin({ pluginId: 'b', name: 'B', version: '1.0.0' }),
      ]);
      const installPlugin = vi.fn()
        .mockResolvedValueOnce(createLegacyInstalledPlugin({ pluginId: 'a', name: 'A', version: '2.0.0' }))
        .mockRejectedValueOnce(new Error('registry unavailable'));

      registry.register(
        createMockAdapter('opencode', true, { listPlugins, installPlugin }),
      );

      const promise = manager.updateAll('opencode');
      await expect(promise).rejects.toMatchObject({
        code: 'PLUGIN_ERROR',
      });
      await expect(promise).rejects.toThrow(/b/);
    });
  });

  // ── search() ───────────────────────────────────────────────────────

  describe('search()', () => {
    it('aggregates results across multiple agents', async () => {
      const searchA = vi.fn().mockResolvedValue([
        { pluginId: 'plugin-a', name: 'A', description: 'a', latestVersion: '1.0.0' },
      ]);
      const searchB = vi.fn().mockResolvedValue([
        { pluginId: 'plugin-b', name: 'B', description: 'b', latestVersion: '2.0.0' },
      ]);

      registry.register(
        createMockAdapter('opencode', true, { searchPlugins: searchA }),
      );
      registry.register(
        createMockAdapter('pi', true, { searchPlugins: searchB }),
      );

      const results = await manager.search('browser');

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.pluginId)).toContain('plugin-a');
      expect(results.map((r) => r.pluginId)).toContain('plugin-b');
      expect(results[0]).toMatchObject({
        agents: [expect.any(String)],
        formats: [expect.any(String)],
        registry: expect.any(String),
      });
    });

    it('deduplicates results by pluginId', async () => {
      const sharedResult = [
        { pluginId: 'shared', name: 'Shared', description: 'shared', latestVersion: '1.0.0' },
      ];
      const searchA = vi.fn().mockResolvedValue(sharedResult);
      const searchB = vi.fn().mockResolvedValue(sharedResult);

      registry.register(
        createMockAdapter('opencode', true, { searchPlugins: searchA }),
      );
      registry.register(
        createMockAdapter('pi', true, { searchPlugins: searchB }),
      );

      const results = await manager.search('shared');
      expect(results).toHaveLength(1);
    });

    it('filters by agents when options.agents is provided', async () => {
      const searchA = vi.fn().mockResolvedValue([
        { pluginId: 'a', name: 'A', description: 'a', latestVersion: '1.0.0' },
      ]);
      const searchB = vi.fn().mockResolvedValue([
        { pluginId: 'b', name: 'B', description: 'b', latestVersion: '1.0.0' },
      ]);

      registry.register(
        createMockAdapter('opencode', true, { searchPlugins: searchA }),
      );
      registry.register(
        createMockAdapter('pi', true, { searchPlugins: searchB }),
      );

      const results = await manager.search('test', { agents: ['opencode'] });

      expect(searchA).toHaveBeenCalled();
      expect(searchB).not.toHaveBeenCalled();
      expect(results).toHaveLength(1);
      expect(results[0].pluginId).toBe('a');
    });

    it('respects the limit option', async () => {
      const many = Array.from({ length: 50 }, (_, i) => ({
        pluginId: `plugin-${i}`,
        name: `Plugin ${i}`,
        description: `Desc ${i}`,
        latestVersion: '1.0.0',
      }));
      const searchFn = vi.fn().mockResolvedValue(many);
      registry.register(
        createMockAdapter('opencode', true, { searchPlugins: searchFn }),
      );

      const results = await manager.search('test', { limit: 10 });
      expect(results).toHaveLength(10);
    });

    it('returns empty array when no adapters have searchPlugins', async () => {
      registry.register(createMockAdapter('opencode', true));

      const results = await manager.search('test');
      expect(results).toEqual([]);
    });

    it('tolerates partial failures across adapters', async () => {
      const searchA = vi.fn().mockRejectedValue(new Error('network error'));
      const searchB = vi.fn().mockResolvedValue([
        { pluginId: 'b', name: 'B', description: 'b', latestVersion: '1.0.0' },
      ]);

      registry.register(
        createMockAdapter('opencode', true, { searchPlugins: searchA }),
      );
      registry.register(
        createMockAdapter('pi', true, { searchPlugins: searchB }),
      );

      const results = await manager.search('test');
      expect(results).toHaveLength(1);
      expect(results[0].pluginId).toBe('b');
    });

    it('throws PLUGIN_ERROR when all searched registries fail', async () => {
      registry.register(
        createMockAdapter('opencode', true, { searchPlugins: vi.fn().mockRejectedValue(new Error('network')) }),
      );
      registry.register(
        createMockAdapter('pi', true, { searchPlugins: vi.fn().mockRejectedValue(new Error('timeout')) }),
      );

      await expect(manager.search('test')).rejects.toMatchObject({
        code: 'PLUGIN_ERROR',
      });
    });
  });

  // ── browse() ───────────────────────────────────────────────────────

  describe('browse()', () => {
    it('delegates to search with empty query', async () => {
      const searchFn = vi.fn().mockResolvedValue([
        { pluginId: 'popular', name: 'Popular', description: 'pop', latestVersion: '1.0.0' },
      ]);
      registry.register(
        createMockAdapter('opencode', true, { searchPlugins: searchFn }),
      );

      const results = await manager.browse({ category: 'coding', sortBy: 'downloads' });

      expect(searchFn).toHaveBeenCalled();
      expect(results).toHaveLength(1);
    });
  });

  // ── info() ─────────────────────────────────────────────────────────

  describe('info()', () => {
    it('returns plugin detail from specified agent', async () => {
      const searchFn = vi.fn().mockResolvedValue([
        {
          pluginId: 'my-plugin',
          name: 'My Plugin',
          description: 'desc',
          latestVersion: '1.0.0',
          versions: ['1.0.0'],
        },
      ]);
      registry.register(
        createMockAdapter('opencode', true, { searchPlugins: searchFn }),
      );

      const detail = await manager.info('my-plugin', 'opencode');
      expect(detail).toMatchObject({
        pluginId: 'my-plugin',
        agents: ['opencode'],
        formats: ['npm-package'],
        registry: 'npm',
      });
      expect(detail.versions).toEqual(['1.0.0']);
    });

    it('throws PLUGIN_ERROR when plugin not found', async () => {
      const searchFn = vi.fn().mockResolvedValue([]);
      registry.register(
        createMockAdapter('opencode', true, { searchPlugins: searchFn }),
      );

      await expect(
        manager.info('nonexistent', 'opencode'),
      ).rejects.toMatchObject({
        code: 'PLUGIN_ERROR',
      });
    });

    it('throws PLUGIN_ERROR when the scoped registry lookup fails', async () => {
      const searchFn = vi.fn().mockRejectedValue(new Error('registry offline'));
      registry.register(
        createMockAdapter('opencode', true, { searchPlugins: searchFn }),
      );

      await expect(
        manager.info('nonexistent', 'opencode'),
      ).rejects.toMatchObject({
        code: 'PLUGIN_ERROR',
      });
    });

    it('searches across all adapters when agent is omitted', async () => {
      const searchA = vi.fn().mockResolvedValue([]);
      const searchB = vi.fn().mockResolvedValue([
        { pluginId: 'found', name: 'Found', description: 'd', latestVersion: '1.0.0' },
      ]);

      registry.register(
        createMockAdapter('opencode', true, { searchPlugins: searchA }),
      );
      registry.register(
        createMockAdapter('pi', true, { searchPlugins: searchB }),
      );

      const detail = await manager.info('found');
      expect(detail.pluginId).toBe('found');
    });

    it('throws PLUGIN_ERROR when not found in any registry', async () => {
      const searchFn = vi.fn().mockResolvedValue([]);
      registry.register(
        createMockAdapter('opencode', true, { searchPlugins: searchFn }),
      );

      await expect(manager.info('nonexistent')).rejects.toMatchObject({
        code: 'PLUGIN_ERROR',
      });
    });

    it('throws PLUGIN_ERROR when every registry lookup fails', async () => {
      registry.register(
        createMockAdapter('opencode', true, { searchPlugins: vi.fn().mockRejectedValue(new Error('network')) }),
      );
      registry.register(
        createMockAdapter('pi', true, { searchPlugins: vi.fn().mockRejectedValue(new Error('timeout')) }),
      );

      await expect(manager.info('nonexistent')).rejects.toMatchObject({
        code: 'PLUGIN_ERROR',
      });
    });
  });

  // ── isInstalled() ──────────────────────────────────────────────────

  describe('isInstalled()', () => {
    it('returns true when plugin is in the installed list', async () => {
      const listPlugins = vi.fn().mockResolvedValue([
        { pluginId: 'my-plugin', name: 'My Plugin', version: '1.0.0', enabled: true },
      ]);
      registry.register(
        createMockAdapter('opencode', true, { listPlugins }),
      );

      const result = await manager.isInstalled('opencode', 'my-plugin');
      expect(result).toBe(true);
    });

    it('returns false when plugin is not installed', async () => {
      const listPlugins = vi.fn().mockResolvedValue([
        { pluginId: 'other-plugin', name: 'Other', version: '1.0.0', enabled: true },
      ]);
      registry.register(
        createMockAdapter('opencode', true, { listPlugins }),
      );

      const result = await manager.isInstalled('opencode', 'my-plugin');
      expect(result).toBe(false);
    });

    it('returns false when no plugins are installed', async () => {
      const listPlugins = vi.fn().mockResolvedValue([]);
      registry.register(
        createMockAdapter('opencode', true, { listPlugins }),
      );

      const result = await manager.isInstalled('opencode', 'any-plugin');
      expect(result).toBe(false);
    });
  });

  // ── Client integration ─────────────────────────────────────────────

  describe('client integration', () => {
    it('PluginManagerImpl is a PluginManager (duck-type check)', () => {
      expect(typeof manager.list).toBe('function');
      expect(typeof manager.install).toBe('function');
      expect(typeof manager.uninstall).toBe('function');
      expect(typeof manager.update).toBe('function');
      expect(typeof manager.updateAll).toBe('function');
      expect(typeof manager.search).toBe('function');
      expect(typeof manager.browse).toBe('function');
      expect(typeof manager.info).toBe('function');
      expect(typeof manager.isInstalled).toBe('function');
    });
  });
});
