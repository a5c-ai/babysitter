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
    sessionBindingFlags: '--plugin-root "${CLAUDE_PLUGIN_ROOT}"',
    hookDriven: true,
    interactiveToolName: 'AskUserQuestion tool',
    sessionEnvVars: 'CLAUDE_SESSION_ID, CLAUDE_ENV_FILE',
    resumeFlags:
      '--state-dir "${CLAUDE_PLUGIN_ROOT}/skills/babysit/state"',
    cliSetupSnippet: [
      'Read the SDK version from `versions.json` to ensure version compatibility:',
      '',
      '```bash',
      'SDK_VERSION=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(\'${CLAUDE_PLUGIN_ROOT}/versions.json\',\'utf8\')).sdkVersion||\'latest\')}catch{console.log(\'latest\')}")',
      'sudo npm i -g @a5c-ai/babysitter-sdk@$SDK_VERSION',
      '```',
      '',
      'then use the CLI alias: `CLI="babysitter"`',
      '',
      '**Alternatively:** `CLI="npx -y @a5c-ai/babysitter-sdk@$SDK_VERSION"`',
    ].join('\n'),
    sdkVersionExpr: '$SDK_VERSION',
    iterateFlags: '--plugin-root "${CLAUDE_PLUGIN_ROOT}"',
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
    sessionBindingFlags:
      '--state-dir .a5c --plugin-root "${CODEX_PLUGIN_ROOT}"',
    hookDriven: typeof globalThis.process !== 'undefined' ? globalThis.process.platform !== 'win32' : true,
    interactiveToolName: 'AskUserQuestion tool',
    sessionEnvVars:
      'CODEX_THREAD_ID, CODEX_SESSION_ID, CODEX_ENV_FILE',
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
    iterateFlags: '--plugin-root "${CODEX_PLUGIN_ROOT}"',
    hasIntentFidelityChecks: true,
    hasNonNegotiables: true,
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
    harnessLabel: 'PI',
    capabilities: ['loop-driver', 'ask-user-question', 'task-tool', 'breakpoint-routing', 'harness-routing'],
    pluginRootVar: '',
    loopControlTerm: 'loop-driver',
    sessionBindingFlags: '',
    hookDriven: false,
    interactiveToolName: 'AskUserQuestion',
    sessionEnvVars: '(auto-resolved by PI extension)',
    resumeFlags: '',
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
