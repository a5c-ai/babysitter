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
   * e.g., '--state-dir .a5c --plugin-root "${CODEX_PLUGIN_ROOT}"'
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
   * e.g., 'CLAUDE_SESSION_ID, CLAUDE_ENV_FILE' or
   *       'CODEX_THREAD_ID, CODEX_SESSION_ID, CODEX_ENV_FILE'
   */
  sessionEnvVars: string;

  /**
   * Extra flags for session:resume command.
   * e.g., '--state-dir "${CLAUDE_PLUGIN_ROOT}/skills/babysit/state"'
   *    or '--state-dir .a5c'
   *    or '' (PI, no extra flags)
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
}

/**
 * A prompt part is a pure function that takes a PromptContext and returns
 * a markdown string for that section. Returns empty string when not applicable.
 */
export type PromptPart = (ctx: PromptContext) => string;
