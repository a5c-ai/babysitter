/**
 * PluginManagerImpl — concrete implementation of the PluginManager interface.
 *
 * Every method resolves the target adapter from the AdapterRegistry,
 * checks `AgentCapabilities.supportsPlugins`, and delegates to the
 * adapter's optional plugin methods.
 *
 * @see 09-plugin-manager.md §2
 */

import type { AgentName, PluginFormat } from './types.js';
import type { AgentAdapter } from './adapter.js';
import type { AdapterRegistry } from './adapter-registry.js';
import { AgentMuxError, CapabilityError, ValidationError } from './errors.js';
import type { PluginManager } from './plugin-manager.js';
import type {
  InstalledPlugin,
  PluginListing,
  PluginDetail,
  PluginInstallOptions,
  PluginSearchOptions,
  PluginBrowseOptions,
} from './plugin-types.js';

/**
 * Concrete implementation of the PluginManager interface.
 * Delegates all operations to the appropriate agent adapter.
 */
export class PluginManagerImpl implements PluginManager {
  private readonly registry: AdapterRegistry;

  constructor(registry: AdapterRegistry) {
    this.registry = registry;
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  /**
   * Resolves the adapter and asserts that it supports plugins.
   * Throws AGENT_NOT_FOUND or CAPABILITY_ERROR as appropriate.
   */
  private assertPluginCapable(agent: AgentName): AgentAdapter {
    const adapter = this.registry.get(agent);
    if (!adapter) {
      throw new AgentMuxError(
        'AGENT_NOT_FOUND',
        `Agent '${agent}' is not registered`,
      );
    }
    if (!adapter.capabilities.supportsPlugins) {
      throw new CapabilityError(agent, 'plugins');
    }
    return adapter;
  }

  private defaultFormatForAdapter(adapter: AgentAdapter): PluginFormat {
    const format = adapter.capabilities.pluginFormats[0];
    return this.isPluginFormat(format) ? format : 'npm-package';
  }

  private isPluginFormat(value: unknown): value is PluginFormat {
    return value === 'npm-package'
      || value === 'skill-file'
      || value === 'skill-directory'
      || value === 'extension-ts'
      || value === 'channel-plugin'
      || value === 'mcp-server';
  }

  private normalizeDate(value: unknown, fallback: Date): Date {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return new Date(value.getTime());
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return new Date(fallback.getTime());
  }

  private sortInstalledPlugins(plugins: InstalledPlugin[]): InstalledPlugin[] {
    return [...plugins].sort(
      (a, b) => b.installedAt.getTime() - a.installedAt.getTime(),
    );
  }

  private normalizeInstalledPlugin(
    agent: AgentName,
    adapter: AgentAdapter,
    plugin: Partial<InstalledPlugin> & Pick<InstalledPlugin, 'pluginId' | 'name' | 'version'>,
    fallbackInstalledAt: Date = new Date(0),
  ): InstalledPlugin {
    return {
      pluginId: plugin.pluginId,
      name: plugin.name,
      version: plugin.version,
      agent,
      format: this.isPluginFormat(plugin.format)
        ? plugin.format
        : this.defaultFormatForAdapter(adapter),
      description: typeof plugin.description === 'string'
        ? plugin.description
        : undefined,
      installedAt: this.normalizeDate(plugin.installedAt, fallbackInstalledAt),
      enabled: typeof plugin.enabled === 'boolean' ? plugin.enabled : true,
    };
  }

  private normalizePluginListing(
    adapter: AgentAdapter,
    listing: Partial<PluginListing> & Pick<PluginListing, 'pluginId' | 'name' | 'latestVersion'>,
  ): PluginListing {
    const fallbackFormat = this.defaultFormatForAdapter(adapter);
    const formats = Array.isArray(listing.formats)
      ? listing.formats.filter((format): format is PluginFormat => this.isPluginFormat(format))
      : [];
    const agents = Array.isArray(listing.agents)
      ? listing.agents.filter((agent): agent is AgentName => typeof agent === 'string' && agent.length > 0)
      : [];
    const tags = Array.isArray(listing.tags)
      ? listing.tags.filter((tag): tag is string => typeof tag === 'string')
      : [];
    const registry = typeof listing.registry === 'string' && listing.registry.length > 0
      ? listing.registry
      : adapter.capabilities.pluginRegistries[0]?.name ?? adapter.agent;

    return {
      pluginId: listing.pluginId,
      name: listing.name,
      latestVersion: listing.latestVersion,
      description: typeof listing.description === 'string' ? listing.description : '',
      author: typeof listing.author === 'string' ? listing.author : registry,
      weeklyDownloads: typeof listing.weeklyDownloads === 'number'
        ? listing.weeklyDownloads
        : undefined,
      agents: agents.length > 0 ? agents : [adapter.agent],
      formats: formats.length > 0 ? formats : [fallbackFormat],
      registry,
      tags,
      url: typeof listing.url === 'string' ? listing.url : '',
    };
  }

  private normalizePluginDetail(
    adapter: AgentAdapter,
    detail: Partial<PluginDetail> & Pick<PluginDetail, 'pluginId' | 'name' | 'latestVersion'>,
  ): PluginDetail {
    const listing = this.normalizePluginListing(adapter, detail);
    const versions = Array.isArray(detail.versions)
      ? detail.versions.filter((version): version is string => typeof version === 'string')
      : [];
    const dependencies = Array.isArray(detail.dependencies)
      ? detail.dependencies.filter((dep): dep is string => typeof dep === 'string')
      : undefined;
    const agentMinVersions = detail.agentMinVersions && typeof detail.agentMinVersions === 'object'
      ? Object.fromEntries(
        Object.entries(detail.agentMinVersions).filter(
          ([agent, version]) => typeof agent === 'string' && typeof version === 'string',
        ),
      ) as Record<AgentName, string>
      : undefined;

    return {
      ...listing,
      readme: typeof detail.readme === 'string' ? detail.readme : undefined,
      changelog: typeof detail.changelog === 'string' ? detail.changelog : undefined,
      versions: versions.length > 0 ? versions : [listing.latestVersion],
      dependencies,
      agentMinVersions,
    };
  }

  private toPluginError(message: string, error: unknown): AgentMuxError {
    if (error instanceof AgentMuxError) {
      return error;
    }
    const suffix = error instanceof Error && error.message
      ? `: ${error.message}`
      : '';
    return new AgentMuxError('PLUGIN_ERROR', `${message}${suffix}`);
  }

  private assertNonEmptyValue(field: string, value: string): void {
    if (value.trim().length > 0) {
      return;
    }
    throw new ValidationError([{
      field,
      message: 'must not be empty',
      received: value,
      expected: 'non-empty string',
    }]);
  }

  private resolveSearchAdapters(agentNames?: AgentName[]): AgentAdapter[] {
    const adapters: AgentAdapter[] = [];

    if (agentNames) {
      for (const name of agentNames) {
        const adapter = this.registry.get(name);
        if (adapter && adapter.capabilities.supportsPlugins) {
          adapters.push(adapter);
        }
      }
      return adapters;
    }

    const allAdapters = this.registry.list();
    for (const info of allAdapters) {
      const adapter = this.registry.get(info.agent);
      if (adapter && adapter.capabilities.supportsPlugins) {
        adapters.push(adapter);
      }
    }
    return adapters;
  }

  private async searchAcrossAdapters(
    query: string,
    options: PluginSearchOptions | PluginBrowseOptions | undefined,
    allowEmptyQuery: boolean,
  ): Promise<PluginListing[]> {
    if (!allowEmptyQuery) {
      this.assertNonEmptyValue('query', query);
    }

    const adapters = this.resolveSearchAdapters(options?.agents);
    const allResults: PluginListing[] = [];
    const seen = new Set<string>();
    let attempted = 0;
    let failed = 0;

    for (const adapter of adapters) {
      if (!adapter.searchPlugins) {
        continue;
      }
      attempted += 1;
      try {
        const results = await adapter.searchPlugins(query, options);
        for (const listing of results) {
          const normalized = this.normalizePluginListing(
            adapter,
            listing as Partial<PluginListing> & Pick<PluginListing, 'pluginId' | 'name' | 'latestVersion'>,
          );
          if (!seen.has(normalized.pluginId)) {
            seen.add(normalized.pluginId);
            allResults.push(normalized);
          }
        }
      } catch {
        failed += 1;
      }
    }

    if (attempted > 0 && failed === attempted) {
      const operation = allowEmptyQuery ? 'browse plugin registries' : `search plugin registries for '${query}'`;
      throw new AgentMuxError('PLUGIN_ERROR', `Failed to ${operation}`);
    }

    const limit = options?.limit
      ? Math.min(Math.max(options.limit, 1), 200)
      : 25;
    return allResults.slice(0, limit);
  }

  // ── PluginManager interface ─────────────────────────────────────────

  async list(agent: AgentName): Promise<InstalledPlugin[]> {
    const adapter = this.assertPluginCapable(agent);
    if (!adapter.listPlugins) {
      return [];
    }
    try {
      const plugins = await adapter.listPlugins();
      return this.sortInstalledPlugins(
        plugins.map((plugin) => this.normalizeInstalledPlugin(agent, adapter, plugin)),
      );
    } catch (error) {
      throw this.toPluginError(`Failed to list plugins for agent '${agent}'`, error);
    }
  }

  async install(
    agent: AgentName,
    pluginId: string,
    options?: PluginInstallOptions,
  ): Promise<InstalledPlugin> {
    this.assertNonEmptyValue('pluginId', pluginId);
    const adapter = this.assertPluginCapable(agent);
    if (!adapter.installPlugin) {
      throw new AgentMuxError(
        'PLUGIN_ERROR',
        `Agent '${agent}' does not implement installPlugin`,
      );
    }
    try {
      const result = await adapter.installPlugin(pluginId, options);
      return this.normalizeInstalledPlugin(agent, adapter, result, new Date());
    } catch (error) {
      throw this.toPluginError(
        `Failed to install plugin '${pluginId}' for agent '${agent}'`,
        error,
      );
    }
  }

  async uninstall(agent: AgentName, pluginId: string, options?: { global?: boolean }): Promise<void> {
    this.assertNonEmptyValue('pluginId', pluginId);
    const adapter = this.assertPluginCapable(agent);
    if (!adapter.uninstallPlugin) {
      throw new AgentMuxError(
        'PLUGIN_ERROR',
        `Agent '${agent}' does not implement uninstallPlugin`,
      );
    }
    try {
      await adapter.uninstallPlugin(pluginId, options);
    } catch (error) {
      throw this.toPluginError(
        `Failed to uninstall plugin '${pluginId}' for agent '${agent}'`,
        error,
      );
    }
  }

  async update(agent: AgentName, pluginId: string): Promise<InstalledPlugin> {
    this.assertNonEmptyValue('pluginId', pluginId);
    const adapter = this.assertPluginCapable(agent);
    const installedPlugins = await this.list(agent);
    const currentPlugin = installedPlugins.find((plugin) => plugin.pluginId === pluginId);
    if (!currentPlugin) {
      throw new AgentMuxError(
        'PLUGIN_ERROR',
        `Plugin '${pluginId}' is not installed for agent '${agent}'`,
      );
    }
    if (!adapter.installPlugin) {
      throw new AgentMuxError(
        'PLUGIN_ERROR',
        `Agent '${agent}' does not implement installPlugin`,
      );
    }
    try {
      const result = await adapter.installPlugin(pluginId);
      return this.normalizeInstalledPlugin(
        agent,
        adapter,
        result,
        currentPlugin.installedAt,
      );
    } catch (error) {
      throw this.toPluginError(
        `Failed to update plugin '${pluginId}' for agent '${agent}'`,
        error,
      );
    }
  }

  async updateAll(agent: AgentName): Promise<InstalledPlugin[]> {
    const adapter = this.assertPluginCapable(agent);
    const plugins = await this.list(agent);
    if (plugins.length === 0) {
      return [];
    }
    if (!adapter.installPlugin) {
      throw new AgentMuxError(
        'PLUGIN_ERROR',
        `Agent '${agent}' does not implement installPlugin`,
      );
    }
    const results: InstalledPlugin[] = [];
    const failures: string[] = [];
    for (const plugin of plugins) {
      try {
        const updated = await adapter.installPlugin(plugin.pluginId);
        results.push(this.normalizeInstalledPlugin(
          agent,
          adapter,
          updated,
          plugin.installedAt,
        ));
      } catch {
        failures.push(plugin.pluginId);
      }
    }
    if (failures.length > 0) {
      throw new AgentMuxError(
        'PLUGIN_ERROR',
        `Failed to update plugins for agent '${agent}': ${failures.join(', ')}`,
      );
    }
    return this.sortInstalledPlugins(results);
  }

  async search(
    query: string,
    options?: PluginSearchOptions,
  ): Promise<PluginListing[]> {
    return this.searchAcrossAdapters(query, options, false);
  }

  async browse(options?: PluginBrowseOptions): Promise<PluginListing[]> {
    return this.searchAcrossAdapters('', options, true);
  }

  async info(pluginId: string, agent?: AgentName): Promise<PluginDetail> {
    this.assertNonEmptyValue('pluginId', pluginId);
    if (agent) {
      const adapter = this.assertPluginCapable(agent);
      if (!adapter.searchPlugins) {
        throw new AgentMuxError(
          'PLUGIN_ERROR',
          `Agent '${agent}' does not implement searchPlugins`,
        );
      }
      try {
        const results = await adapter.searchPlugins(pluginId);
        if (results.length > 0) {
          return this.normalizePluginDetail(
            adapter,
            results[0] as Partial<PluginDetail> & Pick<PluginDetail, 'pluginId' | 'name' | 'latestVersion'>,
          );
        }
      } catch (error) {
        throw this.toPluginError(
          `Failed to look up plugin '${pluginId}' for agent '${agent}'`,
          error,
        );
      }
      throw new AgentMuxError(
        'PLUGIN_ERROR',
        `Plugin '${pluginId}' not found for agent '${agent}'`,
      );
    }

    const adapters = this.resolveSearchAdapters();
    let attempted = 0;
    let failed = 0;

    for (const adapter of adapters) {
      if (!adapter.searchPlugins) {
        continue;
      }
      attempted += 1;
      try {
        const results = await adapter.searchPlugins(pluginId);
        if (results.length > 0) {
          return this.normalizePluginDetail(
            adapter,
            results[0] as Partial<PluginDetail> & Pick<PluginDetail, 'pluginId' | 'name' | 'latestVersion'>,
          );
        }
      } catch {
        failed += 1;
      }
    }

    if (attempted > 0 && failed === attempted) {
      throw new AgentMuxError(
        'PLUGIN_ERROR',
        `Failed to look up plugin '${pluginId}' in any registry`,
      );
    }

    throw new AgentMuxError(
      'PLUGIN_ERROR',
      `Plugin '${pluginId}' not found in any registry`,
    );
  }

  async isInstalled(agent: AgentName, pluginId: string): Promise<boolean> {
    this.assertNonEmptyValue('pluginId', pluginId);
    const plugins = await this.list(agent);
    return plugins.some((p) => p.pluginId === pluginId);
  }
}
