/**
 * Hermes hook event fixtures for testing.
 *
 * Hermes delivers events in the shape `{ event: string, payload: object }`
 * on stdin, with session identity from the HERMES_SESSION env var.
 */

export const ON_EVENT_TOOL_AFTER_PAYLOAD = {
  event: 'tool.completed',
  payload: {
    tool_name: 'bash',
    tool_call_id: 'tc-hermes-001',
    tool_result: { exit_code: 0, stdout: 'Tests passed' },
    cwd: '/home/user/project',
    model: 'claude-sonnet',
  },
};

export const ON_EVENT_MINIMAL_PAYLOAD = {
  event: 'generic',
  payload: {},
};

export const ON_EVENT_NO_PAYLOAD = {
  event: 'generic',
};

export const EMPTY_PAYLOAD = {};

export const MALFORMED_JSON_STRING = '{"event": "test", "payload": {"broken';

export const BASE_ENV: Record<string, string> = {
  HOME: '/home/user',
  PWD: '/home/user/project',
  HERMES_SESSION: 'hermes-sess-abc123',
};

export const ENV_WITHOUT_SESSION: Record<string, string> = {
  HOME: '/home/user',
  PWD: '/home/user/project',
};

export const ENV_WITH_RUN_ID: Record<string, string> = {
  HOME: '/home/user',
  PWD: '/home/user/project',
  HERMES_RUN_ID: 'hermes-run-xyz789',
};
