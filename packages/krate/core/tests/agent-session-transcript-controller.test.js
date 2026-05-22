import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAgentSessionTranscriptController,
  validateAgentSessionTranscript,
  createResource,
  AGENT_SESSION_TRANSCRIPT_CONTROLLER_BOUNDARY
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Acceptance criteria: Slice 1.2e — Agent Session Transcript Controller
//
// An AgentSessionTranscript provides durable transcript storage linked to a
// session. It supports message storage with role, content, timestamp, and
// tool calls, along with pagination and message indexing by role or tool name.
// ---------------------------------------------------------------------------

function makeTranscript(name, overrides = {}) {
  return createResource('AgentSessionTranscript', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    sessionRef: 'session-abc-123',
    messages: [
      { role: 'user', content: 'Hello, agent!', timestamp: '2026-05-01T10:00:00Z' },
      { role: 'assistant', content: 'Hello! How can I help?', timestamp: '2026-05-01T10:00:01Z' }
    ],
    ...overrides
  });
}

// ---------------------------------------------------------------------------
// 1. Factory and shape
// ---------------------------------------------------------------------------

test('createAgentSessionTranscriptController returns a controller with expected methods', () => {
  const controller = createAgentSessionTranscriptController();
  assert.ok(controller, 'controller must be truthy');
  assert.equal(typeof controller.validate, 'function', 'controller must expose validate');
  assert.equal(typeof controller.getMessages, 'function', 'controller must expose getMessages');
  assert.equal(typeof controller.getTotalMessages, 'function', 'controller must expose getTotalMessages');
  assert.equal(typeof controller.getPage, 'function', 'controller must expose getPage');
  assert.equal(typeof controller.getMessagesByRole, 'function', 'controller must expose getMessagesByRole');
  assert.equal(typeof controller.getMessagesByToolName, 'function', 'controller must expose getMessagesByToolName');
  assert.equal(controller.role, 'agent-session-transcript-controller', 'controller must declare its role');
});

// ---------------------------------------------------------------------------
// 2. validate — happy path
// ---------------------------------------------------------------------------

test('validate accepts a valid transcript with name, sessionRef, and messages', () => {
  const controller = createAgentSessionTranscriptController();
  const transcript = makeTranscript('session-abc-123-transcript');
  const result = controller.validate(transcript);

  assert.equal(result.valid, true, 'valid transcript must pass validation');
  assert.ok(Array.isArray(result.errors), 'result must contain an errors array');
  assert.equal(result.errors.length, 0, 'errors array must be empty for a valid transcript');
});

// ---------------------------------------------------------------------------
// 3. validate — empty messages array is acceptable
// ---------------------------------------------------------------------------

test('validate accepts a transcript with an empty messages array', () => {
  const controller = createAgentSessionTranscriptController();
  const transcript = makeTranscript('empty-transcript', { messages: [] });
  const result = controller.validate(transcript);

  assert.equal(result.valid, true, 'transcript with empty messages must pass validation');
  assert.equal(result.errors.length, 0, 'errors array must be empty');
});

// ---------------------------------------------------------------------------
// 4. validate — missing name
// ---------------------------------------------------------------------------

test('validate rejects transcript with missing name', () => {
  const controller = createAgentSessionTranscriptController();
  const transcript = {
    apiVersion: 'krate.a5c.ai/v1alpha1',
    kind: 'AgentSessionTranscript',
    metadata: { namespace: 'krate-org-default', labels: {}, annotations: {} },
    spec: {
      organizationRef: 'default',
      sessionRef: 'session-abc-123',
      messages: []
    },
    status: {}
  };
  const result = controller.validate(transcript);

  assert.equal(result.valid, false, 'transcript without a name must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /name/i.test(e)),
    'at least one error must mention "name"'
  );
});

// ---------------------------------------------------------------------------
// 5. validate — missing sessionRef
// ---------------------------------------------------------------------------

test('validate rejects transcript with missing sessionRef', () => {
  const controller = createAgentSessionTranscriptController();
  const transcript = makeTranscript('no-session-transcript');
  delete transcript.spec.sessionRef;
  const result = controller.validate(transcript);

  assert.equal(result.valid, false, 'transcript without sessionRef must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /sessionRef/i.test(e)),
    'at least one error must mention "sessionRef"'
  );
});

// ---------------------------------------------------------------------------
// 6. validate — messages not an array
// ---------------------------------------------------------------------------

test('validate rejects transcript where messages is not an array', () => {
  const controller = createAgentSessionTranscriptController();
  const transcript = makeTranscript('bad-messages-transcript');
  transcript.spec.messages = 'not-an-array';
  const result = controller.validate(transcript);

  assert.equal(result.valid, false, 'transcript with non-array messages must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /messages/i.test(e)),
    'at least one error must mention "messages"'
  );
});

// ---------------------------------------------------------------------------
// 7. validate — invalid message role
// ---------------------------------------------------------------------------

test('validate rejects transcript with an invalid message role', () => {
  const controller = createAgentSessionTranscriptController();
  const transcript = makeTranscript('bad-role-transcript', {
    messages: [{ role: 'robot', content: 'I am a robot' }]
  });
  const result = controller.validate(transcript);

  assert.equal(result.valid, false, 'transcript with invalid role must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /role/i.test(e)),
    'at least one error must mention "role"'
  );
});

// ---------------------------------------------------------------------------
// 8. validate — missing message content
// ---------------------------------------------------------------------------

test('validate rejects transcript where a message has no content', () => {
  const controller = createAgentSessionTranscriptController();
  const transcript = makeTranscript('no-content-transcript', {
    messages: [{ role: 'user' }]
  });
  const result = controller.validate(transcript);

  assert.equal(result.valid, false, 'message without content must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /content/i.test(e)),
    'at least one error must mention "content"'
  );
});

// ---------------------------------------------------------------------------
// 9. getMessages — returns all messages in order
// ---------------------------------------------------------------------------

test('getMessages returns all messages in order', () => {
  const controller = createAgentSessionTranscriptController();
  const transcript = makeTranscript('full-transcript');
  const messages = controller.getMessages(transcript);

  assert.ok(Array.isArray(messages), 'getMessages must return an array');
  assert.equal(messages.length, 2, 'must return all messages');
  assert.equal(messages[0].role, 'user', 'first message must be user');
  assert.equal(messages[1].role, 'assistant', 'second message must be assistant');
});

test('getMessages returns empty array when no messages in spec', () => {
  const controller = createAgentSessionTranscriptController();
  const transcript = makeTranscript('empty-transcript', { messages: [] });
  const messages = controller.getMessages(transcript);

  assert.ok(Array.isArray(messages), 'getMessages must return an array');
  assert.equal(messages.length, 0, 'must return empty array');
});

// ---------------------------------------------------------------------------
// 10. getTotalMessages — returns message count
// ---------------------------------------------------------------------------

test('getTotalMessages returns the total number of messages', () => {
  const controller = createAgentSessionTranscriptController();
  const transcript = makeTranscript('count-transcript');
  const total = controller.getTotalMessages(transcript);

  assert.equal(total, 2, 'getTotalMessages must return the correct count');
});

test('getTotalMessages returns 0 for empty transcript', () => {
  const controller = createAgentSessionTranscriptController();
  const transcript = makeTranscript('zero-count-transcript', { messages: [] });
  const total = controller.getTotalMessages(transcript);

  assert.equal(total, 0, 'getTotalMessages must return 0 for empty messages');
});

// ---------------------------------------------------------------------------
// 11. getPage — pagination support
// ---------------------------------------------------------------------------

test('getPage returns first page with correct structure', () => {
  const controller = createAgentSessionTranscriptController();
  const messages = Array.from({ length: 25 }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `Message ${i}`,
    timestamp: `2026-05-01T10:00:${String(i).padStart(2, '0')}Z`
  }));
  const transcript = makeTranscript('paginated-transcript', { messages, pageSize: 10 });
  const page = controller.getPage(transcript, 0);

  assert.ok(page, 'getPage must return a value');
  assert.ok(Array.isArray(page.messages), 'page must have a messages array');
  assert.equal(page.messages.length, 10, 'first page must have 10 messages');
  assert.equal(page.pageIndex, 0, 'pageIndex must be 0 for first page');
  assert.equal(page.pageSize, 10, 'pageSize must be 10');
  assert.equal(page.totalMessages, 25, 'totalMessages must be 25');
  assert.equal(page.totalPages, 3, 'totalPages must be 3');
});

test('getPage returns last page with remaining messages', () => {
  const controller = createAgentSessionTranscriptController();
  const messages = Array.from({ length: 25 }, (_, i) => ({
    role: 'user',
    content: `Message ${i}`
  }));
  const transcript = makeTranscript('paginated-transcript-2', { messages, pageSize: 10 });
  const page = controller.getPage(transcript, 2);

  assert.equal(page.messages.length, 5, 'last page must have remaining 5 messages');
  assert.equal(page.pageIndex, 2, 'pageIndex must be 2');
  assert.equal(page.totalPages, 3, 'totalPages must be 3');
});

test('getPage accepts a pageSizeOverride', () => {
  const controller = createAgentSessionTranscriptController();
  const messages = Array.from({ length: 10 }, (_, i) => ({
    role: 'user', content: `Message ${i}`
  }));
  const transcript = makeTranscript('override-pagesize-transcript', { messages, pageSize: 5 });
  const page = controller.getPage(transcript, 0, 3);

  assert.equal(page.messages.length, 3, 'pageSizeOverride must take precedence');
  assert.equal(page.pageSize, 3, 'returned pageSize must match override');
});

// ---------------------------------------------------------------------------
// 12. getMessagesByRole — role indexing
// ---------------------------------------------------------------------------

test('getMessagesByRole returns only messages with the given role', () => {
  const controller = createAgentSessionTranscriptController();
  const transcript = makeTranscript('role-filter-transcript', {
    messages: [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi!' },
      { role: 'user', content: 'Another user message' },
      { role: 'tool', content: 'Tool output' }
    ]
  });
  const userMessages = controller.getMessagesByRole(transcript, 'user');

  assert.ok(Array.isArray(userMessages), 'getMessagesByRole must return an array');
  assert.equal(userMessages.length, 2, 'must return exactly 2 user messages');
  assert.ok(userMessages.every((m) => m.role === 'user'), 'all returned messages must have role "user"');
});

test('getMessagesByRole returns empty array when no messages match the role', () => {
  const controller = createAgentSessionTranscriptController();
  const transcript = makeTranscript('no-system-transcript', {
    messages: [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi!' }
    ]
  });
  const systemMessages = controller.getMessagesByRole(transcript, 'system');

  assert.ok(Array.isArray(systemMessages), 'getMessagesByRole must return an array');
  assert.equal(systemMessages.length, 0, 'must return empty array when no messages match');
});

// ---------------------------------------------------------------------------
// 13. getMessagesByToolName — tool name indexing
// ---------------------------------------------------------------------------

test('getMessagesByToolName returns messages containing the given tool call', () => {
  const controller = createAgentSessionTranscriptController();
  const transcript = makeTranscript('tool-filter-transcript', {
    messages: [
      { role: 'user', content: 'Hello' },
      {
        role: 'assistant',
        content: 'Using bash tool',
        toolCalls: [{ name: 'bash', input: { command: 'ls' } }]
      },
      {
        role: 'assistant',
        content: 'Using read tool',
        toolCalls: [{ name: 'read', input: { path: '/tmp' } }]
      },
      {
        role: 'assistant',
        content: 'Using bash again',
        toolCalls: [{ name: 'bash', input: { command: 'pwd' } }]
      }
    ]
  });
  const bashMessages = controller.getMessagesByToolName(transcript, 'bash');

  assert.ok(Array.isArray(bashMessages), 'getMessagesByToolName must return an array');
  assert.equal(bashMessages.length, 2, 'must return both messages that used bash');
  assert.ok(
    bashMessages.every((m) => m.toolCalls.some((tc) => tc.name === 'bash')),
    'all returned messages must have a bash toolCall'
  );
});

test('getMessagesByToolName returns empty array when no messages use the tool', () => {
  const controller = createAgentSessionTranscriptController();
  const transcript = makeTranscript('no-tool-transcript');
  const result = controller.getMessagesByToolName(transcript, 'bash');

  assert.ok(Array.isArray(result), 'getMessagesByToolName must return an array');
  assert.equal(result.length, 0, 'must return empty array when no messages use the tool');
});

// ---------------------------------------------------------------------------
// 14. validate — rejects null resource
// ---------------------------------------------------------------------------

test('validate rejects null resource with a clear error', () => {
  const controller = createAgentSessionTranscriptController();
  const result = controller.validate(null);

  assert.equal(result.valid, false, 'null resource must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /null|undefined/i.test(e)),
    'error must mention null or undefined'
  );
});

// ---------------------------------------------------------------------------
// 15. getMessages / getTotalMessages / getPage / getMessagesByRole — throw on null
// ---------------------------------------------------------------------------

test('getMessages throws on null resource', () => {
  const controller = createAgentSessionTranscriptController();
  assert.throws(
    () => controller.getMessages(null),
    /null|undefined/i,
    'getMessages must throw on null resource'
  );
});

test('getTotalMessages throws on null resource', () => {
  const controller = createAgentSessionTranscriptController();
  assert.throws(
    () => controller.getTotalMessages(null),
    /null|undefined/i,
    'getTotalMessages must throw on null resource'
  );
});

test('getPage throws on null resource', () => {
  const controller = createAgentSessionTranscriptController();
  assert.throws(
    () => controller.getPage(null, 0),
    /null|undefined/i,
    'getPage must throw on null resource'
  );
});

test('getMessagesByRole throws on null resource', () => {
  const controller = createAgentSessionTranscriptController();
  assert.throws(
    () => controller.getMessagesByRole(null, 'user'),
    /null|undefined/i,
    'getMessagesByRole must throw on null resource'
  );
});

test('getMessagesByToolName throws on null resource', () => {
  const controller = createAgentSessionTranscriptController();
  assert.throws(
    () => controller.getMessagesByToolName(null, 'bash'),
    /null|undefined/i,
    'getMessagesByToolName must throw on null resource'
  );
});

// ---------------------------------------------------------------------------
// 16. validateAgentSessionTranscript — standalone export follows existing pattern
// ---------------------------------------------------------------------------

test('validateAgentSessionTranscript standalone export follows existing pattern', () => {
  assert.equal(
    typeof validateAgentSessionTranscript,
    'function',
    'validateAgentSessionTranscript must be a named export'
  );

  const transcript = makeTranscript('standalone-validate-transcript');
  const result = validateAgentSessionTranscript(transcript);

  assert.ok(result, 'validateAgentSessionTranscript must return a result');
  assert.ok('valid' in result, 'result must have a valid property');
  assert.ok(Array.isArray(result.errors), 'result must have an errors array');
  assert.equal(result.valid, true, 'a fully-specified transcript must pass standalone validation');
});

// ---------------------------------------------------------------------------
// 17. BOUNDARY — exported with correct role
// ---------------------------------------------------------------------------

test('AGENT_SESSION_TRANSCRIPT_CONTROLLER_BOUNDARY is exported with correct role', () => {
  assert.ok(AGENT_SESSION_TRANSCRIPT_CONTROLLER_BOUNDARY, 'BOUNDARY must be exported');
  assert.equal(
    AGENT_SESSION_TRANSCRIPT_CONTROLLER_BOUNDARY.role,
    'agent-session-transcript-controller',
    'BOUNDARY role must be "agent-session-transcript-controller"'
  );
  assert.ok(
    Array.isArray(AGENT_SESSION_TRANSCRIPT_CONTROLLER_BOUNDARY.owns),
    'BOUNDARY must declare owned concerns'
  );
});

// ---------------------------------------------------------------------------
// 18. getValidRoles — returns all valid roles
// ---------------------------------------------------------------------------

test('getValidRoles returns the list of valid message roles', () => {
  const controller = createAgentSessionTranscriptController();
  const roles = controller.getValidRoles();

  assert.ok(Array.isArray(roles), 'getValidRoles must return an array');
  assert.ok(roles.includes('user'), 'valid roles must include user');
  assert.ok(roles.includes('assistant'), 'valid roles must include assistant');
  assert.ok(roles.includes('tool'), 'valid roles must include tool');
  assert.ok(roles.includes('system'), 'valid roles must include system');
});

// ---------------------------------------------------------------------------
// 19. validate — invalid pageSize
// ---------------------------------------------------------------------------

test('validate rejects transcript with non-positive pageSize', () => {
  const controller = createAgentSessionTranscriptController();
  const transcript = makeTranscript('bad-pagesize-transcript', { pageSize: 0 });
  const result = controller.validate(transcript);

  assert.equal(result.valid, false, 'transcript with pageSize=0 must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /pageSize/i.test(e)),
    'at least one error must mention "pageSize"'
  );
});

// ---------------------------------------------------------------------------
// 20. validate — accepts all valid roles
// ---------------------------------------------------------------------------

test('validate accepts messages with all valid roles', () => {
  const controller = createAgentSessionTranscriptController();
  const transcript = makeTranscript('all-roles-transcript', {
    messages: [
      { role: 'user', content: 'User message' },
      { role: 'assistant', content: 'Assistant message' },
      { role: 'tool', content: 'Tool output' },
      { role: 'system', content: 'System message' }
    ]
  });
  const result = controller.validate(transcript);

  assert.equal(result.valid, true, 'transcript with all valid roles must pass validation');
  assert.equal(result.errors.length, 0, 'errors array must be empty');
});
