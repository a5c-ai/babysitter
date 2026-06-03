import assert from 'node:assert/strict';
import test from 'node:test';
import { createMcpServer, MCP_TOOLS } from '../src/mcp-server.js';

const meetings = [];

function createMockController() {
  return {
    async listResourceForOrg(org, kind) {
      if (kind === 'JitsiMeeting') {
        return { items: meetings.filter((meeting) => meeting.spec?.organizationRef === org || meeting.metadata?.namespace === `kradle-org-${org}`) };
      }
      return { items: [] };
    },
    async listResource(kind) {
      if (kind === 'JitsiMeeting') return { items: meetings };
      return { items: [] };
    },
    async getResourceForOrg(org, kind, name) {
      const found = meetings.find((meeting) => meeting.kind === kind && meeting.metadata.name === name && (meeting.spec?.organizationRef === org || meeting.metadata?.namespace === `kradle-org-${org}`));
      if (!found) throw new Error(`${kind}/${name} not found in ${org}`);
      return { resource: found };
    },
    async getResource(kind, name) {
      const found = meetings.find((meeting) => meeting.kind === kind && meeting.metadata.name === name);
      if (!found) throw new Error(`${kind}/${name} not found`);
      return { resource: found };
    },
    async applyResourceForOrg(org, resource) {
      assert.equal(resource.spec.organizationRef, org);
      meetings.push(resource);
      return { operation: 'apply', resource };
    },
    async applyResource(resource) {
      meetings.push(resource);
      return { operation: 'apply', resource };
    },
  };
}

function rpc(method, params = {}, id = 1) {
  return { jsonrpc: '2.0', id, method, params };
}

function parseToolResult(resp) {
  assert.ok(resp.result, JSON.stringify(resp));
  return JSON.parse(resp.result.content[0].text);
}

test('MCP_TOOLS includes Jitsi meeting management and in-meeting tools with required schemas', () => {
  assert.equal(MCP_TOOLS.length, 33);
  const byName = new Map(MCP_TOOLS.map((tool) => [tool.name, tool]));
  for (const name of [
    'kradle_create_meeting',
    'kradle_join_meeting',
    'kradle_list_meetings',
    'kradle_invite_to_meeting',
    'kradle_send_chat_message',
    'kradle_get_meeting_transcript',
    'kradle_get_participant_list',
    'kradle_raise_hand',
    'kradle_share_screen',
    'kradle_start_recording',
    'kradle_react',
  ]) {
    assert.ok(byName.has(name), `${name} must be registered`);
    assert.equal(byName.get(name).inputSchema.type, 'object');
  }
  assert.deepEqual(byName.get('kradle_create_meeting').inputSchema.required, ['displayName']);
  assert.deepEqual(byName.get('kradle_join_meeting').inputSchema.required, ['meetingRef']);
  assert.deepEqual(byName.get('kradle_invite_to_meeting').inputSchema.required, ['meetingRef', 'participantType', 'participantRef']);
  assert.deepEqual(byName.get('kradle_send_chat_message').inputSchema.required, ['text']);
  assert.deepEqual(byName.get('kradle_share_screen').inputSchema.required, ['url']);
  assert.deepEqual(byName.get('kradle_react').inputSchema.required, ['emoji']);
});

test('kradle_create_meeting creates an org-scoped JitsiMeeting resource', async () => {
  meetings.length = 0;
  const server = createMcpServer({ controller: createMockController() });
  const result = parseToolResult(await server.handleMessage(rpc('tools/call', {
    name: 'kradle_create_meeting',
    arguments: { org: 'default', displayName: 'Daily Standup', ttlMinutes: 30, inviteAgentStacks: ['standup-bot'] },
  })));

  assert.equal(result.operation, 'apply');
  assert.equal(result.resource.kind, 'JitsiMeeting');
  assert.equal(result.resource.metadata.namespace, 'kradle-org-default');
  assert.equal(result.resource.spec.organizationRef, 'default');
  assert.equal(result.resource.spec.displayName, 'Daily Standup');
  assert.equal(result.resource.spec.ttlMinutes, 30);
  assert.deepEqual(result.resource.spec.participants.invited[0], { type: 'agentStack', ref: 'standup-bot', role: 'observer' });
});

test('kradle_list_meetings filters active and recent Jitsi meetings', async () => {
  meetings.length = 0;
  meetings.push(
    { kind: 'JitsiMeeting', metadata: { name: 'active', namespace: 'kradle-org-default' }, spec: { organizationRef: 'default' }, status: { phase: 'Active' } },
    { kind: 'JitsiMeeting', metadata: { name: 'ended', namespace: 'kradle-org-default' }, spec: { organizationRef: 'default' }, status: { phase: 'Ended' } },
    { kind: 'JitsiMeeting', metadata: { name: 'other', namespace: 'kradle-org-other' }, spec: { organizationRef: 'other' }, status: { phase: 'Active' } },
  );
  const server = createMcpServer({ controller: createMockController() });
  const result = parseToolResult(await server.handleMessage(rpc('tools/call', {
    name: 'kradle_list_meetings',
    arguments: { org: 'default', status: 'active' },
  })));

  assert.deepEqual(result.items.map((meeting) => meeting.metadata.name), ['active']);
});

test('kradle_join_meeting returns a short-lived join payload for an active meeting', async () => {
  meetings.length = 0;
  meetings.push({
    kind: 'JitsiMeeting',
    metadata: { name: 'active', namespace: 'kradle-org-default' },
    spec: { organizationRef: 'default', roomId: 'daily-room', providerRef: 'jitsi-prod', ttlMinutes: 30 },
    status: { phase: 'Active', roomUrl: 'https://meet.kradle.local/daily-room' },
  });
  const server = createMcpServer({ controller: createMockController() });
  const result = parseToolResult(await server.handleMessage(rpc('tools/call', {
    name: 'kradle_join_meeting',
    arguments: { org: 'default', meetingRef: 'active', participantName: 'Alice' },
  })));

  assert.equal(result.meetingRef, 'active');
  assert.equal(result.org, 'default');
  assert.equal(result.roomUrl, 'https://meet.kradle.local/daily-room');
  assert.equal(result.expiresInSeconds <= 3600, true);
  assert.match(result.jwt, /^kradle-jitsi\./);
});

test('kradle_invite_to_meeting appends participant invites through resource apply', async () => {
  meetings.length = 0;
  meetings.push({
    kind: 'JitsiMeeting',
    metadata: { name: 'active', namespace: 'kradle-org-default' },
    spec: { organizationRef: 'default', roomId: 'daily-room', providerRef: 'jitsi-prod', participants: { invited: [] } },
    status: { phase: 'Active' },
  });
  const server = createMcpServer({ controller: createMockController() });
  const result = parseToolResult(await server.handleMessage(rpc('tools/call', {
    name: 'kradle_invite_to_meeting',
    arguments: { org: 'default', meetingRef: 'active', participantType: 'user', participantRef: 'alice' },
  })));

  assert.equal(result.operation, 'apply');
  assert.deepEqual(result.resource.spec.participants.invited, [{ type: 'user', ref: 'alice', role: 'participant' }]);
});

test('in-meeting MCP tools return sidecar socket commands and enforce role/capability gates', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const meetingContext = {
    roomId: 'daily-room',
    role: 'participant',
    capabilities: { chat: 'readwrite', audio: 'listen', screenshare: 'share' },
  };

  const chat = parseToolResult(await server.handleMessage(rpc('tools/call', {
    name: 'kradle_send_chat_message',
    arguments: { text: 'hello', meetingContext },
  })));
  assert.equal(chat.socketPath, '/tmp/jitsi-agent.sock');
  assert.deepEqual(chat.command, { action: 'send_chat', text: 'hello' });

  const hand = parseToolResult(await server.handleMessage(rpc('tools/call', {
    name: 'kradle_raise_hand',
    arguments: { meetingContext },
  })));
  assert.equal(hand.command.action, 'raise_hand');

  const denied = await server.handleMessage(rpc('tools/call', {
    name: 'kradle_start_recording',
    arguments: { meetingContext },
  }));
  assert.equal(denied.result.isError, true);
  assert.match(JSON.parse(denied.result.content[0].text).error, /cannot perform start_recording/);
});
