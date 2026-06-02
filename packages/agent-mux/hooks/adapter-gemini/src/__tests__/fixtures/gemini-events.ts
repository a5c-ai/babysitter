/**
 * Test fixtures for Gemini CLI hook event payloads.
 */

export const SESSION_START_STDIN = {
  cwd: '/home/user/project',
  model: 'gemini-2.5-pro',
  extensionPath: '/home/user/.gemini/extensions/babysitter',
  prompt: 'Help me refactor the auth module',
};

export const SESSION_END_STDIN = {
  cwd: '/home/user/project',
  model: 'gemini-2.5-pro',
};

export const BEFORE_TOOL_SELECTION_STDIN = {
  cwd: '/home/user/project',
  model: 'gemini-2.5-pro',
  availableTools: ['read_file', 'write_file', 'run_command', 'search'],
  prompt: 'Read the config file and update the database settings',
};

export const BEFORE_MODEL_STDIN = {
  cwd: '/home/user/project',
  model: 'gemini-2.5-pro',
  request: {
    messages: [{ role: 'user', content: 'Fix the bug' }],
    temperature: 0.7,
  },
  messages: [{ role: 'user', content: 'Fix the bug' }],
};

export const AFTER_MODEL_STDIN = {
  cwd: '/home/user/project',
  model: 'gemini-2.5-pro',
  response: {
    content: 'I will fix the bug by updating...',
    toolCalls: [{ name: 'read_file', args: { path: 'src/main.ts' } }],
  },
  usage: {
    promptTokens: 150,
    completionTokens: 80,
    totalTokens: 230,
  },
};

export const BEFORE_AGENT_STDIN = {
  cwd: '/home/user/project',
  model: 'gemini-2.5-pro',
  prompt: 'Analyze the codebase and suggest improvements',
};

export const AFTER_AGENT_STDIN = {
  cwd: '/home/user/project',
  model: 'gemini-2.5-pro',
  lastMessage: 'I have completed the analysis and made the following changes...',
  reason: 'completed',
};

export const BEFORE_TOOL_STDIN = {
  cwd: '/home/user/project',
  model: 'gemini-2.5-pro',
  toolName: 'write_file',
  toolInput: { path: 'src/config.ts', content: 'export const config = {}' },
  toolCallId: 'tc_001',
};

export const AFTER_TOOL_STDIN = {
  cwd: '/home/user/project',
  model: 'gemini-2.5-pro',
  toolName: 'write_file',
  toolInput: { path: 'src/config.ts', content: 'export const config = {}' },
  toolResult: { success: true, bytesWritten: 28 },
  toolCallId: 'tc_001',
};

export const DEFAULT_ENV: Record<string, string> = {
  PWD: '/home/user/project',
  GEMINI_SESSION_ID: 'gemini-test-session-123',
};

export const ENV_WITH_EXPLICIT_SESSION: Record<string, string> = {
  ...DEFAULT_ENV,
  AGENT_SESSION_ID: 'explicit-session-456',
};

export const ENV_WITH_PERSISTED: Record<string, string> = {
  ...DEFAULT_ENV,
  HOOKS_PROXY_PERSIST_RUN_ID: 'run-789',
  HOOKS_PROXY_MODEL: 'gemini-2.5-pro',
};
