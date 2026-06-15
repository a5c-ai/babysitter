/**
 * Cursor hook event fixtures for testing.
 *
 * Note: Cursor's payload format is not fully documented.
 * These fixtures represent best-known shapes as of early 2026.
 */

export const SESSION_START_PAYLOAD = {
  cwd: '/home/user/project',
  workspace: '/home/user/project',
  model: 'gpt-4',
  source: 'startup',
};

export const SESSION_START_MINIMAL = {
  cwd: '/home/user/project',
};

export const STOP_PAYLOAD = {
  cwd: '/home/user/project',
  reason: 'task_complete',
  stop_hook_active: false,
};

export const STOP_WITH_HOOK_ACTIVE = {
  cwd: '/home/user/project',
  reason: 'iteration_limit',
  stop_hook_active: true,
};

export const PRE_TOOL_USE_PAYLOAD = {
  cwd: '/home/user/project',
  tool_name: 'bash',
  tool_call_id: 'tc-cursor-001',
  tool_input: { command: 'npm test' },
};

export const POST_TOOL_USE_PAYLOAD = {
  cwd: '/home/user/project',
  tool_name: 'bash',
  tool_call_id: 'tc-cursor-001',
  tool_input: { command: 'npm test' },
  tool_response: { exit_code: 0, stdout: 'Tests passed' },
};

export const EMPTY_PAYLOAD = {};

export const MALFORMED_JSON_STRING = '{"cwd": "/project", "broken';

export const BASE_ENV: Record<string, string> = {
  HOME: '/home/user',
  PWD: '/home/user/project',
};
