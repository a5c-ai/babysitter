import type { AgentName } from '../types.js';

export interface ToolClassification {
  destructive: boolean;
  readOnly: boolean;
  network: boolean;
  longRunning: boolean;
  handlesSecrets: boolean;
}

type ToolRule = {
  test: RegExp;
  value: Partial<ToolClassification>;
  inputTest?: RegExp;
};

const DEFAULT_CLASSIFICATION: ToolClassification = {
  destructive: true,
  readOnly: false,
  network: false,
  longRunning: false,
  handlesSecrets: false,
};

const RULES: Record<string, ToolRule[]> = {
  '*': [
    { test: /^(read|cat|view|open_file|read_file|file_read|glob|grep|search_files|file_search|list_dir|ls|find)$/i, value: { destructive: false, readOnly: true } },
    { test: /^(fetch|web(fetch|search)?|search_query|browser_(navigate|open|visit|search)|open_url|http_request)$/i, value: { destructive: false, readOnly: true, network: true } },
    { test: /^(bash|shell|exec_command|run_shell_command|terminal|command)$/i, value: { longRunning: true }, inputTest: /\b(rm|del|remove-item|mv|move|cp|copy|chmod|chown|git\s+(commit|push|reset|clean|checkout)|npm\s+publish)\b/i },
    { test: /^(bash|shell|exec_command|run_shell_command|terminal|command)$/i, value: { destructive: false, readOnly: true, longRunning: true }, inputTest: /\b(ls|dir|cat|type|pwd|echo|grep|rg|find|git\s+(status|diff|log)|npm\s+(test|run\s+lint)|vitest|eslint|tsc)\b/i },
    { test: /^(write|edit|multi(edit)?|replace|patch|apply_patch|notebook(edit|_write)|file_(write|create|delete|patch)|create|mkdir|delete|remove|rename|move|copy)$/i, value: { destructive: true, readOnly: false } },
    { test: /^(secret|credential|credentials|auth|login|token|env|keychain|vault)/i, value: { handlesSecrets: true } },
  ],
  claude: [
    { test: /^(Read|Grep|Glob|LS|NotebookRead|TodoRead)$/i, value: { destructive: false, readOnly: true } },
    { test: /^(Write|Edit|MultiEdit|NotebookEdit|TodoWrite)$/i, value: { destructive: true, readOnly: false } },
    { test: /^Web(Fetch|Search)$/i, value: { destructive: false, readOnly: true, network: true } },
    { test: /^Bash$/i, value: { longRunning: true } },
    { test: /^Task$/i, value: { longRunning: true } },
  ],
  codex: [
    { test: /^(view_image|read_mcp_resource|list_mcp_resources|list_mcp_resource_templates)$/i, value: { destructive: false, readOnly: true } },
    { test: /^(exec_command|write_stdin)$/i, value: { longRunning: true } },
    { test: /^apply_patch$/i, value: { destructive: true, readOnly: false } },
  ],
  gemini: [
    { test: /^(read_file|grep_in_files|search_codebase)$/i, value: { destructive: false, readOnly: true } },
    { test: /^(write_file|replace_file_text|create_file|delete_file)$/i, value: { destructive: true, readOnly: false } },
    { test: /^google_search$/i, value: { destructive: false, readOnly: true, network: true } },
    { test: /^run_shell_command$/i, value: { longRunning: true } },
  ],
  copilot: [
    { test: /^(readFile|findTextInFiles|search)$/i, value: { destructive: false, readOnly: true } },
    { test: /^(createFile|editFile|deleteFile)$/i, value: { destructive: true, readOnly: false } },
  ],
  cursor: [
    { test: /^(read_file|search_files|list_files)$/i, value: { destructive: false, readOnly: true } },
    { test: /^(edit_file|create_file|delete_file)$/i, value: { destructive: true, readOnly: false } },
  ],
  opencode: [
    { test: /^(read|grep|glob|ls)$/i, value: { destructive: false, readOnly: true } },
    { test: /^(write|edit|patch)$/i, value: { destructive: true, readOnly: false } },
  ],
  openclaw: [
    { test: /^(channel-plugin|webhook)$/i, value: { network: true, longRunning: true } },
  ],
  pi: [
    { test: /^(read_file|search_files)$/i, value: { destructive: false, readOnly: true } },
    { test: /^(write_file|edit_file)$/i, value: { destructive: true, readOnly: false } },
  ],
  omp: [
    { test: /^(read|grep|glob)$/i, value: { destructive: false, readOnly: true } },
    { test: /^(write|edit|patch)$/i, value: { destructive: true, readOnly: false } },
  ],
  hermes: [
    { test: /^(read_file|grep|glob)$/i, value: { destructive: false, readOnly: true } },
    { test: /^(write_file|edit_file|patch_file)$/i, value: { destructive: true, readOnly: false } },
  ],
};

export function classifyTool(
  agent: AgentName,
  toolName: string,
  input?: unknown,
): ToolClassification {
  const normalizedAgent = String(agent).toLowerCase();
  const normalizedInput = typeof input === 'string' ? input : JSON.stringify(input ?? '');
  const matches = [...(RULES['*'] ?? []), ...(RULES[normalizedAgent] ?? [])];
  const resolved: ToolClassification = { ...DEFAULT_CLASSIFICATION };

  for (const rule of matches) {
    if (!rule.test.test(toolName)) continue;
    if (rule.inputTest && !rule.inputTest.test(normalizedInput)) continue;
    Object.assign(resolved, rule.value);
  }

  return resolved;
}
