# Plugin Manager and Plugin Ecosystem

**Specification v1.0** | `@a5c-ai/agent-mux`

> **SCOPE EXTENSION:** hermes-agent (`@NousResearch/hermes-agent`) is included as a 10th supported agent per explicit project requirements from the project owner. It extends the original scope document's 9 built-in agents. All hermes-specific content in this spec is marked with this same scope extension note.

---

## 1. Overview

This specification defines the `PluginManager` interface and the complete plugin ecosystem for agent-mux. The plugin system provides a unified interface for discovering, installing, updating, and removing plugins across all supported agents, despite each agent having a fundamentally different native plugin architecture.

The `PluginManager` is accessed via `mux.plugins` on the `AgentMuxClient`:

```typescript
const mux = createClient();

// List installed plugins for an agent:
const plugins = await mux.plugins.list('openclaw');

// Install a plugin:
const installed = await mux.plugins.install('opencode', 'opencode-tokenscope');

// Search across registries:
const results = await mux.plugins.search('web browser', { agents: ['openclaw'] });

// Browse by category:
const browsed = await mux.plugins.browse({ category: 'coding', sortBy: 'downloads' });

// Get detailed info:
const detail = await mux.plugins.info('@openclaw/browser-skill', 'openclaw');

// Update all plugins for an agent:
const updated = await mux.plugins.updateAll('omp');

// Uninstall:
await mux.plugins.uninstall('pi', '@mariozechner/pi-subagents');
```

### 1.1 Design Principles

1. **Adapter delegation.** The `PluginManager` does not implement plugin logic directly. It delegates every operation to the target agent's adapter via the optional plugin methods on `AgentAdapter` (`listPlugins()`, `installPlugin()`, `uninstallPlugin()`, `searchPlugins()`). The manager orchestrates; the adapter knows the native plugin system.

2. **Capability gating.** Every `PluginManager` method checks `AgentCapabilities.supportsPlugins` before delegation. Calling any method on an agent where `supportsPlugins` is `false` throws a `CapabilityError` with `capability: 'plugins'`. This applies to Codex, Gemini, and Copilot.

3. **Format-aware.** Plugins come in six structural formats (`PluginFormat`). The manager and adapters are format-aware: npm-based plugins use `npm install`, skill files are copied, MCP servers are configured, etc. Consumers can filter by format in search and browse operations.

4. **Registry federation.** Plugin search and browse aggregate results from multiple registries (npm, openclaw.ai/plugins, agentskills.io, cursor.sh/extensions). Each adapter declares which registries it sources from via `AgentCapabilities.pluginRegistries`.

5. **Partial support is explicit.** Claude Code has `supportsPlugins: true` in the boolean `AgentCapabilities` interface, but its plugin support is limited in scope compared to agents like OpenClaw or Pi: it supports skill directories (via `--add-dir`) and MCP server configuration, but has no native install/search CLI or marketplace. The adapter implements `listPlugins()` and `installPlugin()` through filesystem and config file operations rather than CLI delegation. See Section 13.3 for details.

6. **No shadowing.** agent-mux does not maintain its own plugin registry or database. It reads the agent's native plugin state on every call. There is no cached or shadow plugin list.

### 1.2 Cross-References

| Type / Concept | Spec | Section |
|---|---|---|
| `AgentName`, `BuiltInAgentName` | `01-core-types-and-client.md` | 1.4 |
| `AgentMuxClient`, `createClient()` | `01-core-types-and-client.md` | 5 |
| `ErrorCode`, `AgentMuxError` | `01-core-types-and-client.md` | 3.1 |
| `CapabilityError` | `01-core-types-and-client.md` | 3.2 |
| `ValidationError` | `01-core-types-and-client.md` | 3.3 |
| `AgentAdapter` (full contract) | `05-adapter-system.md` | 2 |
| `AgentAdapter.listPlugins()` | `05-adapter-system.md` | 2 |
| `AgentAdapter.installPlugin()` | `05-adapter-system.md` | 2 |
| `AgentAdapter.uninstallPlugin()` | `05-adapter-system.md` | 2 |
| `AgentAdapter.searchPlugins()` | `05-adapter-system.md` | 2 |
| `AgentCapabilities.supportsPlugins` | `06-capabilities-and-models.md` | 2 |
| `AgentCapabilities.pluginFormats` | `06-capabilities-and-models.md` | 2 |
| `AgentCapabilities.pluginRegistries` | `06-capabilities-and-models.md` | 2 |
| `PluginFormat` | `06-capabilities-and-models.md` | 3.1 |
| `PluginRegistry` (incl. `searchable`) | `06-capabilities-and-models.md` | 3.2 |
| `AgentCapabilities.pluginInstallCmd`, etc. | `06-capabilities-and-models.md` | 2 |
| Plugin events (`plugin_loaded`, `plugin_invoked`, `plugin_error`) | `04-agent-events.md` | 14 |
| `McpServerConfig` | `02-run-options-and-profiles.md` | 4 |

---

## 2. PluginManager Interface

The `PluginManager` is the unified entry point for all plugin operations across agents. It is accessible as `mux.plugins` and provides nine methods covering the complete plugin lifecycle: listing, installing, uninstalling, updating, searching, browsing, and inspecting plugins.

Every method accepts an `AgentName` parameter (or infers one from context) and delegates to the corresponding adapter. All methods are async and capability-gated.

```typescript
/**
 * Unified interface over each agent's native plugin system.
 *
 * All methods are capability-gated: calling any method on an agent where
 * `AgentCapabilities.supportsPlugins` is `false` throws a `CapabilityError`
 * with `code: 'CAPABILITY_ERROR'` and `capability: 'plugins'`.
 *
 * The PluginManager does not implement plugin logic directly. It resolves
 * the target adapter from the AdapterRegistry, verifies the capability gate,
 * and delegates to the adapter's optional plugin methods.
 *
 * @see AgentAdapter plugin methods in 05-adapter-system.md, Section 2.
 * @see AgentCapabilities.supportsPlugins in 06-capabilities-and-models.md, Section 2.
 */
interface PluginManager {

  /**
   * List all plugins currently installed for an agent.
   *
   * Delegates to `AgentAdapter.listPlugins()`. Returns an empty array if
   * the agent supports plugins but none are installed.
   *
   * @param agent - The agent to query. Must be a registered AgentName.
   * @returns Array of installed plugin descriptors, sorted by `installedAt`
   *   descending (most recently installed first).
   *
   * @throws {CapabilityError} If `supportsPlugins` is `false` for the agent.
   *   Error code: `'CAPABILITY_ERROR'`, capability: `'plugins'`.
   * @throws {AgentMuxError} With code `'AGENT_NOT_FOUND'` if the agent
   *   is not registered in the AdapterRegistry.
   * @throws {AgentMuxError} With code `'PLUGIN_ERROR'` if the underlying
   *   adapter operation fails (e.g., native CLI returns non-zero exit code).
   *
   * @example
   * ```typescript
   * const plugins = await mux.plugins.list('openclaw');
   * for (const p of plugins) {
   *   console.log(`${p.name}@${p.version} [${p.format}] enabled=${p.enabled}`);
   * }
   * ```
   */
  list(agent: AgentName): Promise<InstalledPlugin[]>;

  /**
   * Install a plugin for an agent.
   *
   * Delegates to `AgentAdapter.installPlugin()`. The plugin identifier format
   * depends on the agent and plugin format:
   * - npm-package: npm package name (e.g., `'opencode-tokenscope'`, `'@openclaw/browser-skill'`)
   * - skill-file: file path or URL to the skill definition
   * - skill-directory: directory path containing the skill bundle
   * - extension-ts: extension identifier from cursor.sh/extensions
   * - channel-plugin: OpenClaw channel plugin identifier
   * - mcp-server: MCP server name or package identifier
   *
   * @param agent - The agent to install the plugin for.
   * @param pluginId - Plugin identifier. Format is agent-specific (see above).
   * @param options - Optional installation options (version pinning, scope, verification).
   * @returns Descriptor of the newly installed plugin.
   *
   * @throws {CapabilityError} If `supportsPlugins` is `false` for the agent.
   *   Error code: `'CAPABILITY_ERROR'`, capability: `'plugins'`.
   * @throws {AgentMuxError} With code `'AGENT_NOT_FOUND'` if the agent
   *   is not registered.
   * @throws {AgentMuxError} With code `'PLUGIN_ERROR'` if installation fails
   *   (e.g., package not found on registry, network error, version conflict,
   *   incompatible plugin format for the target agent).
   * @throws {ValidationError} If `pluginId` is empty or `options` contains
   *   invalid values (e.g., malformed version string).
   *
   * @example
   * ```typescript
   * const plugin = await mux.plugins.install('opencode', 'opencode-tokenscope', {
   *   version: '1.2.0',
   *   global: true,
   * });
   * console.log(`Installed ${plugin.name}@${plugin.version}`);
   * ```
   */
  install(
    agent: AgentName,
    pluginId: string,
    options?: PluginInstallOptions
  ): Promise<InstalledPlugin>;

  /**
   * Uninstall a plugin from an agent.
   *
   * Delegates to `AgentAdapter.uninstallPlugin()`. The plugin is identified
   * by its `pluginId` as returned by `list()` or `install()`.
   *
   * @param agent - The agent to uninstall the plugin from.
   * @param pluginId - Plugin identifier to remove.
   *
   * @throws {CapabilityError} If `supportsPlugins` is `false` for the agent.
   *   Error code: `'CAPABILITY_ERROR'`, capability: `'plugins'`.
   * @throws {AgentMuxError} With code `'AGENT_NOT_FOUND'` if the agent
   *   is not registered.
   * @throws {AgentMuxError} With code `'PLUGIN_ERROR'` if the plugin is
   *   not installed or uninstallation fails.
   * @throws {ValidationError} If `pluginId` is empty.
   *
   * @example
   * ```typescript
   * await mux.plugins.uninstall('openclaw', '@openclaw/browser-skill');
   * ```
   */
  uninstall(agent: AgentName, pluginId: string): Promise<void>;

  /**
   * Update a single installed plugin to its latest version.
   *
   * The adapter resolves the latest available version from the plugin's
   * source registry and performs an in-place update. If the plugin is
   * already at the latest version, returns the current descriptor unchanged.
   *
   * @param agent - The agent whose plugin to update.
   * @param pluginId - Plugin identifier to update.
   * @returns Descriptor of the updated plugin (with new version).
   *
   * @throws {CapabilityError} If `supportsPlugins` is `false` for the agent.
   *   Error code: `'CAPABILITY_ERROR'`, capability: `'plugins'`.
   * @throws {AgentMuxError} With code `'AGENT_NOT_FOUND'` if the agent
   *   is not registered.
   * @throws {AgentMuxError} With code `'PLUGIN_ERROR'` if the plugin is
   *   not installed or the update fails.
   *
   * @example
   * ```typescript
   * const updated = await mux.plugins.update('omp', '@oh-my-pi/web-tools');
   * console.log(`Updated to ${updated.version}`);
   * ```
   */
  update(agent: AgentName, pluginId: string): Promise<InstalledPlugin>;

  /**
   * Update all installed plugins for an agent to their latest versions.
   *
   * Iterates over all installed plugins, checks each for available updates,
   * and updates those that have newer versions. Returns the full list of
   * installed plugins after the update pass (including those that were
   * already at the latest version).
   *
   * @param agent - The agent whose plugins to update.
   * @returns Array of all installed plugins after the update pass.
   *
   * @throws {CapabilityError} If `supportsPlugins` is `false` for the agent.
   *   Error code: `'CAPABILITY_ERROR'`, capability: `'plugins'`.
   * @throws {AgentMuxError} With code `'AGENT_NOT_FOUND'` if the agent
   *   is not registered.
   * @throws {AgentMuxError} With code `'PLUGIN_ERROR'` if any update fails.
   *   The error message includes the plugin identifier(s) that failed.
   *   Successfully updated plugins are not rolled back.
   *
   * @example
   * ```typescript
   * const all = await mux.plugins.updateAll('openclaw');
   * console.log(`${all.length} plugins now installed`);
   * ```
   */
  updateAll(agent: AgentName): Promise<InstalledPlugin[]>;

  /**
   * Search for plugins across registries.
   *
   * Performs a federated search across all registries declared by matching
   * adapters. When `options.agents` is specified, only those agents' registries
   * are queried. When omitted, all registries from all plugin-capable agents
   * are searched.
   *
   * Results are deduplicated by `pluginId`. If the same plugin appears in
   * multiple registries, the listing from the first matching registry (by
   * adapter registration order) is used.
   *
   * @param query - Free-text search query. Matched against plugin name,
   *   description, tags, and author.
   * @param options - Optional filters for agents, format, registry, and
   *   result limit.
   * @returns Array of matching plugin listings, sorted by relevance
   *   (registry-defined). Empty array if no matches.
   *
   * @throws {AgentMuxError} With code `'PLUGIN_ERROR'` if all searched
   *   registries fail. Partial failures are tolerated: results from
   *   successful registries are returned, and failed registries are logged
   *   at debug level.
   * @throws {ValidationError} If `query` is empty.
   *
   * @example
   * ```typescript
   * const results = await mux.plugins.search('web browser', {
   *   agents: ['openclaw', 'opencode'],
   *   format: 'npm-package',
   *   limit: 20,
   * });
   * ```
   */
  search(query: string, options?: PluginSearchOptions): Promise<PluginListing[]>;

  /**
   * Browse available plugins by agent or category.
   *
   * Unlike `search()`, `browse()` does not require a text query. It returns
   * curated or categorized listings from registries that support browsing.
   * Useful for discovery UIs and CLI exploration.
   *
   * @param options - Optional filters for agents, format, registry, category,
   *   sort order, and result limit.
   * @returns Array of plugin listings matching the browse criteria.
   *
   * @throws {AgentMuxError} With code `'PLUGIN_ERROR'` if all browsed
   *   registries fail. Partial failures are tolerated.
   *
   * @example
   * ```typescript
   * const popular = await mux.plugins.browse({
   *   agents: ['opencode'],
   *   category: 'coding',
   *   sortBy: 'downloads',
   *   limit: 50,
   * });
   * ```
   */
  browse(options?: PluginBrowseOptions): Promise<PluginListing[]>;

  /**
   * Get detailed information about a specific plugin.
   *
   * Returns extended metadata including README content, changelog, version
   * history, dependencies, and per-agent minimum version requirements.
   *
   * When `agent` is specified, the detail is fetched from that agent's
   * registry. When omitted, the manager queries all plugin-capable agents'
   * registries and returns the first match.
   *
   * @param pluginId - The plugin identifier to look up.
   * @param agent - Optional agent to scope the lookup to a specific registry.
   * @returns Detailed plugin information.
   *
   * @throws {AgentMuxError} With code `'PLUGIN_ERROR'` if the plugin is
   *   not found in any searched registry.
   * @throws {ValidationError} If `pluginId` is empty.
   *
   * @example
   * ```typescript
   * const detail = await mux.plugins.info('@openclaw/browser-skill', 'openclaw');
   * console.log(detail.readme);
   * console.log(`Versions: ${detail.versions.join(', ')}`);
   * ```
   */
  info(pluginId: string, agent?: AgentName): Promise<PluginDetail>;
}
```

### 2.1 Capability Gate Implementation

Every `PluginManager` method follows the same capability gate pattern before delegation:

```typescript
// Internal implementation pattern (pseudocode):
private assertPluginCapable(agent: AgentName): AgentAdapter {
  const adapter = this.registry.get(agent);
  // Throws AGENT_NOT_FOUND if not registered
  if (!adapter) {
    throw new AgentMuxError('AGENT_NOT_FOUND', `Agent '${agent}' is not registered`);
  }

  if (!adapter.capabilities.supportsPlugins) {
    throw new CapabilityError(agent, 'plugins');
    // CapabilityError.code is always 'CAPABILITY_ERROR'
    // CapabilityError.recoverable is always false
  }

  return adapter;
}
```

The following agents will always throw `CapabilityError` from any `PluginManager` method:

| Agent | `supportsPlugins` | Reason |
|---|---|---|
| `codex` | `false` | No plugin/extension system |
| `gemini` | `false` | No plugin/extension system |
| `copilot` | `false` | No plugin/extension system |

### 2.2 Adapter Delegation Flow

```
Consumer                  PluginManager              AdapterRegistry         AgentAdapter
   |                           |                           |                      |
   |-- list('openclaw') ------>|                           |                      |
   |                           |-- get('openclaw') ------->|                      |
   |                           |<-- OpenClawAdapter -------|                      |
   |                           |                                                  |
   |                           |-- check supportsPlugins                          |
   |                           |   (true -> proceed)                              |
   |                           |                                                  |
   |                           |-- listPlugins() -------------------------------->|
   |                           |<-- InstalledPlugin[] ----------------------------|
   |                           |                                                  |
   |<-- InstalledPlugin[] -----|                                                  |
```

---

## 3. InstalledPlugin Interface

Represents a plugin that is currently installed for a specific agent. Returned by `list()`, `install()`, `update()`, and `updateAll()`.

```typescript
/**
 * Descriptor of a plugin currently installed for a specific agent.
 *
 * The `pluginId` is the canonical identifier used in `install()`,
 * `uninstall()`, and `update()` calls. Its format is agent-specific:
 * - npm-package agents: npm package name (e.g., '@openclaw/browser-skill')
 * - skill-file agents: filename or registry identifier
 * - extension-ts (Cursor): extension identifier
 * - channel-plugin (OpenClaw): channel plugin identifier
 * - mcp-server: server name from the agent's MCP config
 */
interface InstalledPlugin {
  /**
   * Canonical plugin identifier. Used as the key for install, uninstall,
   * and update operations. Format is agent- and format-specific.
   *
   * @example 'opencode-tokenscope'
   * @example '@openclaw/browser-skill'
   * @example '@mariozechner/pi-subagents'
   * @example 'my-mcp-server'
   */
  pluginId: string;

  /**
   * Human-readable display name of the plugin.
   * Typically the npm package name's last segment or the skill's title.
   *
   * @example 'tokenscope'
   * @example 'Browser Skill'
   */
  name: string;

  /**
   * Installed version string. Follows semver where applicable.
   * For non-versioned plugins (e.g., local skill files), this is
   * `'0.0.0'` or the file's last-modified timestamp as an ISO string.
   *
   * @example '1.2.0'
   * @example '2024-03-15T10:30:00Z'
   */
  version: string;

  /**
   * The agent this plugin is installed for.
   *
   * @see AgentName in 01-core-types-and-client.md, Section 1.4.
   */
  agent: AgentName;

  /**
   * The structural format of this plugin.
   *
   * @see PluginFormat in 06-capabilities-and-models.md, Section 3.1.
   */
  format: PluginFormat;

  /**
   * Short description of the plugin's purpose. May be absent for
   * locally installed skill files that lack metadata.
   */
  description?: string;

  /**
   * Timestamp when the plugin was installed. For npm packages, this is
   * derived from the package's install time in node_modules. For skill
   * files, it is the file creation time.
   */
  installedAt: Date;

  /**
   * Whether the plugin is currently enabled. Most agents do not distinguish
   * between installed and enabled; for those, this is always `true`.
   * Cursor extensions and OpenClaw channel-plugins support explicit
   * enable/disable toggling.
   */
  enabled: boolean;
}
```

### 3.1 InstalledPlugin Field Summary

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `pluginId` | `string` | Yes | -- | Canonical identifier for install/uninstall/update operations. |
| `name` | `string` | Yes | -- | Human-readable display name. |
| `version` | `string` | Yes | -- | Installed version (semver or timestamp). |
| `agent` | `AgentName` | Yes | -- | Agent this plugin is installed for. |
| `format` | `PluginFormat` | Yes | -- | Structural format of the plugin. |
| `description` | `string` | No | `undefined` | Short description. |
| `installedAt` | `Date` | Yes | -- | Installation timestamp. |
| `enabled` | `boolean` | Yes | -- | Whether the plugin is active. |

---

## 4. PluginListing Interface

Represents a plugin available in a registry, returned by `search()` and `browse()`. Contains metadata for display and filtering but not the full detail available via `info()`.

```typescript
/**
 * A plugin listing from a registry search or browse result.
 * Contains enough metadata for display in a list view and for
 * filtering by agent, format, and tags.
 */
interface PluginListing {
  /**
   * Canonical plugin identifier. Same format as `InstalledPlugin.pluginId`.
   *
   * @example '@openclaw/browser-skill'
   * @example 'opencode-tokenscope'
   */
  pluginId: string;

  /**
   * Human-readable display name.
   */
  name: string;

  /**
   * Latest available version in the registry.
   */
  latestVersion: string;

  /**
   * Short description of the plugin. Always present in registry listings
   * (unlike `InstalledPlugin.description` which may be absent for local files).
   */
  description: string;

  /**
   * Author name or organization.
   *
   * @example 'OpenClaw Team'
   * @example 'NousResearch'
   */
  author: string;

  /**
   * Weekly download count from the registry. Present for npm-based
   * registries; absent for registries that do not track downloads.
   */
  weeklyDownloads?: number;

  /**
   * Agents that this plugin supports. A plugin may support multiple agents
   * (e.g., an npm-package skill that works with both opencode and pi).
   */
  agents: AgentName[];

  /**
   * The plugin formats this listing is available in.
   * A single plugin may be available in multiple formats
   * (e.g., both npm-package and skill-file).
   */
  formats: PluginFormat[];

  /**
   * The registry this listing was sourced from.
   * Matches a `PluginRegistry.name` value.
   *
   * @example 'npm'
   * @example 'openclaw-registry'
   * @example 'agentskills-hub'
   */
  registry: string;

  /**
   * Searchable tags / keywords.
   *
   * @example ['web', 'browser', 'scraping']
   */
  tags: string[];

  /**
   * URL to the plugin's homepage or registry page.
   *
   * @example 'https://www.npmjs.com/package/@openclaw/browser-skill'
   * @example 'https://openclaw.ai/plugins/@openclaw/browser-skill'
   */
  url: string;
}
```

### 4.1 PluginListing Field Summary

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `pluginId` | `string` | Yes | -- | Canonical plugin identifier. |
| `name` | `string` | Yes | -- | Human-readable display name. |
| `latestVersion` | `string` | Yes | -- | Latest available version. |
| `description` | `string` | Yes | -- | Short description. |
| `author` | `string` | Yes | -- | Author or organization. |
| `weeklyDownloads` | `number` | No | `undefined` | Weekly download count (registry-dependent). |
| `agents` | `AgentName[]` | Yes | -- | Agents this plugin supports. |
| `formats` | `PluginFormat[]` | Yes | -- | Available plugin formats. |
| `registry` | `string` | Yes | -- | Source registry name. |
| `tags` | `string[]` | Yes | -- | Searchable tags. |
| `url` | `string` | Yes | -- | Plugin homepage or registry page URL. |

---

## 5. PluginDetail Interface

Extended plugin information returned by `info()`. Extends `PluginListing` with README content, changelog, version history, dependencies, and per-agent minimum version requirements.

```typescript
/**
 * Detailed information about a specific plugin. Extends PluginListing
 * with full content and metadata that is too expensive to include in
 * search/browse results.
 */
interface PluginDetail extends PluginListing {
  /**
   * Full README content (Markdown). Fetched from the registry or the
   * plugin's package metadata. May be absent if the plugin has no README.
   */
  readme?: string;

  /**
   * Changelog content (Markdown or plain text). Fetched from the registry
   * or the plugin's CHANGELOG file. May be absent.
   */
  changelog?: string;

  /**
   * All published versions, sorted newest-first (semver descending).
   *
   * @example ['2.1.0', '2.0.0', '1.5.3', '1.5.2', '1.0.0']
   */
  versions: string[];

  /**
   * Runtime dependencies of the plugin. For npm packages, these are the
   * `dependencies` from `package.json`. For skill files, these are
   * declared tool or library requirements.
   *
   * @example ['puppeteer', '@anthropic-ai/sdk']
   */
  dependencies?: string[];

  /**
   * Minimum agent CLI version required for this plugin, keyed by agent name.
   * The adapter validates this during `install()` and warns if the installed
   * agent version is below the minimum.
   *
   * @example { opencode: '0.5.0', pi: '1.2.0' }
   */
  agentMinVersions?: Record<AgentName, string>;
}
```

### 5.1 PluginDetail Additional Field Summary

These fields are in addition to those inherited from `PluginListing` (Section 4.1).

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `readme` | `string` | No | `undefined` | Full README content (Markdown). |
| `changelog` | `string` | No | `undefined` | Changelog content. |
| `versions` | `string[]` | Yes | -- | All published versions, newest first. |
| `dependencies` | `string[]` | No | `undefined` | Runtime dependencies. |
| `agentMinVersions` | `Record<AgentName, string>` | No | `undefined` | Minimum agent versions per agent. |

---

## 6. PluginInstallOptions Interface

Options for the `install()` method, controlling version pinning, install scope, and verification behavior.

```typescript
/**
 * Options for plugin installation.
 *
 * All fields are optional. When omitted, the adapter uses its defaults:
 * latest version, project-local scope (where supported), with verification
 * enabled.
 */
interface PluginInstallOptions {
  /**
   * Pin to a specific version. Must be a valid semver string or semver range.
   * When omitted, the adapter installs the latest version from the registry.
   *
   * @example '1.2.0'
   * @example '^1.0.0'
   */
  version?: string;

  /**
   * Install globally (true) vs. project-local (false).
   *
   * Not all agents distinguish between global and project-local plugins.
   * For agents that do not support scoped installs, this option is silently
   * ignored.
   *
   * | Agent | Global/Local Support |
   * |---|---|
   * | OpenCode | Yes -- global: `~/.config/opencode/plugins/`, local: `.opencode/plugins/` |
   * | Claude Code | No -- skill directories are always passed via `--add-dir` per-run |
   * | Cursor | No -- extensions are always user-global |
   * | Pi | No -- global only (`~/.pi/agent/plugins/`) |
   * | omp | No -- global only (`~/.omp/agent/plugins/`) |
   * | OpenClaw | Yes -- global: `~/.openclaw/plugins/`, local: `.openclaw/plugins/` |
   * | Hermes | No -- global only (`~/.hermes/skills/`) |
   *
   * @default false (project-local where supported)
   */
  global?: boolean;

  /**
   * Skip plugin integrity/signature verification where available.
   *
   * **Security warning:** Setting this to `true` bypasses the registry's
   * integrity checks. Only use for development, local testing, or when
   * installing from trusted private registries.
   *
   * Currently applicable to:
   * - npm-package plugins: skips npm's `--ignore-scripts` safety (allows
   *   postinstall scripts to run)
   * - OpenClaw registry plugins: skips signature verification
   *
   * @default false
   *
   * @see Section 18 (Security Considerations) for full implications.
   */
  skipVerify?: boolean;
}
```

### 6.1 PluginInstallOptions Field Summary

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `version` | `string` | No | `undefined` (latest) | Semver version or range to pin. |
| `global` | `boolean` | No | `false` | Global vs. project-local install scope. |
| `skipVerify` | `boolean` | No | `false` | Skip integrity/signature verification. |

---

## 7. PluginSearchOptions Interface

Options for the `search()` method, controlling which agents, formats, registries, and result limits to apply.

```typescript
/**
 * Options for filtering plugin search results.
 *
 * All fields are optional. When all are omitted, the search queries
 * all registries from all plugin-capable agents with a default limit
 * of 25 results.
 */
interface PluginSearchOptions {
  /**
   * Filter results to plugins that support one or more of these agents.
   * When omitted, results include plugins for any agent.
   *
   * @example ['openclaw', 'opencode']
   */
  agents?: AgentName[];

  /**
   * Filter results to a specific plugin format.
   * When omitted, results include all formats.
   *
   * @see PluginFormat in 06-capabilities-and-models.md, Section 3.1.
   */
  format?: PluginFormat;

  /**
   * Restrict the search to a specific registry by name.
   * Must match a `PluginRegistry.name` value from a registered adapter's
   * capabilities. When omitted, all applicable registries are searched.
   *
   * @example 'npm'
   * @example 'openclaw-registry'
   */
  registry?: string;

  /**
   * Maximum number of results to return.
   * Applies after deduplication and filtering.
   *
   * Values outside the valid range are clamped: values < 1 are treated
   * as 1, values > 200 are treated as 200. No error is thrown for
   * out-of-range values.
   *
   * @default 25
   * @minimum 1
   * @maximum 200
   */
  limit?: number;
}
```

### 7.1 PluginSearchOptions Field Summary

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `agents` | `AgentName[]` | No | `undefined` (all agents) | Filter by supported agent(s). |
| `format` | `PluginFormat` | No | `undefined` (all formats) | Filter by plugin format. |
| `registry` | `string` | No | `undefined` (all registries) | Restrict to a specific registry. |
| `limit` | `number` | No | `25` | Maximum results to return. |

---

## 8. PluginBrowseOptions Interface

Options for the `browse()` method. Extends `PluginSearchOptions` with category filtering and sort order.

```typescript
/**
 * Options for browsing plugin listings by category and sort order.
 * Extends PluginSearchOptions, inheriting all filter fields.
 */
interface PluginBrowseOptions extends PluginSearchOptions {
  /**
   * Browse by category. Category values are registry-defined.
   * Common categories across registries:
   * - `'coding'`         -- code generation, refactoring, analysis
   * - `'communication'`  -- chat, messaging, notifications
   * - `'automation'`     -- CI/CD, deployment, workflow
   * - `'data'`           -- databases, APIs, data transformation
   * - `'testing'`        -- test generation, coverage, assertions
   * - `'security'`       -- vulnerability scanning, secrets management
   *
   * When omitted, no category filter is applied.
   */
  category?: string;

  /**
   * Sort order for browse results.
   * - `'downloads'` -- most downloaded first (default for browse)
   * - `'updated'`   -- most recently updated first
   * - `'name'`      -- alphabetical by plugin name
   *
   * @default 'downloads'
   */
  sortBy?: 'downloads' | 'updated' | 'name';
}
```

### 8.1 PluginBrowseOptions Additional Field Summary

These fields are in addition to those inherited from `PluginSearchOptions` (Section 7.1). Inherited fields include `agents`, `format`, `registry`, and `limit` (default: 25, clamped to 1–200).

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `category` | `string` | No | `undefined` | Category filter. |
| `sortBy` | `'downloads' \| 'updated' \| 'name'` | No | `'downloads'` | Sort order for results. |

---

## 9. Plugin Support Matrix

This table summarizes plugin support across all ten built-in agents. The `supportsPlugins` value in `AgentCapabilities` determines whether the `PluginManager` will accept operations for that agent.

| Agent | `supportsPlugins` | Formats | Registries | Native Install CLI | Native List CLI | Native Search CLI |
|---|---|---|---|---|---|---|
| Claude Code | `true` | `skill-directory`, `mcp-server` | -- | -- | -- | -- |
| Codex CLI | `false` | -- | -- | -- | -- | -- |
| Gemini CLI | `false` | -- | -- | -- | -- | -- |
| Copilot CLI | `false` | -- | -- | -- | -- | -- |
| Cursor | `true` | `extension-ts`, `mcp-server` | `cursor-extensions` | `cursor --install-extension <id>` | `cursor --list-extensions` | -- |
| OpenCode | `true` | `npm-package`, `skill-file`, `mcp-server` | `npm` (`opencode-*`) | `opencode plugins install <id>` | `opencode plugins list` | `opencode plugins search <q>` |
| Pi | `true` | `npm-package`, `skill-file` | `npm` (`@mariozechner/pi-*`) | `pi plugins install <id>` | `pi plugins list` | `pi plugins search <q>` |
| omp | `true` | `npm-package`, `skill-file` | `npm` (`@oh-my-pi/*`) | `omp plugins install <id>` | `omp plugins list` | `omp plugins search <q>` |
| OpenClaw | `true` | `npm-package`, `skill-file`, `channel-plugin` | `npm` + `openclaw-registry` | `openclaw plugins install <id>` | `openclaw plugins list` | `openclaw plugins search <q>` |
| Hermes | `true` | `skill-file`, `skill-directory`, `mcp-server` | `agentskills-hub` | `hermes skills install <id>` | `hermes skills list` | `hermes skills search <q>` |

> **SCOPE EXTENSION:** The Hermes row above is a scope extension. Hermes uses `hermes skills` as its native CLI namespace rather than `hermes plugins`.

### 9.1 PluginFormat Support Matrix

Detailed mapping of which agents support which `PluginFormat` values:

| PluginFormat | Claude | Codex | Gemini | Copilot | Cursor | OpenCode | Pi | omp | OpenClaw | Hermes |
|---|---|---|---|---|---|---|---|---|---|---|
| `npm-package` | -- | -- | -- | -- | -- | Yes | Yes | Yes | Yes | -- |
| `skill-file` | -- | -- | -- | -- | -- | Yes | Yes | Yes | Yes | Yes |
| `skill-directory` | Yes | -- | -- | -- | -- | -- | -- | -- | -- | Yes |
| `extension-ts` | -- | -- | -- | -- | Yes | -- | -- | -- | -- | -- |
| `channel-plugin` | -- | -- | -- | -- | -- | -- | -- | -- | Yes | -- |
| `mcp-server` | Yes | -- | -- | -- | Yes | Yes | -- | -- | -- | Yes |

> **SCOPE EXTENSION:** Hermes supports `skill-file`, `skill-directory`, and `mcp-server` formats. Skill files and directories are stored in `~/.hermes/skills/`. MCP server configurations are stored in `~/.hermes/mcp.json`.

---

## 10. Per-Agent Plugin Behavior

This section describes how each agent's adapter implements plugin operations. These details are essential for implementers.

### 10.1 Claude Code (limited scope)

Claude Code does not have a native plugin install/search CLI. `AgentCapabilities.supportsPlugins` is `true` (boolean), but the scope of plugin operations is narrower than agents with dedicated plugin ecosystems: it supports skill directories (loaded via `--add-dir` at run time) and MCP server configuration (stored in `~/.claude/settings.json` under `mcpServers`). There is no marketplace or registry integration.

**list:** Reads `~/.claude/settings.json` to enumerate configured MCP servers. Scans directories specified in prior `--add-dir` invocations (tracked via agent-mux's run index). Each MCP server entry becomes an `InstalledPlugin` with `format: 'mcp-server'`. Skill directories produce entries with `format: 'skill-directory'`.

**install (skill-directory):** Copies or symlinks the specified directory into a well-known location. The adapter records the path so subsequent runs can include it via `--add-dir`.

**install (mcp-server):** Writes the MCP server configuration into `~/.claude/settings.json` under the `mcpServers` key. Uses the same config merge semantics as `ConfigManager.set()` (see `08-config-and-auth.md`, Section 2).

**uninstall:** Removes the MCP server entry from settings or removes the skill directory symlink.

**update:** Not applicable for skill directories (local files). For MCP servers backed by npm packages, delegates to `npm update` for the underlying package.

**search:** Not supported. Claude Code has no native plugin registry. The adapter's `searchPlugins()` method is not implemented; `PluginManager.search()` with `agents: ['claude']` returns an empty array.

### 10.2 Codex CLI (no support)

`supportsPlugins: false`. All `PluginManager` methods throw `CapabilityError`.

### 10.3 Gemini CLI (no support)

`supportsPlugins: false`. All `PluginManager` methods throw `CapabilityError`.

### 10.4 Copilot CLI (no support)

`supportsPlugins: false`. All `PluginManager` methods throw `CapabilityError`.

### 10.5 Cursor

Cursor supports TypeScript extensions and MCP servers.

**list:** Invokes `cursor --list-extensions` and parses the output. Each extension becomes an `InstalledPlugin` with `format: 'extension-ts'`. MCP servers are read from `~/.cursor/settings.json` under the `mcpServers` key.

**install (extension-ts):** Invokes `cursor --install-extension <pluginId>`. The adapter parses stdout for success/failure messages.

**install (mcp-server):** Writes the MCP server config into `~/.cursor/settings.json`.

**uninstall:** Invokes `cursor --uninstall-extension <pluginId>` for extensions. Removes config entry for MCP servers.

**update:** Invokes `cursor --install-extension <pluginId>` (Cursor's install command updates if already installed).

**search:** Cursor does not expose a CLI search command. The adapter queries `cursor.sh/extensions` via HTTPS and parses the JSON response. Requires network access.

### 10.6 OpenCode

OpenCode has a full native plugin CLI and npm-based registry.

**list:** Invokes `opencode plugins list --json` and parses the JSON array output.

**install:** Invokes `opencode plugins install <pluginId>` with optional `--version <v>` flag. For MCP servers, writes to `~/.config/opencode/opencode.json` under the `mcpServers` key.

**uninstall:** Invokes `opencode plugins uninstall <pluginId>`.

**update:** Invokes `opencode plugins update <pluginId>`.

**search:** Invokes `opencode plugins search <query> --json`. Searches the npm registry filtering by the `opencode-` prefix convention.

**Plugin directory:** Global: `~/.config/opencode/plugins/`. Project-local: `.opencode/plugins/`.

### 10.7 Pi

Pi uses npm packages with the `@mariozechner/pi-` prefix convention.

**list:** Invokes `pi plugins list --json`.

**install:** Invokes `pi plugins install <pluginId>`. Version pinning is passed as `pi plugins install <pluginId>@<version>`.

**uninstall:** Invokes `pi plugins uninstall <pluginId>`.

**update:** Invokes `pi plugins update <pluginId>`.

**search:** Invokes `pi plugins search <query> --json`. Searches npm for packages matching `@mariozechner/pi-*`.

**Plugin directory:** `~/.pi/agent/plugins/`.

### 10.8 omp (oh-my-pi)

omp follows the same plugin architecture as Pi but with the `@oh-my-pi/` npm scope.

**list:** Invokes `omp plugins list --json`.

**install:** Invokes `omp plugins install <pluginId>`. Version pinning: `omp plugins install <pluginId>@<version>`.

**uninstall:** Invokes `omp plugins uninstall <pluginId>`.

**update:** Invokes `omp plugins update <pluginId>`.

**search:** Invokes `omp plugins search <query> --json`. Searches npm for packages matching `@oh-my-pi/*`.

**Plugin directory:** `~/.omp/agent/plugins/`.

### 10.9 OpenClaw

OpenClaw has the richest plugin ecosystem among the supported agents, with three distinct plugin formats and two registries.

**list:** Invokes `openclaw plugins list --json`. Returns npm-packages, skill-files, and channel-plugins in a unified JSON array.

**install (npm-package / skill-file):** Invokes `openclaw plugins install <pluginId>`. Supports `--version`, `--global` flags.

**install (channel-plugin):** Invokes `openclaw plugins install <pluginId> --type channel`. Channel plugins are messaging gateway connectors for Telegram, Discord, Slack, WhatsApp, Matrix, etc.

**uninstall:** Invokes `openclaw plugins uninstall <pluginId>`.

**update:** Invokes `openclaw plugins update <pluginId>`.

**search:** Invokes `openclaw plugins search <query> --json`. Searches both the npm registry (for `@openclaw/*` and general npm plugins) and the OpenClaw plugin registry at `openclaw.ai/plugins`.

**Plugin directory:** Global: `~/.openclaw/plugins/`. Project-local: `.openclaw/plugins/`.

**Registries:**
- npm (`https://registry.npmjs.org/`) -- for npm-packages
- OpenClaw Plugin Registry (`https://openclaw.ai/plugins`) -- curated directory with categories, ratings, and verified badges

### 10.10 Hermes

> **SCOPE EXTENSION:** Hermes agent (`@NousResearch/hermes-agent`) is a scope extension.

Hermes uses the `hermes skills` CLI namespace. It supports skill files, skill directories, and MCP servers. Hermes has a unique feature: **auto-generated skills** -- after completing certain tasks, Hermes can automatically generate skill files and save them to `~/.hermes/skills/auto/` for reuse. See Section 17.1 for details.

**list:** Invokes `hermes skills list --json`. Returns both manually installed and auto-generated skills. Auto-generated skills have a metadata flag `autoGenerated: true` in the JSON output; the adapter maps this to the `InstalledPlugin` type with `description` prefixed by `[auto-generated]`.

**install (skill-file):** Invokes `hermes skills install <pluginId>`. Downloads from the agentskills.io registry or installs from a local file path.

**install (skill-directory):** Copies or symlinks the directory into `~/.hermes/skills/`.

**install (mcp-server):** Writes MCP server configuration to `~/.hermes/mcp.json`.

**uninstall:** Invokes `hermes skills uninstall <pluginId>`. Auto-generated skills can also be uninstalled.

**update:** Invokes `hermes skills update <pluginId>`. Only applicable to registry-sourced skills.

**search:** Invokes `hermes skills search <query> --json`. Searches the agentskills.io registry.

**Plugin directory:** `~/.hermes/skills/` (manual), `~/.hermes/skills/auto/` (auto-generated).

**Registry:** agentskills.io (`https://agentskills.io/`) -- NousResearch's skill marketplace with community contributions.

---

## 11. PluginFormat Semantics

Each `PluginFormat` value (defined in `06-capabilities-and-models.md`, Section 3.1) has specific semantics for installation, loading, and lifecycle management.

### 11.1 `npm-package`

An npm-installable package containing skill definitions, tools, or agent extensions.

- **Installation:** `npm install <package-name>` in the agent's plugin directory. The adapter may use `--save` or `--no-save` depending on the agent's convention.
- **Version management:** Full semver support via npm. Version pinning, ranges, and `npm update` are all supported.
- **Loading:** The agent loads the package at startup via `require()` or dynamic `import()`. The package must export a well-known entry point (agent-specific).
- **Used by:** OpenCode (`opencode-*` prefix), Pi (`@mariozechner/pi-*`), omp (`@oh-my-pi/*`), OpenClaw (any npm package with agent-mux plugin metadata).

### 11.2 `skill-file`

A single file (typically Markdown, YAML, or JSON) defining a skill: its name, description, instructions, and optionally tool definitions.

- **Installation:** File is downloaded from a registry URL or copied from a local path into the agent's skills directory.
- **Version management:** Limited. Registries may track versions; local files are unversioned.
- **Loading:** The agent reads the file at startup or on demand. The file format is agent-specific (Markdown for OpenCode/Pi/omp, YAML for Hermes).
- **Used by:** OpenCode, Pi, omp, OpenClaw, Hermes.

### 11.3 `skill-directory`

A directory containing multiple files that together constitute a skill bundle: instructions, tool definitions, examples, templates, etc.

- **Installation:** Directory is copied, symlinked, or cloned into the agent's skills directory.
- **Version management:** Limited. Git-based directories can track versions via tags.
- **Loading:** Claude Code loads via `--add-dir <path>` at run time. Hermes scans `~/.hermes/skills/` subdirectories at startup.
- **Used by:** Claude Code, Hermes.

### 11.4 `extension-ts`

A TypeScript extension file following Cursor's extension API.

- **Installation:** Installed via `cursor --install-extension <id>`. Downloaded from cursor.sh/extensions.
- **Version management:** Managed by Cursor's built-in extension system.
- **Loading:** Cursor loads extensions at editor startup. CLI mode loads a subset relevant to headless operation.
- **Used by:** Cursor only.

### 11.5 `channel-plugin`

A messaging channel connector plugin specific to OpenClaw. Enables OpenClaw to operate on messaging platforms (Telegram, Discord, Slack, WhatsApp, Matrix, etc.).

- **Installation:** Installed via `openclaw plugins install <id> --type channel`.
- **Version management:** npm-based; follows the same versioning as `npm-package`.
- **Loading:** OpenClaw loads channel plugins at startup and registers them as message transport adapters.
- **Typical examples:** `@openclaw/telegram-channel`, `@openclaw/discord-channel`, `@openclaw/slack-channel`.
- **Used by:** OpenClaw only.

### 11.6 `mcp-server`

An MCP (Model Context Protocol) server that the agent connects to as a client, extending its tool capabilities.

- **Installation:** The MCP server process is installed separately (typically via npm or pip). The plugin "installation" consists of writing the server's configuration (name, command, args, env) into the agent's config file.
- **Version management:** Managed by the underlying package manager (npm, pip). The config file references the server command, not a version.
- **Loading:** The agent spawns the MCP server as a subprocess at run time and communicates via the MCP protocol (JSON-RPC over stdio or HTTP+SSE).
- **Config locations:**
  - Claude Code: `~/.claude/settings.json` → `mcpServers`
  - Cursor: `~/.cursor/settings.json` → `mcpServers`
  - OpenCode: `~/.config/opencode/opencode.json` → `mcpServers`
  - Hermes: `~/.hermes/mcp.json`
- **Used by:** Claude Code, Cursor, OpenCode, Hermes. (Note: OpenClaw supports MCP as a tool protocol (`supportsMCP: true`) but does not use `mcp-server` as a `PluginFormat` — its plugin formats are `npm-package`, `skill-file`, and `channel-plugin` per scope §11.)

> **SCOPE EXTENSION:** Hermes supports MCP in both client mode (connecting to external MCP servers) and server mode (exposing itself as an MCP server via `hermes-acp`). The `mcp-server` plugin format refers to the client mode only.

---

## 12. Marketplace and Registry Integration

Plugin discovery relies on a set of registries, each serving different agent ecosystems. The `PluginManager.search()` and `browse()` methods federate queries across these registries.

### 12.1 Registry Catalog

| Registry Name | URL | Agents | Searchable | Formats | Notes |
|---|---|---|---|---|---|
| `npm` | `https://registry.npmjs.org/` | OpenCode, Pi, omp, OpenClaw | Yes | `npm-package` | Filtered by agent-specific naming conventions |
| `openclaw-registry` | `https://openclaw.ai/plugins` | OpenClaw | Yes | `npm-package`, `skill-file`, `channel-plugin` | Curated with categories, ratings, verified badges |
| `agentskills-hub` | `https://agentskills.io/` | Hermes | Yes | `skill-file`, `skill-directory` | NousResearch community skill marketplace. Note: does not serve `mcp-server` plugins -- Hermes MCP servers are installed by direct config edit only (see Section 10.10). |
| `cursor-extensions` | `https://cursor.sh/extensions` | Cursor | Yes | `extension-ts` | Cursor's official extension marketplace |

> **SCOPE EXTENSION:** The `agentskills-hub` registry is specific to hermes-agent.

### 12.2 npm Registry Conventions

Each npm-based agent uses naming conventions to identify its plugins in the npm registry:

| Agent | npm Naming Convention | Example Packages |
|---|---|---|
| OpenCode | `opencode-*` prefix | `opencode-tokenscope`, `opencode-git-tools` |
| Pi | `@mariozechner/pi-*` scope/prefix | `@mariozechner/pi-subagents`, `@mariozechner/pi-web` |
| omp | `@oh-my-pi/*` scope | `@oh-my-pi/web-tools`, `@oh-my-pi/code-review` |
| OpenClaw | `@openclaw/*` scope or any package with `openclaw-plugin` keyword | `@openclaw/browser-skill`, `@openclaw/telegram-channel` |

When `PluginManager.search()` queries npm, each agent's adapter applies its naming convention as a filter. For example, the OpenCode adapter searches npm for packages matching `opencode-*` that contain the query terms.

### 12.3 OpenClaw Plugin Registry

The OpenClaw Plugin Registry (`openclaw.ai/plugins`) is a curated directory that provides:

- **Categories:** coding, communication, automation, data, testing, security
- **Verified badges:** Plugins reviewed and approved by the OpenClaw team
- **Ratings and reviews:** Community feedback
- **Cross-agent metadata:** Plugins that also work with other agents are tagged accordingly

The registry exposes a JSON API at `https://openclaw.ai/plugins/api/v1/` with endpoints:
- `GET /search?q=<query>&category=<cat>&sort=<sort>&limit=<n>`
- `GET /browse?category=<cat>&sort=<sort>&limit=<n>`
- `GET /plugins/<pluginId>`

### 12.4 agentskills.io Registry

> **SCOPE EXTENSION:** This registry is specific to hermes-agent.

The agentskills.io registry (`https://agentskills.io/`) is NousResearch's community skill marketplace. It provides:

- **Skill files and directories:** Both single-file and bundled skills
- **Community contributions:** Anyone can publish skills
- **Auto-generated skill sharing:** Hermes users can optionally share auto-generated skills
- **Tagging and categorization:** Skills tagged by domain, language, and complexity

The registry exposes a JSON API at `https://agentskills.io/api/v1/` with endpoints:
- `GET /search?q=<query>&limit=<n>`
- `GET /browse?category=<cat>&sort=<sort>&limit=<n>`
- `GET /skills/<skillId>`

### 12.5 Cursor Extension Marketplace

The Cursor extension marketplace (`cursor.sh/extensions`) provides TypeScript extensions for Cursor. It follows a VS Code-like extension model. The adapter queries the marketplace via HTTPS and parses the response.

Cursor does not expose a CLI search command; the adapter makes direct HTTPS requests to the marketplace API.

---

## 13. Capability Gating

All `PluginManager` methods are gated by the `supportsPlugins` field in `AgentCapabilities` (see `06-capabilities-and-models.md`, Section 2). This section specifies the gating behavior in detail.

### 13.1 Gate Check

Before every operation, the `PluginManager` performs:

1. **Resolve the adapter.** Looks up the adapter by `AgentName` in the `AdapterRegistry`. If not found, throws `AgentMuxError` with code `'AGENT_NOT_FOUND'`.
2. **Check capability.** Reads `adapter.capabilities.supportsPlugins`. If `false`, throws `CapabilityError` with `agent` set to the target agent and `capability` set to `'plugins'`.
3. **Check adapter method.** Verifies the adapter implements the required optional method (e.g., `listPlugins()` for `list()`). If the method is undefined despite `supportsPlugins: true`, throws `AgentMuxError` with code `'INTERNAL'` (this indicates a bug in the adapter).

### 13.2 Capability Error Shape

```typescript
// Thrown when calling any PluginManager method on a non-plugin agent:
throw new CapabilityError('codex', 'plugins');
// Error properties:
//   code: 'CAPABILITY_ERROR'
//   message: "Agent 'codex' does not support plugins"
//   agent: 'codex'
//   capability: 'plugins'
//   recoverable: false
```

See `01-core-types-and-client.md`, Section 3.2 for the full `CapabilityError` definition.

### 13.3 Partial Support (Claude Code)

Claude Code's `supportsPlugins` is `true` but with limited scope:

- `list()` -- supported (returns MCP servers and tracked skill directories)
- `install()` -- supported for `skill-directory` and `mcp-server` formats only
- `uninstall()` -- supported
- `update()` -- supported only for MCP server packages; no-ops for skill directories
- `updateAll()` -- updates MCP server packages only
- `search()` -- returns empty array (no native registry)
- `browse()` -- returns empty array
- `info()` -- returns `PluginDetail` for installed plugins only (no registry lookup)

Consumers can detect partial support by examining `AgentCapabilities.pluginFormats` and `AgentCapabilities.pluginRegistries` (which will be empty for Claude Code).

---

## 14. Plugin Lifecycle

Plugins follow a five-stage lifecycle. Not all agents support every stage explicitly; the adapter normalizes agent-specific behavior into this model.

```
  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌───────────┐     ┌─────────────┐
  │ INSTALL  │────>│  ENABLE  │────>│  UPDATE  │────>│  DISABLE  │────>│  UNINSTALL  │
  └──────────┘     └──────────┘     └──────────┘     └───────────┘     └─────────────┘
       │                │                │                 │                   │
       │                │                │                 │                   │
       v                v                v                 v                   v
  install()        (automatic)      update()          (automatic)       uninstall()
  returns          enabled=true     returns           enabled=false      removes all
  InstalledPlugin  in next list()   InstalledPlugin   (if supported)     traces
```

### 14.1 Install

Triggered by `mux.plugins.install(agent, pluginId, options)`. The adapter:

1. Resolves the plugin from the registry (or local path).
2. Downloads/copies the plugin files to the agent's plugin directory.
3. For npm-packages: runs `npm install` (with `--ignore-scripts` unless `skipVerify: true`).
4. For MCP servers: writes configuration to the agent's config file.
5. Returns an `InstalledPlugin` descriptor.

### 14.2 Enable

Most agents automatically enable a plugin upon installation. The `enabled` field in `InstalledPlugin` reflects this:

| Agent | Auto-enable on install | Explicit enable/disable |
|---|---|---|
| Claude Code | Yes | No |
| Cursor | Yes | Yes (via extension management) |
| OpenCode | Yes | No |
| Pi | Yes | No |
| omp | Yes | No |
| OpenClaw | Yes | Yes (channel-plugins can be disabled) |
| Hermes | Yes | No |

For agents that support explicit enable/disable, the adapter toggles the `enabled` field when the plugin is enabled or disabled through the agent's native CLI.

### 14.3 Update

Triggered by `mux.plugins.update(agent, pluginId)` or `mux.plugins.updateAll(agent)`. The adapter:

1. Checks the registry for a newer version.
2. If a newer version exists, performs the update (typically `npm update` for npm-packages, re-download for skill-files).
3. Returns the updated `InstalledPlugin` with the new version.
4. If already at latest, returns the current descriptor unchanged.

### 14.4 Disable

Not all agents support disabling plugins without uninstalling them. Where supported:

- **Cursor:** Extensions can be disabled via `cursor --disable-extension <id>`.
- **OpenClaw:** Channel plugins can be disabled via `openclaw plugins disable <id>`.
- **Other agents:** Disabling is equivalent to uninstalling.

The `PluginManager` does not expose explicit `enable()` / `disable()` methods in v1. These operations are performed through the agent's native CLI or config. The `InstalledPlugin.enabled` field reflects the current state.

### 14.5 Uninstall

Triggered by `mux.plugins.uninstall(agent, pluginId)`. The adapter:

1. Removes the plugin files from the agent's plugin directory.
2. For npm-packages: runs `npm uninstall`.
3. For MCP servers: removes the configuration entry from the agent's config file.
4. For skill-files/directories: deletes or unlinks the file/directory.

---

## 15. CLI Commands

The CLI exposes plugin operations under the `amux plugins` namespace. All commands respect capability gating and produce the same errors as the SDK methods.

### 15.1 `amux plugins list`

```
amux plugins list <agent>
  --json              Output as JSON array of InstalledPlugin objects
```

Lists all installed plugins for the specified agent. Default output is a human-readable table:

```
$ amux plugins list openclaw
  Plugin                        Version  Format         Enabled
  @openclaw/browser-skill       2.1.0    npm-package    yes
  @openclaw/telegram-channel    1.5.2    channel-plugin yes
  my-custom-skill               0.0.0    skill-file     yes

3 plugins installed for openclaw
```

JSON output (`--json`):

```json
[
  {
    "pluginId": "@openclaw/browser-skill",
    "name": "browser-skill",
    "version": "2.1.0",
    "agent": "openclaw",
    "format": "npm-package",
    "description": "Web browsing and scraping capabilities",
    "installedAt": "2026-03-15T10:30:00.000Z",
    "enabled": true
  }
]
```

### 15.2 `amux plugins install`

```
amux plugins install <agent> <plugin-id>
  --version <version>   Pin to specific version
  --global              Install globally (vs project-local)
  --skip-verify         Skip integrity checks (security risk)
  --yes, -y             Skip confirmation prompt
```

Installs a plugin for the specified agent. Without `--yes`, prompts for confirmation before installing:

```
$ amux plugins install openclaw @openclaw/browser-skill
Install @openclaw/browser-skill (latest) for openclaw? [y/N] y
Installed @openclaw/browser-skill@2.1.0 for openclaw
```

### 15.3 `amux plugins uninstall`

```
amux plugins uninstall <agent> <plugin-id>
  --yes, -y             Skip confirmation prompt
```

Uninstalls a plugin from the specified agent.

```
$ amux plugins uninstall openclaw @openclaw/browser-skill
Uninstall @openclaw/browser-skill from openclaw? [y/N] y
Uninstalled @openclaw/browser-skill from openclaw
```

### 15.4 `amux plugins update`

```
amux plugins update <agent> <plugin-id>
amux plugins update <agent> --all
```

Updates a single plugin or all plugins for an agent.

```
$ amux plugins update openclaw --all
Checking for updates...
  @openclaw/browser-skill       2.1.0 → 2.2.0  updated
  @openclaw/telegram-channel    1.5.2           up to date
  my-custom-skill               0.0.0           up to date (local)

1 plugin updated, 2 already up to date
```

### 15.5 `amux plugins search`

```
amux plugins search <query>
  --agent <agent>       Filter by agent
  --format <format>     Filter by plugin format
  --registry <name>     Search specific registry only
  --limit <n>           Maximum results (default: 25)
  --json                Output as JSON array
```

Searches across registries for plugins matching the query.

```
$ amux plugins search "web browser" --agent openclaw
  Plugin                    Version  Agent     Downloads  Description
  @openclaw/browser-skill   2.2.0    openclaw  1,250/wk   Web browsing and scraping capabilities
  @openclaw/web-runner      1.0.3    openclaw  340/wk     Headless browser automation

2 results from 2 registries
```

### 15.6 `amux plugins browse`

```
amux plugins browse [agent]
  --category <cat>      Filter by category
  --sort <field>        Sort by: downloads | updated | name
  --limit <n>           Maximum results (default: 25)
  --format <format>     Filter by plugin format
  --registry <name>     Browse specific registry only
  --json                Output as JSON array
```

Browses plugin listings by category and sort order.

```
$ amux plugins browse opencode --category coding --sort downloads
  Plugin                    Version  Downloads  Description
  opencode-tokenscope       1.2.0    3,450/wk   Token usage analysis and optimization
  opencode-git-tools        2.0.1    2,100/wk   Advanced git operations
  opencode-test-gen         0.9.0    1,800/wk   AI-powered test generation

3 results from npm
```

### 15.7 `amux plugins info`

```
amux plugins info <plugin-id> [--agent <agent>]
  --json                Output as JSON PluginDetail object
```

Displays detailed information about a plugin.

```
$ amux plugins info @openclaw/browser-skill --agent openclaw
@openclaw/browser-skill v2.2.0
  Author:       OpenClaw Team
  Format:       npm-package
  Agents:       openclaw, opencode
  Registry:     openclaw-registry
  Downloads:    1,250/wk
  Tags:         web, browser, scraping, automation
  URL:          https://openclaw.ai/plugins/@openclaw/browser-skill

  Versions:     2.2.0, 2.1.0, 2.0.0, 1.5.0, 1.0.0
  Dependencies: puppeteer, cheerio

  Description:
    Web browsing and scraping capabilities for OpenClaw agents.
    Supports headless Chrome, page screenshots, DOM extraction,
    and structured data scraping.
```

---

## 16. Error Handling and Error Codes

All errors thrown by the `PluginManager` use error codes from the canonical `ErrorCode` union defined in `01-core-types-and-client.md`, Section 3.1. No plugin-specific error codes are introduced.

### 16.1 Error Code Usage

| Error Code | When Thrown | Recoverable | Example |
|---|---|---|---|
| `AGENT_NOT_FOUND` | The `agent` parameter is not registered in the `AdapterRegistry`. | No | `mux.plugins.list('nonexistent')` |
| `CAPABILITY_ERROR` | The agent does not support plugins (`supportsPlugins: false`). | No | `mux.plugins.list('codex')` |
| `PLUGIN_ERROR` | The underlying adapter operation failed. | Depends | Plugin not found, install failed, network error, registry unreachable |
| `VALIDATION_ERROR` | Input parameters are invalid. | No | Empty `pluginId`, malformed version string |
| `INTERNAL` | An adapter declares `supportsPlugins: true` but does not implement the required method. | No | Bug in adapter implementation |

### 16.2 Error Wrapping

When an adapter's plugin method throws, the `PluginManager` wraps the error:

```typescript
try {
  return await adapter.installPlugin(pluginId, options);
} catch (error) {
  if (error instanceof AgentMuxError) {
    throw error; // Already typed, pass through
  }
  // Wrap unknown errors in PLUGIN_ERROR
  throw new AgentMuxError(
    'PLUGIN_ERROR',
    `Failed to install plugin '${pluginId}' for agent '${agent}': ${error.message}`,
    true // Recoverable -- transient failures like network errors
  );
}
```

### 16.3 Partial Failure in Bulk Operations

`updateAll()` and `search()` involve multiple underlying operations. Their failure semantics:

- **`updateAll()`:** If one plugin update fails, the error is thrown immediately. Successfully updated plugins are not rolled back. The error message includes the failing plugin's identifier. Consumers should call `list()` after a failed `updateAll()` to inspect the current state.

- **`search()`:** Federated search tolerates partial registry failures. Results from successful registries are returned normally. Failed registries are logged at debug level. Only if all registries fail does the method throw `PLUGIN_ERROR`.

- **`browse()`:** Same partial failure semantics as `search()`.

---

## 17. Edge Cases

### 17.1 Auto-Generated Skills (Hermes)

> **SCOPE EXTENSION:** This section is specific to hermes-agent.

Hermes has a unique self-improving capability: after completing certain tasks, it can automatically generate skill files and save them to `~/.hermes/skills/auto/` for future reuse. These auto-generated skills appear in `mux.plugins.list('hermes')` alongside manually installed skills.

**Identification:** Auto-generated skills are distinguished by:
- `InstalledPlugin.description` is prefixed with `[auto-generated]`
- `InstalledPlugin.format` is `'skill-file'`
- File path is under `~/.hermes/skills/auto/`

**Lifecycle:**
- Auto-generated skills are created by Hermes, not by the user or `PluginManager`.
- They can be uninstalled via `mux.plugins.uninstall('hermes', pluginId)`.
- They cannot be updated (they have no registry source).
- They are listed by `mux.plugins.list('hermes')` with the same `InstalledPlugin` shape.

**CLI representation:**

```
$ amux plugins list hermes
  Plugin                    Version              Format          Enabled
  git-commit-helper         0.0.0                skill-file      yes
  python-test-runner        0.0.0                skill-file      yes
  [auto] code-review-v1     2026-03-15T10:30:00Z skill-file      yes
  [auto] refactor-helper    2026-03-12T08:15:00Z skill-file      yes

4 plugins installed for hermes (2 auto-generated)
```

### 17.2 Cross-Agent Plugin Compatibility

Some plugins work with multiple agents (e.g., an npm-package skill that works with both OpenCode and Pi). The `PluginListing.agents` array indicates compatibility. However, installing a plugin on an incompatible agent will fail at the adapter level with `PLUGIN_ERROR`.

Consumers should check compatibility before installing:

```typescript
const detail = await mux.plugins.info('opencode-tokenscope');
if (detail.agents.includes('pi')) {
  await mux.plugins.install('pi', 'opencode-tokenscope');
}
```

### 17.3 Partial Support (Claude Code)

Claude Code's plugin support is limited compared to agents with full native plugin CLIs. Consumers should be aware:

1. **No search/browse.** `search()` and `browse()` return empty arrays for Claude.
2. **No native install CLI.** Installation is handled by file operations and config writes, not CLI delegation.
3. **Format restrictions.** Only `skill-directory` and `mcp-server` are supported. Attempting to install an `npm-package` or `skill-file` throws `PLUGIN_ERROR`.
4. **No version management for skill directories.** `update()` on a skill-directory plugin is a no-op.

### 17.4 Plugin ID Collisions

Plugin IDs are scoped per agent. The same `pluginId` string can refer to different plugins on different agents. For example, a skill file named `web-tools` installed on both OpenCode and Hermes is tracked as two independent `InstalledPlugin` records with different `agent` values.

### 17.5 Concurrent Plugin Operations

Plugin operations are not concurrency-safe at the adapter level. Callers must not invoke `install()`, `uninstall()`, or `update()` concurrently for the same agent. Concurrent operations on different agents are safe.

The `PluginManager` does not enforce this constraint internally (no locking). If concurrent modifications are attempted, the underlying CLI or file operations may produce undefined behavior.

---

## 18. Security Considerations

### 18.1 `skipVerify` Option

The `PluginInstallOptions.skipVerify` flag bypasses integrity and verification checks during installation. When `skipVerify: true`:

- **npm-package plugins:** npm `postinstall` scripts are allowed to run. By default (`skipVerify: false`), the adapter blocks postinstall scripts by passing `--ignore-scripts` to `npm install`, preventing arbitrary code execution. Setting `skipVerify: true` removes this safeguard.
- **OpenClaw registry plugins:** Signature verification is skipped.

**Recommendation:** Never set `skipVerify: true` in production. Use only for:
- Local development with trusted packages.
- Private registries with internal trust.
- Packages that require postinstall scripts for compilation (e.g., native addons).

### 18.2 npm postinstall Script Risks

npm packages can include `postinstall` scripts that execute arbitrary code during `npm install`. The default behavior (`skipVerify: false`) mitigates this by passing `--ignore-scripts` to npm. However, some plugins may require postinstall scripts for legitimate purposes (native compilation, binary downloads). In those cases, the consumer must explicitly opt in with `skipVerify: true`.

### 18.3 MCP Server Trust

MCP servers are external processes spawned by the agent. Installing an MCP server plugin writes its spawn configuration to the agent's config file. The MCP server then has access to:

- The agent's working directory (file system read/write via MCP tools).
- Network access (the MCP server is an independent process).
- Environment variables passed in its configuration.

**Recommendation:**
- Only install MCP servers from trusted sources.
- Review the MCP server's source code before installation.
- Use `env` restrictions in the `McpServerConfig` to limit the server's environment.

### 18.4 Skill File Injection

Skill files contain instructions and tool definitions that are loaded into the agent's context. A malicious skill file could:

- Inject adversarial prompts that alter the agent's behavior.
- Define tool schemas that trick the agent into executing harmful operations.
- Exfiltrate context information through tool call descriptions.

**Recommendation:**
- Only install skill files from trusted registries (agentskills.io, npm with verified publishers).
- Review skill file contents before installation.
- Use `mux.plugins.info()` to inspect a plugin's metadata before installing.

### 18.5 Channel Plugin Security (OpenClaw)

OpenClaw channel plugins connect the agent to external messaging platforms. A malicious channel plugin could:

- Intercept and forward messages to third parties.
- Impersonate the agent on messaging platforms.
- Access API tokens for the connected messaging platform.

**Recommendation:**
- Only install channel plugins from the official OpenClaw registry with verified badges.
- Review channel plugin permissions before installation.
- Monitor channel plugin network activity.

---

## 19. Platform Notes

### 19.1 macOS

- npm global install directory: `/usr/local/lib/node_modules/` or `~/.npm-global/`
- Cursor extensions: `~/Library/Application Support/Cursor/extensions/`
- File permissions: standard POSIX. No special considerations.

### 19.2 Linux

- npm global install directory: `/usr/local/lib/node_modules/` or `~/.npm-global/`
- Cursor extensions: `~/.config/Cursor/extensions/`
- File permissions: standard POSIX. Ensure the user has write access to plugin directories.
- Hermes (pip-installed): `~/.local/lib/python3.xx/site-packages/hermes_agent/`

> **SCOPE EXTENSION:** Hermes is installed via pip on Linux. Its skills directory is `~/.hermes/skills/`.

### 19.3 Windows

- npm global install directory: `%APPDATA%\npm\node_modules\`
- Cursor extensions: `%APPDATA%\Cursor\extensions\`
- Path separators: The adapter normalizes all file paths to use forward slashes in `InstalledPlugin` descriptors, regardless of the OS. Internal operations use `path.join()` for OS-native paths.
- Long path support: Plugin paths may exceed 260 characters on Windows (especially nested `node_modules`). Ensure `LongPathsEnabled` is set in the Windows registry or use npm's `--prefix` to control install location.
- Hermes (pip-installed): `%APPDATA%\Python\PythonXX\site-packages\hermes_agent\`

> **SCOPE EXTENSION:** Hermes requires Python >= 3.11 on Windows. Install via `pip install hermes-agent` or `uv pip install hermes-agent`.

---

## 20. Complete Type Summary

All types defined or referenced in this specification:

| Type | Kind | Defined In | Description |
|---|---|---|---|
| `PluginManager` | Interface | This spec, Section 2 | Unified plugin management interface |
| `InstalledPlugin` | Interface | This spec, Section 3 | Descriptor of an installed plugin |
| `PluginListing` | Interface | This spec, Section 4 | Plugin listing from a registry |
| `PluginDetail` | Interface (extends `PluginListing`) | This spec, Section 5 | Extended plugin metadata |
| `PluginInstallOptions` | Interface | This spec, Section 6 | Options for `install()` |
| `PluginSearchOptions` | Interface | This spec, Section 7 | Options for `search()` |
| `PluginBrowseOptions` | Interface (extends `PluginSearchOptions`) | This spec, Section 8 | Options for `browse()` |
| `PluginFormat` | Type alias (union) | `06-capabilities-and-models.md`, Section 3.1 | Structural format of a plugin |
| `PluginRegistry` | Interface | `06-capabilities-and-models.md`, Section 3.2 | Registry descriptor |
| `AgentCapabilities` | Interface | `06-capabilities-and-models.md`, Section 2 | Agent capability manifest (includes plugin fields) |
| `AgentName` | Type alias | `01-core-types-and-client.md`, Section 1.4 | Agent identifier type |
| `ErrorCode` | Type alias (union) | `01-core-types-and-client.md`, Section 3.1 | Machine-readable error codes |
| `AgentMuxError` | Class | `01-core-types-and-client.md`, Section 3.1 | Base error class |
| `CapabilityError` | Class (extends `AgentMuxError`) | `01-core-types-and-client.md`, Section 3.2 | Capability gate error |
| `ValidationError` | Class (extends `AgentMuxError`) | `01-core-types-and-client.md`, Section 3.3 | Input validation error |

---

## 21. Method Summary

Complete reference of all `PluginManager` methods:

| Method | Signature | Returns | Throws | Description |
|---|---|---|---|---|
| `list` | `(agent: AgentName)` | `Promise<InstalledPlugin[]>` | `AGENT_NOT_FOUND`, `CAPABILITY_ERROR`, `PLUGIN_ERROR` | List installed plugins |
| `install` | `(agent: AgentName, pluginId: string, options?: PluginInstallOptions)` | `Promise<InstalledPlugin>` | `AGENT_NOT_FOUND`, `CAPABILITY_ERROR`, `PLUGIN_ERROR`, `VALIDATION_ERROR` | Install a plugin |
| `uninstall` | `(agent: AgentName, pluginId: string)` | `Promise<void>` | `AGENT_NOT_FOUND`, `CAPABILITY_ERROR`, `PLUGIN_ERROR`, `VALIDATION_ERROR` | Uninstall a plugin |
| `update` | `(agent: AgentName, pluginId: string)` | `Promise<InstalledPlugin>` | `AGENT_NOT_FOUND`, `CAPABILITY_ERROR`, `PLUGIN_ERROR` | Update a single plugin |
| `updateAll` | `(agent: AgentName)` | `Promise<InstalledPlugin[]>` | `AGENT_NOT_FOUND`, `CAPABILITY_ERROR`, `PLUGIN_ERROR` | Update all plugins for an agent |
| `search` | `(query: string, options?: PluginSearchOptions)` | `Promise<PluginListing[]>` | `PLUGIN_ERROR`, `VALIDATION_ERROR` | Search registries for plugins |
| `browse` | `(options?: PluginBrowseOptions)` | `Promise<PluginListing[]>` | `PLUGIN_ERROR` | Browse plugins by category/sort |
| `info` | `(pluginId: string, agent?: AgentName)` | `Promise<PluginDetail>` | `PLUGIN_ERROR`, `VALIDATION_ERROR` | Get detailed plugin information |

---

## Implementation Status (2026-04-12)

The plugin surface (`PluginManager`, `InstalledPlugin`, `PluginListing`, `AgentAdapter.listPlugins` / `installPlugin` / `uninstallPlugin` / `searchPlugins`) is in place. Coverage across adapters is partial — plugin methods remain `optional` on the adapter interface, and adapters whose harnesses have no plugin system leave them undefined.
