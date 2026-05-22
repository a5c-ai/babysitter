/**
 * Codex hook event fixtures for testing.
 */

export const SESSION_START_PAYLOAD = {
  session_id: 'codex-sess-abc123',
  cwd: '/home/user/project',
  model: 'o3',
  source: 'startup',
};

export const SESSION_START_MINIMAL = {
  session_id: 'codex-sess-minimal',
};

export const USER_PROMPT_PAYLOAD = {
  session_id: 'codex-sess-abc123',
  prompt: 'Fix the bug in auth module',
  cwd: '/home/user/project',
};

export const SESSION_END_PAYLOAD = {
  session_id: 'codex-sess-abc123',
  reason: 'task_complete',
  summary: 'Session completed successfully',
};

export const STOP_PAYLOAD = {
  session_id: 'codex-sess-abc123',
  reason: 'task_complete',
  stop_hook_active: false,
};

export const STOP_WITH_HOOK_ACTIVE = {
  session_id: 'codex-sess-abc123',
  reason: 'iteration_limit',
  stop_hook_active: true,
};

export const TOOL_BEFORE_PAYLOAD = {
  session_id: 'codex-sess-abc123',
  tool_name: 'bash',
  tool_call_id: 'tc-001',
  tool_input: { command: 'npm test' },
};

export const TOOL_AFTER_PAYLOAD = {
  session_id: 'codex-sess-abc123',
  tool_name: 'bash',
  tool_call_id: 'tc-001',
  tool_output: { exit_code: 0, stdout: 'Tests passed' },
};

export const EMPTY_PAYLOAD = {};

export const MALFORMED_JSON_STRING = '{"session_id": "abc", "broken';

export const BASE_ENV: Record<string, string> = {
  HOME: '/home/user',
  PWD: '/home/user/project',
};
