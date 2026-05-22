/**
 * PluginManager interface for @a5c-ai/agent-mux.
 *
 * @see 09-plugin-manager.md §2
 */

import type { AgentName } from './types.js';
import type {
  InstalledPlugin,
  PluginListing,
  PluginDetail,
  PluginInstallOptions,
  PluginSearchOptions,
  PluginBrowseOptions,
} from './plugin-types.js';

/**
 * Unified interface over each agent's native plugin system.
 *
 * All methods are capability-gated: calling any method on an agent where
 * `AgentCapabilities.supportsPlugins` is `false` throws a `CapabilityError`
 * with `code: 'CAPABILITY_ERROR'` and `capability: 'plugins'`.
 */
export interface PluginManager {
  /**
   * List all plugins currently installed for an agent.
   *
   * @throws {CapabilityError} If `supportsPlugins` is `false` for the agent.
   * @throws {AgentMuxError} With code `'AGENT_NOT_FOUND'` if agent is not registered.
   */
  list(agent: AgentName): Promise<InstalledPlugin[]>;

  /**
   * Install a plugin for an agent.
   *
   * @throws {CapabilityError} If `supportsPlugins` is `false` for the agent.
   * @throws {AgentMuxError} With code `'AGENT_NOT_FOUND'` if agent is not registered.
   * @throws {AgentMuxError} With code `'PLUGIN_ERROR'` if installation fails.
   */
  install(
    agent: AgentName,
    pluginId: string,
    options?: PluginInstallOptions,
  ): Promise<InstalledPlugin>;

  /**
   * Uninstall a plugin from an agent.
   *
   * @throws {CapabilityError} If `supportsPlugins` is `false` for the agent.
   * @throws {AgentMuxError} With code `'AGENT_NOT_FOUND'` if agent is not registered.
   * @throws {AgentMuxError} With code `'PLUGIN_ERROR'` if uninstallation fails.
   */
  uninstall(agent: AgentName, pluginId: string, options?: { global?: boolean }): Promise<void>;

  /**
   * Update a single installed plugin to its latest version.
   *
   * @throws {CapabilityError} If `supportsPlugins` is `false` for the agent.
   * @throws {AgentMuxError} With code `'AGENT_NOT_FOUND'` if agent is not registered.
   * @throws {AgentMuxError} With code `'PLUGIN_ERROR'` if the update fails.
   */
  update(agent: AgentName, pluginId: string): Promise<InstalledPlugin>;

  /**
   * Update all installed plugins for an agent to their latest versions.
   *
   * @throws {CapabilityError} If `supportsPlugins` is `false` for the agent.
   * @throws {AgentMuxError} With code `'AGENT_NOT_FOUND'` if agent is not registered.
   */
  updateAll(agent: AgentName): Promise<InstalledPlugin[]>;

  /**
   * Search for plugins across registries.
   *
   * @throws {AgentMuxError} With code `'PLUGIN_ERROR'` if all registries fail.
   */
  search(query: string, options?: PluginSearchOptions): Promise<PluginListing[]>;

  /**
   * Browse available plugins by agent or category.
   *
   * @throws {AgentMuxError} With code `'PLUGIN_ERROR'` if all registries fail.
   */
  browse(options?: PluginBrowseOptions): Promise<PluginListing[]>;

  /**
   * Get detailed information about a specific plugin.
   *
   * @throws {AgentMuxError} With code `'PLUGIN_ERROR'` if plugin is not found.
   */
  info(pluginId: string, agent?: AgentName): Promise<PluginDetail>;

  /**
   * Check whether a plugin is currently installed for an agent.
   *
   * @throws {CapabilityError} If `supportsPlugins` is `false` for the agent.
   * @throws {AgentMuxError} With code `'AGENT_NOT_FOUND'` if agent is not registered.
   */
  isInstalled(agent: AgentName, pluginId: string): Promise<boolean>;
}
