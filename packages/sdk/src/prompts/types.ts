/**
 * Prompt template types for composable, harness-parameterized prompt generation.
 *
 * @module prompts/types
 */

/**
 * Context object that parameterizes all prompt parts for a specific harness.
 * Each field controls conditional sections, CLI flag variations, or
 * harness-specific wording throughout the generated prompt.
 */
export interface PromptContext {
  /** Harness identifier: 'claude-code' | 'codex' | 'pi' | string */
  harness: string;

  /** Human-readable harness label: 'Claude Code' | 'Codex' | 'PI' */
  harnessLabel: string;

  /** Whether the harness session is interactive (has AskUserQuestion or equivalent).
   *  undefined = unknown — include both interactive and non-interactive content. */
  interactive: boolean | undefined;

  /**
   * Capabilities available in this harness context.
   * Examples: 'hooks', 'stop-hook', 'loop-driver', 'ask-user-question',
   *           'task-tool', 'mcp', 'session-binding'
   */
  capabilities: string[];

  /** Runtime platform: 'win32' | 'darwin' | 'linux' */
  platform: string;

  /**
   * Plugin root variable expression for shell interpolation.
   * '${CLAUDE_PLUGIN_ROOT}' | '${CODEX_PLUGIN_ROOT}' | '' (PI has none)
   */
  pluginRootVar: string;

  /**
   * Term used for the mechanism that continues the orchestration loop.
   * 'stop-hook' (Claude Code) | 'loop-driver' (PI) | 'stop-hook' (Codex)
   */
  loopControlTerm: string;

  /**
   * Additional CLI flags appended to run:create for session binding.
   * e.g., '--state-dir ~/.a5c/state'
   */
  sessionBindingFlags: string;

  /** Whether orchestration uses a stop-hook mechanism (true) or in-turn continuation (false).
   *  When false, the agent drives the loop in-turn instead of yielding to a hook. */
  hookDriven: boolean;

  /**
   * Name of the interactive question tool in the harness.
   * 'AskUserQuestion tool' | 'question tool' | ''
   */
  interactiveToolName: string;

  /**
   * Environment variables the harness auto-resolves for session binding.
   * e.g., 'AGENT_SESSION_ID (via CLAUDE_ENV_FILE)' or
   *       'AGENT_SESSION_ID, CODEX_THREAD_ID (auto-injected)'
   */
  sessionEnvVars: string;

  /**
   * Extra flags for session:resume command.
   * Usually empty — state dir defaults to ~/.a5c/state/ globally.
   * Only set when a harness needs an explicit override.
   */
  resumeFlags: string;

  /**
   * SDK version expression for install commands.
   * Only used by Claude Code which reads versions.json.
   * Empty string for harnesses that use plain 'babysitter' alias.
   */
  sdkVersionExpr: string;

  /**
   * Whether this harness supports the intent fidelity checks section.
   * Currently true for Codex, false for Claude Code and PI.
   */
  hasIntentFidelityChecks: boolean;

  /**
   * Whether this harness has a non-negotiables section.
   * Currently true for Codex, false for Claude Code and PI.
   */
  hasNonNegotiables: boolean;

  /**
   * CLI alias setup snippet. Varies by harness (versions.json lookup
   * vs plain alias).
   */
  cliSetupSnippet: string;

  /**
   * The run:iterate command template with harness-specific flags.
   */
  iterateFlags: string;

  /**
   * Resolved active process-library root directory (binding.dir).
   * When set, templates can reference this directly instead of telling
   * users to resolve it manually via CLI.
   */
  processLibraryRoot?: string;

  /**
   * Reference root path within the process library.
   * Typically `defaultSpec.referenceRoot` from the resolved library.
   */
  processLibraryReferenceRoot?: string;

  /**
   * GAP-PROMPT-005: Continuity context for resume overlays.
   * When set, renderContinuityOverlay produces a structured resume context section.
   * Undefined by default — only populated when resuming an existing run.
   */
  continuityContext?: ContinuityContext;

  // ── Context-gated part flags (auto-derived from detectExecutionContext) ──

  /** Always-on additions (enabled by default). */
  hasPriorityLadder?: boolean;
  hasRootCauseGuardrail?: boolean;
}

/**
 * GAP-PROMPT-005: Summary of a single effect for continuity overlays.
 */
export interface ContinuityEffectSummary {
  effectId: string;
  kind: string;
  title: string;
  status: 'resolved' | 'pending';
}

/**
 * GAP-PROMPT-005: Rich context extracted from run journal, tasks, and session
 * for structured resume overlays.
 */
export interface ContinuityContext {
  resolvedEffects: ContinuityEffectSummary[];
  pendingEffects: ContinuityEffectSummary[];
  stateTransitions: Array<{ event: string; recordedAt: string }>;
  modifiedFiles: string[];
  decisions: Array<{ description: string; timestamp: string }>;
  iteration: number;
  progressText: string;
}

/**
 * A prompt part is a pure function that takes a PromptContext and returns
 * a markdown string for that section. Returns empty string when not applicable.
 */
export type PromptPart = (ctx: PromptContext) => string;

/**
 * GAP-PROMPT-001: Prompt strata for cache optimization and deterministic composition.
 *
 * - stable:    System identity, core rules, tool definitions (rarely changes, highly cacheable)
 * - runtime:   Available capabilities, feature flags, workspace context (changes per session)
 * - turnLocal: Recent messages, current task, turn-specific instructions (changes every turn)
 */
export type PromptStratum = 'stable' | 'runtime' | 'turnLocal';

/**
 * A prompt part tagged with its stratum classification and a human-readable name.
 */
export interface StratumTaggedPart {
  /** Human-readable part name (e.g. 'renderCriticalRules') */
  name: string;
  /** Which stratum this part belongs to */
  stratum: PromptStratum;
  /** The render function */
  render: PromptPart;
  /**
   * GAP-PERF-005: Volatility score for cache-aware ordering within a stratum.
   * 0 = most stable (rendered first, most cacheable), 100 = most volatile.
   * Default: 50.
   */
  volatilityScore?: number;
}

/**
 * GAP-PERF-005: Stratum checksums for cache-break detection.
 * Only populated strata have checksums.
 */
export type StratumChecksums = Partial<Record<PromptStratum, string>>;

/**
 * GAP-PERF-005: Result of strata-aware composition with metadata.
 */
export interface ComposeByStrataWithMetaResult {
  /** The composed prompt output */
  output: string;
  /** SHA256 checksum per stratum for cache-break detection */
  stratumChecksums: StratumChecksums;
}

/**
 * Options for strata-aware prompt composition.
 */
export interface ComposeByStrataOptions {
  /** When true, add stratum header labels to the output for debugging */
  showStrata?: boolean;
  /** Custom separator between stratum groups (default: '\n\n---\n\n') */
  separator?: string;
  /** GAP-PERF-005: Sort parts within each stratum by volatilityScore ascending. Default: true */
  sortByVolatility?: boolean;
}
