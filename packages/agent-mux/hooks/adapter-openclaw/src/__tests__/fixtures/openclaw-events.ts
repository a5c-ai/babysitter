/**
 * OpenClaw hook event fixtures for testing.
 *
 * Covers both plugin hooks (agent-lifecycle) and gateway hooks (infrastructure).
 */

// ---------------------------------------------------------------------------
// Plugin hook payloads
// ---------------------------------------------------------------------------

export const PLUGIN_SESSION_START = {
  sessionId: 'oc-sess-abc123',
  workspace: '/home/user/project',
  model: 'gpt-4o',
  source: 'startup',
  initialPrompt: 'Help me build a REST API',
  pluginId: 'my-plugin',
  timestamp: '2026-04-17T10:00:00Z',
};

export const PLUGIN_SESSION_END = {
  sessionId: 'oc-sess-abc123',
  workspace: '/home/user/project',
  pluginId: 'my-plugin',
  timestamp: '2026-04-17T10:30:00Z',
};

export const PLUGIN_TOOL_BEFORE = {
  sessionId: 'oc-sess-abc123',
  workspace: '/home/user/project',
  model: 'gpt-4o',
  toolName: 'execute_bash',
  toolCallId: 'tc-001',
  toolInput: { command: 'npm test' },
  pluginId: 'my-plugin',
};

export const PLUGIN_TOOL_AFTER = {
  sessionId: 'oc-sess-abc123',
  workspace: '/home/user/project',
  model: 'gpt-4o',
  toolName: 'execute_bash',
  toolCallId: 'tc-001',
  toolInput: { command: 'npm test' },
  toolResponse: 'All 15 tests passed.',
  pluginId: 'my-plugin',
};

export const PLUGIN_TURN_STOP = {
  sessionId: 'oc-sess-abc123',
  workspace: '/home/user/project',
  model: 'gpt-4o',
  reason: 'end_turn',
  lastMessage: 'I have completed the API implementation.',
  pluginId: 'my-plugin',
};

export const PLUGIN_PROMPT_SUBMITTED = {
  sessionId: 'oc-sess-abc123',
  workspace: '/home/user/project',
  model: 'gpt-4o',
  prompt: 'Now add authentication middleware',
  pluginId: 'my-plugin',
};

// ---------------------------------------------------------------------------
// Gateway hook payloads
// ---------------------------------------------------------------------------

export const GATEWAY_REQUEST_RECEIVED = {
  correlationId: 'gw-corr-xyz789',
  requestId: 'req-001',
  route: '/api/v1/chat',
  method: 'POST',
  timestamp: '2026-04-17T10:00:00Z',
};

export const GATEWAY_REQUEST_ROUTED = {
  correlationId: 'gw-corr-xyz789',
  requestId: 'req-001',
  route: '/api/v1/chat',
  timestamp: '2026-04-17T10:00:01Z',
};

export const GATEWAY_REQUEST_COMPLETED = {
  correlationId: 'gw-corr-xyz789',
  requestId: 'req-001',
  statusCode: 200,
  timestamp: '2026-04-17T10:00:05Z',
};

export const GATEWAY_AUTH_CHECK = {
  correlationId: 'gw-corr-xyz789',
  requestId: 'req-002',
  authResult: 'passed',
  timestamp: '2026-04-17T10:00:00Z',
};
