import assert from 'node:assert/strict';
import test from 'node:test';
import { createMcpServer, MCP_TOOLS } from '../src/mcp-server.js';

// ---------------------------------------------------------------------------
// Mock controller — returns canned data without kubectl / Kubernetes
// ---------------------------------------------------------------------------
function createMockController() {
  const repositories = [
    { kind: 'Repository', metadata: { name: 'web-app', namespace: 'krate-org-default' }, spec: { organizationRef: 'default', visibility: 'internal' } },
    { kind: 'Repository', metadata: { name: 'api-service', namespace: 'krate-org-default' }, spec: { organizationRef: 'default', visibility: 'private' } },
  ];
  const stacks = [
    { kind: 'AgentStack', metadata: { name: 'review-bot', namespace: 'krate-org-default' }, spec: { organizationRef: 'default', baseAgent: 'claude-code' } },
  ];

  return {
    role: 'mock-krate-api-controller',
    namespace: 'krate-org-default',

    async snapshot() {
      return {
        namespace: 'krate-org-default',
        resources: {
          Repository: repositories,
          AgentStack: stacks,
        },
      };
    },

    async listResource(kind) {
      if (kind === 'Repository') return { items: repositories };
      if (kind === 'AgentStack') return { items: stacks };
      if (kind === 'KrateVirtualModel') return { items: [] };
      return { items: [] };
    },

    async getResource(kind, name) {
      const all = kind === 'Repository' ? repositories : kind === 'AgentStack' ? stacks : [];
      const found = all.find((r) => r.metadata.name === name);
      return found ? { resource: found } : { error: 'not_found' };
    },

    async applyResource(resource) {
      return { operation: 'apply', resource };
    },

    async deleteResource(kind, name) {
      return { operation: 'delete', kind, name };
    },

    async dispatchAgent(input) {
      return { dispatched: true, stackRef: input.agentStack, input };
    },

    async syncExternalBinding(bindingName, options) {
      return { bindingName, resource: { kind: options.kind, localName: options.localName }, synced: true };
    },

    async resolveExternalConflict(opts) {
      return { conflictName: opts.conflictName, strategy: opts.strategy, resolved: true };
    },

    async listModelCatalog() {
      return { models: [] };
    },
  };
}

// ---------------------------------------------------------------------------
// Helper to build a JSON-RPC 2.0 request
// ---------------------------------------------------------------------------
function rpc(method, params = {}, id = 1) {
  return { jsonrpc: '2.0', id, method, params };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('MCP_TOOLS array has 23 entries', () => {
  assert.equal(MCP_TOOLS.length, 23);
  const names = MCP_TOOLS.map((t) => t.name);
  assert.ok(names.includes('krate_list_resources'));
  assert.ok(names.includes('krate_get_resource'));
  assert.ok(names.includes('krate_apply_resource'));
  assert.ok(names.includes('krate_delete_resource'));
  assert.ok(names.includes('krate_snapshot'));
  assert.ok(names.includes('krate_search'));
  assert.ok(names.includes('krate_list_stacks'));
  assert.ok(names.includes('krate_dispatch_agent'));
  assert.ok(names.includes('krate_list_secrets'));
  assert.ok(names.includes('krate_create_secret'));
  assert.ok(names.includes('krate_create_stack'));
  assert.ok(names.includes('krate_sync_external'));
  assert.ok(names.includes('krate_resolve_conflict'));
  assert.ok(names.includes('krate_audit_query'));
  assert.ok(names.includes('krate_list_virtual_models'));
  assert.ok(names.includes('krate_create_virtual_model'));
  assert.ok(names.includes('krate_create_meeting'));
  assert.ok(names.includes('krate_join_meeting'));
  assert.ok(names.includes('krate_list_meetings'));
  assert.ok(names.includes('krate_invite_to_meeting'));
});

test('createMcpServer returns object with start, stop, handleMessage', () => {
  const server = createMcpServer({ controller: createMockController() });
  assert.equal(typeof server.start, 'function');
  assert.equal(typeof server.stop, 'function');
  assert.equal(typeof server.handleMessage, 'function');
});

test('handleMessage initialize returns capabilities with tools', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('initialize'));
  assert.equal(resp.jsonrpc, '2.0');
  assert.equal(resp.id, 1);
  assert.ok(resp.result);
  assert.equal(resp.result.serverInfo.name, 'krate');
  assert.ok(resp.result.capabilities.tools);
  assert.equal(resp.result.protocolVersion, '2024-11-05');
});

test('handleMessage tools/list returns all 23 tool definitions', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/list'));
  assert.equal(resp.result.tools.length, 23);
  for (const tool of resp.result.tools) {
    assert.ok(tool.name, 'each tool has a name');
    assert.ok(tool.description, 'each tool has a description');
    assert.ok(tool.inputSchema, 'each tool has an inputSchema');
  }
});

test('handleMessage tools/call krate_snapshot returns a result', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/call', { name: 'krate_snapshot', arguments: {} }));
  assert.ok(resp.result);
  assert.ok(resp.result.content);
  assert.equal(resp.result.content[0].type, 'text');
  const parsed = JSON.parse(resp.result.content[0].text);
  assert.ok(parsed.resources);
  assert.ok(parsed.resources.Repository);
});

test('handleMessage tools/call krate_list_resources with kind Repository', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/call', { name: 'krate_list_resources', arguments: { kind: 'Repository' } }));
  assert.ok(resp.result);
  const parsed = JSON.parse(resp.result.content[0].text);
  assert.ok(parsed.items);
  assert.equal(parsed.items.length, 2);
});

test('handleMessage tools/call krate_get_resource', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/call', { name: 'krate_get_resource', arguments: { kind: 'Repository', name: 'web-app' } }));
  const parsed = JSON.parse(resp.result.content[0].text);
  assert.equal(parsed.resource.metadata.name, 'web-app');
});

test('handleMessage tools/call krate_apply_resource', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resource = { kind: 'Repository', metadata: { name: 'new-repo' }, spec: {} };
  const resp = await server.handleMessage(rpc('tools/call', { name: 'krate_apply_resource', arguments: { resource } }));
  const parsed = JSON.parse(resp.result.content[0].text);
  assert.equal(parsed.operation, 'apply');
  assert.equal(parsed.resource.metadata.name, 'new-repo');
});

test('handleMessage tools/call krate_delete_resource', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/call', { name: 'krate_delete_resource', arguments: { kind: 'Repository', name: 'web-app' } }));
  const parsed = JSON.parse(resp.result.content[0].text);
  assert.equal(parsed.operation, 'delete');
  assert.equal(parsed.name, 'web-app');
});

test('handleMessage tools/call krate_search returns matching resources', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/call', { name: 'krate_search', arguments: { query: 'web' } }));
  const parsed = JSON.parse(resp.result.content[0].text);
  assert.equal(parsed.query, 'web');
  assert.ok(parsed.matches.length >= 1);
  assert.ok(parsed.matches.some((m) => m.name === 'web-app'));
});

test('handleMessage tools/call krate_list_stacks', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/call', { name: 'krate_list_stacks', arguments: {} }));
  const parsed = JSON.parse(resp.result.content[0].text);
  assert.ok(parsed.items);
  assert.equal(parsed.items.length, 1);
  assert.equal(parsed.items[0].metadata.name, 'review-bot');
});

test('handleMessage tools/call krate_dispatch_agent', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/call', { name: 'krate_dispatch_agent', arguments: { stackRef: 'review-bot', input: { repository: 'web-app' } } }));
  const parsed = JSON.parse(resp.result.content[0].text);
  assert.ok(parsed.dispatched);
  assert.equal(parsed.stackRef, 'review-bot');
});

test('handleMessage with unknown method returns error', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('nonexistent/method'));
  assert.ok(resp.error);
  assert.equal(resp.error.code, -32601);
  assert.ok(resp.error.message.includes('nonexistent/method'));
});

test('handleMessage with unknown tool returns error', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/call', { name: 'krate_nonexistent', arguments: {} }));
  assert.ok(resp.error);
  assert.equal(resp.error.code, -32602);
  assert.ok(resp.error.message.includes('krate_nonexistent'));
});

test('handleMessage notifications/initialized returns null (no response)', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('notifications/initialized'));
  assert.equal(resp, null);
});

// ---------------------------------------------------------------------------
// New tool tests
// ---------------------------------------------------------------------------

test('handleMessage tools/call krate_list_secrets returns items', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/call', { name: 'krate_list_secrets', arguments: {} }));
  assert.ok(resp.result);
  const parsed = JSON.parse(resp.result.content[0].text);
  assert.ok(Array.isArray(parsed.items));
});

test('handleMessage tools/call krate_list_secrets with org filters by namespace', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/call', { name: 'krate_list_secrets', arguments: { org: 'default' } }));
  assert.ok(resp.result);
  const parsed = JSON.parse(resp.result.content[0].text);
  assert.ok(Array.isArray(parsed.items));
});

test('handleMessage tools/call krate_create_secret returns apply result', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/call', {
    name: 'krate_create_secret',
    arguments: { name: 'my-secret-grant', org: 'default', agentRef: 'review-bot', secretRef: 'db-password', permissions: ['read'] },
  }));
  assert.ok(resp.result);
  const parsed = JSON.parse(resp.result.content[0].text);
  assert.equal(parsed.operation, 'apply');
  assert.equal(parsed.resource.kind, 'AgentSecretGrant');
  assert.equal(parsed.resource.metadata.name, 'my-secret-grant');
});

test('handleMessage tools/call krate_create_stack returns apply result', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/call', {
    name: 'krate_create_stack',
    arguments: { name: 'new-stack', org: 'default', spec: { baseAgent: 'claude-code' } },
  }));
  assert.ok(resp.result);
  const parsed = JSON.parse(resp.result.content[0].text);
  assert.equal(parsed.operation, 'apply');
  assert.equal(parsed.resource.kind, 'AgentStack');
  assert.equal(parsed.resource.metadata.name, 'new-stack');
  assert.equal(parsed.resource.spec.organizationRef, 'default');
});

test('handleMessage tools/call krate_sync_external returns sync result', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/call', {
    name: 'krate_sync_external',
    arguments: { bindingName: 'github-binding', kind: 'Repository', localName: 'web-app', watermark: 'cursor-123' },
  }));
  assert.ok(resp.result);
  const parsed = JSON.parse(resp.result.content[0].text);
  assert.equal(parsed.bindingName, 'github-binding');
  assert.ok(parsed.synced);
});

test('handleMessage tools/call krate_resolve_conflict returns resolution', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/call', {
    name: 'krate_resolve_conflict',
    arguments: { conflictName: 'conflict-abc', strategy: 'local-wins' },
  }));
  assert.ok(resp.result);
  const parsed = JSON.parse(resp.result.content[0].text);
  assert.equal(parsed.conflictName, 'conflict-abc');
  assert.equal(parsed.strategy, 'local-wins');
  assert.ok(parsed.resolved);
});

test('handleMessage tools/call krate_audit_query returns events and total', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/call', {
    name: 'krate_audit_query',
    arguments: { org: 'default', limit: 10 },
  }));
  assert.ok(resp.result);
  const parsed = JSON.parse(resp.result.content[0].text);
  assert.ok(Array.isArray(parsed.events));
  assert.equal(typeof parsed.total, 'number');
});
