# @a5c-ai/agent-mux
### Complete scope definition · v1

---

## 1. Package identity

| Field | Value |
|---|---|
| npm scope | `@a5c-ai` |
| Core package | `@a5c-ai/agent-mux` |
| CLI binary | `amux` |
| Language | TypeScript, targeting Node 20+ |
| License | MIT |

Both the SDK and CLI are first-class surfaces that share the same core layer and behave identically.

---

## 2. What agent-mux is

A unified dispatch and introspection layer for local CLI-based AI coding agents. Any orchestrator (Paperclip, vibe-kanban, custom pipelines) or developer script that needs to drive, configure, inspect, or install one of the supported agents gets a single, well-typed interface instead of reimplementing subprocess management, output parsing, session state, config I/O, cost tracking, auth detection, capability discovery, and plugin management for each one independently.

**What agent-mux is not:** an orchestrator, a task manager, a UI, a database, or a remote API proxy. It is infrastructure. Consumers build those things on top.

---

## 3. Core concepts

**Agent** — a local CLI-based AI coding agent that can be spawned as a subprocess. Examples: `claude`, `codex`, `gemini`, `pi`, `omp`, `opencode`, `openclaw`, `copilot`.

**Adapter** — agent-mux's internal representation of a specific agent. Knows everything about it: how to install it, how to spawn it, where its files live, how to parse its output, what it can do, and how its plugin system works.

**Run** — a single invocation of an agent. Represented by a `RunHandle`. Async, event-streaming, concurrency-safe.

**Session** — the agent's own persistent record of a conversation. Stored in the agent's native format and location. agent-mux reads these on demand; it does not own or replicate them.

**Event** — a typed, normalized unit of output from a run. Emitted on the `RunHandle`. All agent-specific output formats are parsed into the unified `AgentEvent` union type.

**Capabilities** — a structured manifest of what an agent adapter (and each of its models) can do. Used for consumer-side feature-gating.

**Profile** — a named set of `RunOptions` stored in `~/.agent-mux/` or `.agent-mux/`. Consumers can switch profiles without changing code.

**Plugin** — an extension to an agent's capabilities (skills, tools, themes, MCP servers, channel connectors, etc.). Plugin support is agent-specific and gated by capabilities. Managed through a unified `amux plugins` interface.

---

## 4. Storage layout

Two directories. Project overrides global.

### Global: `~/.agent-mux/`
```
~/.agent-mux/
  config.json          # Global SDK defaults (default agent, approval mode, timeout, etc.)
  profiles/            # Named RunOptions presets shared across all projects
    fast.json
    careful.json
  auth-hints.json      # Cached auth state hints per agent (read-only cache, not credentials)
```

### Project-local: `.agent-mux/` (in project root)
```
.agent-mux/
  config.json          # Project-level overrides of global config
  profiles/            # Project-specific profiles (override or extend global ones)
  run-index.jsonl      # Append-only run log: runId, agent, model, sessionId, cost, timestamp, tags
```

The `run-index.jsonl` is the only persistent record agent-mux writes. It maps `RunHandle` identities to the native session IDs of each agent, enabling cross-agent cost roll-ups and session lookups without owning actual session data.

---

## 5. AgentMuxClient — main entry point

```typescript
import { createClient } from '@a5c-ai/agent-mux'

const mux = createClient({
  // All optional. All overridable per run.
  defaultAgent?: AgentName,
  defaultModel?: string,
  approvalMode?: 'yolo' | 'prompt' | 'deny',   // default: 'prompt'
  timeout?: number,                              // ms
  inactivityTimeout?: number,                   // ms
  retryPolicy?: RetryPolicy,
  stream?: boolean | 'auto',                    // default: 'auto'
  configDir?: string,                           // override ~/.agent-mux/
  projectConfigDir?: string,                    // override .agent-mux/
})

// Top-level namespaces:
mux.run(options: RunOptions): RunHandle
mux.adapters         // AdapterRegistry — discovery, capabilities, install
mux.models           // ModelRegistry — per-agent model lists and metadata
mux.sessions         // SessionManager — read native session files
mux.config           // ConfigManager — read/write agent config files
mux.auth             // AuthManager — detect and surface auth state
mux.profiles         // ProfileManager — named RunOptions presets
mux.plugins          // PluginManager — install, list, remove plugins per agent
```

---

## 6. RunOptions — complete parameter set

```typescript
interface RunOptions {
  // Required
  agent: AgentName   // 'claude' | 'codex' | 'gemini' | 'copilot' | 'cursor'
                     // | 'opencode' | 'pi' | 'omp' | 'openclaw' | string (plugin adapter)

  // Prompt / input
  prompt: string | string[]
  systemPrompt?: string
  systemPromptMode?: 'prepend' | 'append' | 'replace'   // default: 'prepend'
  attachments?: Attachment[]

  // Model
  model?: string

  // Thinking / reasoning
  thinkingEffort?: 'low' | 'medium' | 'high' | 'max'
  thinkingBudgetTokens?: number
  thinkingOverride?: Record<string, unknown>

  // Sampling
  temperature?: number
  topP?: number
  topK?: number
  maxTokens?: number
  maxOutputTokens?: number

  // Session
  sessionId?: string
  forkSessionId?: string
  noSession?: boolean

  // Streaming
  stream?: boolean | 'auto'

  // Output format (capability-gated)
  outputFormat?: 'text' | 'json' | 'jsonl'

  // Execution context
  cwd?: string
  env?: Record<string, string>
  timeout?: number
  inactivityTimeout?: number
  maxTurns?: number

  // Approval / interaction
  approvalMode?: 'yolo' | 'prompt' | 'deny'
  onInputRequired?: (event: InputRequiredEvent) => Promise<string>
  onApprovalRequest?: (event: ApprovalRequestEvent) => Promise<'approve' | 'deny'>

  // Skills / agent docs (capability-gated)
  skills?: string[]
  agentsDoc?: string

  // MCP (capability-gated)
  mcpServers?: McpServerConfig[]

  // Retry
  retryPolicy?: RetryPolicy

  // Metadata (stored in .agent-mux/run-index.jsonl, not sent to agent)
  runId?: string
  tags?: string[]
  projectId?: string

  // Profile
  profile?: string
}
```

---

## 7. RunHandle

```typescript
interface RunHandle extends AsyncIterable<AgentEvent> {
  readonly runId: string
  readonly agent: AgentName
  readonly model: string | undefined

  // Primary: async iterator
  [Symbol.asyncIterator](): AsyncIterator<AgentEvent>

  // Secondary: EventEmitter
  on<T extends AgentEvent['type']>(
    type: T,
    handler: (event: Extract<AgentEvent, { type: T }>) => void
  ): this
  off<T extends AgentEvent['type']>(type: T, handler: Function): this
  once<T extends AgentEvent['type']>(type: T, handler: Function): this

  // Promise interface — await mux.run() gives RunResult
  then: Promise<RunResult>['then']
  catch: Promise<RunResult>['catch']
  finally: Promise<RunResult>['finally']

  // Interaction
  send(text: string): Promise<void>
  approve(detail?: string): Promise<void>
  deny(reason?: string): Promise<void>
  continue(prompt: string): Promise<void>

  // Control
  interrupt(): Promise<void>
  abort(): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>

  // Interaction channel — for building interactive UIs
  readonly interaction: InteractionChannel

  result(): Promise<RunResult>
}

interface InteractionChannel {
  readonly pending: PendingInteraction[]
  onPending(handler: (interaction: PendingInteraction) => void): () => void
  respond(id: string, response: InteractionResponse): Promise<void>
  approveAll(): Promise<void>
  denyAll(reason?: string): Promise<void>
}
```

---

## 8. AgentEvent — complete union type

All events share:
```typescript
interface BaseEvent {
  type: string
  runId: string
  agent: AgentName
  timestamp: number
  raw?: string   // Present only in debug mode
}
```

### Session lifecycle
```typescript
{ type: 'session_start';     sessionId: string; resumed: boolean; forkedFrom?: string }
{ type: 'session_resume';    sessionId: string; priorTurnCount: number }
{ type: 'session_fork';      sessionId: string; forkedFrom: string }
{ type: 'session_checkpoint'; sessionId: string; checkpointId: string }
{ type: 'session_end';       sessionId: string; turnCount: number; cost?: CostRecord }
```

### Turn / step lifecycle
```typescript
{ type: 'turn_start';  turnIndex: number }
{ type: 'turn_end';    turnIndex: number; cost?: CostRecord }
{ type: 'step_start';  turnIndex: number; stepIndex: number; stepType: string }
{ type: 'step_end';    turnIndex: number; stepIndex: number }
```

### Text / message streaming
```typescript
{ type: 'message_start' }
{ type: 'text_delta';   delta: string; accumulated: string }
{ type: 'message_stop'; text: string }
```

### Thinking / reasoning
```typescript
{ type: 'thinking_start'; effort?: string }
{ type: 'thinking_delta'; delta: string; accumulated: string }
{ type: 'thinking_stop';  thinking: string }
```

### Tool calling
```typescript
{ type: 'tool_call_start';  toolCallId: string; toolName: string; inputAccumulated: string }
{ type: 'tool_input_delta'; toolCallId: string; delta: string; inputAccumulated: string }
{ type: 'tool_call_ready';  toolCallId: string; toolName: string; input: unknown }
{ type: 'tool_result';      toolCallId: string; toolName: string; output: unknown; durationMs: number }
{ type: 'tool_error';       toolCallId: string; toolName: string; error: string }
```

### File operations
```typescript
{ type: 'file_read';   path: string }
{ type: 'file_write';  path: string; byteCount: number }
{ type: 'file_create'; path: string; byteCount: number }
{ type: 'file_delete'; path: string }
{ type: 'file_patch';  path: string; diff: string }
```

### Shell operations
```typescript
{ type: 'shell_start';        command: string; cwd: string }
{ type: 'shell_stdout_delta'; delta: string }
{ type: 'shell_stderr_delta'; delta: string }
{ type: 'shell_exit';         exitCode: number; durationMs: number }
```

### MCP tool calling
```typescript
{ type: 'mcp_tool_call_start'; toolCallId: string; server: string; toolName: string; input: unknown }
{ type: 'mcp_tool_result';     toolCallId: string; server: string; toolName: string; output: unknown }
{ type: 'mcp_tool_error';      toolCallId: string; server: string; toolName: string; error: string }
```

### Subagent dispatch
```typescript
{ type: 'subagent_spawn';  subagentId: string; agentName: string; prompt: string }
{ type: 'subagent_result'; subagentId: string; agentName: string; summary: string; cost?: CostRecord }
{ type: 'subagent_error';  subagentId: string; agentName: string; error: string }
```

### Plugin events
```typescript
{ type: 'plugin_loaded';    pluginId: string; pluginName: string; version: string }
{ type: 'plugin_invoked';   pluginId: string; pluginName: string }
{ type: 'plugin_error';     pluginId: string; pluginName: string; error: string }
```

### Skill / agent doc loading
```typescript
{ type: 'skill_loaded';  skillName: string; source: string }
{ type: 'skill_invoked'; skillName: string }
{ type: 'agentdoc_read'; path: string }
```

### Multimodal
```typescript
{ type: 'image_output';    mimeType: string; base64?: string; filePath?: string }
{ type: 'image_input_ack'; mimeType: string }
```

### Cost and tokens
```typescript
{ type: 'cost';        cost: CostRecord }
{ type: 'token_usage'; inputTokens: number; outputTokens: number; thinkingTokens?: number; cachedTokens?: number }
```

### Interaction / waiting
```typescript
{ type: 'input_required';   interactionId: string; question: string; context?: string; source: 'agent' | 'tool' }
{ type: 'approval_request'; interactionId: string; action: string; detail: string; toolName?: string; riskLevel: 'low' | 'medium' | 'high' }
{ type: 'approval_granted'; interactionId: string }
{ type: 'approval_denied';  interactionId: string; reason?: string }
```

### Rate / context limits
```typescript
{ type: 'rate_limited';          retryAfterMs?: number }
{ type: 'context_limit_warning'; usedTokens: number; maxTokens: number; pctUsed: number }
{ type: 'context_compacted';     summary: string; tokensSaved: number }
{ type: 'retry';                 attempt: number; maxAttempts: number; reason: string; delayMs: number }
```

### Run lifecycle / control
```typescript
{ type: 'interrupted' }
{ type: 'aborted' }
{ type: 'paused' }
{ type: 'resumed' }
{ type: 'timeout';      kind: 'run' | 'inactivity' }
{ type: 'turn_limit';   maxTurns: number }
{ type: 'stream_fallback'; capability: 'text' | 'tool_calls' | 'thinking'; reason: string }
```

### Errors (typed)
```typescript
{ type: 'auth_error';       agent: AgentName; message: string; guidance: string }
{ type: 'rate_limit_error'; message: string; retryAfterMs?: number }
{ type: 'context_exceeded'; usedTokens: number; maxTokens: number }
{ type: 'crash';            exitCode: number; stderr: string }
{ type: 'error';            code: ErrorCode; message: string; recoverable: boolean }
```

### Debug
```typescript
{ type: 'debug'; level: 'verbose' | 'info' | 'warn'; message: string }
{ type: 'log';   source: 'stdout' | 'stderr'; line: string }
```

---

## 9. Streaming model

- `stream: 'auto'` (default) — uses streaming per output type if adapter + model support it; silently falls back to buffered emission for unsupported types. Emits `stream_fallback` event when fallback activates.
- `stream: true` — throws `CapabilityError` if the adapter does not support text streaming. Tool call and thinking streaming still fall back silently.
- `stream: false` — all output buffered; single `text_delta` with full accumulated text fires on completion, followed by `message_stop`.

Consumer always receives the same event types regardless of mode.

---

## 10. Thinking effort normalization

```typescript
thinkingEffort?: 'low' | 'medium' | 'high' | 'max'
thinkingBudgetTokens?: number            // Claude: passes through as budget_tokens
thinkingOverride?: Record<string, unknown>  // Full escape hatch; merged over normalized params

// Per-adapter translation (internal):
// Claude Code:   'low'→1024, 'medium'→8192, 'high'→32768, 'max'→max_budget_tokens
// Codex CLI:     'low'→'low', 'medium'→'medium', 'high'→'high', 'max'→'high'
// Gemini CLI:    maps to thinkingConfig.thinkingBudget equivalents
// Pi / omp:      model-dependent; passed as provider-level param
// thinkingOverride is merged last, giving full native control
```

Setting `thinkingEffort` when the selected model has `supportsThinking: false` throws `CapabilityError` before spawning.

---

## 11. Adapter capabilities manifest

### Agent-level capabilities

```typescript
interface AgentCapabilities {
  agent: AgentName

  // Session
  canResume: boolean
  canFork: boolean
  supportsMultiTurn: boolean
  sessionPersistence: 'none' | 'file' | 'sqlite' | 'in-memory'

  // Streaming
  supportsTextStreaming: boolean
  supportsToolCallStreaming: boolean
  supportsThinkingStreaming: boolean

  // Tool calling
  supportsNativeTools: boolean
  supportsMCP: boolean
  supportsParallelToolCalls: boolean
  requiresToolApproval: boolean
  approvalModes: ('yolo' | 'prompt' | 'deny')[]

  // Thinking
  supportsThinking: boolean
  thinkingEffortLevels: ThinkingEffortLevel[]
  supportsThinkingBudgetTokens: boolean

  // Output
  supportsJsonMode: boolean
  supportsStructuredOutput: boolean

  // Skills / agent docs
  supportsSkills: boolean
  supportsAgentsMd: boolean
  skillsFormat: 'file' | 'directory' | 'npm-package' | null

  // Subagents / parallelism
  supportsSubagentDispatch: boolean
  supportsParallelExecution: boolean
  maxParallelTasks?: number

  // Interaction
  supportsInteractiveMode: boolean
  supportsStdinInjection: boolean

  // Multimodal
  supportsImageInput: boolean
  supportsImageOutput: boolean
  supportsFileAttachments: boolean

  // Plugin system
  supportsPlugins: boolean
  pluginFormats: PluginFormat[]    // What kinds of plugins this agent supports
  pluginInstallCmd?: string        // Native install command (e.g. 'openclaw plugins install')
  pluginListCmd?: string           // Native list command
  pluginUninstallCmd?: string      // Native uninstall command
  pluginMarketplaceUrl?: string    // Official marketplace / registry URL
  pluginSearchCmd?: string         // Native search command if available
  pluginRegistries: PluginRegistry[] // Where plugins are sourced from (npm, custom registry, etc.)

  // Process
  supportedPlatforms: ('darwin' | 'linux' | 'win32')[]
  requiresGitRepo: boolean
  requiresPty: boolean

  // Auth
  authMethods: AuthMethod[]
  authFiles: string[]

  // Install
  installMethods: InstallMethod[]  // How to install this agent (see §12)
}

type PluginFormat = 'npm-package' | 'skill-file' | 'skill-directory' | 'extension-ts' | 'channel-plugin' | 'mcp-server'

interface PluginRegistry {
  name: string              // 'npm', 'openclaw-registry', 'opencode-plugins', etc.
  url: string
  searchable: boolean
}

interface InstallMethod {
  platform: 'darwin' | 'linux' | 'win32' | 'all'
  type: 'npm' | 'brew' | 'gh-extension' | 'curl' | 'winget' | 'scoop' | 'manual'
  command: string           // The exact command to run
  notes?: string            // e.g. "Requires gh CLI to be installed first"
  prerequisiteCheck?: string // Command to verify prerequisite exists
}
```

### Plugin support per built-in agent

| Agent | supportsPlugins | Format(s) | Registry |
|---|---|---|---|
| Claude Code | partial | skill-directory, mcp-server | — (via --add-dir) |
| Codex CLI | no | — | — |
| Gemini CLI | no | — | — |
| Copilot CLI | no | — | — |
| Cursor | yes | extension-ts, mcp-server | cursor.sh/extensions |
| OpenCode | yes | npm-package, skill-file, mcp-server | npm (opencode-*) |
| Pi | yes | npm-package, skill-file | npm (@mariozechner/pi-*) |
| omp | yes | npm-package, skill-file | npm (@oh-my-pi/*) |
| OpenClaw | yes | npm-package, skill-file, channel-plugin | npm + openclaw.ai/plugins |

---

## 12. Agent install metadata (per built-in adapter)

Each adapter declares `installMethods: InstallMethod[]`. Used by `amux install <agent>` and the `AdapterRegistry.installInstructions()` API.

```
Claude Code
  npm (all):   npm install -g @anthropic-ai/claude-code
  brew (mac):  brew install claude-code

Codex CLI
  npm (all):   npm install -g @openai/codex

Gemini CLI
  npm (all):   npm install -g @google/gemini-cli

GitHub Copilot CLI
  gh-ext (all): gh extension install github/gh-copilot
  notes: "Requires GitHub CLI (gh). Install with: brew install gh / winget install GitHub.cli"
  prerequisiteCheck: gh --version

Cursor
  manual (mac):   open https://cursor.sh/download — macOS .dmg installer
  manual (linux): open https://cursor.sh/download — AppImage
  manual (win):   winget install Cursor.Cursor
  notes: "No headless-only install. Full app required even for CLI use."

OpenCode
  npm (all):   npm install -g opencode
  brew (mac):  brew install opencode/tap/opencode

Pi
  npm (all):   npm install -g @mariozechner/pi-coding-agent

omp (oh-my-pi)
  npm (all):   npm install -g @oh-my-pi/pi-coding-agent

OpenClaw
  npm (all):   npm install -g openclaw
  notes: "Requires Node 22.16+, 16GB RAM minimum"
```

---

## 13. PluginManager

Unified interface over each agent's native plugin system. All methods are capability-gated — calling on an agent where `supportsPlugins: false` throws `CapabilityError`.

```typescript
interface PluginManager {
  // List installed plugins for an agent
  list(agent: AgentName): Promise<InstalledPlugin[]>

  // Install a plugin
  install(agent: AgentName, pluginId: string, options?: PluginInstallOptions): Promise<InstalledPlugin>

  // Uninstall a plugin
  uninstall(agent: AgentName, pluginId: string): Promise<void>

  // Update a plugin
  update(agent: AgentName, pluginId: string): Promise<InstalledPlugin>

  // Update all plugins for an agent
  updateAll(agent: AgentName): Promise<InstalledPlugin[]>

  // Search marketplace
  search(query: string, options?: PluginSearchOptions): Promise<PluginListing[]>

  // Browse marketplace by agent or category
  browse(options?: PluginBrowseOptions): Promise<PluginListing[]>

  // Get detail on a specific plugin
  info(pluginId: string, agent?: AgentName): Promise<PluginDetail>
}

interface InstalledPlugin {
  pluginId: string
  name: string
  version: string
  agent: AgentName
  format: PluginFormat
  description?: string
  installedAt: Date
  enabled: boolean
}

interface PluginListing {
  pluginId: string
  name: string
  latestVersion: string
  description: string
  author: string
  weeklyDownloads?: number
  agents: AgentName[]        // Which agents this plugin supports
  formats: PluginFormat[]
  registry: string
  tags: string[]
  url: string
}

interface PluginDetail extends PluginListing {
  readme?: string
  changelog?: string
  versions: string[]
  dependencies?: string[]
  agentMinVersions?: Record<AgentName, string>
}

interface PluginInstallOptions {
  version?: string           // Pin to specific version
  global?: boolean           // Install globally vs project-local (where agent supports both)
  skipVerify?: boolean       // Skip plugin integrity checks where available
}

interface PluginSearchOptions {
  agents?: AgentName[]       // Filter by supported agent
  format?: PluginFormat      // Filter by plugin type
  registry?: string          // Search specific registry only
  limit?: number
}

interface PluginBrowseOptions extends PluginSearchOptions {
  category?: string          // e.g. 'coding', 'communication', 'automation'
  sortBy?: 'downloads' | 'updated' | 'name'
}
```

---

## 14. AdapterRegistry

```typescript
interface AdapterRegistry {
  list(): AgentAdapterInfo[]
  installed(): Promise<InstalledAgentInfo[]>
  detect(agent: AgentName): Promise<InstalledAgentInfo | null>
  capabilities(agent: AgentName): AgentCapabilities
  installInstructions(agent: AgentName, platform?: NodeJS.Platform): InstallMethod[]

  // SDK adapter plugins
  register(adapter: AgentAdapter): void
  unregister(agent: AgentName): void
}

interface InstalledAgentInfo {
  agent: AgentName
  installed: boolean
  cliPath: string | null
  version: string | null
  meetsMinVersion: boolean
  minVersion: string
  authState: 'authenticated' | 'unauthenticated' | 'expired' | 'unknown'
  activeModel: string | null
}
```

---

## 15. ModelRegistry

```typescript
interface ModelRegistry {
  models(agent: AgentName): ModelCapabilities[]
  model(agent: AgentName, modelId: string): ModelCapabilities | null
  defaultModel(agent: AgentName): ModelCapabilities | null
  validate(agent: AgentName, modelId: string): ModelValidationResult
  lastUpdated(agent: AgentName): Date
  refresh(agent: AgentName): Promise<void>
  refreshAll(): Promise<void>
  estimateCost(agent: AgentName, modelId: string, inputTokens: number, outputTokens: number): number
}

interface ModelCapabilities {
  agent: AgentName
  modelId: string
  modelAlias?: string
  displayName: string
  deprecated: boolean
  deprecatedSince?: string
  successorModelId?: string
  contextWindow: number
  maxOutputTokens: number
  maxThinkingTokens?: number
  inputPricePerMillion?: number
  outputPricePerMillion?: number
  thinkingPricePerMillion?: number
  cachedInputPricePerMillion?: number
  supportsThinking: boolean
  thinkingEffortLevels?: ThinkingEffortLevel[]
  thinkingBudgetRange?: [number, number]
  supportsToolCalling: boolean
  supportsParallelToolCalls: boolean
  supportsToolCallStreaming: boolean
  supportsJsonMode: boolean
  supportsStructuredOutput: boolean
  supportsTextStreaming: boolean
  supportsThinkingStreaming: boolean
  supportsImageInput: boolean
  supportsImageOutput: boolean
  supportsFileInput: boolean
  cliArgKey: string
  cliArgValue: string
  lastUpdated: string
  source: 'bundled' | 'remote'
}
```

---

## 16. SessionManager

```typescript
interface SessionManager {
  list(agent: AgentName, options?: SessionListOptions): Promise<SessionSummary[]>
  get(agent: AgentName, sessionId: string): Promise<Session>
  search(query: SessionQuery): Promise<SessionSummary[]>
  totalCost(options?: CostAggregationOptions): Promise<CostSummary>
  export(agent: AgentName, sessionId: string, format: 'json' | 'jsonl' | 'markdown'): Promise<string>
  diff(a: { agent: AgentName; sessionId: string }, b: { agent: AgentName; sessionId: string }): Promise<SessionDiff>
  resolveUnifiedId(agent: AgentName, nativeSessionId: string): string
  resolveNativeId(unifiedId: string): { agent: AgentName; nativeSessionId: string } | null
}
```

### Native session file locations

| Agent | Session storage | Format |
|---|---|---|
| Claude Code | `~/.claude/projects/<hash>/` | JSONL per session |
| Codex CLI | `~/.codex/sessions/` | JSONL |
| Gemini CLI | `~/.gemini/sessions/` | JSONL |
| Copilot CLI | `~/.config/github-copilot/sessions/` | JSON |
| Cursor | `~/.cursor/sessions/` | SQLite |
| OpenCode | `~/.local/share/opencode/` | SQLite |
| Pi | `~/.pi/agent/sessions/` | JSONL tree (id + parentId) |
| omp | `~/.omp/agent/sessions/` | JSONL tree (id + parentId) |
| OpenClaw | `~/.openclaw/sessions/` | JSON per channel/session |

---

## 17. ConfigManager

```typescript
interface ConfigManager {
  get(agent: AgentName): AgentConfig
  getField(agent: AgentName, field: string): unknown
  set(agent: AgentName, fields: Partial<AgentConfig>): Promise<void>
  setField(agent: AgentName, field: string, value: unknown): Promise<void>
  schema(agent: AgentName): AgentConfigSchema
  validate(agent: AgentName, config: Partial<AgentConfig>): ValidationResult
  getMcpServers(agent: AgentName): McpServerConfig[]
  addMcpServer(agent: AgentName, server: McpServerConfig): Promise<void>
  removeMcpServer(agent: AgentName, serverName: string): Promise<void>
  profiles(): ProfileManager
}

interface AgentConfigSchema {
  agent: AgentName
  fields: ConfigField[]
  configFilePaths: string[]
  projectConfigFilePaths: string[]
}
```

### Native config file locations

| Agent | Global config | Project config |
|---|---|---|
| Claude Code | `~/.claude/settings.json` | `.claude/settings.json` |
| Codex CLI | `~/.codex/config.json` | `.codex/config.json` |
| Gemini CLI | `~/.config/gemini/settings.json` | `.gemini/settings.json` |
| Copilot CLI | `~/.config/github-copilot/settings.json` | — |
| Cursor | `~/.cursor/settings.json` | `.cursor/settings.json` |
| OpenCode | `~/.config/opencode/opencode.json` | `.opencode/opencode.json` |
| Pi | `~/.pi/agent/settings.json` | — |
| omp | `~/.omp/agent/settings.json` | — |
| OpenClaw | `~/.openclaw/config.json` | — |

---

## 18. AuthManager

```typescript
interface AuthManager {
  check(agent: AgentName): Promise<AuthState>
  checkAll(): Promise<Record<AgentName, AuthState>>
  getSetupGuidance(agent: AgentName): AuthSetupGuidance
}

interface AuthState {
  agent: AgentName
  status: 'authenticated' | 'unauthenticated' | 'expired' | 'unknown'
  method?: AuthMethod
  identity?: string
  expiresAt?: Date
  checkedAt: Date
  details?: string
}
```

---

## 19. Plugin adapter contract

### Minimal interface

```typescript
interface AgentAdapter {
  readonly agent: AgentName
  readonly displayName: string
  readonly cliCommand: string
  readonly minVersion?: string
  readonly capabilities: AgentCapabilities
  readonly models: ModelCapabilities[]
  readonly defaultModelId?: string
  readonly configSchema: AgentConfigSchema

  buildSpawnArgs(options: RunOptions): SpawnArgs
  parseEvent(line: string, context: ParseContext): AgentEvent | AgentEvent[] | null
  detectAuth(): Promise<AuthState>
  getAuthGuidance(): AuthSetupGuidance
  sessionDir(cwd?: string): string
  parseSessionFile(filePath: string): Promise<Session>
  listSessionFiles(cwd?: string): Promise<string[]>
  readConfig(cwd?: string): Promise<AgentConfig>
  writeConfig(config: Partial<AgentConfig>, cwd?: string): Promise<void>

  // Plugin operations — only required when capabilities.supportsPlugins is true
  listPlugins?(): Promise<InstalledPlugin[]>
  installPlugin?(pluginId: string, options?: PluginInstallOptions): Promise<InstalledPlugin>
  uninstallPlugin?(pluginId: string): Promise<void>
  searchPlugins?(query: string, options?: PluginSearchOptions): Promise<PluginListing[]>
}
```

### BaseAgentAdapter (extended by all built-in adapters)

```typescript
abstract class BaseAgentAdapter implements AgentAdapter {
  // All AgentAdapter fields required as abstract

  // Provided utilities
  protected parseJsonLine(line: string): unknown | null
  protected assembleCostRecord(raw: unknown): CostRecord | null
  protected detectVersionFromCli(): Promise<string | null>
  protected buildEnvFromOptions(options: RunOptions): Record<string, string>
  protected resolveSessionId(options: RunOptions): string | undefined

  // Hook points with defaults
  onSpawnError(error: Error): AgentEvent
  onTimeout(): AgentEvent
  onProcessExit(exitCode: number, signal: string | null): AgentEvent[]
  shouldRetry(event: AgentEvent, attempt: number, policy: RetryPolicy): boolean

  protected readonly streamAssembler: StreamAssembler
}
```

---

## 20. Built-in adapters — v1 summary

| Adapter | CLI | Session | Stream | Fork | Thinking | MCP | Skills | Plugins | ACP |
|---|---|---|---|---|---|---|---|---|---|
| Claude Code | `claude` | JSONL | yes | yes | yes | yes | yes | partial | no |
| Codex CLI | `codex` | JSONL | yes | no | yes | yes | no | no | no |
| Gemini CLI | `gemini` | JSONL | yes | no | yes | yes | no | no | no |
| Copilot CLI | `copilot` | JSON | yes | no | no | no | no | no | no |
| Cursor | `cursor` | SQLite | partial | no | model-dep | yes | no | yes | no |
| OpenCode | `opencode` | SQLite | yes | yes | model-dep | yes | yes | yes | yes |
| Pi | `pi` | JSONL tree | yes | yes | model-dep | no | yes | yes | yes |
| omp | `omp` | JSONL tree | yes | yes | yes | no | yes | yes | yes |
| OpenClaw | `openclaw` | JSON | partial | no | model-dep | yes | yes | yes | no |

---

## 21. CLI — all commands and flags

### Binary: `amux`

```
amux [command] [flags]

  --agent, -a       Agent name
  --model, -m       Model ID
  --json            Output as JSONL event stream
  --debug           Include raw event output
  --config-dir      Override ~/.agent-mux/
  --project-dir     Override .agent-mux/
  --no-color
```

### `amux run`
```
amux run [agent] <prompt>

  --model, -m
  --stream / --no-stream
  --thinking-effort        low | medium | high | max
  --thinking-budget        Budget tokens (Claude)
  --max-tokens
  --max-turns
  --session                Resume session by ID
  --fork                   Fork session by ID
  --no-session             Ephemeral
  --system                 Inject system prompt
  --system-mode            prepend | append | replace
  --cwd
  --env                    KEY=VALUE (repeatable)
  --yolo                   Auto-approve all actions
  --deny                   Auto-deny all actions
  --timeout
  --inactivity-timeout
  --output-format          text | json | jsonl
  --tag                    (repeatable)
  --run-id
  --profile
  --interactive, -i        REPL mode
  --json                   Emit JSONL to stdout
  --quiet, -q
```

### `amux install`
```
amux install <agent>
  # Detects platform, prints the exact command(s) to run, and optionally executes them.
  # Runs through all installMethods for the current platform in order.
  # Checks for prerequisites before attempting installation.

  --dry-run        Print the install commands without running them
  --method         Force a specific install method (npm | brew | gh-extension | etc.)
  --yes, -y        Non-interactive: run install commands without prompting

Examples:
  amux install claude       # → npm install -g @anthropic-ai/claude-code
  amux install codex        # → npm install -g @openai/codex
  amux install copilot      # → gh extension install github/gh-copilot
  amux install opencode     # → brew install opencode/tap/opencode (macOS)
                            #   npm install -g opencode (linux/win)
  amux install cursor       # → Opens download page (no CLI installer available)
  amux install --dry-run gemini  # Prints install command without running
```

### `amux adapters`
```
amux adapters list              # All registered adapters: installed status, version, auth
amux adapters detect <agent>    # Detect single adapter: version, path, auth state
```

### `amux capabilities`
```
amux capabilities <agent>
amux capabilities <agent> --model <model>
amux capabilities <agent> --json
```

### `amux models`
```
amux models list <agent>
amux models list <agent> --json
amux models get <agent> <model>
amux models refresh <agent>
```

### `amux plugins`
```
# List installed plugins for an agent
amux plugins list <agent>
amux plugins list <agent> --json

# Install a plugin (capability-gated)
amux plugins install <agent> <plugin-id>
  --version              Pin to version
  --global               Install globally (vs project-local)
  --yes, -y              Skip confirmation

# Uninstall
amux plugins uninstall <agent> <plugin-id>
  --yes, -y

# Update
amux plugins update <agent> <plugin-id>
amux plugins update <agent> --all

# Search marketplace (cross-agent or agent-specific)
amux plugins search <query>
  --agent                Filter by agent
  --format               Filter by plugin format (npm-package | skill-file | etc.)
  --registry             Search specific registry only
  --json

# Browse marketplace by agent or category
amux plugins browse [agent]
  --category             e.g. coding | communication | automation
  --sort                 downloads | updated | name
  --json

# Plugin detail
amux plugins info <plugin-id> [--agent <agent>]

Examples:
  amux plugins list openclaw
  amux plugins install openclaw @openclaw/browser-skill
  amux plugins install opencode opencode-tokenscope
  amux plugins install pi @mariozechner/pi-subagents
  amux plugins search "web browser" --agent openclaw
  amux plugins browse opencode --category coding
  amux plugins update openclaw --all
```

### `amux sessions`
```
amux sessions list <agent> [options]
  --since, --until
  --model
  --tag
  --limit
  --sort           date | cost | turns
  --json

amux sessions show <agent> <session-id>
  --format         json | jsonl | markdown

amux sessions search <query> [--agent <a>] [--since] [--until]
amux sessions export <agent> <session-id> [--format]
amux sessions diff <agent>:<id> <agent>:<id>
amux sessions resume <agent> <session-id>
amux sessions fork <agent> <session-id>
```

### `amux cost`
```
amux cost report
  --agent
  --since, --until
  --model
  --tag
  --group-by       agent | model | day | tag
  --json
```

### `amux config`
```
amux config get <agent> [field]
amux config set <agent> <field> <value>
amux config schema <agent>
amux config validate <agent>
amux config mcp list <agent>
amux config mcp add <agent>
amux config mcp remove <agent> <name>
```

### `amux profiles`
```
amux profiles list [--scope global|project]
amux profiles show <name>
amux profiles set <name> [run flags]
amux profiles delete <name>
amux profiles apply <name>
```

### `amux auth`
```
amux auth check [agent]
amux auth setup <agent>
```

### `amux init`
```
amux init    # Create .agent-mux/ in current directory with defaults
```

### Pipe / stdin
```bash
echo "refactor this" | amux run claude --json
amux run codex "explain this" --json | jq 'select(.type == "text_delta")'
```

---

## 22. Process lifecycle and safety

- All child processes tracked. On SIGTERM: SIGINT first, SIGKILL after grace period (default 5s).
- Concurrent runs are concurrency-safe: each `RunHandle` has its own subprocess, stdio pipes, and state.
- Shared resources (config files, session files) are read-only; writes go through `ConfigManager` with file locking.
- Run isolation: each run gets its own temp dir for ephemeral harness state.
- PTY support via `node-pty` for agents that require it (OpenClaw, some interactive modes).
- Backpressure: configurable high-water mark (default: 1000 events) on the async iterator read loop.
- Zombie prevention: all spawned processes registered in a process group; SIGKILL sent on Node exit.

---

## 23. Cross-platform support

| Agent | macOS | Linux | Windows |
|---|---|---|---|
| Claude Code | ✅ | ✅ | ✅ |
| Codex CLI | ✅ | ✅ | ✅ |
| Gemini CLI | ✅ | ✅ | ✅ |
| Copilot CLI | ✅ | ✅ | ✅ |
| Cursor | ✅ | ✅ | ✅ |
| OpenCode | ✅ | ✅ | ✅ |
| Pi | ✅ | ✅ | ✅ |
| omp | ✅ | ✅ | partial |
| OpenClaw | ✅ | ✅ | ✅ |

Platform-specific: path separators, shell invocation, PTY availability, config file paths (XDG on Linux, `~/Library` on macOS, `%APPDATA%` on Windows) all normalized per adapter.

---

## 24. Package structure

```
@a5c-ai/agent-mux          — Full convenience package: re-exports core + adapters + cli
@a5c-ai/agent-mux-core     — AgentMuxClient, RunHandle, all types, stream engine
@a5c-ai/agent-mux-adapters — All built-in adapter implementations
@a5c-ai/agent-mux-cli      — CLI binary (amux)
```

```bash
# SDK only
npm install @a5c-ai/agent-mux-core @a5c-ai/agent-mux-adapters

# SDK + CLI (everything)
npm install @a5c-ai/agent-mux
npx @a5c-ai/agent-mux       # Zero-install CLI
```

---

## 25. Explicit out-of-scope for v1

- HTTP / remote agent dispatch (subprocess-local only)
- A database, sync layer, or storage for session content
- UI or dashboard
- Credential storage or management
- Explicit parallel dispatch orchestration (consumers call `mux.run()` concurrently)
- Scheduled or background runs
- Billing integrations
- Automatic plugin security scanning or sandboxing
