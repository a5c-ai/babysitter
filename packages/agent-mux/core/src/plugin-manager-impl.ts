/**
 * PluginManagerImpl — concrete implementation of the PluginManager interface.
 *
 * Every method resolves the target adapter from the AdapterRegistry,
 * checks `AgentCapabilities.supportsPlugins`, and delegates to the
 * adapter's optional plugin methods.
 *
 * @see 09-plugin-manager.md §2
 */

import type { AgentName } from './types.js';
import type { AgentAdapter } from './adapter.js';
import type { AdapterRegistry } from './adapter-registry.js';
import { AgentMuxError, CapabilityError } from './errors.js';
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

  // ── PluginManager interface ─────────────────────────────────────────

  async list(agent: AgentName): Promise<InstalledPlugin[]> {
    const adapter = this.assertPluginCapable(agent);
    if (!adapter.listPlugins) {
      return [];
    }
    const plugins = await adapter.listPlugins();
    return plugins as unknown as InstalledPlugin[];
  }

  async install(
    agent: AgentName,
    pluginId: string,
    options?: PluginInstallOptions,
  ): Promise<InstalledPlugin> {
    const adapter = this.assertPluginCapable(agent);
    if (!adapter.installPlugin) {
      throw new AgentMuxError(
        'PLUGIN_ERROR',
        `Agent '${agent}' does not implement installPlugin`,
      );
    }
    const result = await adapter.installPlugin(pluginId, options);
    return result as unknown as InstalledPlugin;
  }

  async uninstall(agent: AgentName, pluginId: string, options?: { global?: boolean }): Promise<void> {
    const adapter = this.assertPluginCapable(agent);
    if (!adapter.uninstallPlugin) {
      throw new AgentMuxError(
        'PLUGIN_ERROR',
        `Agent '${agent}' does not implement uninstallPlugin`,
      );
    }
    await adapter.uninstallPlugin(pluginId, options);
  }

  async update(agent: AgentName, pluginId: string): Promise<InstalledPlugin> {
    const adapter = this.assertPluginCapable(agent);
    // update = uninstall + install (adapters may override if they have native update)
    if (!adapter.installPlugin) {
      throw new AgentMuxError(
        'PLUGIN_ERROR',
        `Agent '${agent}' does not implement installPlugin`,
      );
    }
    const result = await adapter.installPlugin(pluginId);
    return result as unknown as InstalledPlugin;
  }

  async updateAll(agent: AgentName): Promise<InstalledPlugin[]> {
    const adapter = this.assertPluginCapable(agent);
    if (!adapter.listPlugins) {
      return [];
    }
    const plugins = await adapter.listPlugins();
    if (!adapter.installPlugin) {
      return plugins as unknown as InstalledPlugin[];
    }
    const results: InstalledPlugin[] = [];
    for (const plugin of plugins) {
      try {
        const updated = await adapter.installPlugin(plugin.pluginId);
        results.push(updated as unknown as InstalledPlugin);
      } catch {
        // Keep the current version on failure
        results.push(plugin as unknown as InstalledPlugin);
      }
    }
    return results;
  }

  async search(
    query: string,
    options?: PluginSearchOptions,
  ): Promise<PluginListing[]> {
    const agentNames = options?.agents;
    const adapters: AgentAdapter[] = [];

    if (agentNames) {
      for (const name of agentNames) {
        const adapter = this.registry.get(name);
        if (adapter && adapter.capabilities.supportsPlugins) {
          adapters.push(adapter);
        }
      }
    } else {
      // Search across all plugin-capable adapters
      const allAdapters = this.registry.list();
      for (const info of allAdapters) {
        const adapter = this.registry.get(info.agent);
        if (adapter && adapter.capabilities.supportsPlugins) {
          adapters.push(adapter);
        }
      }
    }

    const allResults: PluginListing[] = [];
    const seen = new Set<string>();

    for (const adapter of adapters) {
      if (!adapter.searchPlugins) continue;
      try {
        const results = await adapter.searchPlugins(query, options);
        for (const listing of results) {
          const l = listing as unknown as PluginListing;
          if (!seen.has(l.pluginId)) {
            seen.add(l.pluginId);
            allResults.push(l);
          }
        }
      } catch {
        // Partial failures are tolerated per spec
      }
    }

    const limit = options?.limit
      ? Math.min(Math.max(options.limit, 1), 200)
      : 25;
    return allResults.slice(0, limit);
  }

  async browse(options?: PluginBrowseOptions): Promise<PluginListing[]> {
    // Browse delegates to search with an empty query, since browse is a
    // superset of search options. Adapters that support browse-specific
    // behavior will handle the options internally.
    return this.search('', options);
  }

  async info(pluginId: string, agent?: AgentName): Promise<PluginDetail> {
    if (agent) {
      const adapter = this.assertPluginCapable(agent);
      if (adapter.searchPlugins) {
        const results = await adapter.searchPlugins(pluginId);
        if (results.length > 0) {
          return results[0] as unknown as PluginDetail;
        }
      }
      throw new AgentMuxError(
        'PLUGIN_ERROR',
        `Plugin '${pluginId}' not found for agent '${agent}'`,
      );
    }

    // Search all plugin-capable adapters
    const allAdapters = this.registry.list();
    for (const info of allAdapters) {
      const adapter = this.registry.get(info.agent);
      if (!adapter || !adapter.capabilities.supportsPlugins || !adapter.searchPlugins) {
        continue;
      }
      try {
        const results = await adapter.searchPlugins(pluginId);
        if (results.length > 0) {
          return results[0] as unknown as PluginDetail;
        }
      } catch {
        // Continue searching other adapters
      }
    }

    throw new AgentMuxError(
      'PLUGIN_ERROR',
      `Plugin '${pluginId}' not found in any registry`,
    );
  }

  async isInstalled(agent: AgentName, pluginId: string): Promise<boolean> {
    const plugins = await this.list(agent);
    return plugins.some((p) => p.pluginId === pluginId);
  }
}
