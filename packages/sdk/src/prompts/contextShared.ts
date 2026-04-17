import type { PromptContext } from "./types";

const DEFAULT_PLATFORM = typeof process !== "undefined" ? process.platform : "linux";

const DEFAULT_CLI_SETUP_SNIPPET = [
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
  'npm i -g @a5c-ai/babysitter-sdk@$SDK_VERSION',
  'CLI="npx -y @a5c-ai/babysitter-sdk@$SDK_VERSION"',
  '```',
  '',
  'If `babysitter` is already installed globally at the correct version, you may use `CLI="babysitter"` instead.',
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
