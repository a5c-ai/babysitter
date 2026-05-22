/**
 * Plugin types for @a5c-ai/agent-mux.
 *
 * @see 09-plugin-manager.md §3–§8
 */

import type { AgentName, PluginFormat } from './types.js';

// ---------------------------------------------------------------------------
// InstalledPlugin (§3)
// ---------------------------------------------------------------------------

/**
 * Descriptor of a plugin currently installed for a specific agent.
 *
 * The `pluginId` is the canonical identifier used in `install()`,
 * `uninstall()`, and `update()` calls. Its format is agent-specific.
 */
export interface InstalledPlugin {
  /** Canonical plugin identifier. */
  pluginId: string;

  /** Human-readable display name. */
  name: string;

  /** Installed version string. Follows semver where applicable. */
  version: string;

  /** The agent this plugin is installed for. */
  agent: AgentName;

  /** The structural format of this plugin. */
  format: PluginFormat;

  /** Short description of the plugin's purpose. */
  description?: string;

  /** Timestamp when the plugin was installed. */
  installedAt: Date;

  /** Whether the plugin is currently enabled. */
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// PluginListing (§4)
// ---------------------------------------------------------------------------

/**
 * A plugin listing from a registry search or browse result.
 */
export interface PluginListing {
  /** Canonical plugin identifier. */
  pluginId: string;

  /** Human-readable display name. */
  name: string;

  /** Latest available version in the registry. */
  latestVersion: string;

  /** Short description of the plugin. */
  description: string;

  /** Author name or organization. */
  author: string;

  /** Weekly download count from the registry. */
  weeklyDownloads?: number;

  /** Agents that this plugin supports. */
  agents: AgentName[];

  /** The plugin formats this listing is available in. */
  formats: PluginFormat[];

  /** The registry this listing was sourced from. */
  registry: string;

  /** Searchable tags / keywords. */
  tags: string[];

  /** URL to the plugin's homepage or registry page. */
  url: string;
}

// ---------------------------------------------------------------------------
// PluginDetail (§5)
// ---------------------------------------------------------------------------

/**
 * Detailed information about a specific plugin. Extends PluginListing
 * with full content and metadata.
 */
export interface PluginDetail extends PluginListing {
  /** Full README content (Markdown). */
  readme?: string;

  /** Changelog content (Markdown or plain text). */
  changelog?: string;

  /** All published versions, sorted newest-first. */
  versions: string[];

  /** Runtime dependencies of the plugin. */
  dependencies?: string[];

  /** Minimum agent CLI version required, keyed by agent name. */
  agentMinVersions?: Record<AgentName, string>;
}

// ---------------------------------------------------------------------------
// PluginInstallOptions (§6)
// ---------------------------------------------------------------------------

/**
 * Options for plugin installation.
 */
export interface PluginInstallOptions {
  /** Pin to a specific version (semver string or range). */
  version?: string;

  /** Install globally (true) vs. project-local (false). */
  global?: boolean;

  /** Skip plugin integrity/signature verification. */
  skipVerify?: boolean;
}

// ---------------------------------------------------------------------------
// PluginSearchOptions (§7)
// ---------------------------------------------------------------------------

/**
 * Options for filtering plugin search results.
 */
export interface PluginSearchOptions {
  /** Filter results to plugins that support one or more of these agents. */
  agents?: AgentName[];

  /** Filter results to a specific plugin format. */
  format?: PluginFormat;

  /** Restrict the search to a specific registry by name. */
  registry?: string;

  /**
   * Maximum number of results to return.
   * Values < 1 are clamped to 1, values > 200 are clamped to 200.
   * @default 25
   */
  limit?: number;
}

// ---------------------------------------------------------------------------
// PluginBrowseOptions (§8)
// ---------------------------------------------------------------------------

/**
 * Options for browsing plugin listings by category and sort order.
 * Extends PluginSearchOptions, inheriting all filter fields.
 */
export interface PluginBrowseOptions extends PluginSearchOptions {
  /** Browse by category. Category values are registry-defined. */
  category?: string;

  /**
   * Sort order for browse results.
   * @default 'downloads'
   */
  sortBy?: 'downloads' | 'updated' | 'name';
}
