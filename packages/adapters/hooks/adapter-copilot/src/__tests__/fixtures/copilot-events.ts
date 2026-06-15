import type { CopilotRawInput } from '../../normalizer';

/**
 * Fixture: sessionStart event from Copilot CLI.
 */
export const SESSION_START: CopilotRawInput = {
  event: 'sessionStart',
  cwd: '/home/user/project',
  workspace: '/home/user/project',
};

/**
 * Fixture: sessionEnd event.
 */
export const SESSION_END: CopilotRawInput = {
  event: 'sessionEnd',
  cwd: '/home/user/project',
  workspace: '/home/user/project',
};

/**
 * Fixture: userPromptSubmitted event.
 */
export const USER_PROMPT_SUBMITTED: CopilotRawInput = {
  event: 'userPromptSubmitted',
  cwd: '/home/user/project',
  workspace: '/home/user/project',
  prompt: 'Fix the login bug in auth.ts',
};

/**
 * Fixture: preToolUse event.
 */
export const PRE_TOOL_USE: CopilotRawInput = {
  event: 'preToolUse',
  cwd: '/home/user/project',
  workspace: '/home/user/project',
  toolName: 'bash',
  toolCallId: 'call-abc-123',
  toolInput: {
    command: 'rm -rf /',
  },
};

/**
 * Fixture: postToolUse event.
 */
export const POST_TOOL_USE: CopilotRawInput = {
  event: 'postToolUse',
  cwd: '/home/user/project',
  workspace: '/home/user/project',
  toolName: 'bash',
  toolCallId: 'call-abc-123',
  toolResponse: {
    stdout: 'Permission denied',
    exitCode: 1,
  },
};

/**
 * Fixture: error event.
 */
export const ERROR_EVENT: CopilotRawInput = {
  event: 'errorOccurred',
  cwd: '/home/user/project',
  workspace: '/home/user/project',
  error: 'Connection timeout to model endpoint',
};

/**
 * Fixture: preToolUse with Windows-style paths.
 */
export const PRE_TOOL_USE_WINDOWS: CopilotRawInput = {
  event: 'preToolUse',
  cwd: 'C:\\Users\\dev\\project',
  workspace: 'C:\\Users\\dev\\project',
  toolName: 'write_file',
  toolCallId: 'call-def-456',
  toolInput: {
    path: 'C:\\Users\\dev\\project\\src\\index.ts',
    content: 'console.log("hello")',
  },
};
