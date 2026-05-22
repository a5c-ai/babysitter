/**
 * Real Claude Code hook payload fixtures for each event type.
 *
 * These represent the stdin JSON that Claude Code passes to hook subprocesses.
 * Claude does not include the native hook event name in this payload; callers
 * must pass it separately (for example via `invoke --native-event <ClaudeHook>`).
 */

export const SESSION_START_STARTUP = {
  session_id: 'sess_abc123def456',
  session_type: 'interactive',
  cwd: '/home/user/project',
  transcript_path: '/home/user/.claude/transcripts/sess_abc123def456.jsonl',
  model: 'claude-sonnet-4-20250514',
  permission_mode: 'default',
  source: 'startup',
  initial_prompt: 'Help me refactor the auth module',
};

export const SESSION_START_RESUME = {
  session_id: 'sess_abc123def456',
  session_type: 'interactive',
  cwd: '/home/user/project',
  transcript_path: '/home/user/.claude/transcripts/sess_abc123def456.jsonl',
  model: 'claude-sonnet-4-20250514',
  permission_mode: 'default',
  source: 'resume',
};

export const SESSION_START_COMPACT = {
  session_id: 'sess_abc123def456',
  session_type: 'interactive',
  cwd: '/home/user/project',
  model: 'claude-sonnet-4-20250514',
  source: 'compact',
};

export const SESSION_START_CLEAR = {
  session_id: 'sess_abc123def456',
  session_type: 'interactive',
  cwd: '/home/user/project',
  model: 'claude-sonnet-4-20250514',
  source: 'clear',
};

export const PRE_TOOL_USE_BASH = {
  session_id: 'sess_abc123def456',
  session_type: 'interactive',
  cwd: '/home/user/project',
  model: 'claude-sonnet-4-20250514',
  tool_name: 'Bash',
  tool_call_id: 'tc_001',
  tool_input: {
    command: 'npm test',
    description: 'Run tests',
  },
};

export const PRE_TOOL_USE_EDIT = {
  session_id: 'sess_abc123def456',
  session_type: 'interactive',
  cwd: '/home/user/project',
  model: 'claude-sonnet-4-20250514',
  tool_name: 'Edit',
  tool_call_id: 'tc_002',
  tool_input: {
    file_path: '/home/user/project/src/auth.ts',
    old_string: 'function login() {',
    new_string: 'async function login() {',
  },
};

export const POST_TOOL_USE_BASH = {
  session_id: 'sess_abc123def456',
  session_type: 'interactive',
  cwd: '/home/user/project',
  model: 'claude-sonnet-4-20250514',
  tool_name: 'Bash',
  tool_call_id: 'tc_001',
  tool_input: {
    command: 'npm test',
  },
  tool_response: 'All 42 tests passed.',
};

export const POST_TOOL_USE_EDIT = {
  session_id: 'sess_abc123def456',
  session_type: 'interactive',
  cwd: '/home/user/project',
  model: 'claude-sonnet-4-20250514',
  tool_name: 'Edit',
  tool_call_id: 'tc_002',
  tool_input: {
    file_path: '/home/user/project/src/auth.ts',
    old_string: 'function login() {',
    new_string: 'async function login() {',
  },
  tool_response: 'File edited successfully.',
};

export const STOP_END_TURN = {
  session_id: 'sess_abc123def456',
  session_type: 'interactive',
  cwd: '/home/user/project',
  model: 'claude-sonnet-4-20250514',
  reason: 'end_turn',
  last_assistant_message: 'I have completed the refactoring.',
  stop_hook_active: false,
};

export const STOP_RECURSIVE_GUARD = {
  session_id: 'sess_abc123def456',
  session_type: 'interactive',
  cwd: '/home/user/project',
  model: 'claude-sonnet-4-20250514',
  reason: 'end_turn',
  last_assistant_message: 'Done.',
  stop_hook_active: true,
};

export const USER_PROMPT_SUBMIT = {
  session_id: 'sess_abc123def456',
  session_type: 'interactive',
  cwd: '/home/user/project',
  model: 'claude-sonnet-4-20250514',
  prompt: 'Now add tests for the auth module',
};

export const SUBAGENT_STOP = {
  session_id: 'sess_abc123def456',
  session_type: 'interactive',
  cwd: '/home/user/project',
  model: 'claude-sonnet-4-20250514',
  agent_type: 'code-reviewer',
  reason: 'end_turn',
  last_assistant_message: 'Review complete. No issues found.',
};

export const NOTIFICATION = {
  session_id: 'sess_abc123def456',
  session_type: 'interactive',
  cwd: '/home/user/project',
  title: 'Build Complete',
  message: 'The build completed successfully in 12.3s.',
};

export const PRE_COMPACT = {
  session_id: 'sess_abc123def456',
  session_type: 'interactive',
  cwd: '/home/user/project',
  model: 'claude-sonnet-4-20250514',
};

export const SESSION_END = {
  session_id: 'sess_abc123def456',
  session_type: 'interactive',
  cwd: '/home/user/project',
};
