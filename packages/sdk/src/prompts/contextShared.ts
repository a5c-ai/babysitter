import type { PromptContext } from "./types";

const DEFAULT_PLATFORM = typeof process !== "undefined" ? process.platform : "linux";

const DEFAULT_CLI_SETUP_SNIPPET = [
  'Read the SDK version from `versions.json` when available, otherwise use the latest SDK:',
  '',
  '```bash',
  'SDK_VERSION=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(\'versions.json\',\'utf8\')).sdkVersion||\'latest\')}catch{console.log(\'latest\')}")',
  '```',
  '',
  'Use an installed `babysitter` command only after proving it can execute:',
  '',
  '```bash',
  'if command -v babysitter >/dev/null 2>&1 && babysitter --version >/dev/null 2>&1; then',
  '  CLI="babysitter"',
  'else',
  '  CLI="npm exec --yes --package @a5c-ai/babysitter-sdk@$SDK_VERSION -- babysitter"',
  'fi',
  '```',
  '',
  'If a stale or broken global shim fails with `MODULE_NOT_FOUND`, repair it with `npm rm -g @a5c-ai/babysitter @a5c-ai/babysitter-sdk && npm i -g @a5c-ai/babysitter-sdk@$SDK_VERSION`, then re-run `babysitter --version`.',
].join('\n');

const INTERNAL_CLI_SETUP_SNIPPET = [
  'Use the installed CLI alias:',
  '',
  '```bash',
  'CLI="babysitter"',
  '```',
].join('\n');

const CLAUDE_CODE_CLI_SETUP_SNIPPET = [
  'Read the SDK version from `versions.json` to ensure version compatibility:',
  '',
  '```bash',
  'SDK_VERSION=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(\'${CLAUDE_PLUGIN_ROOT}/versions.json\',\'utf8\')).sdkVersion||\'latest\')}catch{console.log(\'latest\')}")',
  '```',
  '',
  'Use an installed `babysitter` command only after proving it can execute:',
  '',
  '```bash',
  'if command -v babysitter >/dev/null 2>&1 && babysitter --version >/dev/null 2>&1; then',
  '  CLI="babysitter"',
  'else',
  '  CLI="npm exec --yes --package @a5c-ai/babysitter-sdk@$SDK_VERSION -- babysitter"',
  'fi',
  '```',
  '',
  'If a stale or broken global shim fails with `MODULE_NOT_FOUND`, repair it with `npm rm -g @a5c-ai/babysitter @a5c-ai/babysitter-sdk && npm i -g @a5c-ai/babysitter-sdk@$SDK_VERSION`, then re-run `babysitter --version`.',
].join('\n');

const COMMON_DEFAULTS: Partial<PromptContext> = {
  interactive: true,
  platform: DEFAULT_PLATFORM,
  hasIntentFidelityChecks: false,
  hasNonNegotiables: false,
  sdkVersionExpr: '',
  hasPriorityLadder: true,
  hasRootCauseGuardrail: true,
};

export function createPromptContext(
  base: Omit<
    PromptContext,
    "interactive" | "platform" | "sdkVersionExpr" | "hasIntentFidelityChecks" | "hasNonNegotiables"
  > & Partial<Pick<
    PromptContext,
    "interactive" | "platform" | "sdkVersionExpr" | "hasIntentFidelityChecks" | "hasNonNegotiables"
  >>,
  overrides?: Partial<PromptContext>,
): PromptContext {
  return {
    ...COMMON_DEFAULTS,
    ...base,
    ...overrides,
  } as PromptContext;
}

export function createDefaultCliSetupSnippet(): string {
  return DEFAULT_CLI_SETUP_SNIPPET;
}

export function createInternalCliSetupSnippet(): string {
  return INTERNAL_CLI_SETUP_SNIPPET;
}

export function createClaudeCodeCliSetupSnippet(): string {
  return CLAUDE_CODE_CLI_SETUP_SNIPPET;
}
