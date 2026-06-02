/**
 * Oh-My-Pi extension event fixtures for testing.
 *
 * These represent in-process event contexts from the Pi extension API.
 */

export const SESSION_START_PAYLOAD = {
  sessionId: 'pi-session-abc123',
  cwd: '/home/user/project',
  workspace: '/home/user/project',
  model: 'claude-4',
  source: 'startup',
};

export const SESSION_START_MINIMAL = {
  cwd: '/home/user/project',
};

export const SESSION_END_PAYLOAD = {
  sessionId: 'pi-session-abc123',
  cwd: '/home/user/project',
  reason: 'user_exit',
};

export const PROMPT_PAYLOAD = {
  sessionId: 'pi-session-abc123',
  cwd: '/home/user/project',
  text: 'fix the build',
};

export const TOOL_CALL_PAYLOAD = {
  sessionId: 'pi-session-abc123',
  cwd: '/home/user/project',
  tool_name: 'bash',
  tool_call_id: 'tc-omp-001',
  tool_input: { command: 'npm test' },
};

export const TOOL_RESULT_PAYLOAD = {
  sessionId: 'pi-session-abc123',
  cwd: '/home/user/project',
  tool_name: 'bash',
  tool_call_id: 'tc-omp-001',
  tool_input: { command: 'npm test' },
  tool_result: { exit_code: 0, stdout: 'Tests passed' },
};

export const ERROR_PAYLOAD = {
  sessionId: 'pi-session-abc123',
  cwd: '/home/user/project',
  error: 'Provider timeout',
  code: 'TIMEOUT',
};

export const CONTEXT_PAYLOAD = {
  sessionId: 'pi-session-abc123',
  cwd: '/home/user/project',
};

export const BEFORE_PROVIDER_REQUEST_PAYLOAD = {
  sessionId: 'pi-session-abc123',
  cwd: '/home/user/project',
  model: 'claude-4',
};

export const EMPTY_PAYLOAD = {};

export const MALFORMED_JSON_STRING = '{"sessionId": "abc", "broken';

export const BASE_ENV: Record<string, string> = {
  HOME: '/home/user',
  PWD: '/home/user/project',
};
