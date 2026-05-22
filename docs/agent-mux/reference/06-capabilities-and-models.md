# Agent Capabilities, Model Registry, and Thinking Normalization

**Specification v1.0** | `@a5c-ai/agent-mux`

> **Note:** hermes-agent is included as a 10th supported agent per project requirements, extending the original scope's 9 agents. All ten built-in agents (claude, codex, gemini, copilot, cursor, opencode, pi, omp, openclaw, hermes) share the same capability and model interfaces defined here.

---

## 1. Overview

This specification defines the capability discovery, model introspection, and thinking normalization systems in agent-mux. These three concerns are tightly related: capabilities determine what an agent can do, the model registry provides per-model granularity within those capabilities, and thinking normalization translates the unified `thinkingEffort` abstraction into each agent's native parameters.

The capability system serves two primary roles:

1. **Consumer-side feature-gating.** Consumers query capabilities before invoking features, enabling graceful degradation across agents with different feature sets.
2. **Pre-spawn validation.** The run engine validates `RunOptions` against capabilities before spawning a subprocess, throwing `CapabilityError` for unsupported operations rather than producing cryptic agent-side failures.

### 1.1 Cross-References

| Type / Concept | Spec | Section |
|---|---|---|
| `AgentName`, `BuiltInAgentName` | `01-core-types-and-client.md` | 1.4 |
| `AgentMuxClient`, `createClient()` | `01-core-types-and-client.md` | 5 |
| `RunOptions` | `02-run-options-and-profiles.md` | 2 |
| `RunHandle` | `03-run-handle-and-interaction.md` | 2 |
| `AgentEvent`, `BaseEvent` | `04-agent-events.md` | 2 |
| `ErrorCode`, `AgentMuxError`, `CapabilityError` | `01-core-types-and-client.md` | 3.1, 3.2 |
| `AgentAdapter`, `BaseAgentAdapter` | `05-adapter-system.md` | 2, 4 |
| `AdapterRegistry` | `05-adapter-system.md` | 5 |
| `InstalledPlugin`, `PluginInstallOptions`, `PluginSearchOptions`, `PluginListing` | `09-plugin-manager.md` | 2 |
| `AuthState`, `AuthMethod` | `08-config-and-auth.md` | 9, 10 |
| `McpServerConfig` | `02-run-options-and-profiles.md` | 4 |

---

## 2. AgentCapabilities Interface

The `AgentCapabilities` interface is the structured manifest of what an agent adapter can do. Every adapter -- built-in or plugin -- exposes a `capabilities` property of this type. Consumers access it via `mux.adapters.capabilities(agent)` or directly from the adapter instance.

```typescript
interface AgentCapabilities {
  /** The agent this capability manifest describes. */
  agent: AgentName

  // ── Session ─────────────────────────────────────────────────────────

  /** Whether the agent can resume a prior session by ID. */
  canResume: boolean

  /** Whether the agent can fork (branch) an existing session. */
  canFork: boolean

  /** Whether the agent supports multi-turn conversations within a single run. */
  supportsMultiTurn: boolean

  /**
   * How the agent persists session data.
   * - 'none'      — no persistence (ephemeral runs only)
   * - 'file'      — flat files (JSON, JSONL)
   * - 'sqlite'    — SQLite database
   * - 'in-memory' — in-process memory only, lost on exit
   */
  sessionPersistence: 'none' | 'file' | 'sqlite' | 'in-memory'

  // ── Streaming ───────────────────────────────────────────────────────

  /** Whether the agent supports real-time text token streaming. */
  supportsTextStreaming: boolean

  /** Whether tool call arguments stream incrementally. */
  supportsToolCallStreaming: boolean

  /** Whether thinking/reasoning tokens stream incrementally. */
  supportsThinkingStreaming: boolean

  // ── Tool Calling ────────────────────────────────────────────────────

  /** Whether the agent supports native tool/function calling. */
  supportsNativeTools: boolean

  /** Whether the agent supports the Model Context Protocol. */
  supportsMCP: boolean

  /** Whether the agent can invoke multiple tools in a single turn. */
  supportsParallelToolCalls: boolean

  /** Whether tool execution requires explicit user approval by default. */
  requiresToolApproval: boolean

  /** The approval modes this agent supports. */
  approvalModes: ('yolo' | 'prompt' | 'deny')[]

  // ── Thinking ────────────────────────────────────────────────────────

  /** Whether the agent supports extended thinking / reasoning mode. */
  supportsThinking: boolean

  /** The discrete thinking effort levels this agent accepts. */
  thinkingEffortLevels: ThinkingEffortLevel[]

  /** Whether the agent supports a numeric thinking budget in tokens. */
  supportsThinkingBudgetTokens: boolean

  // ── Output ──────────────────────────────────────────────────────────

  /** Whether the agent supports JSON-only output mode. */
  supportsJsonMode: boolean

  /** Whether the agent supports structured output with a schema. */
  supportsStructuredOutput: boolean

  // ── Skills / Agent Docs ─────────────────────────────────────────────

  /** Whether the agent supports loading skill definitions. */
  supportsSkills: boolean

  /** Whether the agent supports an agents.md / AGENTS.md doc. */
  supportsAgentsMd: boolean

  /**
   * The format skills are loaded in, or null if skills are unsupported.
   * - 'file'          — single-file skill definitions
   * - 'directory'     — directory-based skill bundles
   * - 'npm-package'   — npm-installable skill packages
   */
  skillsFormat: 'file' | 'directory' | 'npm-package' | null

  // ── Subagents / Parallelism ─────────────────────────────────────────

  /** Whether the agent can dispatch subagent tasks. */
  supportsSubagentDispatch: boolean

  /** Whether the agent supports running parallel tasks / tool calls. */
  supportsParallelExecution: boolean

  /** Maximum number of concurrent parallel tasks, if bounded. */
  maxParallelTasks?: number

  // ── Interaction ─────────────────────────────────────────────────────

  /** Whether the agent has an interactive REPL mode. */
  supportsInteractiveMode: boolean

  /** Whether agent-mux can inject text into the agent's stdin mid-run. */
  supportsStdinInjection: boolean

  // ── Multimodal ──────────────────────────────────────────────────────

  /** Whether the agent accepts image inputs (screenshots, diagrams). */
  supportsImageInput: boolean

  /** Whether the agent can produce image outputs. */
  supportsImageOutput: boolean

  /** Whether the agent accepts file attachments beyond images. */
  supportsFileAttachments: boolean

  // ── Plugin System ───────────────────────────────────────────────────

  /** Whether this agent has a plugin/extension system. */
  supportsPlugins: boolean

  /** The kinds of plugins this agent supports. */
  pluginFormats: PluginFormat[]

  /** Native CLI command to install a plugin, if available. */
  pluginInstallCmd?: string

  /** Native CLI command to list installed plugins, if available. */
  pluginListCmd?: string

  /** Native CLI command to uninstall a plugin, if available. */
  pluginUninstallCmd?: string

  /** Official plugin marketplace / registry URL, if available. */
  pluginMarketplaceUrl?: string

  /** Native CLI command to search for plugins, if available. */
  pluginSearchCmd?: string

  /** Where plugins are sourced from (npm, custom registries, etc.). */
  pluginRegistries: PluginRegistry[]

  // ── Process ─────────────────────────────────────────────────────────

  /** Platforms this agent runs on natively. */
  supportedPlatforms: ('darwin' | 'linux' | 'win32')[]

  /** Whether the agent requires the working directory to be a git repo. */
  requiresGitRepo: boolean

  /** Whether the agent requires a pseudo-terminal (PTY) to function. */
  requiresPty: boolean

  // ── Auth ────────────────────────────────────────────────────────────

  /** Authentication methods this agent supports. */
  authMethods: AuthMethod[]

  /** File paths (relative to home) where auth tokens/keys are stored. */
  authFiles: string[]

  // ── Install ─────────────────────────────────────────────────────────

  /** Installation methods for this agent, per platform. See Section 7. */
  installMethods: InstallMethod[]
}

type ThinkingEffortLevel = 'low' | 'medium' | 'high' | 'max'
```

### 2.1 Capability Access Patterns

Capabilities are accessed in two ways:

1. **Via AdapterRegistry** (the standard consumer path):
   ```typescript
   const caps = mux.adapters.capabilities('claude')
   if (caps.supportsThinking) {
     // safe to pass thinkingEffort
   }
   ```

2. **Via the adapter instance** (for adapter authors and internal use):
   ```typescript
   const adapter = mux.adapters.get('claude')
   const caps = adapter.capabilities
   ```

Both return the same `AgentCapabilities` instance. The object is immutable at runtime; adapters construct it once during initialization.

---

## 3. Supporting Types: PluginFormat, PluginRegistry, InstallMethod

### 3.1 PluginFormat

Defines the structural kinds of plugins an agent can load.

```typescript
/**
 * The structural format of a plugin.
 * - 'npm-package'      — an npm-installable package
 * - 'skill-file'       — a single-file skill definition (markdown, YAML, etc.)
 * - 'skill-directory'  — a directory-based skill bundle
 * - 'extension-ts'     — a TypeScript extension (Cursor-style)
 * - 'channel-plugin'   — a messaging channel connector (OpenClaw gateways)
 * - 'mcp-server'       — an MCP server that the agent connects to as a client
 */
type PluginFormat =
  | 'npm-package'
  | 'skill-file'
  | 'skill-directory'
  | 'extension-ts'
  | 'channel-plugin'
  | 'mcp-server'
```

### 3.2 PluginRegistry

Describes where plugins are sourced from for a given agent.

```typescript
interface PluginRegistry {
  /** Registry identifier (e.g., 'npm', 'openclaw-registry', 'agentskills-hub'). */
  name: string

  /** Base URL of the registry. */
  url: string

  /** Whether the registry supports programmatic search. */
  searchable: boolean
}
```

### 3.3 InstallMethod

Describes a single method for installing an agent on a particular platform.

```typescript
interface InstallMethod {
  /**
   * Which platform this install method applies to.
   * 'all' means the method works on darwin, linux, and win32.
   */
  platform: 'darwin' | 'linux' | 'win32' | 'all'

  /**
   * The installation mechanism.
   * - 'npm'          — global npm install
   * - 'brew'         — Homebrew formula or cask
   * - 'gh-extension' — GitHub CLI extension
   * - 'curl'         — shell installer via curl pipe
   * - 'winget'       — Windows Package Manager
   * - 'scoop'        — Scoop package manager
   * - 'manual'       — manual download / no automated install
   * - 'pip'          — Python pip/uv install
   * - 'nix'          — Nix flake
   */
  type: 'npm' | 'brew' | 'gh-extension' | 'curl' | 'winget' | 'scoop' | 'manual' | 'pip' | 'nix'

  /** The exact command to run for installation. */
  command: string

  /** Human-readable notes (e.g., prerequisites, RAM requirements). */
  notes?: string

  /** A command to run to verify a prerequisite is installed (e.g., 'gh --version'). */
  prerequisiteCheck?: string
}
```

> **Scope extension:** `'pip'` and `'nix'` are added by this spec to support hermes-agent; not in the original scope's 7-value union.

---

## 4. ModelRegistry Interface

The `ModelRegistry` provides per-agent model introspection. It is accessible via `mux.models` and exposes methods to list models, query individual model capabilities, validate model identifiers, estimate costs, and refresh model data.

Model data is sourced from two tiers:

1. **Bundled** -- a static snapshot shipped with each adapter, always available offline.
2. **Remote** -- fetched on demand via `refresh()`, reflecting the latest model availability from the agent's provider.

```typescript
interface ModelRegistry {
  /**
   * Return all known models for an agent.
   * Returns bundled data immediately; call refresh() first for latest remote data.
   */
  models(agent: AgentName): ModelCapabilities[]

  /**
   * Return the model catalog for an agent, including default-entry metadata.
   * Preferred for CLI/TUI listings.
   */
  catalog(agent: AgentName): Array<ModelCapabilities & { isDefault: boolean }>

  /**
   * Return capabilities for a specific model, or null if not found.
   * Matches on both modelId and modelAlias.
   */
  model(agent: AgentName, modelId: string): ModelCapabilities | null

  /**
   * Return the default model for an agent, or null if the agent
   * has no configured default.
   */
  defaultModel(agent: AgentName): ModelCapabilities | null

  /**
   * Validate a model identifier against the agent's known model list.
   * Returns a result indicating whether the model is valid, deprecated,
   * or unknown, with guidance for corrections.
   */
  validate(agent: AgentName, modelId: string): ModelValidationResult

  /**
   * Estimate the cost (in USD) for a given token usage on a specific model.
   * Returns 0 if pricing data is unavailable.
   */
  estimateCost(
    agent: AgentName,
    modelId: string,
    inputTokens: number,
    outputTokens: number
  ): number

  /**
   * Refresh model data for a specific agent from its remote source.
   * Updates the in-memory model list; does not persist to disk.
   */
  refresh(agent: AgentName): Promise<void>

  /**
   * Refresh model data for all registered agents.
   * Runs refresh() calls in parallel.
   */
  refreshAll(): Promise<void>

  /**
   * Return the timestamp of the last successful model data update
   * for an agent. Returns the bundled data timestamp if refresh()
   * has never been called.
   */
  lastUpdated(agent: AgentName): Date
}
```

### 4.1 Cost Estimation

The `estimateCost` method computes a USD estimate using the model's pricing fields:

```
cost = (inputTokens / 1_000_000) * inputPricePerMillion
     + (outputTokens / 1_000_000) * outputPricePerMillion
```

For models with thinking pricing, consumers should account for thinking tokens separately:

```typescript
const thinkingCost = (thinkingTokens / 1_000_000) * model.thinkingPricePerMillion
```

Cached input tokens use `cachedInputPricePerMillion` when available. The method returns `0` when pricing data is not available for the given model.

---

## 5. ModelCapabilities Interface

Each model known to an adapter is described by a `ModelCapabilities` object. This provides model-level granularity beyond the agent-level `AgentCapabilities`.

```typescript
interface ModelCapabilities {
  /** The agent this model belongs to. */
  agent: AgentName

  /** The canonical model identifier (e.g., 'claude-opus-4-20250514'). */
  modelId: string

  /** An optional short alias (e.g., 'opus' for 'claude-opus-4-20250514'). */
  modelAlias?: string

  /** Human-readable display name (e.g., 'Claude Opus 4'). */
  displayName: string

  /** Whether this model is deprecated and should not be used for new work. */
  deprecated: boolean

  /** ISO 8601 date string when the model was deprecated. */
  deprecatedSince?: string

  /** The recommended replacement model when this model is deprecated. */
  successorModelId?: string

  /** Maximum context window size in tokens. */
  contextWindow: number

  /** Maximum output tokens the model can generate in a single response. */
  maxOutputTokens: number

  /** Maximum thinking/reasoning tokens, if the model supports thinking. */
  maxThinkingTokens?: number

  /** Cost per million input tokens in USD. */
  inputPricePerMillion?: number

  /** Cost per million output tokens in USD. */
  outputPricePerMillion?: number

  /** Cost per million thinking tokens in USD. */
  thinkingPricePerMillion?: number

  /** Cost per million cached input tokens in USD. */
  cachedInputPricePerMillion?: number

  /** Whether this model supports extended thinking / reasoning mode. */
  supportsThinking: boolean

  /** The discrete thinking effort levels this model accepts. */
  thinkingEffortLevels?: ThinkingEffortLevel[]

  /** The valid range [min, max] for thinkingBudgetTokens on this model. */
  thinkingBudgetRange?: [number, number]

  /** Whether this model supports tool/function calling. */
  supportsToolCalling: boolean

  /** Whether this model supports parallel tool calls in a single turn. */
  supportsParallelToolCalls: boolean

  /** Whether tool call arguments stream incrementally on this model. */
  supportsToolCallStreaming: boolean

  /** Whether this model supports JSON-only output mode. */
  supportsJsonMode: boolean

  /** Whether this model supports structured output with a schema. */
  supportsStructuredOutput: boolean

  /** Whether this model supports real-time text token streaming. */
  supportsTextStreaming: boolean

  /** Whether thinking/reasoning tokens stream on this model. */
  supportsThinkingStreaming: boolean

  /** Whether this model accepts image inputs. */
  supportsImageInput: boolean

  /** Whether this model can produce image outputs. */
  supportsImageOutput: boolean

  /** Whether this model accepts file inputs beyond images. */
  supportsFileInput: boolean

  /** Normalized provider family backing this entry. */
  provider?: string

  /** Provider-native model identifier when it differs from modelId. */
  providerModelId?: string

  /** Normalized request protocol used by the adapter for this model. */
  protocol?: 'chat' | 'responses' | 'messages' | 'custom'

  /** Typical deployment path for the adapter/model combination. */
  deployment?: 'hosted' | 'local' | 'gateway' | 'hybrid'

  /** Whether the adapter can route this model entry to local backends. */
  supportsLocalModels?: boolean

  /**
   * The CLI argument key used to select this model
   * (e.g., '--model', '-m', '--provider').
   */
  cliArgKey: string

  /**
   * The CLI argument value passed with cliArgKey
   * (e.g., 'claude-opus-4-20250514', 'o3').
   */
  cliArgValue: string

  /** ISO 8601 timestamp of the last update to this model's data. */
  lastUpdated: string

  /** Whether this data comes from a bundled snapshot or a remote refresh. */
  source: 'bundled' | 'remote'
}
```

### 5.1 Model vs. Agent Capability Resolution

When both agent-level and model-level capabilities exist for the same feature, the model-level value takes precedence. For example:

- `AgentCapabilities.supportsThinking` may be `true` for an agent that has at least one thinking-capable model, but `ModelCapabilities.supportsThinking` for a specific model may be `false`.
- The run engine validates against the **model-level** capability when a model is specified, and falls back to agent-level only when no model is specified.

This is particularly relevant for agents like Cursor, OpenCode, Pi, and OpenClaw where thinking support is model-dependent.

---

## 6. ModelValidationResult

Returned by `ModelRegistry.validate()` to give consumers detailed feedback on model identifier validity.

```typescript
interface ModelValidationResult {
  /** Whether the model identifier is recognized and usable. */
  valid: boolean

  /** The validated model's capabilities, if valid. */
  model?: ModelCapabilities

  /**
   * Validation status:
   * - 'ok'          — model is valid and current
   * - 'deprecated'  — model is valid but deprecated; see successorModelId
   * - 'alias'       — an alias was provided; resolved to canonical modelId
   * - 'unknown'     — model identifier not found
   * - 'ambiguous'   — model identifier matches multiple models
   */
  status: 'ok' | 'deprecated' | 'alias' | 'unknown' | 'ambiguous'

  /** Human-readable message explaining the result. */
  message: string

  /** Suggested model identifiers when status is 'unknown' or 'ambiguous'. */
  suggestions?: string[]

  /** The canonical model ID when status is 'alias'. */
  resolvedModelId?: string

  /** The recommended successor when status is 'deprecated'. */
  successorModelId?: string
}
```

### 6.1 Validation Behavior

- When `status` is `'alias'`, `valid` is `true` and `resolvedModelId` contains the canonical identifier.
- When `status` is `'deprecated'`, `valid` is `true` (the model still works) but `successorModelId` indicates the recommended migration target.
- When `status` is `'unknown'`, the registry performs fuzzy matching and populates `suggestions` with the closest matches (up to 5).
- When `status` is `'ambiguous'`, `suggestions` contains all matching candidates.

---

## 7. Install Metadata Per Built-in Adapter

Each built-in adapter declares an `installMethods` array in its capabilities. These are consumed by `amux install <agent>` and the `AdapterRegistry.installInstructions()` API.

### 7.1 Claude Code

| Platform | Type | Command |
|---|---|---|
| all | npm | `npm install -g @anthropic-ai/claude-code` |
| darwin | brew | `brew install claude-code` |

### 7.2 Codex CLI

| Platform | Type | Command |
|---|---|---|
| all | npm | `npm install -g @openai/codex` |

### 7.3 Gemini CLI

| Platform | Type | Command |
|---|---|---|
| all | npm | `npm install -g @google/gemini-cli` |

### 7.4 GitHub Copilot CLI

| Platform | Type | Command | Notes |
|---|---|---|---|
| all | gh-extension | `gh extension install github/gh-copilot` | Requires GitHub CLI (gh). Install with: `brew install gh` / `winget install GitHub.cli` |

Prerequisite check: `gh --version`

### 7.5 Cursor

| Platform | Type | Command | Notes |
|---|---|---|---|
| darwin | manual | `open https://cursor.sh/download` | macOS .dmg installer |
| linux | manual | `open https://cursor.sh/download` | AppImage |
| win32 | winget | `winget install Cursor.Cursor` | No headless-only install. Full app required even for CLI use. |

### 7.6 OpenCode

| Platform | Type | Command |
|---|---|---|
| all | npm | `npm install -g opencode` |
| darwin | brew | `brew install opencode/tap/opencode` |

### 7.7 Pi

| Platform | Type | Command |
|---|---|---|
| all | npm | `npm install -g @mariozechner/pi-coding-agent` |

### 7.8 omp (oh-my-pi)

| Platform | Type | Command |
|---|---|---|
| all | npm | `npm install -g @oh-my-pi/pi-coding-agent` |

### 7.9 OpenClaw

| Platform | Type | Command | Notes |
|---|---|---|---|
| all | npm | `npm install -g openclaw` | Requires Node 22.16+, 16GB RAM minimum |

### 7.10 Hermes

| Platform | Type | Command | Notes |
|---|---|---|---|
| all | pip | `pip install hermes-agent` | Requires Python >= 3.11 |
| all | curl | `curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh \| bash` | Shell installer |
| all | nix | `nix run github:NousResearch/hermes-agent` | Nix flake available |

---

## 8. Thinking Effort Normalization

The unified `thinkingEffort` enum (`'low' | 'medium' | 'high' | 'max'`) is translated by each adapter into the agent's native thinking parameters before spawning. This section defines the complete per-adapter translation table and the override merge behavior.

### 8.1 Per-Adapter Translation Table

| Agent | low | medium | high | max | Native Parameter |
|---|---|---|---|---|---|
| Claude Code | `budget_tokens: 1024` | `budget_tokens: 8192` | `budget_tokens: 32768` | `budget_tokens: max_budget_tokens` | `--thinking-budget` or `budget_tokens` in API |
| Codex CLI | `'low'` | `'medium'` | `'high'` | `'high'` | `--reasoning` flag; max maps to high (no separate max tier) |
| Gemini CLI | `thinkingBudget: 1024` | `thinkingBudget: 8192` | `thinkingBudget: 32768` | `thinkingBudget: max` | `thinkingConfig.thinkingBudget` equivalents |
| Copilot CLI | n/a | n/a | n/a | n/a | No thinking support |
| Cursor | model-dependent | model-dependent | model-dependent | model-dependent | Passed as provider-level parameter when model supports thinking |
| OpenCode | model-dependent | model-dependent | model-dependent | model-dependent | Passed as provider-level parameter when model supports thinking |
| Pi | model-dependent | model-dependent | model-dependent | model-dependent | Passed as provider-level parameter when model supports thinking |
| omp | `budget_tokens: 1024` | `budget_tokens: 8192` | `budget_tokens: 32768` | `budget_tokens: max_budget_tokens` | `budget_tokens` passed to provider (always supported; not model-dependent) |
| OpenClaw | model-dependent | model-dependent | model-dependent | model-dependent | Passed as provider-level parameter when model supports thinking |
| Hermes | n/a | n/a | n/a | n/a | No explicit extended-thinking mode; focus is on skill creation and procedural learning |

For agents marked "model-dependent," the adapter inspects the selected model's `ModelCapabilities.supportsThinking` and `thinkingEffortLevels` to determine whether and how to pass the parameter. When the model does support thinking, the adapter translates the effort level to the appropriate provider-level parameter for the underlying model provider (e.g., Anthropic budget_tokens, OpenAI reasoning_effort).

### 8.2 thinkingBudgetTokens Pass-Through

The `thinkingBudgetTokens` field in `RunOptions` provides direct numeric control. When specified:

- **Claude Code:** Passed directly as `budget_tokens`.
- **Codex CLI:** Ignored (Codex uses discrete levels only).
- **Gemini CLI:** Passed as `thinkingConfig.thinkingBudget`.
- **omp:** Passed directly as `budget_tokens` (always supported, unconditionally).
- **Model-dependent agents (Cursor, OpenCode, Pi, OpenClaw):** Passed through to the provider when the model supports `supportsThinkingBudgetTokens`.
- **Copilot CLI, Hermes:** Ignored (no thinking support).

### 8.3 thinkingOverride Merge Behavior

The `thinkingOverride` field in `RunOptions` is an escape hatch for full native control. The merge order is:

1. The adapter computes normalized parameters from `thinkingEffort` and/or `thinkingBudgetTokens`.
2. `thinkingOverride` is shallow-merged **on top** of the normalized parameters.
3. The merged result is passed to the agent's native CLI flags or configuration.

This means `thinkingOverride` always wins. Example:

```typescript
// RunOptions
{
  agent: 'claude',
  thinkingEffort: 'high',           // → budget_tokens: 32768
  thinkingOverride: {
    budget_tokens: 50000,           // overrides the 32768
    some_future_param: true         // passed through as-is
  }
}
// Final native params: { budget_tokens: 50000, some_future_param: true }
```

### 8.4 CapabilityError on Unsupported Thinking

Setting `thinkingEffort` or `thinkingBudgetTokens` in `RunOptions` when the selected model has `supportsThinking: false` throws a `CapabilityError` **before spawning** the subprocess. This is a synchronous validation in the run engine.

```typescript
// From 01-core-types-and-client.md Section 3.2
class CapabilityError extends AgentMuxError {
  readonly code = 'CAPABILITY_ERROR'
  readonly agent: AgentName
  readonly capability: string  // e.g. 'thinking', 'jsonMode', 'plugins'
}
```

The error is thrown in the following cases:

| Condition | CapabilityError message |
|---|---|
| `thinkingEffort` set, agent `supportsThinking: false` | `Agent '{agent}' does not support thinking/reasoning mode` |
| `thinkingEffort` set, model `supportsThinking: false` | `Model '{modelId}' on agent '{agent}' does not support thinking` |
| `thinkingEffort` value not in model's `thinkingEffortLevels` | `Model '{modelId}' does not support thinking effort level '{level}'` |
| `thinkingBudgetTokens` set, agent/model `supportsThinkingBudgetTokens: false` | `Agent '{agent}' does not support numeric thinking budget` |
| `thinkingBudgetTokens` outside model's `thinkingBudgetRange` | `Thinking budget {n} is outside valid range [{min}, {max}] for model '{modelId}'` |

---

## 9. Plugin Support Matrix Per Agent

This table documents the plugin capabilities for each of the ten built-in agents.

| Agent | supportsPlugins | Format(s) | Registry | Marketplace URL |
|---|---|---|---|---|
| Claude Code | partial | skill-directory, mcp-server | -- (via `--add-dir`) | -- |
| Codex CLI | no | -- | -- | -- |
| Gemini CLI | no | -- | -- | -- |
| Copilot CLI | no | -- | -- | -- |
| Cursor | yes | extension-ts, mcp-server | cursor.sh/extensions | `https://cursor.sh/extensions` |
| OpenCode | yes | npm-package, skill-file, mcp-server | npm (opencode-*) | `https://www.npmjs.com/search?q=opencode-` |
| Pi | yes | npm-package, skill-file | npm (@mariozechner/pi-*) | `https://www.npmjs.com/search?q=%40mariozechner%2Fpi-` |
| omp | yes | npm-package, skill-file | npm (@oh-my-pi/*) | `https://www.npmjs.com/search?q=%40oh-my-pi%2F` |
| OpenClaw | yes | npm-package, skill-file, channel-plugin | npm + openclaw.ai/plugins | `https://openclaw.ai/plugins` |
| Hermes | yes | skill-file, skill-directory, mcp-server | agentskills.io | `https://agentskills.io` |

### 9.1 Notes on Hermes Plugin Support

Hermes has a rich plugin and skills ecosystem:

- **Built-in plugins:** `context_engine` and `memory` plugins in the `plugins/` directory.
- **Skills system:** User-created skills stored in `~/.hermes/skills/`; skills are auto-generated after complex tasks and self-improving during use.
- **Skills Hub:** Compatible with the agentskills.io open standard.
- **Optional skills:** Additional skills available in the `optional-skills/` directory.
- **MCP integration:** Full MCP client integration; can connect to any MCP server. Also runs as an MCP server via `mcp_serve.py` and the `hermes-acp` entry point.

---

## 10. Built-in Adapters Summary

This table provides a complete at-a-glance summary of all ten built-in adapters and their key characteristics.

| Adapter | CLI | Session | Stream | Fork | Thinking | MCP | Skills | Plugins | ACP | Platforms |
|---|---|---|---|---|---|---|---|---|---|---|
| Claude Code | `claude` | JSONL | yes | yes | yes | yes | yes | partial | no | darwin, linux, win32 |
| Codex CLI | `codex` | JSONL | yes | no | yes | yes | no | no | no | darwin, linux, win32 |
| Gemini CLI | `gemini` | JSONL | yes | no | yes | yes | no | no | no | darwin, linux, win32 |
| Copilot CLI | `copilot` | JSON | yes | no | no | no | no | no | no | darwin, linux, win32 |
| Cursor | `cursor` | SQLite | partial | no | model-dep | yes | no | yes | no | darwin, linux, win32 |
| OpenCode | `opencode` | SQLite | yes | yes | model-dep | yes | yes | yes | yes | darwin, linux, win32 |
| Pi | `pi` | JSONL tree | yes | yes | model-dep | no | yes | yes | yes | darwin, linux, win32 |
| omp | `omp` | JSONL tree | yes | yes | yes | no | yes | yes | yes | darwin, linux, win32 |
| OpenClaw | `openclaw` | JSON | partial | no | model-dep | yes | yes | yes | no | darwin, linux, win32 |
| Hermes | `hermes` | SQLite | yes | no | no | yes | yes | yes | yes | darwin, linux (WSL2 on win32) |

### 10.1 Column Definitions

| Column | Meaning |
|---|---|
| **CLI** | The command-line binary name used to invoke the agent |
| **Session** | Native session storage format |
| **Stream** | Real-time text streaming support; "partial" means some output types buffer |
| **Fork** | Whether the agent can branch an existing session into a new one |
| **Thinking** | Extended thinking/reasoning support; "model-dep" means only certain models support it |
| **MCP** | Model Context Protocol (tool server) support |
| **Skills** | Whether the agent supports loading skill definitions |
| **Plugins** | Whether the agent has a plugin/extension system; "partial" means limited |
| **ACP** | Agent Communication Protocol support |
| **Platforms** | Natively supported operating systems |

### 10.2 Hermes Adapter Notes

Hermes (hermes-agent by NousResearch) is the 10th built-in adapter, extending the original scope's 9 agents. Key characteristics:

- **CLI binary:** `hermes` (primary), `hermes-agent` (run agent), `hermes-acp` (ACP adapter).
- **Multi-provider:** Routes through OpenRouter (200+ models), Anthropic, OpenAI, Nous Portal, GitHub Copilot, Gemini, and any OpenAI-compatible endpoint (LM Studio, Ollama, vLLM, llama.cpp). Default model: `anthropic/claude-opus-4.6`.
- **Session/Memory:** Persistent memory with agent-curated entries in `~/.hermes/`; FTS5-based session search with LLM summarization for cross-session recall.
- **Configuration:** YAML-based (`~/.hermes/cli-config.yaml`); env vars override YAML.
- **Auth:** API keys via env vars or config YAML; OAuth via `hermes login` for Nous Portal and OpenAI Codex; GitHub token for Copilot; command approval/allowlist security model.
- **Platform:** Linux, macOS, WSL2, Android (Termux). Windows requires WSL2.
- **Terminal backends:** Local, Docker, SSH, Daytona, Modal, Singularity.
- **Messaging gateways:** Telegram, Discord, Slack, WhatsApp, Signal, Email, Matrix, Home Assistant.
- **40+ built-in tools** across multiple domains.
- **No explicit extended-thinking mode.** The agent focuses on skill creation and procedural learning rather than chain-of-thought reasoning tokens.
- **Python-based** (Python >= 3.11 required); installed via pip, shell installer, or Nix.

---

## 11. Capability-Gated Validation Rules

The run engine validates `RunOptions` against capabilities before subprocess creation. This section enumerates all capability-gated validations.

| RunOptions Field | Required Capability | CapabilityError Code |
|---|---|---|
| `thinkingEffort` | `supportsThinking: true` on agent or model | `CAPABILITY_ERROR` |
| `thinkingBudgetTokens` | `supportsThinkingBudgetTokens: true` | `CAPABILITY_ERROR` |
| `outputFormat: 'json'` | `supportsJsonMode: true` | `CAPABILITY_ERROR` |
| `sessionId` (resume) | `canResume: true` | `CAPABILITY_ERROR` |
| `forkSessionId` | `canFork: true` | `CAPABILITY_ERROR` |
| `skills` | `supportsSkills: true` | `CAPABILITY_ERROR` |
| `mcpServers` | `supportsMCP: true` | `CAPABILITY_ERROR` |
| `stream: true` | `supportsTextStreaming: true` | `CAPABILITY_ERROR` |
| `attachments` (images) | `supportsImageInput: true` | `CAPABILITY_ERROR` |
| `attachments` (files) | `supportsFileAttachments: true` | `CAPABILITY_ERROR` |
| Plugin operations | `supportsPlugins: true` | `CAPABILITY_ERROR` |

When `stream: 'auto'` is used, the engine silently falls back to buffered emission for unsupported streaming types and emits a `stream_fallback` event (see `04-agent-events.md` Section 20). No `CapabilityError` is thrown in auto mode.

---

## 12. Agent Capability Profiles (Complete Reference)

This section provides the full `AgentCapabilities` profile for each built-in adapter as a reference for implementors.

### 12.1 Claude Code

```
session:     canResume=true, canFork=true, supportsMultiTurn=true, sessionPersistence='file'
streaming:   text=true, toolCall=true, thinking=true
tools:       nativeTools=true, mcp=true, parallelToolCalls=true, requiresToolApproval=true, approvalModes=['yolo','prompt','deny']
thinking:    supportsThinking=true, effortLevels=['low','medium','high','max'], budgetTokens=true
output:      jsonMode=true, structuredOutput=true
skills:      supportsSkills=true, supportsAgentsMd=true, skillsFormat='directory'
subagents:   supportsSubagentDispatch=true, supportsParallelExecution=true
interaction: interactiveMode=true, stdinInjection=true
multimodal:  imageInput=true, imageOutput=false, fileAttachments=true
plugins:     supportsPlugins=true (partial), pluginFormats=['skill-directory','mcp-server']
process:     platforms=['darwin','linux','win32'], requiresGitRepo=false, requiresPty=false
auth:        methods=['api-key','oauth'], authFiles=['~/.claude/.credentials']
```

### 12.2 Codex CLI

```
session:     canResume=false, canFork=false, supportsMultiTurn=true, sessionPersistence='file'
streaming:   text=true, toolCall=true, thinking=true
tools:       nativeTools=true, mcp=true, parallelToolCalls=true, requiresToolApproval=true, approvalModes=['yolo','prompt','deny']
thinking:    supportsThinking=true, effortLevels=['low','medium','high'], budgetTokens=false
output:      jsonMode=true, structuredOutput=false
skills:      supportsSkills=false, supportsAgentsMd=false, skillsFormat=null
subagents:   supportsSubagentDispatch=false, supportsParallelExecution=false
interaction: interactiveMode=true, stdinInjection=true
multimodal:  imageInput=true, imageOutput=false, fileAttachments=false
plugins:     supportsPlugins=false
process:     platforms=['darwin','linux','win32'], requiresGitRepo=false, requiresPty=false
auth:        methods=['api-key'], authFiles=['~/.codex/auth.json']
```

### 12.3 Gemini CLI

```
session:     canResume=false, canFork=false, supportsMultiTurn=true, sessionPersistence='file'
streaming:   text=true, toolCall=true, thinking=true
tools:       nativeTools=true, mcp=true, parallelToolCalls=true, requiresToolApproval=true, approvalModes=['yolo','prompt','deny']
thinking:    supportsThinking=true, effortLevels=['low','medium','high','max'], budgetTokens=true
output:      jsonMode=false, structuredOutput=false
skills:      supportsSkills=false, supportsAgentsMd=false, skillsFormat=null
subagents:   supportsSubagentDispatch=false, supportsParallelExecution=false
interaction: interactiveMode=true, stdinInjection=true
multimodal:  imageInput=true, imageOutput=true, fileAttachments=true
plugins:     supportsPlugins=false
process:     platforms=['darwin','linux','win32'], requiresGitRepo=false, requiresPty=false
auth:        methods=['api-key','oauth'], authFiles=['~/.config/gemini/credentials.json']
```

### 12.4 Copilot CLI

```
session:     canResume=false, canFork=false, supportsMultiTurn=true, sessionPersistence='file'
streaming:   text=true, toolCall=false, thinking=false
tools:       nativeTools=false, mcp=false, parallelToolCalls=false, requiresToolApproval=false, approvalModes=['prompt']
thinking:    supportsThinking=false, effortLevels=[], budgetTokens=false
output:      jsonMode=false, structuredOutput=false
skills:      supportsSkills=false, supportsAgentsMd=false, skillsFormat=null
subagents:   supportsSubagentDispatch=false, supportsParallelExecution=false
interaction: interactiveMode=true, stdinInjection=true
multimodal:  imageInput=false, imageOutput=false, fileAttachments=false
plugins:     supportsPlugins=false
process:     platforms=['darwin','linux','win32'], requiresGitRepo=false, requiresPty=false
auth:        methods=['oauth','github-token'], authFiles=['~/.config/github-copilot/hosts.json']
```

### 12.5 Cursor

```
session:     canResume=false, canFork=false, supportsMultiTurn=true, sessionPersistence='sqlite'
streaming:   text=true (partial), toolCall=false, thinking=false
tools:       nativeTools=true, mcp=true, parallelToolCalls=true, requiresToolApproval=true, approvalModes=['yolo','prompt','deny']
thinking:    supportsThinking=true (model-dependent), effortLevels=['low','medium','high','max'], budgetTokens=true
output:      jsonMode=false, structuredOutput=false
skills:      supportsSkills=false, supportsAgentsMd=false, skillsFormat=null
subagents:   supportsSubagentDispatch=false, supportsParallelExecution=false
interaction: interactiveMode=true, stdinInjection=false
multimodal:  imageInput=true, imageOutput=false, fileAttachments=true
plugins:     supportsPlugins=true, pluginFormats=['extension-ts','mcp-server'], registries=[{name:'cursor.sh/extensions'}]
process:     platforms=['darwin','linux','win32'], requiresGitRepo=false, requiresPty=true
auth:        methods=['oauth'], authFiles=['~/.cursor/auth.json']
```

### 12.6 OpenCode

```
session:     canResume=true, canFork=true, supportsMultiTurn=true, sessionPersistence='sqlite'
streaming:   text=true, toolCall=true, thinking=true
tools:       nativeTools=true, mcp=true, parallelToolCalls=true, requiresToolApproval=true, approvalModes=['yolo','prompt','deny']
thinking:    supportsThinking=true (model-dependent), effortLevels=['low','medium','high','max'], budgetTokens=true
output:      jsonMode=true, structuredOutput=true
skills:      supportsSkills=true, supportsAgentsMd=true, skillsFormat='file'
subagents:   supportsSubagentDispatch=true, supportsParallelExecution=true
interaction: interactiveMode=true, stdinInjection=true
multimodal:  imageInput=true, imageOutput=false, fileAttachments=true
plugins:     supportsPlugins=true, pluginFormats=['npm-package','skill-file','mcp-server'], registries=[{name:'npm', searchable:true}]
process:     platforms=['darwin','linux','win32'], requiresGitRepo=false, requiresPty=false
auth:        methods=['api-key'], authFiles=['~/.config/opencode/auth.json']
```

### 12.7 Pi

```
session:     canResume=true, canFork=true, supportsMultiTurn=true, sessionPersistence='file'
streaming:   text=true, toolCall=true, thinking=true
tools:       nativeTools=true, mcp=false, parallelToolCalls=true, requiresToolApproval=true, approvalModes=['yolo','prompt','deny']
thinking:    supportsThinking=true (model-dependent), effortLevels=['low','medium','high','max'], budgetTokens=true
output:      jsonMode=false, structuredOutput=false
skills:      supportsSkills=true, supportsAgentsMd=false, skillsFormat='file'
subagents:   supportsSubagentDispatch=true, supportsParallelExecution=true
interaction: interactiveMode=true, stdinInjection=true
multimodal:  imageInput=true, imageOutput=false, fileAttachments=false
plugins:     supportsPlugins=true, pluginFormats=['npm-package','skill-file'], registries=[{name:'npm', searchable:true}]
process:     platforms=['darwin','linux','win32'], requiresGitRepo=false, requiresPty=false
auth:        methods=['api-key'], authFiles=['~/.pi/agent/auth.json']
```

### 12.8 omp (oh-my-pi)

```
session:     canResume=true, canFork=true, supportsMultiTurn=true, sessionPersistence='file'
streaming:   text=true, toolCall=true, thinking=true
tools:       nativeTools=true, mcp=false, parallelToolCalls=true, requiresToolApproval=true, approvalModes=['yolo','prompt','deny']
thinking:    supportsThinking=true, effortLevels=['low','medium','high','max'], budgetTokens=true
output:      jsonMode=false, structuredOutput=false
skills:      supportsSkills=true, supportsAgentsMd=false, skillsFormat='file'
subagents:   supportsSubagentDispatch=true, supportsParallelExecution=true
interaction: interactiveMode=true, stdinInjection=true
multimodal:  imageInput=true, imageOutput=false, fileAttachments=false
plugins:     supportsPlugins=true, pluginFormats=['npm-package','skill-file'], registries=[{name:'npm', searchable:true}]
process:     platforms=['darwin','linux','win32'], requiresGitRepo=false, requiresPty=false
auth:        methods=['api-key'], authFiles=['~/.omp/agent/auth.json']
```

### 12.9 OpenClaw

```
session:     canResume=false, canFork=false, supportsMultiTurn=true, sessionPersistence='file'
streaming:   text=true (partial), toolCall=false, thinking=false
tools:       nativeTools=true, mcp=true, parallelToolCalls=true, requiresToolApproval=true, approvalModes=['yolo','prompt','deny']
thinking:    supportsThinking=true (model-dependent), effortLevels=['low','medium','high','max'], budgetTokens=true
output:      jsonMode=true, structuredOutput=false
skills:      supportsSkills=true, supportsAgentsMd=true, skillsFormat='file'
subagents:   supportsSubagentDispatch=false, supportsParallelExecution=false
interaction: interactiveMode=true, stdinInjection=true
multimodal:  imageInput=true, imageOutput=false, fileAttachments=true
plugins:     supportsPlugins=true, pluginFormats=['npm-package','skill-file','channel-plugin'], registries=[{name:'npm', searchable:true},{name:'openclaw-registry', url:'https://openclaw.ai/plugins', searchable:true}]
process:     platforms=['darwin','linux','win32'], requiresGitRepo=false, requiresPty=false
auth:        methods=['api-key'], authFiles=['~/.openclaw/auth.json']
```

### 12.10 Hermes

```
session:     canResume=true, canFork=false, supportsMultiTurn=true, sessionPersistence='sqlite'
streaming:   text=true, toolCall=true, thinking=false
tools:       nativeTools=true, mcp=true, parallelToolCalls=true, requiresToolApproval=true, approvalModes=['yolo','prompt','deny']
thinking:    supportsThinking=false, effortLevels=[], budgetTokens=false
output:      jsonMode=false, structuredOutput=false
skills:      supportsSkills=true, supportsAgentsMd=false, skillsFormat='directory'
subagents:   supportsSubagentDispatch=false, supportsParallelExecution=false
interaction: interactiveMode=true, stdinInjection=true
multimodal:  imageInput=false, imageOutput=false, fileAttachments=false
plugins:     supportsPlugins=true, pluginFormats=['skill-file','skill-directory','mcp-server'], registries=[{name:'agentskills-hub', url:'https://agentskills.io', searchable:true}]
process:     platforms=['darwin','linux'] (win32 via WSL2 only), requiresGitRepo=false, requiresPty=false
auth:        methods=['api-key','oauth'], authFiles=['~/.hermes/.env','~/.hermes/cli-config.yaml']
```

---

## Implementation Status (2026-04-12)

No behavioural changes to capabilities or models. The `agent-mux-remote` adapter (spec 12) declares capabilities that reflect the *transport delegate* rather than a specific harness; callers must read capabilities from the adapter they nest into.
