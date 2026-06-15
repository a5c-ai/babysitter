/**
 * Test fixtures for OpenCode hook event payloads.
 */

export const SESSION_CREATED_EVENT = {
  sessionId: 'opencode-session-abc',
  cwd: '/home/user/project',
  model: 'claude-sonnet-4-20250514',
  prompt: 'Help me refactor the auth module',
};

export const TOOL_EXECUTE_BEFORE_EVENT = {
  sessionId: 'opencode-session-abc',
  cwd: '/home/user/project',
  model: 'claude-sonnet-4-20250514',
  toolName: 'write_file',
  toolInput: { path: 'src/config.ts', content: 'export const config = {}' },
  toolCallId: 'tc_001',
};

export const TOOL_EXECUTE_AFTER_EVENT = {
  sessionId: 'opencode-session-abc',
  cwd: '/home/user/project',
  model: 'claude-sonnet-4-20250514',
  toolName: 'write_file',
  toolInput: { path: 'src/config.ts', content: 'export const config = {}' },
  toolResult: { success: true, bytesWritten: 28 },
  toolCallId: 'tc_001',
};

export const SHELL_ENV_EVENT = {
  sessionId: 'opencode-session-abc',
  cwd: '/home/user/project',
  env: {
    AGENT_SESSION_ID: 'opencode-session-abc',
    AGENT_WORKSPACE_ROOT: '/home/user/project',
    CUSTOM_VAR: 'hello',
  },
};

export const DEFAULT_ENV: Record<string, string> = {
  PWD: '/home/user/project',
};

export const ENV_WITH_NATIVE_SESSION: Record<string, string> = {
  ...DEFAULT_ENV,
  OPENCODE_SESSION_ID: 'opencode-env-session-789',
};

export const ENV_WITH_EXPLICIT_SESSION: Record<string, string> = {
  ...DEFAULT_ENV,
  AGENT_SESSION_ID: 'explicit-session-456',
  OPENCODE_SESSION_ID: 'opencode-env-session-789',
};

export const ENV_WITH_PERSISTED: Record<string, string> = {
  ...DEFAULT_ENV,
  HOOKS_PROXY_PERSIST_RUN_ID: 'run-789',
  HOOKS_PROXY_MODEL: 'claude-sonnet-4-20250514',
};
