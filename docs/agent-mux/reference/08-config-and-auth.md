# Config Manager, Auth Manager, and Agent Configuration

**Specification v1.0** | `@a5c-ai/agent-mux`

> **SCOPE EXTENSION:** hermes-agent (`@NousResearch/hermes-agent`) is included as a 10th supported agent per explicit project requirements from the project owner. It extends the original scope document's 9 built-in agents. All hermes-specific content in this spec is marked with this same scope extension note.

---

## 1. Overview

This specification defines two manager interfaces and their supporting types:

1. **ConfigManager** -- read, write, validate, and introspect agent-native configuration files through a unified interface. Handles per-agent config formats (JSON, YAML), global vs. project-level config merging, field-level access, schema introspection, MCP server management within config files, and profile delegation.

2. **AuthManager** -- detect, report, and guide authentication state for all supported agents. Purely read-only detection: it never prompts the user, never writes credentials, and never modifies auth state. It surfaces current status and provides structured guidance for setup.

Both managers are accessed from the `AgentMuxClient`:

```typescript
const mux = createClient();

// Configuration operations:
const config = mux.config.get('claude');
await mux.config.set('codex', { model: 'o4-mini' });
const servers = mux.config.getMcpServers('gemini');

// Authentication operations:
const authState = await mux.auth.check('claude');
const allAuth = await mux.auth.checkAll();
const guidance = mux.auth.getSetupGuidance('hermes');
```

### 1.1 Design Principles

- **Native format fidelity.** ConfigManager reads and writes each agent's native config format (JSON, YAML). It does not maintain a shadow copy or proprietary format. The agent's own CLI always sees the same file content.
- **Merge semantics.** `set()` and `setField()` perform deep merge with existing config. They never overwrite fields not mentioned in the update. This prevents accidental destruction of hand-edited config.
- **File locking.** All write operations acquire an advisory file lock to prevent concurrent corruption when multiple agent-mux consumers (or the agent's own CLI) write simultaneously.
- **Adapter delegation.** ConfigManager delegates file I/O to each agent's adapter (`readConfig()`, `writeConfig()`). The manager orchestrates; the adapter knows the file format.
- **Read-only auth detection.** AuthManager inspects files, environment variables, and credential stores. It never modifies state, prompts the user, or spawns interactive processes.
- **Structured guidance.** Instead of opaque error messages, AuthManager provides machine-readable setup guidance including steps, environment variable names, documentation links, and platform-specific notes.

### 1.2 Cross-References

| Type / Concept | Spec | Section |
|---|---|---|
| `AgentName`, `BuiltInAgentName` | `01-core-types-and-client.md` | 1.4 |
| `AgentMuxClient`, `createClient()` | `01-core-types-and-client.md` | 5 |
| `ErrorCode`, `AgentMuxError` | `01-core-types-and-client.md` | 3.1 |
| `RunOptions` | `02-run-options-and-profiles.md` | 2 |
| `McpServerConfig` | `02-run-options-and-profiles.md` | 4 |
| `ProfileManager` | `02-run-options-and-profiles.md` | 10 |
| `AgentAdapter.readConfig()` | `05-adapter-system.md` | 2 |
| `AgentAdapter.writeConfig()` | `05-adapter-system.md` | 2 |
| `AgentAdapter.detectAuth()` | `05-adapter-system.md` | 2 |
| `AgentAdapter.getAuthGuidance()` | `05-adapter-system.md` | 2 |
| `AgentCapabilities.authMethods` | `06-capabilities-and-models.md` | 2 |
| `AgentCapabilities.authFiles` | `06-capabilities-and-models.md` | 2 |
| `AgentCapabilities.supportsMCP` | `06-capabilities-and-models.md` | 2 |

---

## 2. ConfigManager Interface

```typescript
/**
 * Unified configuration access for all supported agents.
 *
 * ConfigManager reads and writes each agent's native config files through
 * the agent's adapter. It provides field-level access, schema introspection,
 * validation, and MCP server management.
 *
 * Accessed via `mux.config`.
 */
interface ConfigManager {
  /**
   * Read the full merged configuration for an agent.
   *
   * Returns a normalized AgentConfig object that merges global config
   * with project-level config (project wins on conflicts). If no config
   * file exists for the agent, returns a default AgentConfig with the
   * agent name set and all other fields undefined.
   *
   * On the first call for a given agent, reads the config file(s)
   * synchronously (fs.readFileSync), parses and merges them, and
   * caches the result. Subsequent calls return from cache with no I/O.
   * The cache is updated automatically after any successful write
   * (set, setField, addMcpServer, removeMcpServer).
   *
   * @param agent - Agent to read config for.
   * @returns Merged agent configuration (from cache after first access).
   * @throws AgentMuxError with code 'AGENT_NOT_FOUND' if agent is unknown.
   * @throws AgentMuxError with code 'CONFIG_ERROR' if the config file
   *   exists but cannot be parsed.
   */
  get(agent: AgentName): AgentConfig;

  /**
   * Read a single field from the merged configuration.
   *
   * Uses dot-notation for nested access (e.g., 'model', 'permissions.allow').
   * Returns undefined if the field does not exist in the merged config.
   *
   * @param agent - Agent to read config for.
   * @param field - Dot-notation path to the config field.
   * @returns The field value, or undefined if not set.
   * @throws AgentMuxError with code 'AGENT_NOT_FOUND' if agent is unknown.
   * @throws AgentMuxError with code 'CONFIG_ERROR' if the config file
   *   exists but cannot be parsed.
   */
  getField(agent: AgentName, field: string): unknown;

  /**
   * Write partial configuration updates to the agent's native config file.
   *
   * Performs a deep merge with existing config. Fields not present in the
   * update are preserved. The write targets the global config file by
   * default; to write to the project-level file, construct the client
   * with the desired `projectConfigDir` in `ClientOptions`.
   *
   * Acquires an advisory file lock before writing to prevent concurrent
   * corruption. The lock is released after the write completes.
   *
   * @param agent - Agent to write config for.
   * @param fields - Partial config to merge into the existing config.
   * @returns Resolves when the write is complete and the lock is released.
   * @throws AgentMuxError with code 'AGENT_NOT_FOUND' if agent is unknown.
   * @throws AgentMuxError with code 'CONFIG_ERROR' if the file
   *   cannot be written (permissions, disk full, etc.).
   * @throws AgentMuxError with code 'CONFIG_LOCK_ERROR' if the advisory
   *   file lock cannot be acquired within 5000ms (recoverable: true).
   * @throws AgentMuxError with code 'VALIDATION_ERROR' if the merged
   *   result would violate the agent's config schema.
   */
  set(agent: AgentName, fields: Partial<AgentConfig>): Promise<void>;

  /**
   * Write a single field to the agent's native config file.
   *
   * Convenience wrapper around set() for single-field updates. Uses
   * dot-notation for nested access.
   *
   * @param agent - Agent to write config for.
   * @param field - Dot-notation path to the config field.
   * @param value - The value to set.
   * @returns Resolves when the write is complete.
   * @throws AgentMuxError with code 'AGENT_NOT_FOUND' if agent is unknown.
   * @throws AgentMuxError with code 'CONFIG_ERROR' if the file
   *   cannot be written.
   * @throws AgentMuxError with code 'CONFIG_LOCK_ERROR' if the advisory
   *   file lock cannot be acquired within 5000ms (recoverable: true).
   * @throws AgentMuxError with code 'VALIDATION_ERROR' if the resulting
   *   config would violate the agent's config schema.
   */
  setField(agent: AgentName, field: string, value: unknown): Promise<void>;

  /**
   * Returns the configuration schema for an agent.
   *
   * The schema describes all recognized fields, their types, defaults,
   * valid ranges, and the file paths where config is stored.
   *
   * @param agent - Agent to get schema for.
   * @returns The agent's config schema.
   * @throws AgentMuxError with code 'AGENT_NOT_FOUND' if agent is unknown.
   */
  schema(agent: AgentName): AgentConfigSchema;

  /**
   * Validate a partial config object against the agent's schema.
   *
   * Does not write anything. Returns a ValidationResult indicating
   * whether the config is valid, and if not, which fields have errors.
   *
   * @param agent - Agent to validate config for.
   * @param config - Partial config to validate.
   * @returns Validation result with field-level error details.
   * @throws AgentMuxError with code 'AGENT_NOT_FOUND' if agent is unknown.
   */
  validate(agent: AgentName, config: Partial<AgentConfig>): ValidationResult;

  /**
   * Returns all MCP server configurations from the agent's config file.
   *
   * Reads the agent's native MCP server entries and normalizes them into
   * McpServerConfig objects. Returns an empty array if the agent has no
   * MCP servers configured or does not support MCP.
   *
   * @param agent - Agent to read MCP servers for.
   * @returns Array of MCP server configurations.
   * @throws AgentMuxError with code 'AGENT_NOT_FOUND' if agent is unknown.
   */
  getMcpServers(agent: AgentName): McpServerConfig[];

  /**
   * Add an MCP server to the agent's native config file.
   *
   * Writes the server entry into the agent's config in the agent's native
   * MCP format. If a server with the same name already exists, throws
   * CONFIG_ERROR.
   *
   * @param agent - Agent to add the MCP server to.
   * @param server - MCP server configuration to add.
   * @returns Resolves when the server has been added and the file written.
   * @throws AgentMuxError with code 'AGENT_NOT_FOUND' if agent is unknown.
   * @throws AgentMuxError with code 'CAPABILITY_ERROR' if the agent does
   *   not support MCP (supportsMCP is false).
   * @throws AgentMuxError with code 'CONFIG_ERROR' if a server with
   *   the same name already exists, or if the file cannot be written.
   * @throws AgentMuxError with code 'CONFIG_LOCK_ERROR' if the advisory
   *   file lock cannot be acquired within 5000ms (recoverable: true).
   */
  addMcpServer(agent: AgentName, server: McpServerConfig): Promise<void>;

  /**
   * Remove an MCP server from the agent's native config file by name.
   *
   * @param agent - Agent to remove the MCP server from.
   * @param serverName - Name of the MCP server to remove.
   * @returns Resolves when the server has been removed and the file written.
   * @throws AgentMuxError with code 'AGENT_NOT_FOUND' if agent is unknown.
   * @throws AgentMuxError with code 'CAPABILITY_ERROR' if the agent does
   *   not support MCP.
   * @throws AgentMuxError with code 'CONFIG_ERROR' if no server with
   *   the given name exists, or if the file cannot be written.
   * @throws AgentMuxError with code 'CONFIG_LOCK_ERROR' if the advisory
   *   file lock cannot be acquired within 5000ms (recoverable: true).
   */
  removeMcpServer(agent: AgentName, serverName: string): Promise<void>;

  /**
   * Invalidate the config cache and re-read from disk.
   *
   * Clears the in-memory cache for the specified agent (or all agents
   * if no agent is given) and re-reads the config file(s) from disk.
   * This is useful when external processes (e.g., the agent's own CLI)
   * may have modified the config file since the last read.
   *
   * @param agent - Optional agent to reload. If omitted, reloads all.
   * @returns Resolves when the cache has been refreshed.
   * @throws AgentMuxError with code 'AGENT_NOT_FOUND' if agent is unknown.
   * @throws AgentMuxError with code 'CONFIG_ERROR' if the config file
   *   exists but cannot be parsed.
   */
  reload(agent?: AgentName): Promise<void>;

  /**
   * Returns the ProfileManager instance.
   *
   * Convenience accessor that returns the same ProfileManager available
   * at `mux.profiles`. Provided here so that config-related code can
   * access profiles without a separate import.
   *
   * @returns The ProfileManager instance.
   * @see ProfileManager in 02-run-options-and-profiles.md, Section 10.
   */
  profiles(): ProfileManager;
}
```

### 2.1 ConfigManager Method Reference

| Method | Parameters | Returns | Throws |
|---|---|---|---|
| `get(agent)` | `agent: AgentName` | `AgentConfig` | `AGENT_NOT_FOUND`, `CONFIG_ERROR` |
| `getField(agent, field)` | `agent: AgentName`, `field: string` | `unknown` | `AGENT_NOT_FOUND`, `CONFIG_ERROR` |
| `set(agent, fields)` | `agent: AgentName`, `fields: Partial<AgentConfig>` | `Promise<void>` | `AGENT_NOT_FOUND`, `CONFIG_ERROR`, `CONFIG_LOCK_ERROR`, `VALIDATION_ERROR` |
| `setField(agent, field, value)` | `agent: AgentName`, `field: string`, `value: unknown` | `Promise<void>` | `AGENT_NOT_FOUND`, `CONFIG_ERROR`, `CONFIG_LOCK_ERROR`, `VALIDATION_ERROR` |
| `schema(agent)` | `agent: AgentName` | `AgentConfigSchema` | `AGENT_NOT_FOUND` |
| `validate(agent, config)` | `agent: AgentName`, `config: Partial<AgentConfig>` | `ValidationResult` | `AGENT_NOT_FOUND` |
| `getMcpServers(agent)` | `agent: AgentName` | `McpServerConfig[]` | `AGENT_NOT_FOUND` |
| `addMcpServer(agent, server)` | `agent: AgentName`, `server: McpServerConfig` | `Promise<void>` | `AGENT_NOT_FOUND`, `CAPABILITY_ERROR`, `CONFIG_ERROR`, `CONFIG_LOCK_ERROR` |
| `removeMcpServer(agent, serverName)` | `agent: AgentName`, `serverName: string` | `Promise<void>` | `AGENT_NOT_FOUND`, `CAPABILITY_ERROR`, `CONFIG_ERROR`, `CONFIG_LOCK_ERROR` |
| `reload(agent?)` | `agent?: AgentName` | `Promise<void>` | `AGENT_NOT_FOUND`, `CONFIG_ERROR` |
| `profiles()` | -- | `ProfileManager` | -- |

#### Cache Initialization and the Sync/Async Contract

The scope defines `get()` and other read methods as synchronous, yet the underlying adapter methods (`readConfig()`) are async (they perform file I/O). ConfigManager resolves this through **lazy cache warming**:

1. **`createClient()` is synchronous** (see `01-core-types-and-client.md`, §5.1) and performs no I/O. The config cache starts empty.
2. **On first sync read** (`get()`, `getField()`, `getMcpServers()`), if the cache for the requested agent is cold, ConfigManager performs a **synchronous file read** (`fs.readFileSync`) to load the agent's config file(s), parse them, merge global and project configs, and populate the cache. This is the only synchronous file I/O in ConfigManager. Subsequent reads for the same agent return from cache with no I/O.
3. **Write methods** (`set()`, `setField()`, `addMcpServer()`, `removeMcpServer()`) are async because they acquire a file lock and perform `fs.writeFile`. After a successful write, the cache for that agent is updated in-place with the merged result before the Promise resolves. This ensures the next sync read sees the updated value.
4. **External changes** (e.g., the user editing the config file directly, or the agent's own CLI modifying the file) are not reflected in the cache automatically. Call `reload(agent)` to re-read from disk and refresh the cache for a specific agent, or `reload()` with no arguments to refresh all agents. `reload()` is async (it re-reads from disk) and should be called when external modifications are suspected.
5. **Adapter delegation**: `readConfig()` in the adapter contract is async, but ConfigManager does not use it for sync reads. Instead, ConfigManager reads the raw file synchronously and delegates only the **parsing** (format-specific deserialization and field mapping) to a synchronous adapter method. The async `readConfig()` adapter method is used internally by write operations that need to read-before-write with a lock held.

---

## 3. AgentConfig Type

The normalized representation of an agent's configuration. Each adapter reads and writes its native format but exposes the result through this common shape.

```typescript
/**
 * Normalized agent configuration.
 *
 * This is the common representation returned by ConfigManager.get() and
 * accepted by ConfigManager.set(). Each adapter maps between this type
 * and the agent's native config format.
 *
 * Fields not set in the agent's config file are undefined (not null).
 * When passed to set(), undefined fields are ignored (not written).
 */
interface AgentConfig {
  /** The agent this config belongs to. Always set. */
  agent: AgentName;

  /** The source of this config: 'global', 'project', or 'merged'. */
  source: 'global' | 'project' | 'merged';

  /**
   * Absolute paths to the config file(s) that contributed to this config.
   * For a merged config, both global and project paths are included.
   * For a source-specific config, only that source's path is included.
   * Empty array if no config file exists.
   */
  filePaths: string[];

  // ── Model and inference ──────────────────────────────────────────

  /** Default model identifier. Agent-specific format. */
  model?: string;

  /** Default provider identifier (for agents that separate model/provider). */
  provider?: string;

  /** Default temperature for sampling. */
  temperature?: number;

  /** Default max output tokens. */
  maxTokens?: number;

  // ── Permissions and approval ─────────────────────────────────────

  /** Commands or patterns the agent is allowed to execute without approval. */
  allowedCommands?: string[];

  /** Commands or patterns the agent is denied from executing. */
  deniedCommands?: string[];

  /** Default approval mode for tool calls. */
  approvalMode?: 'yolo' | 'prompt' | 'deny';

  // ── MCP servers ──────────────────────────────────────────────────

  /**
   * MCP server configurations stored in the agent's config file.
   * Normalized from the agent's native MCP format.
   */
  mcpServers?: McpServerConfig[];

  // ── Skills and extensions ────────────────────────────────────────

  /** Enabled skills or extensions. */
  skills?: string[];

  /** Path to agent documentation file. */
  agentsDoc?: string;

  // ── Environment ──────────────────────────────────────────────────

  /** Custom environment variables set in config. */
  env?: Record<string, string>;

  // ── Agent-specific fields ────────────────────────────────────────

  /**
   * Catch-all for agent-specific configuration fields that do not map
   * to a normalized field above.
   *
   * Each adapter places native fields here that are meaningful to the
   * agent but not part of the common schema. Consumers can read and write
   * these fields using getField/setField with dot-notation paths prefixed
   * by 'native.' (e.g., 'native.theme', 'native.telemetry').
   */
  native?: Record<string, unknown>;
}
```

### 3.1 AgentConfig Field Reference

| Field | Type | Always Set | Description |
|---|---|---|---|
| `agent` | `AgentName` | Yes | The agent this config belongs to. |
| `source` | `'global' \| 'project' \| 'merged'` | Yes | Origin of this config snapshot. |
| `filePaths` | `string[]` | Yes | Absolute paths to contributing config files. |
| `model` | `string` | No | Default model identifier. |
| `provider` | `string` | No | Default provider identifier. |
| `temperature` | `number` | No | Default sampling temperature. |
| `maxTokens` | `number` | No | Default max output tokens. |
| `allowedCommands` | `string[]` | No | Allowed command patterns. |
| `deniedCommands` | `string[]` | No | Denied command patterns. |
| `approvalMode` | `'yolo' \| 'prompt' \| 'deny'` | No | Default approval mode. |
| `mcpServers` | `McpServerConfig[]` | No | MCP server configurations. |
| `skills` | `string[]` | No | Enabled skills or extensions. |
| `agentsDoc` | `string` | No | Path to agent documentation file. |
| `env` | `Record<string, string>` | No | Custom environment variables. |
| `native` | `Record<string, unknown>` | No | Agent-specific fields. |

---

## 4. AgentConfigSchema Type

Describes the configuration schema for a specific agent: what fields it supports, their types, constraints, and where config files live on disk.

```typescript
/**
 * Schema definition for an agent's configuration.
 *
 * Returned by ConfigManager.schema(). Describes all fields the agent
 * recognizes, their types and constraints, and the filesystem locations
 * of the agent's native config files.
 */
interface AgentConfigSchema {
  /** The agent this schema describes. */
  agent: AgentName;

  /**
   * All configuration fields recognized by this agent.
   * Includes both normalized fields (model, temperature, etc.) and
   * agent-specific native fields.
   */
  fields: ConfigField[];

  /**
   * Absolute paths to global config files for this agent.
   * Typically one file, but some agents have multiple (e.g., main config
   * plus an env file). Paths use the `~` prefix for home directory.
   *
   * Example: ['~/.claude/settings.json']
   */
  configFilePaths: string[];

  /**
   * Relative paths to project-level config files for this agent.
   * Relative to the project root. Empty array if the agent does not
   * support project-level config.
   *
   * Example: ['.claude/settings.json']
   */
  projectConfigFilePaths: string[];

  /**
   * The native config file format.
   *
   * > **Spec-level addition:** This field is not in the scope's
   * > AgentConfigSchema definition (scope §17) but is required by
   * > implementations to select the correct parser/serializer.
   *
   * Only 'json' and 'yaml' are used by the currently supported agents:
   * hermes uses 'yaml'; all other nine agents use 'json'.
   *
   * > **SCOPE EXTENSION:** 'yaml' is included to support hermes-agent
   * > (`@NousResearch/hermes-agent`), the 10th supported agent added per
   * > explicit project requirements. Without hermes this field would be
   * > the literal type `'json'`.
   */
  configFormat: 'json' | 'yaml';

  /**
   * Whether the agent supports project-level config overrides.
   *
   * > **Spec-level addition:** This field is not in the scope's
   * > AgentConfigSchema definition (scope §17) but is required by
   * > implementations to guard against writing project config for
   * > agents that only support global config.
   *
   * > **SCOPE EXTENSION:** hermes-agent does not support project-level
   * > config (this field is `false` for hermes). The field exists in the
   * > schema for completeness across all 10 agents; without hermes the
   * > set of agents with `supportsProjectConfig: false` would be smaller.
   */
  supportsProjectConfig: boolean;
}
```

---

## 5. ConfigField Type

Describes a single configuration field within an agent's config schema.

```typescript
/**
 * Descriptor for a single configuration field.
 *
 * Used in AgentConfigSchema.fields to provide introspection and
 * validation metadata for each field an agent recognizes.
 */
interface ConfigField {
  /**
   * The field path in dot-notation.
   * For normalized fields: 'model', 'temperature', 'approvalMode', etc.
   * For native fields: 'native.theme', 'native.telemetry', etc.
   */
  path: string;

  /** Human-readable label for the field. */
  label: string;

  /** Brief description of what the field controls. */
  description: string;

  /**
   * The value type of the field.
   * - 'string': free-form string
   * - 'number': numeric value
   * - 'boolean': true/false
   * - 'enum': one of a fixed set of string values (see `enumValues`)
   * - 'string[]': array of strings
   * - 'object': nested object; fields are defined by the agent's native config schema
   * - 'McpServerConfig[]': array of MCP server configurations
   */
  type: 'string' | 'number' | 'boolean' | 'enum' | 'string[]' | 'object' | 'McpServerConfig[]';

  /** Whether this field is required in the config. */
  required: boolean;

  /**
   * Default value used by the agent when the field is not set in config.
   * Undefined if there is no default (field is truly optional or
   * agent-determined at runtime).
   */
  defaultValue?: unknown;

  /** Allowed values for 'enum' type fields. Undefined for other types. */
  enumValues?: string[];

  /**
   * For numeric fields, the valid range.
   * Both min and max are inclusive. Either may be undefined for
   * an open-ended range.
   */
  min?: number;
  max?: number;

  /**
   * Regex pattern that string values must match.
   * Undefined if there is no pattern constraint.
   */
  pattern?: string;

  /**
   * Whether this field maps to a normalized AgentConfig field or is
   * agent-specific (stored in AgentConfig.native).
   */
  normalized: boolean;

  /**
   * The native key path in the agent's config file.
   * May differ from `path` when the agent uses a different key name
   * than the normalized field name.
   *
   * Example: For Claude Code, the normalized 'model' field maps to
   * the native key 'model' in settings.json. For hermes, 'model'
   * maps to 'default_model' in cli-config.yaml.
   */
  nativeKeyPath: string;

  /**
   * Which config scope(s) this field can appear in.
   * 'global' -- only in the global config file.
   * 'project' -- only in the project config file.
   * 'both' -- in either or both.
   */
  scope: 'global' | 'project' | 'both';
}
```

---

## 6. ValidationResult Type

Returned by `ConfigManager.validate()` to provide detailed, field-level validation feedback.

```typescript
/**
 * Result of validating a partial config against an agent's schema.
 *
 * If valid is true, errors is empty. If valid is false, errors contains
 * one or more field-level error descriptors.
 */
interface ValidationResult {
  /** Whether the config is valid against the schema. */
  valid: boolean;

  /** Field-level validation errors. Empty array if valid. */
  errors: ConfigValidationError[];

  /** Field-level warnings (deprecated fields, non-standard values). */
  warnings: ConfigValidationWarning[];
}

/**
 * A single validation error for a specific config field.
 *
 * Named `ConfigValidationError` (not `ValidationError`) to avoid
 * collision with the `ValidationError` class in `01-core-types-and-client.md`
 * Section 3.3, which is a throwable error class with different structure.
 */
interface ConfigValidationError {
  /** Dot-notation path to the field that failed validation. */
  field: string;

  /**
   * Machine-readable error code.
   * - 'required' -- a required field is missing.
   * - 'type_mismatch' -- the value type does not match the schema.
   * - 'out_of_range' -- a numeric value is outside min/max bounds.
   * - 'invalid_enum' -- the value is not one of the allowed enum values.
   * - 'pattern_mismatch' -- a string value does not match the pattern.
   * - 'unknown_field' -- the field is not recognized in the schema.
   * - 'invalid_format' -- the value format is wrong (e.g., invalid URL).
   */
  code: 'required' | 'type_mismatch' | 'out_of_range' | 'invalid_enum'
      | 'pattern_mismatch' | 'unknown_field' | 'invalid_format';

  /** Human-readable error message. */
  message: string;

  /** The invalid value that was provided. */
  value?: unknown;

  /** The expected type or constraint, for context in error messages. */
  expected?: string;
}

/**
 * A non-fatal validation warning.
 */
interface ConfigValidationWarning {
  /** Dot-notation path to the field. */
  field: string;

  /**
   * Warning code.
   * - 'deprecated' -- the field is deprecated; use the replacement.
   * - 'non_standard' -- the value works but is not recommended.
   */
  code: 'deprecated' | 'non_standard';

  /** Human-readable warning message. */
  message: string;

  /** Suggested replacement field or value, if applicable. */
  suggestion?: string;
}
```

---

## 7. Native Config File Locations

Each agent stores its configuration in a native format at agent-specific filesystem locations. ConfigManager reads and writes these files through the adapter layer.

> **SCOPE EXTENSION:** hermes-agent is included as the 10th agent. Its config location (`~/.hermes/cli-config.yaml`) was determined through direct research of the NousResearch/hermes-agent repository.

| Agent | Global Config Path | Project Config Path | Format |
|---|---|---|---|
| Claude Code (`claude`) | `~/.claude/settings.json` | `.claude/settings.json` | JSON |
| Codex CLI (`codex`) | `~/.codex/config.json` | `.codex/config.json` | JSON |
| Gemini CLI (`gemini`) | `~/.config/gemini/settings.json` | `.gemini/settings.json` | JSON |
| Copilot CLI (`copilot`) | `~/.config/github-copilot/settings.json` | -- | JSON |
| Cursor (`cursor`) | `~/.cursor/settings.json` | `.cursor/settings.json` | JSON |
| OpenCode (`opencode`) | `~/.config/opencode/opencode.json` | `.opencode/opencode.json` | JSON |
| Pi (`pi`) | `~/.pi/agent/settings.json` | -- | JSON |
| omp (`omp`) | `~/.omp/agent/settings.json` | -- | JSON |
| OpenClaw (`openclaw`) | `~/.openclaw/config.json` | -- | JSON |
| hermes (`hermes`) | `~/.hermes/cli-config.yaml` | -- | YAML |

### 7.1 Path Resolution Rules

1. **Home directory.** The `~` prefix resolves to the user's home directory (`os.homedir()`). On Windows, this is typically `C:\Users\<username>`.

2. **Project root.** If `ClientOptions.projectConfigDir` is set, it is used directly as the project root. If not set, the project root is resolved by walking up from `process.cwd()` until a directory containing `.git` is found; if no `.git` ancestor exists, `process.cwd()` is used. The `.agent-mux/` directory is appended to the resolved project root for agent-mux's own project-level files.

3. **Merge order.** When both global and project configs exist, the project config takes precedence on conflicting keys. The merge is a deep merge: nested objects are merged recursively, arrays are replaced (not concatenated), and scalar values from the project config overwrite global values. This is the same deep-merge algorithm used by `set()` when writing partial config updates (see Section 13.1).

4. **Missing files.** If neither global nor project config exists, `get()` returns a default `AgentConfig` with `agent` set, `source` set to `'merged'`, `filePaths` as an empty array, and all other fields `undefined`.

5. **No project config support.** For agents that do not support project-level config (copilot, pi, omp, openclaw, hermes), the project config path column shows `--`. `AgentConfigSchema.projectConfigFilePaths` is an empty array, and `AgentConfigSchema.supportsProjectConfig` is `false`.

### 7.2 Format-Specific Notes

**JSON agents (9 of 10).** Config files use standard JSON. Comments are not supported in the native format (JSON does not allow comments). Trailing commas are tolerated during reads (parsed with a lenient JSON parser) but never written.

**YAML agent (hermes).** The hermes config at `~/.hermes/cli-config.yaml` uses standard YAML. Comments and formatting in the existing file are preserved during writes where possible (using a comment-preserving YAML library). Multi-document YAML files are not supported; only the first document is read.

> **SCOPE EXTENSION:** hermes-agent also supports environment variable overrides via a `.env` file in `~/.hermes/`. The `ConfigManager` reads the YAML config file as the primary source. Environment variable overrides are not reflected in `get()` results because they are process-level state, not file configuration. The `schema()` method documents which fields have env var equivalents in the `ConfigField.description`.

---

## 8. AuthManager Interface

```typescript
/**
 * Authentication state detection and setup guidance for all agents.
 *
 * AuthManager is strictly read-only: it inspects credentials, tokens,
 * config files, and environment variables to determine auth status.
 * It never writes credentials, prompts users, or modifies auth state.
 *
 * Accessed via `mux.auth`.
 */
interface AuthManager {
  /**
   * Check the current authentication state for a single agent.
   *
   * Delegates to the agent adapter's detectAuth() method. The detection
   * strategy varies per agent: some adapters inspect auth files and
   * environment variables (e.g., Claude Code checks session token files
   * in `~/.claude/`), while others check credential stores or run
   * lightweight CLI probes. See Section 14.1 for per-agent strategies.
   *
   * The result is not cached between calls. Each call performs a fresh
   * detection to reflect current state.
   *
   * @param agent - Agent to check auth for.
   * @returns Current authentication state.
   * @throws AgentMuxError with code 'AGENT_NOT_FOUND' if agent is unknown.
   */
  check(agent: AgentName): Promise<AuthState>;

  /**
   * Check authentication state for all registered agents.
   *
   * Runs check() for every registered agent in parallel. The result
   * is a record keyed by agent name. Agents that fail detection (e.g.,
   * not installed) will have status 'unknown' with details explaining
   * the failure.
   *
   * @returns Record mapping each agent name to its auth state.
   */
  checkAll(): Promise<Record<AgentName, AuthState>>;

  /**
   * Get structured setup guidance for authenticating with an agent.
   *
   * Returns step-by-step instructions, required credentials, environment
   * variable names, documentation links, and platform-specific notes.
   *
   * This is a synchronous method: guidance is static per adapter and
   * does not require network access or filesystem inspection.
   *
   * @param agent - Agent to get guidance for.
   * @returns Structured auth setup guidance.
   * @throws AgentMuxError with code 'AGENT_NOT_FOUND' if agent is unknown.
   */
  getSetupGuidance(agent: AgentName): AuthSetupGuidance;
}
```

### 8.1 AuthManager Method Reference

| Method | Parameters | Returns | Throws |
|---|---|---|---|
| `check(agent)` | `agent: AgentName` | `Promise<AuthState>` | `AGENT_NOT_FOUND` |
| `checkAll()` | -- | `Promise<Record<AgentName, AuthState>>` | -- |
| `getSetupGuidance(agent)` | `agent: AgentName` | `AuthSetupGuidance` | `AGENT_NOT_FOUND` |

---

## 9. AuthState Type

Represents the current authentication state for a single agent at a point in time.

```typescript
/**
 * Authentication state snapshot for an agent.
 *
 * Returned by AuthManager.check() and AuthManager.checkAll().
 * Also returned by AgentAdapter.detectAuth().
 */
interface AuthState {
  /** The agent this state belongs to. */
  agent: AgentName;

  /**
   * Current authentication status.
   *
   * - 'authenticated' -- the agent has valid, non-expired credentials
   *   and is ready to use.
   * - 'unauthenticated' -- no credentials found. The agent will fail
   *   on invocation unless auth is set up first.
   * - 'expired' -- credentials exist but have expired. Re-authentication
   *   is required (e.g., OAuth token refresh, re-login).
   * - 'unknown' -- auth state could not be determined. This occurs when
   *   the agent is not installed, the auth probe fails, or the auth
   *   mechanism is not supported for detection.
   */
  status: 'authenticated' | 'unauthenticated' | 'expired' | 'unknown';

  /**
   * The authentication method that was detected.
   * Undefined when status is 'unauthenticated' or 'unknown'.
   */
  method?: AuthMethod;

  /**
   * Identity string associated with the credentials.
   * Format is agent-specific: email address, username, API key prefix
   * (first 8 chars + '...'), OAuth subject, etc.
   * Undefined when status is 'unauthenticated' or 'unknown'.
   */
  identity?: string;

  /**
   * When the credentials expire.
   * Undefined if the credentials do not expire (e.g., API keys) or
   * if expiry cannot be determined.
   */
  expiresAt?: Date;

  /**
   * When this auth state was checked.
   * Always set. Consumers can use this to decide whether to re-check
   * (e.g., if the check is older than 5 minutes).
   */
  checkedAt: Date;

  /**
   * Additional human-readable details about the auth state.
   * Used for context when status is 'unknown' (e.g., "Agent not installed")
   * or for supplementary info (e.g., "Using organization API key").
   */
  details?: string;
}
```

### 9.1 AuthState Field Reference

| Field | Type | Always Set | Description |
|---|---|---|---|
| `agent` | `AgentName` | Yes | Agent this state belongs to. |
| `status` | `'authenticated' \| 'unauthenticated' \| 'expired' \| 'unknown'` | Yes | Current auth status. |
| `method` | `AuthMethod` | No | Detected auth method. |
| `identity` | `string` | No | Identity string (email, key prefix, etc.). |
| `expiresAt` | `Date` | No | Credential expiry time. |
| `checkedAt` | `Date` | Yes | When this check was performed. |
| `details` | `string` | No | Additional context. |

---

## 10. AuthMethod Type

Enumerates the authentication mechanisms used by agents.

```typescript
/**
 * Authentication methods supported by agents.
 *
 * Used in AuthState.method to indicate which credential type was detected,
 * and in AgentCapabilities.authMethods to declare which methods an agent supports.
 */
type AuthMethod =
  | 'api_key'          // API key in env var or config file (most agents)
  | 'oauth'            // OAuth 2.0 flow (e.g., Copilot, hermes login)
  | 'oauth_device'     // OAuth device code flow
  | 'browser_login'    // Browser-based login (e.g., Claude Code)
  | 'token_file'       // Token stored in a file (e.g., ~/.config/<agent>/token)
  | 'keychain'         // OS-level credential store (macOS Keychain, Windows Credential Manager)
  | 'github_token'     // GitHub personal access token (Copilot, hermes)
  | 'config_file'      // Credentials embedded in config file (hermes YAML)
  | 'none'             // Agent requires no authentication (rare; local-only agents)
```

### 10.1 Agent Auth Methods

| Agent | Primary Method | Alternative Methods | Auth Files / Env Vars |
|---|---|---|---|
| Claude Code | `browser_login` | `api_key` | `ANTHROPIC_API_KEY` |
| Codex CLI | `api_key` | -- | `OPENAI_API_KEY` |
| Gemini CLI | `browser_login`, `api_key` (both equally primary) | -- | `GOOGLE_API_KEY`, `GEMINI_API_KEY` |
| Copilot CLI | `oauth_device` | `github_token` | `GITHUB_TOKEN` |
| Cursor | `browser_login` | `api_key` | `CURSOR_API_KEY` |
| OpenCode | `api_key` | -- | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` |
| Pi | `api_key` | -- | Provider-specific API key env vars |
| omp | `api_key` | -- | Provider-specific API key env vars |
| OpenClaw | `api_key` | -- | Provider-specific API key env vars |
| hermes | `api_key` | `oauth`, `github_token`, `config_file` | `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `NOUS_API_KEY`, `GITHUB_TOKEN`, `GOOGLE_API_KEY` |

> **SCOPE EXTENSION:** hermes-agent supports the broadest set of auth methods among all supported agents, reflecting its multi-provider architecture. Its `hermes login` command supports OAuth for Nous Portal and OpenAI Codex. API keys can be set via environment variables, `.env` file in `~/.hermes/`, or directly in `cli-config.yaml`.

---

## 11. AuthSetupGuidance Type

Structured, machine-readable guidance for setting up authentication with an agent.

```typescript
/**
 * Structured authentication setup guidance.
 *
 * Returned by AuthManager.getSetupGuidance() and AgentAdapter.getAuthGuidance().
 * Provides everything a consumer needs to display setup instructions to a
 * user or generate automated setup scripts.
 */
interface AuthSetupGuidance {
  /** The agent this guidance is for. */
  agent: AgentName;

  /** Human-readable display name for the auth provider or method. */
  providerName: string;

  /**
   * Ordered list of setup steps.
   * Each step has a description and optional command or URL.
   * Steps should be followed in order.
   */
  steps: AuthSetupStep[];

  /**
   * Environment variables relevant to authentication.
   * Includes both required variables and optional overrides.
   */
  envVars: AuthEnvVar[];

  /**
   * URLs to relevant documentation.
   */
  documentationUrls: string[];

  /**
   * Platform-specific notes.
   * Keyed by platform identifier (e.g., 'darwin', 'linux', 'win32').
   * Undefined platforms have no special notes.
   */
  platformNotes?: Record<string, string>;

  /**
   * The CLI command to initiate interactive authentication, if available.
   * Example: 'claude login', 'hermes login', 'gh auth login'.
   * Undefined if the agent does not have an interactive login command.
   */
  loginCommand?: string;

  /**
   * The CLI command to verify authentication status, if available.
   * Example: 'claude auth status', 'hermes doctor'.
   */
  verifyCommand?: string;
}

/**
 * A single step in the auth setup process.
 */
interface AuthSetupStep {
  /** Step number (1-indexed). */
  step: number;

  /** Human-readable description of what to do. */
  description: string;

  /**
   * Shell command to run for this step, if applicable.
   * Undefined if the step is manual (e.g., "Visit the website and sign up").
   */
  command?: string;

  /**
   * URL to visit for this step, if applicable.
   * Undefined if the step is command-based or purely descriptive.
   */
  url?: string;
}

/**
 * An environment variable relevant to agent authentication.
 */
interface AuthEnvVar {
  /** The environment variable name (e.g., 'ANTHROPIC_API_KEY'). */
  name: string;

  /** Human-readable description of what this variable controls. */
  description: string;

  /** Whether this variable is required for the primary auth method. */
  required: boolean;

  /**
   * Example value format (with sensitive parts masked).
   * Example: 'sk-ant-api03-...'
   */
  exampleFormat?: string;
}
```

---

## 12. MCP Server Management

ConfigManager provides dedicated methods for managing MCP server configurations within agent config files. This is a convenience layer over `set()` that understands each agent's native MCP config format and provides targeted operations.

### 12.1 Native MCP Config Formats

Each agent stores MCP server configurations differently in its native config file. The adapter layer translates between the common `McpServerConfig` type (defined in `02-run-options-and-profiles.md`, Section 4) and the native format.

**Claude Code** (`settings.json`):
```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "@my/mcp-server"],
      "env": { "API_KEY": "..." }
    }
  }
}
```

**Codex CLI** (`config.json`):
```json
{
  "mcpServers": [
    {
      "name": "my-server",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@my/mcp-server"]
    }
  ]
}
```

**Gemini CLI** (`settings.json`):
```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "@my/mcp-server"]
    }
  }
}
```

**hermes** (`cli-config.yaml`):
```yaml
mcp_servers:
  my-server:
    command: npx
    args:
      - "-y"
      - "@my/mcp-server"
    env:
      API_KEY: "..."
```

> **SCOPE EXTENSION:** hermes-agent stores MCP server config in YAML format within `cli-config.yaml` under the `mcp_servers` key. The adapter translates between the YAML map structure and the common `McpServerConfig` type.

### 12.2 MCP Support by Agent

| Agent | Supports MCP | Native MCP Format | Config Key |
|---|---|---|---|
| Claude Code | Yes | Object map (keyed by name) | `mcpServers` |
| Codex CLI | Yes | Array of objects | `mcpServers` |
| Gemini CLI | Yes | Object map (keyed by name) | `mcpServers` |
| Copilot CLI | No | -- | -- |
| Cursor | Yes | Object map (keyed by name) | `mcpServers` |
| OpenCode | Yes | Object map (keyed by name) | `mcpServers` |
| Pi | No | -- | -- |
| omp | No | -- | -- |
| OpenClaw | Yes | Object map (keyed by name) | `mcpServers` |
| hermes | Yes | YAML map (keyed by name) | `mcp_servers` |

Calling `addMcpServer()` or `removeMcpServer()` on an agent where `supportsMCP` is `false` throws `AgentMuxError` with code `CAPABILITY_ERROR`.

### 12.3 addMcpServer Behavior

1. Acquire an advisory file lock (throws `CONFIG_LOCK_ERROR` on timeout).
2. Read the agent's current config file (within the lock, to prevent TOCTOU races).
3. Check that no server with the given `server.name` already exists. If one does, release the lock and throw `CONFIG_ERROR` with a message identifying the duplicate.
4. Translate the `McpServerConfig` into the agent's native MCP format.
5. Insert the entry into the config structure.
6. Write the updated config file.
7. Update the in-memory cache.
8. Release the file lock.

### 12.4 removeMcpServer Behavior

1. Acquire an advisory file lock (throws `CONFIG_LOCK_ERROR` on timeout).
2. Read the agent's current config file (within the lock, to prevent TOCTOU races).
3. Find the server entry matching `serverName`. If not found, release the lock and throw `CONFIG_ERROR` with a message identifying the missing server.
4. Remove the entry from the config structure.
5. Write the updated config file.
6. Update the in-memory cache.
7. Release the file lock.

### 12.5 getMcpServers Normalization

`getMcpServers()` reads the agent's native MCP config and normalizes each entry into a `McpServerConfig` object:

- For agents using object-map format (Claude Code, Gemini, Cursor, OpenCode, OpenClaw, hermes), the map key becomes `McpServerConfig.name`.
- For agents using array format (Codex), each entry's `name` field is used directly.
- The `transport` field defaults to `'stdio'` when the native format does not store it explicitly (the native format implies stdio by requiring `command`).
- `url`, `headers`, `args`, and `env` are passed through as-is.

---

## 13. Config Write Semantics

### 13.1 Deep Merge Rules

> **Note:** `set()` and `setField()` use the same deep-merge algorithm as `get()` when it merges global and project config files (Section 7.1, rule 3). Scalar fields are replaced, object fields are merged recursively, and array fields are replaced wholesale. Both code paths share a single internal `deepMerge()` utility to ensure consistent behavior.

When `set()` or `setField()` writes a partial config:

1. **Scalar fields** (string, number, boolean): the new value replaces the old value.
2. **Object fields** (env, native): the new object is deep-merged with the existing object. Keys present in both use the new value. Keys only in the existing object are preserved. Keys only in the new object are added.
3. **Array fields** (allowedCommands, deniedCommands, skills, mcpServers): the new array replaces the existing array entirely. Arrays are not concatenated or deduplicated. Consumers who want to append to an array should read the current value first, append, then write the full array.
4. **Undefined fields**: fields set to `undefined` in the partial config are ignored (the existing value is preserved). To delete a field from the config, the consumer must use the adapter's `writeConfig()` directly with the appropriate native format mechanism.

### 13.2 File Locking

All write operations (`set`, `setField`, `addMcpServer`, `removeMcpServer`) acquire an advisory file lock using `proper-lockfile` or equivalent. The lock:

- Is acquired with a configurable timeout (default: 5000ms). If the lock cannot be acquired within the timeout, the operation throws `CONFIG_LOCK_ERROR` (`recoverable: true`).
- Is released immediately after the write completes, even if the write throws.
- Uses a `.lock` file adjacent to the config file (e.g., `settings.json.lock`).
- Is process-safe: multiple agent-mux instances on the same machine will not corrupt the file.

### 13.3 Validation on Write

Before writing, `set()` and `setField()` validate the merged result against the agent's schema (the same logic as `validate()`). If validation fails, the write is aborted and a `VALIDATION_ERROR` is thrown. The original file is not modified.

---

## 14. Auth Detection Strategies

Each adapter implements `detectAuth()` using agent-specific strategies. The AuthManager delegates to these adapter methods and does not implement detection logic itself.

### 14.1 Detection Strategies by Agent

| Agent | Primary Strategy | Details |
|---|---|---|
| Claude Code | Check for session token in `~/.claude/` | Inspects auth token files; falls back to `ANTHROPIC_API_KEY` env var |
| Codex CLI | Check `OPENAI_API_KEY` env var | Validates key format (starts with `sk-`) |
| Gemini CLI | Check `GOOGLE_API_KEY` / `GEMINI_API_KEY` env var | Also checks browser-based OAuth credential cache |
| Copilot CLI | Check `GITHUB_TOKEN` env var and OAuth token file | Inspects `~/.config/github-copilot/` for cached OAuth tokens |
| Cursor | Check session token in `~/.cursor/` | Inspects auth storage; falls back to `CURSOR_API_KEY` env var |
| OpenCode | Check provider-specific env vars | Checks `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` based on configured provider |
| Pi | Check provider-specific env vars | Checks API key env vars based on configured provider |
| omp | Check provider-specific env vars | Checks API key env vars based on configured provider |
| OpenClaw | Check provider-specific env vars | Checks API key env vars based on configured provider |
| hermes | Multi-strategy probe | Checks `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `NOUS_API_KEY`, `GITHUB_TOKEN`, `GOOGLE_API_KEY`; inspects `~/.hermes/cli-config.yaml` for embedded keys; checks OAuth token cache from `hermes login` |

> **SCOPE EXTENSION:** hermes-agent detection checks multiple providers because hermes supports 10+ inference providers. The detection returns `'authenticated'` if any valid credential is found for any configured provider. The `AuthState.method` reflects the primary credential found, and `AuthState.details` lists all detected providers.

### 14.2 Detection Guarantees

- **No side effects.** `detectAuth()` never modifies any file, environment variable, or credential store. It is safe to call in a tight loop or on a timer.
- **No network calls.** Detection is local-only. It does not validate credentials against a remote API. A key that exists locally but has been revoked server-side will show as `'authenticated'`.
- **Fast.** Detection reads at most a few small files and checks environment variables. It completes in under 100ms for all agents.
- **No prompts.** Detection never spawns interactive processes or prompts the user.

---

## 15. CLI Integration

The `amux config` and `amux auth` CLI subcommands map directly to the `ConfigManager` and `AuthManager` APIs.

### 15.1 amux config

```
amux config get <agent> [field]
amux config set <agent> <field> <value>
amux config schema <agent>
amux config validate <agent>
amux config mcp list <agent>
amux config mcp add <agent>
amux config mcp remove <agent> <name>
amux config reload [agent]
```

| Command | API Method | Behavior |
|---|---|---|
| `amux config get <agent>` | `config.get(agent)` | Prints the full merged config as formatted JSON. |
| `amux config get <agent> <field>` | `config.getField(agent, field)` | Prints the single field value. |
| `amux config set <agent> <field> <value>` | `config.setField(agent, field, value)` | Writes the field. Prints confirmation. |
| `amux config schema <agent>` | `config.schema(agent)` | Prints the config schema as formatted JSON. |
| `amux config validate <agent>` | `config.validate(agent, config.get(agent))` | Validates current config. Prints result. Exit code 1 if invalid. |
| `amux config mcp list <agent>` | `config.getMcpServers(agent)` | Lists MCP servers as a table. |
| `amux config mcp add <agent>` | `config.addMcpServer(agent, server)` | Interactive prompt for server details, then adds. |
| `amux config mcp remove <agent> <name>` | `config.removeMcpServer(agent, name)` | Removes the named server. Prints confirmation. |
| `amux config reload [agent]` | `config.reload(agent)` | Re-reads config from disk. If no agent given, reloads all. |

All config CLI commands support `--json` for machine-readable output and `--scope global|project` to target a specific config file (default: merged for reads, global for writes).

### 15.2 amux auth

```
amux auth check [agent]
amux auth setup <agent>
```

| Command | API Method | Behavior |
|---|---|---|
| `amux auth check` | `auth.checkAll()` | Prints auth status for all agents as a table. Supports `--json` for machine-readable output. |
| `amux auth check <agent>` | `auth.check(agent)` | Prints auth status for a single agent. Supports `--json` for machine-readable output. |
| `amux auth setup <agent>` | `auth.getSetupGuidance(agent)` | Prints setup instructions. Supports `--json` for machine-readable output. If the agent has a `loginCommand`, offers to run it. |

The `amux auth check` output uses color coding: green for `authenticated`, red for `unauthenticated`, yellow for `expired`, gray for `unknown`.

---

## 16. Error Handling

### 16.1 Error Codes

ConfigManager and AuthManager use the standard `AgentMuxError` type (see `01-core-types-and-client.md`, Section 3.1) with these codes:

| Code | Manager | Thrown By | Meaning |
|---|---|---|---|
| `AGENT_NOT_FOUND` | Both | All methods accepting `AgentName` | The specified agent is not registered in the adapter registry. |
| `CONFIG_ERROR` | Config | `get()`, `getField()`, `set()`, `setField()`, `addMcpServer()`, `removeMcpServer()`, `reload()` | The config file cannot be parsed (malformed JSON/YAML) or cannot be written (permissions, disk full, duplicate MCP server name, missing MCP server name). |
| `CONFIG_LOCK_ERROR` | Config | `set()`, `setField()`, `addMcpServer()`, `removeMcpServer()` | The advisory file lock cannot be acquired within the timeout (default 5000ms). `recoverable: true` — the consumer can retry after a delay. |
| `VALIDATION_ERROR` | Config | `set()`, `setField()` | The merged config after applying the update would violate the agent's schema. |
| `CAPABILITY_ERROR` | Config | `addMcpServer()`, `removeMcpServer()` | The agent does not support MCP (`supportsMCP` is `false`). |

### 16.2 Error Recovery

- **CONFIG_ERROR on read:** The consumer receives the error and can decide to show a diagnostic, attempt to fix the file, or fall back to defaults. `get()` does not return partial results from a corrupt file.
- **CONFIG_LOCK_ERROR:** The advisory file lock could not be acquired within the timeout (default: 5000ms). `recoverable: true` — the consumer can retry after a delay. The lock timeout is configurable in `ClientOptions`.
- **VALIDATION_ERROR on write:** The error includes the full `ValidationResult` in the error's `cause` property, allowing the consumer to display field-level errors.

---

## 17. Implementation Notes

### 17.1 Adapter Contract

ConfigManager is a thin orchestration layer. The actual file I/O is performed by each adapter's `readConfig()` and `writeConfig()` methods (see `05-adapter-system.md`, Section 2). The adapter:

- Knows the native file format (JSON, YAML).
- Knows the native key names and structure.
- Maps between the native format and the normalized `AgentConfig` type.
- Handles global vs. project config paths.
- Preserves file formatting where possible (indentation, comments in YAML).

### 17.2 Concurrency Model

- **Reads** (`get`, `getField`, `getMcpServers`, `schema`, `validate`) are synchronous and lock-free. On the first read for a given agent, ConfigManager performs a synchronous file read (`fs.readFileSync`), parses and merges global/project configs, and caches the result. Subsequent reads return from the in-memory cache with no I/O. The cache is updated in-place after any successful write operation (`set`, `setField`, `addMcpServer`, `removeMcpServer`), ensuring the next read reflects the latest state.
- **Writes** (`set`, `setField`, `addMcpServer`, `removeMcpServer`) are async and acquire a file lock. Concurrent writes to the same agent's config file are serialized by the lock.
- **Auth checks** (`check`, `checkAll`) are async but lock-free. Concurrent auth checks are safe because detection is read-only.

### 17.3 ProfileManager Relationship

`ConfigManager.profiles()` returns the same `ProfileManager` instance available at `mux.profiles`. Profiles are agent-mux's own named `RunOptions` presets (stored in `~/.agent-mux/profiles/` and `.agent-mux/profiles/`). They are distinct from agent-native configuration: profiles control how agent-mux invokes an agent, while `AgentConfig` represents the agent's own persisted settings. See `02-run-options-and-profiles.md`, Section 10 for the full `ProfileManager` specification.

---

## 18. Complete Type Summary

All types defined in this specification, listed alphabetically:

| Type | Kind | Section | Description |
|---|---|---|---|
| `AgentConfig` | `interface` | 3 | Normalized agent configuration object. |
| `AgentConfigSchema` | `interface` | 4 | Schema definition for an agent's config. |
| `AuthEnvVar` | `interface` | 11 | Environment variable relevant to auth. |
| `AuthManager` | `interface` | 8 | Auth detection and guidance API. |
| `AuthMethod` | `type` (union) | 10 | Authentication method identifiers. |
| `AuthSetupGuidance` | `interface` | 11 | Structured auth setup instructions. |
| `AuthSetupStep` | `interface` | 11 | Single step in auth setup. |
| `AuthState` | `interface` | 9 | Auth state snapshot for an agent. |
| `ConfigField` | `interface` | 5 | Single config field descriptor. |
| `ConfigManager` | `interface` | 2 | Config read/write/validate API. |
| `McpServerConfig` | `interface` | `02-run-options-and-profiles.md`, Section 4 | MCP server connection config (defined externally, used here). |
| `ProfileManager` | `interface` | `02-run-options-and-profiles.md`, Section 10 | Named RunOptions presets (defined externally). Accessible via `ConfigManager.profiles()` and `mux.profiles`. |
| `ConfigValidationError` | `interface` | 6 | Single field validation error. Named to avoid collision with the throwable `ValidationError` class in `01-core-types-and-client.md`. |
| `ConfigValidationWarning` | `interface` | 6 | Non-fatal validation warning. |
| `ValidationResult` | `interface` | 6 | Config validation result (contains `ConfigValidationError[]` and `ConfigValidationWarning[]`). |

### 18.1 Method Summary

| Interface | Method | Returns |
|---|---|---|
| `ConfigManager` | `get(agent)` | `AgentConfig` |
| `ConfigManager` | `getField(agent, field)` | `unknown` |
| `ConfigManager` | `set(agent, fields)` | `Promise<void>` |
| `ConfigManager` | `setField(agent, field, value)` | `Promise<void>` |
| `ConfigManager` | `schema(agent)` | `AgentConfigSchema` |
| `ConfigManager` | `validate(agent, config)` | `ValidationResult` |
| `ConfigManager` | `getMcpServers(agent)` | `McpServerConfig[]` |
| `ConfigManager` | `addMcpServer(agent, server)` | `Promise<void>` |
| `ConfigManager` | `removeMcpServer(agent, serverName)` | `Promise<void>` |
| `ConfigManager` | `reload(agent?)` | `Promise<void>` |
| `ConfigManager` | `profiles()` | `ProfileManager` |
| `AuthManager` | `check(agent)` | `Promise<AuthState>` |
| `AuthManager` | `checkAll()` | `Promise<Record<AgentName, AuthState>>` |
| `AuthManager` | `getSetupGuidance(agent)` | `AuthSetupGuidance` |

---

## Implementation Status (2026-04-12)

### Config file formats

Each adapter declares its on-disk format in `capabilities.configFormat`. As currently implemented:

- `json` — claude, codex, copilot, cursor, opencode, pi, omp, openclaw, gemini.
- `yaml` — hermes (`~/.hermes/cli-config.yaml`). `writeConfig()` serializes through a local YAML emitter in the hermes adapter.

### Atomic writes

Both session-file writes and config writes go through the unified helper in `packages/core/src/atomic-fs.ts` (`writeFileAtomic` / `writeJsonAtomic`). The helper performs:

1. Create the parent directory if needed.
2. Acquire an advisory lockfile (`<path>.lock`) containing the holder's PID and a monotonic timestamp. Concurrent writers retry with bounded backoff; stale locks (holder PID dead, or older than `staleMs`, default 30s) are forcibly reclaimed.
3. Write the payload to a uniquely-named temp sibling, then `fsync` the file handle.
4. Rename the temp file over the target (with retry on Windows `EPERM`/`EBUSY` sharing-violation transients — the rename itself is atomic; we just retry the call).
5. Best-effort `fsync` of the parent directory (no-op on platforms that don't support it).
6. Release the lockfile.

This gives concurrent readers either the old bytes or the new bytes — never a torn state — and serialises concurrent writers so read-modify-write sequences in `ConfigManager.set()` and `addMcpServer()` / `removeMcpServer()` cannot interleave. `ConfigManagerImpl` additionally serialises `set()` calls per agent via an in-process write queue so the cache and on-disk state stay consistent.

Every adapter's `writeConfig()` (JSON: claude, codex, copilot, cursor, gemini, omp, opencode, openclaw, pi; YAML: hermes) funnels through `writeJsonFileAtomic` / `writeTextFileAtomic` in `packages/adapters/src/session-fs.ts`, which simply delegate to the core `atomic-fs` primitives. There is no ad-hoc atomic-write code left in the adapter layer.
