/**
 * Agent and model capability types for @a5c-ai/agent-mux.
 *
 * @see 06-capabilities-and-models.md
 */

import type { AgentName, PluginFormat } from './types.js';
import type { AuthMethodDescriptor } from './auth-types.js';
import type { RuntimeHookCapabilities } from './runtime-hooks.js';

// ---------------------------------------------------------------------------
// ThinkingEffortLevel
// ---------------------------------------------------------------------------

/** Discrete thinking effort levels supported by agents. */
export type ThinkingEffortLevel = 'low' | 'medium' | 'high' | 'max';

/** Normalized request/transport protocol used to talk to a model. */
export type ModelProtocol = 'chat' | 'responses' | 'messages' | 'custom';

/** How a model is typically reached for a given adapter. */
export type ModelDeployment = 'hosted' | 'local' | 'gateway' | 'hybrid';

/**
 * How agent-mux can execute additional turns for a structured session.
 *
 * `restart-per-turn` means each user turn requires a fresh invocation or
 * reconnect that resumes the same native session.
 * `persistent` means the same live process/connection stays open and can
 * accept later turns while continuing to emit structured events.
 */
export type StructuredSessionTransport = 'none' | 'restart-per-turn' | 'persistent';

/**
 * Who owns the live session control plane behind an adapter.
 *
 * `self-managed` means agent-mux directly owns the subprocess / SDK lifecycle.
 * `external-host` means agent-mux talks to another long-lived host surface
 * (app-server, HTTP server, remote wrapper) that owns the session.
 * `mcp-mediated` means a third-party host mediates the live session over MCP or
 * a similar host-managed channel.
 */
export type SessionControlPlane = 'self-managed' | 'external-host' | 'mcp-mediated';

// ---------------------------------------------------------------------------
// PluginRegistry
// ---------------------------------------------------------------------------

/** Describes where plugins are sourced from for a given agent. */
export interface PluginRegistry {
  /** Registry identifier (e.g., 'npm', 'openclaw-registry', 'agentskills-hub'). */
  name: string;

  /** Base URL of the registry. */
  url: string;

  /** Whether the registry supports programmatic search. */
  searchable: boolean;
}

// ---------------------------------------------------------------------------
// InstallMethod
// ---------------------------------------------------------------------------

/** Describes a single method for installing an agent on a particular platform. */
export interface InstallMethod {
  /**
   * Which platform this install method applies to.
   * 'all' means the method works on darwin, linux, and win32.
   */
  platform: 'darwin' | 'linux' | 'win32' | 'all';

  /**
   * The installation mechanism.
   */
  type: 'npm' | 'brew' | 'gh-extension' | 'curl' | 'winget' | 'scoop' | 'manual' | 'pip' | 'nix';

  /** The exact command to run for installation. */
  command: string;

  /** Human-readable notes (e.g., prerequisites, RAM requirements). */
  notes?: string;

  /** A command to run to verify a prerequisite is installed. */
  prerequisiteCheck?: string;
}

// ---------------------------------------------------------------------------
// AgentCapabilities
// ---------------------------------------------------------------------------

/** Structured manifest of what an agent adapter can do. */
export interface AgentCapabilities {
  /** The agent this capability manifest describes. */
  agent: AgentName;

  // ── Session ─────────────────────────────────────────────────────────

  /** Whether the agent can resume a prior session by ID. */
  canResume: boolean;

  /** Whether the agent can fork (branch) an existing session. */
  canFork: boolean;

  /** Whether the agent supports multi-turn conversations within a single run. */
  supportsMultiTurn: boolean;

  /** How the agent persists session data. */
  sessionPersistence: 'none' | 'file' | 'sqlite' | 'in-memory';

  // ── Streaming ───────────────────────────────────────────────────────

  /** Whether the agent supports real-time text token streaming. */
  supportsTextStreaming: boolean;

  /** Whether tool call arguments stream incrementally. */
  supportsToolCallStreaming: boolean;

  /** Whether thinking/reasoning tokens stream incrementally. */
  supportsThinkingStreaming: boolean;

  // ── Tool Calling ────────────────────────────────────────────────────

  /** Whether the agent supports native tool/function calling. */
  supportsNativeTools: boolean;

  /** Whether the agent supports the Model Context Protocol. */
  supportsMCP: boolean;

  /** Whether the agent can invoke multiple tools in a single turn. */
  supportsParallelToolCalls: boolean;

  /** Whether tool execution requires explicit user approval by default. */
  requiresToolApproval: boolean;

  /** The approval modes this agent supports. */
  approvalModes: ('yolo' | 'prompt' | 'deny')[];

  /** How each runtime hook kind is supported by the adapter. */
  runtimeHooks: RuntimeHookCapabilities;

  // ── Thinking ────────────────────────────────────────────────────────

  /** Whether the agent supports extended thinking / reasoning mode. */
  supportsThinking: boolean;

  /** The discrete thinking effort levels this agent accepts. */
  thinkingEffortLevels: ThinkingEffortLevel[];

  /** Whether the agent supports a numeric thinking budget in tokens. */
  supportsThinkingBudgetTokens: boolean;

  // ── Output ──────────────────────────────────────────────────────────

  /** Whether the agent supports JSON-only output mode. */
  supportsJsonMode: boolean;

  /** Whether the agent supports structured output with a schema. */
  supportsStructuredOutput: boolean;

  /**
   * How agent-mux can drive structured multi-turn sessions for this adapter.
   * Distinguishes resumable one-turn CLI flows from truly persistent live
   * structured sessions.
   */
  structuredSessionTransport: StructuredSessionTransport;

  /** Who owns the live session control plane for this adapter. */
  sessionControlPlane: SessionControlPlane;

  // ── Skills / Agent Docs ─────────────────────────────────────────────

  /** Whether the agent supports loading skill definitions. */
  supportsSkills: boolean;

  /** Whether the agent supports an agents.md / AGENTS.md doc. */
  supportsAgentsMd: boolean;

  /** The format skills are loaded in, or null if skills are unsupported. */
  skillsFormat: 'file' | 'directory' | 'npm-package' | null;

  // ── Subagents / Parallelism ─────────────────────────────────────────

  /** Whether the agent can dispatch subagent tasks. */
  supportsSubagentDispatch: boolean;

  /** Whether the agent supports running parallel tasks / tool calls. */
  supportsParallelExecution: boolean;

  /** Maximum number of concurrent parallel tasks, if bounded. */
  maxParallelTasks?: number;

  // ── Interaction ─────────────────────────────────────────────────────

  /** Whether the agent has an interactive REPL mode. */
  supportsInteractiveMode: boolean;

  /** Whether agent-mux can inject text into the agent's stdin mid-run. */
  supportsStdinInjection: boolean;

  // ── Multimodal ──────────────────────────────────────────────────────

  /** Whether the agent accepts image inputs (screenshots, diagrams). */
  supportsImageInput: boolean;

  /** Whether the agent can produce image outputs. */
  supportsImageOutput: boolean;

  /** Whether the agent accepts file attachments beyond images. */
  supportsFileAttachments: boolean;

  // ── Plugin System ───────────────────────────────────────────────────

  /** Whether this agent has a plugin/extension system. */
  supportsPlugins: boolean;

  /** The kinds of plugins this agent supports. */
  pluginFormats: PluginFormat[];

  /** Native CLI command to install a plugin, if available. */
  pluginInstallCmd?: string;

  /** Native CLI command to list installed plugins, if available. */
  pluginListCmd?: string;

  /** Native CLI command to uninstall a plugin, if available. */
  pluginUninstallCmd?: string;

  /** Official plugin marketplace / registry URL, if available. */
  pluginMarketplaceUrl?: string;

  /** Native CLI command to search for plugins, if available. */
  pluginSearchCmd?: string;

  /** Where plugins are sourced from (npm, custom registries, etc.). */
  pluginRegistries: PluginRegistry[];

  // ── Process ─────────────────────────────────────────────────────────

  /** Platforms this agent runs on natively. */
  supportedPlatforms: ('darwin' | 'linux' | 'win32')[];

  /** Whether the agent requires the working directory to be a git repo. */
  requiresGitRepo: boolean;

  /** Whether the agent requires a pseudo-terminal (PTY) to function. */
  requiresPty: boolean;

  // ── Auth ────────────────────────────────────────────────────────────

  /** Authentication methods this agent supports. */
  authMethods: AuthMethodDescriptor[];

  /** File paths (relative to home) where auth tokens/keys are stored. */
  authFiles: string[];

  // ── Install ─────────────────────────────────────────────────────────

  /** Installation methods for this agent, per platform. */
  installMethods: InstallMethod[];
}

// ---------------------------------------------------------------------------
// ModelCapabilities
// ---------------------------------------------------------------------------

/** Per-model capability, pricing, and context information. */
export interface ModelCapabilities {
  /** The agent this model belongs to. */
  agent: AgentName;

  /** The canonical model identifier (e.g., 'claude-opus-4-20250514'). */
  modelId: string;

  /** An optional short alias (e.g., 'opus' for 'claude-opus-4-20250514'). */
  modelAlias?: string;

  /** Human-readable display name (e.g., 'Claude Opus 4'). */
  displayName: string;

  /** Whether this model is deprecated and should not be used for new work. */
  deprecated: boolean;

  /** ISO 8601 date string when the model was deprecated. */
  deprecatedSince?: string;

  /** The recommended replacement model when this model is deprecated. */
  successorModelId?: string;

  /** Maximum context window size in tokens. */
  contextWindow: number;

  /** Maximum output tokens the model can generate in a single response. */
  maxOutputTokens: number;

  /** Maximum thinking/reasoning tokens, if the model supports thinking. */
  maxThinkingTokens?: number;

  /** Cost per million input tokens in USD. */
  inputPricePerMillion?: number;

  /** Cost per million output tokens in USD. */
  outputPricePerMillion?: number;

  /** Cost per million thinking tokens in USD. */
  thinkingPricePerMillion?: number;

  /** Cost per million cached input tokens in USD. */
  cachedInputPricePerMillion?: number;

  /** Whether this model supports extended thinking / reasoning mode. */
  supportsThinking: boolean;

  /** The discrete thinking effort levels this model accepts. */
  thinkingEffortLevels?: ThinkingEffortLevel[];

  /** The valid range [min, max] for thinkingBudgetTokens on this model. */
  thinkingBudgetRange?: [number, number];

  /** Whether this model supports tool/function calling. */
  supportsToolCalling: boolean;

  /** Whether this model supports parallel tool calls in a single turn. */
  supportsParallelToolCalls: boolean;

  /** Whether tool call arguments stream incrementally on this model. */
  supportsToolCallStreaming: boolean;

  /** Whether this model supports JSON-only output mode. */
  supportsJsonMode: boolean;

  /** Whether this model supports structured output with a schema. */
  supportsStructuredOutput: boolean;

  /** Whether this model supports real-time text token streaming. */
  supportsTextStreaming: boolean;

  /** Whether thinking/reasoning tokens stream on this model. */
  supportsThinkingStreaming: boolean;

  /** Whether this model accepts image inputs. */
  supportsImageInput: boolean;

  /** Whether this model can produce image outputs. */
  supportsImageOutput: boolean;

  /** Whether this model accepts file inputs beyond images. */
  supportsFileInput: boolean;

  /** The underlying provider family backing this model entry. */
  provider?: string;

  /** Provider-native model identifier when it differs from modelId. */
  providerModelId?: string;

  /** The request/transport protocol typically used for this model. */
  protocol?: ModelProtocol;

  /** Whether this model is typically reached as hosted, local, or via gateway. */
  deployment?: ModelDeployment;

  /** Whether the adapter can route this catalog entry to local model backends. */
  supportsLocalModels?: boolean;

  /** The CLI argument key used to select this model. */
  cliArgKey: string;

  /** The CLI argument value passed with cliArgKey. */
  cliArgValue: string;

  /** ISO 8601 timestamp of the last update to this model's data. */
  lastUpdated: string;

  /** Whether this data comes from a bundled snapshot or a remote refresh. */
  source: 'bundled' | 'remote';
}

// ---------------------------------------------------------------------------
// ModelValidationResult
// ---------------------------------------------------------------------------

/** Returned by ModelRegistry.validate() for model identifier validation. */
export interface ModelValidationResult {
  /** Whether the model identifier is recognized and usable. */
  valid: boolean;

  /** The validated model's capabilities, if valid. */
  model?: ModelCapabilities;

  /** Validation status. */
  status: 'ok' | 'deprecated' | 'alias' | 'unknown' | 'ambiguous';

  /** Human-readable message explaining the result. */
  message: string;

  /** Suggested model identifiers when status is 'unknown' or 'ambiguous'. */
  suggestions?: string[];

  /** The canonical model ID when status is 'alias'. */
  resolvedModelId?: string;

  /** The recommended successor when status is 'deprecated'. */
  successorModelId?: string;
}
