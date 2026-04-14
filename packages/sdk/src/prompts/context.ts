/**
 * Context factory functions for each supported harness.
 *
 * @module prompts/context
 */

import { PromptContext } from './types';

const COMMON_DEFAULTS: Partial<PromptContext> = {
  interactive: true,
  platform: typeof process !== 'undefined' ? process.platform : 'linux',
  hasIntentFidelityChecks: false,
  hasNonNegotiables: false,
  sdkVersionExpr: '',
  // Always-on additions — enabled by default across harnesses.
  hasPriorityLadder: true,
  hasRootCauseGuardrail: true,
};

/**
 * Create a PromptContext pre-configured for Claude Code.
 */
export function createClaudeCodeContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return {
    ...COMMON_DEFAULTS,
    harness: 'claude-code',
    harnessLabel: 'Claude Code',
    capabilities: ['hooks', 'stop-hook', 'ask-user-question', 'task-tool', 'breakpoint-routing'],
    pluginRootVar: '${CLAUDE_PLUGIN_ROOT}',
    loopControlTerm: 'stop-hook',
    sessionBindingFlags: '',
    hookDriven: true,
    interactiveToolName: 'AskUserQuestion tool',
    sessionEnvVars: 'PID-scoped session marker (authoritative); CLAUDE_ENV_FILE and BABYSITTER_SESSION_ID are fallbacks',
    resumeFlags: '--state-dir .a5c',
    cliSetupSnippet: [
      'Read the SDK version from `versions.json` to ensure version compatibility:',
      '',
      '```bash',
      'SDK_VERSION=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(\'${CLAUDE_PLUGIN_ROOT}/versions.json\',\'utf8\')).sdkVersion||\'latest\')}catch{console.log(\'latest\')}")',
      'npm i -g @a5c-ai/babysitter-sdk@$SDK_VERSION',
      'CLI="npx -y @a5c-ai/babysitter-sdk@$SDK_VERSION"',
      '```',
      '',
      'If `babysitter` is already installed globally at the correct version, you may use `CLI="babysitter"` instead.',
    ].join('\n'),
    sdkVersionExpr: '$SDK_VERSION',
    iterateFlags: '',
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
    ...overrides,
  } as PromptContext;
}

/**
 * Create a PromptContext pre-configured for Codex.
 */
export function createCodexContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return {
    ...COMMON_DEFAULTS,
    harness: 'codex',
    harnessLabel: 'Codex',
    capabilities: ['hooks', 'stop-hook', 'ask-user-question', 'task-tool', 'breakpoint-routing'],
    pluginRootVar: '${CODEX_PLUGIN_ROOT}',
    loopControlTerm: 'stop-hook',
    sessionBindingFlags: '',
    hookDriven: true, // overridden at instruction-generation time if session-start hook hasn't run
    interactiveToolName: 'AskUserQuestion tool',
    sessionEnvVars:
      'PID-scoped session marker (authoritative); CODEX_THREAD_ID/CODEX_SESSION_ID and BABYSITTER_SESSION_ID are fallbacks',
    resumeFlags: '--state-dir .a5c',
    cliSetupSnippet: [
      'Use the installed CLI alias:',
      '',
      '```bash',
      'CLI="babysitter"',
      '```',
      '',
      'If it is not available on the path, use:',
      '',
      '```bash',
      'CLI="npx -y @a5c-ai/babysitter-sdk"',
      '```',
    ].join('\n'),
    iterateFlags: '',
    hasIntentFidelityChecks: true,
    hasNonNegotiables: true,
    ...overrides,
  } as PromptContext;
}

/**
 * Create a PromptContext pre-configured for GitHub Copilot CLI.
 */
export function createGithubCopilotContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return {
    ...COMMON_DEFAULTS,
    harness: 'github-copilot',
    harnessLabel: 'GitHub Copilot CLI',
    capabilities: ['hooks', 'mcp', 'task-tool', 'breakpoint-routing'],
    pluginRootVar: '${COPILOT_PLUGIN_ROOT}',
    // In-turn model: agent drives orchestration loop within a single session.
    // No stop-hook available — Copilot CLI sessionEnd output is ignored.
    loopControlTerm: 'in-turn',
    sessionBindingFlags: '',
    hookDriven: false,
    interactiveToolName: 'AskUserQuestion tool',
    sessionEnvVars: 'PID-scoped session marker (authoritative); COPILOT_ENV_FILE / COPILOT_SESSION_ID and BABYSITTER_SESSION_ID are fallbacks',
    resumeFlags: '--state-dir .a5c',
    cliSetupSnippet: [
      'Use the installed CLI alias:',
      '',
      '```bash',
      'CLI="babysitter"',
      '```',
      '',
      'If it is not available on the path, use:',
      '',
      '```bash',
      'CLI="npx -y @a5c-ai/babysitter-sdk"',
      '```',
    ].join('\n'),
    iterateFlags: '',
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
    ...overrides,
  } as PromptContext;
}

/**
 * Create a PromptContext pre-configured for Cursor IDE/CLI.
 */
export function createCursorContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return {
    ...COMMON_DEFAULTS,
    harness: 'cursor',
    harnessLabel: 'Cursor',
    capabilities: ['hooks', 'stop-hook', 'mcp', 'task-tool', 'breakpoint-routing'],
    pluginRootVar: '${CURSOR_PLUGIN_ROOT}',
    // Stop-hook model: Cursor's stop hook returns {followup_message: "..."}
    // to auto-continue (controlled by loop_limit in hooks.json).
    loopControlTerm: 'stop-hook',
    sessionBindingFlags: '',
    hookDriven: true,
    interactiveToolName: 'AskUserQuestion tool',
    sessionEnvVars: 'conversation_id from hook stdin (authoritative per-request); PID-scoped session marker; BABYSITTER_SESSION_ID fallback',
    resumeFlags: '--state-dir .a5c',
    cliSetupSnippet: [
      'Use the installed CLI alias:',
      '',
      '```bash',
      'CLI="babysitter"',
      '```',
      '',
      'If it is not available on the path, use:',
      '',
      '```bash',
      'CLI="npx -y @a5c-ai/babysitter-sdk"',
      '```',
    ].join('\n'),
    iterateFlags: '',
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
    ...overrides,
  } as PromptContext;
}

/**
 * Create a PromptContext pre-configured for Gemini CLI.
 */
export function createGeminiCliContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return {
    ...COMMON_DEFAULTS,
    harness: 'gemini-cli',
    harnessLabel: 'Gemini CLI',
    capabilities: ['hooks', 'stop-hook', 'task-tool', 'breakpoint-routing'],
    pluginRootVar: '${GEMINI_EXTENSION_PATH}',
    loopControlTerm: 'stop-hook',
    sessionBindingFlags: '',
    hookDriven: true,
    interactiveToolName: 'AskUserQuestion tool',
    sessionEnvVars: 'PID-scoped session marker (authoritative); GEMINI_SESSION_ID and BABYSITTER_SESSION_ID are fallbacks',
    resumeFlags: '--state-dir .a5c',
    cliSetupSnippet: [
      'Use the installed CLI alias:',
      '',
      '```bash',
      'CLI="babysitter"',
      '```',
      '',
      'If it is not available on the path, use:',
      '',
      '```bash',
      'CLI="npx -y @a5c-ai/babysitter-sdk"',
      '```',
    ].join('\n'),
    iterateFlags: '',
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
    ...overrides,
  } as PromptContext;
}

/**
 * Create a PromptContext pre-configured for OpenCode.
 */
export function createOpenCodeContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return {
    ...COMMON_DEFAULTS,
    harness: 'opencode',
    harnessLabel: 'OpenCode',
    capabilities: ['task-tool', 'breakpoint-routing'],
    pluginRootVar: '',
    // In-turn model: OpenCode has no blocking stop hook.
    // session.idle is fire-and-forget. Orchestration is driven in-turn
    // by the agent itself or via the SDK loop driver.
    loopControlTerm: 'in-turn',
    sessionBindingFlags: '',
    hookDriven: false,
    interactiveToolName: '',
    sessionEnvVars: 'PID-scoped session marker (authoritative); shell.env-injected session ID and BABYSITTER_SESSION_ID are fallbacks',
    resumeFlags: '--state-dir .a5c',
    cliSetupSnippet: [
      'Use the installed CLI alias:',
      '',
      '```bash',
      'CLI="babysitter"',
      '```',
      '',
      'If it is not available on the path, use:',
      '',
      '```bash',
      'CLI="npx -y @a5c-ai/babysitter-sdk"',
      '```',
    ].join('\n'),
    iterateFlags: '',
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
    ...overrides,
  } as PromptContext;
}

/**
 * Create a PromptContext pre-configured for PI.
 */
export function createPiContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return {
    ...COMMON_DEFAULTS,
    harness: 'pi',
    harnessLabel: 'Pi Coding Agent',
    capabilities: ['skills', 'slash-commands', 'task-tool', 'harness-routing', 'programmatic-session'],
    pluginRootVar: '${PI_PLUGIN_ROOT}',
    loopControlTerm: 'skill-driven',
    sessionBindingFlags: '',
    hookDriven: false,
    interactiveToolName: 'AskUserQuestion',
    sessionEnvVars: 'PID-scoped session marker (authoritative); PI_SESSION_ID and BABYSITTER_SESSION_ID are fallbacks',
    resumeFlags: '--state-dir .a5c',
    cliSetupSnippet: [
      'Use the installed CLI alias:',
      '',
      '```bash',
      'CLI="babysitter"',
      '```',
      '',
      'If it is not available on the path, use:',
      '',
      '```bash',
      'CLI="npx -y @a5c-ai/babysitter-sdk"',
      '```',
    ].join('\n'),
    iterateFlags: '',
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
    ...overrides,
  } as PromptContext;
}

/**
 * Create a PromptContext pre-configured for OpenClaw.
 */
export function createOpenClawContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return {
    ...COMMON_DEFAULTS,
    harness: 'openclaw',
    harnessLabel: 'OpenClaw',
    capabilities: ['session-binding', 'mcp', 'headless-prompt', 'task-tool', 'breakpoint-routing'],
    pluginRootVar: '',
    // Daemon model: no stop-hook. Agent lifecycle managed by agent_end signal.
    loopControlTerm: 'agent_end',
    sessionBindingFlags: '',
    hookDriven: false,
    interactiveToolName: 'AskUserQuestion tool',
    sessionEnvVars: 'PID-scoped session marker (authoritative); OPENCLAW_SHELL gateway injection and BABYSITTER_SESSION_ID are fallbacks',
    resumeFlags: '--state-dir .a5c',
    cliSetupSnippet: [
      'Use the installed CLI alias:',
      '',
      '```bash',
      'CLI="babysitter"',
      '```',
      '',
      'If it is not available on the path, use:',
      '',
      '```bash',
      'CLI="npx -y @a5c-ai/babysitter-sdk"',
      '```',
    ].join('\n'),
    iterateFlags: '',
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
    ...overrides,
  } as PromptContext;
}

export function createOhMyPiContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return {
    ...COMMON_DEFAULTS,
    harness: 'oh-my-pi',
    harnessLabel: 'oh-my-pi',
    capabilities: ['skills', 'slash-commands', 'task-tool', 'harness-routing', 'programmatic-session', 'mcp'],
    pluginRootVar: '${OMP_PLUGIN_ROOT}',
    loopControlTerm: 'skill-driven',
    sessionBindingFlags: '',
    hookDriven: false,
    interactiveToolName: 'AskUserQuestion',
    sessionEnvVars: 'PID-scoped session marker (authoritative); OMP_SESSION_ID and BABYSITTER_SESSION_ID are fallbacks',
    resumeFlags: '--state-dir .a5c',
    cliSetupSnippet: [
      'Use the installed CLI alias:',
      '',
      '```bash',
      'CLI="babysitter"',
      '```',
      '',
      'If it is not available on the path, use:',
      '',
      '```bash',
      'CLI="npx -y @a5c-ai/babysitter-sdk"',
      '```',
    ].join('\n'),
    iterateFlags: '',
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
    ...overrides,
  } as PromptContext;
}

/**
 * Create a PromptContext pre-configured for the internal (programmatic) harness.
 *
 * The internal harness is the SDK's built-in execution engine. It supports
 * concurrent effect execution (GAP-PAR-001), async/background effects
 * (GAP-PAR-002), and multi-harness parallel dispatch (GAP-PAR-003).
 */
export function createInternalContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return {
    ...COMMON_DEFAULTS,
    harness: 'internal',
    harnessLabel: 'Internal (Programmatic)',
    capabilities: [
      'task-tool',
      'breakpoint-routing',
      'programmatic-session',
      'concurrent-effects',
      'background-effects',
      'multi-harness-dispatch',
    ],
    pluginRootVar: '',
    loopControlTerm: 'in-turn',
    sessionBindingFlags: '',
    hookDriven: false,
    interactiveToolName: 'AskUserQuestion',
    sessionEnvVars: 'PID-scoped session marker (authoritative); OMP_SESSION_ID / PI_SESSION_ID and BABYSITTER_SESSION_ID are fallbacks',
    resumeFlags: '--state-dir .a5c',
    cliSetupSnippet: [
      'Use the installed CLI alias:',
      '',
      '```bash',
      'CLI="babysitter"',
      '```',
    ].join('\n'),
    iterateFlags: '',
    hasIntentFidelityChecks: false,
    hasNonNegotiables: false,
    ...overrides,
  } as PromptContext;
}
