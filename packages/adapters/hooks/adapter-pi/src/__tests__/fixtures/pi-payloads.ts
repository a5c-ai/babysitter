/**
 * Pi hook payload fixtures for each event type.
 *
 * These represent the in-process event objects that Pi passes to extension hooks.
 * Unlike Claude's stdin JSON, these are native JavaScript objects.
 */

export const SESSION_START = {
  sessionId: 'pi_sess_abc123',
  cwd: '/home/user/project',
  model: 'claude-sonnet-4-20250514',
  initialPrompt: 'Help me refactor the auth module',
};

export const SESSION_START_MINIMAL = {
  sessionId: 'pi_sess_def456',
};

export const TOOL_CALL_BASH = {
  sessionId: 'pi_sess_abc123',
  cwd: '/home/user/project',
  model: 'claude-sonnet-4-20250514',
  toolName: 'Bash',
  toolCallId: 'tc_pi_001',
  toolInput: {
    command: 'npm test',
    description: 'Run tests',
  },
};

export const TOOL_CALL_EDIT = {
  sessionId: 'pi_sess_abc123',
  cwd: '/home/user/project',
  model: 'claude-sonnet-4-20250514',
  toolName: 'Edit',
  toolCallId: 'tc_pi_002',
  toolInput: {
    file_path: '/home/user/project/src/auth.ts',
    old_string: 'function login() {',
    new_string: 'async function login() {',
  },
};

export const CONTEXT = {
  sessionId: 'pi_sess_abc123',
  cwd: '/home/user/project',
  contextContent: 'The project uses TypeScript with strict mode enabled.',
};

export const BEFORE_PROVIDER_REQUEST = {
  sessionId: 'pi_sess_abc123',
  cwd: '/home/user/project',
  model: 'claude-sonnet-4-20250514',
  messages: [
    { role: 'user', content: 'Help me refactor the auth module' },
  ],
  providerConfig: {
    maxTokens: 4096,
    temperature: 0,
  },
};
