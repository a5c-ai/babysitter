import assert from 'node:assert/strict';
import test from 'node:test';
import { createMcpServer, MCP_TOOLS } from '../src/mcp-server.js';

const meetings = [];

function createMockController() {
  return {
    async listResourceForOrg(org, kind) {
      if (kind === 'JitsiMeeting') {
        return { items: meetings.filter((meeting) => meeting.spec?.organizationRef === org || meeting.metadata?.namespace === `krate-org-${org}`) };
      }
      return { items: [] };
    },
    async listResource(kind) {
      if (kind === 'JitsiMeeting') return { items: meetings };
      return { items: [] };
    },
    async getResourceForOrg(org, kind, name) {
      const found = meetings.find((meeting) => meeting.kind === kind && meeting.metadata.name === name && (meeting.spec?.organizationRef === org || meeting.metadata?.namespace === `krate-org-${org}`));
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

test('MCP_TOOLS includes the four Jitsi meeting tools with required schemas', () => {
  assert.equal(MCP_TOOLS.length, 23);
  const byName = new Map(MCP_TOOLS.map((tool) => [tool.name, tool]));
  for (const name of ['krate_create_meeting', 'krate_join_meeting', 'krate_list_meetings', 'krate_invite_to_meeting']) {
    assert.ok(byName.has(name), `${name} must be registered`);
    assert.equal(byName.get(name).inputSchema.type, 'object');
  }
  assert.deepEqual(byName.get('krate_create_meeting').inputSchema.required, ['displayName']);
  assert.deepEqual(byName.get('krate_join_meeting').inputSchema.required, ['meetingRef']);
  assert.deepEqual(byName.get('krate_invite_to_meeting').inputSchema.required, ['meetingRef', 'participantType', 'participantRef']);
});

test('krate_create_meeting creates an org-scoped JitsiMeeting resource', async () => {
  meetings.length = 0;
  const server = createMcpServer({ controller: createMockController() });
  const result = parseToolResult(await server.handleMessage(rpc('tools/call', {
    name: 'krate_create_meeting',
    arguments: { org: 'default', displayName: 'Daily Standup', ttlMinutes: 30, inviteAgentStacks: ['standup-bot'] },
  })));

  assert.equal(result.operation, 'apply');
  assert.equal(result.resource.kind, 'JitsiMeeting');
  assert.equal(result.resource.metadata.namespace, 'krate-org-default');
  assert.equal(result.resource.spec.organizationRef, 'default');
  assert.equal(result.resource.spec.displayName, 'Daily Standup');
  assert.equal(result.resource.spec.ttlMinutes, 30);
  assert.deepEqual(result.resource.spec.participants.invited[0], { type: 'agentStack', ref: 'standup-bot', role: 'observer' });
});

test('krate_list_meetings filters active and recent Jitsi meetings', async () => {
  meetings.length = 0;
  meetings.push(
    { kind: 'JitsiMeeting', metadata: { name: 'active', namespace: 'krate-org-default' }, spec: { organizationRef: 'default' }, status: { phase: 'Active' } },
    { kind: 'JitsiMeeting', metadata: { name: 'ended', namespace: 'krate-org-default' }, spec: { organizationRef: 'default' }, status: { phase: 'Ended' } },
    { kind: 'JitsiMeeting', metadata: { name: 'other', namespace: 'krate-org-other' }, spec: { organizationRef: 'other' }, status: { phase: 'Active' } },
  );
  const server = createMcpServer({ controller: createMockController() });
  const result = parseToolResult(await server.handleMessage(rpc('tools/call', {
    name: 'krate_list_meetings',
    arguments: { org: 'default', status: 'active' },
  })));

  assert.deepEqual(result.items.map((meeting) => meeting.metadata.name), ['active']);
});

test('krate_join_meeting returns a short-lived join payload for an active meeting', async () => {
  meetings.length = 0;
  meetings.push({
    kind: 'JitsiMeeting',
    metadata: { name: 'active', namespace: 'krate-org-default' },
    spec: { organizationRef: 'default', roomId: 'daily-room', providerRef: 'jitsi-prod', ttlMinutes: 30 },
    status: { phase: 'Active', roomUrl: 'https://meet.krate.local/daily-room' },
  });
  const server = createMcpServer({ controller: createMockController() });
  const result = parseToolResult(await server.handleMessage(rpc('tools/call', {
    name: 'krate_join_meeting',
    arguments: { org: 'default', meetingRef: 'active', participantName: 'Alice' },
  })));

  assert.equal(result.meetingRef, 'active');
  assert.equal(result.org, 'default');
  assert.equal(result.roomUrl, 'https://meet.krate.local/daily-room');
  assert.equal(result.expiresInSeconds <= 3600, true);
  assert.match(result.jwt, /^krate-jitsi\./);
});

test('krate_invite_to_meeting appends participant invites through resource apply', async () => {
  meetings.length = 0;
  meetings.push({
    kind: 'JitsiMeeting',
    metadata: { name: 'active', namespace: 'krate-org-default' },
    spec: { organizationRef: 'default', roomId: 'daily-room', providerRef: 'jitsi-prod', participants: { invited: [] } },
    status: { phase: 'Active' },
  });
  const server = createMcpServer({ controller: createMockController() });
  const result = parseToolResult(await server.handleMessage(rpc('tools/call', {
    name: 'krate_invite_to_meeting',
    arguments: { org: 'default', meetingRef: 'active', participantType: 'user', participantRef: 'alice' },
  })));

  assert.equal(result.operation, 'apply');
  assert.deepEqual(result.resource.spec.participants.invited, [{ type: 'user', ref: 'alice', role: 'participant' }]);
});
