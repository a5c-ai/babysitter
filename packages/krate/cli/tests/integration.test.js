/**
 * CLI Integration Tests — Verify MCP server commands work together
 *
 * Tests the full MCP server protocol flow: initialize, tools/list, tools/call
 * with an apply+list round-trip and verification that all 17 tools are present.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createMcpServer, MCP_TOOLS } from '../src/mcp-server.js';

// ---------------------------------------------------------------------------
// Mock controller — returns canned data without kubectl / Kubernetes
// (copied from mcp-server.test.js)
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
// Test 1: MCP initialize + tools/list + snapshot
// ---------------------------------------------------------------------------

test('CLI integration: initialize → tools/list → krate_snapshot all succeed', async () => {
  const server = createMcpServer({ controller: createMockController() });

  // Initialize
  const initResp = await server.handleMessage(rpc('initialize', {
    protocolVersion: '2024-11-05',
    clientInfo: { name: 'integration-test', version: '1.0' },
  }));
  assert.equal(initResp.jsonrpc, '2.0');
  assert.equal(initResp.id, 1);
  assert.ok(initResp.result, 'initialize must return a result');
  assert.ok(initResp.result.serverInfo, 'initialize must return serverInfo');
  assert.equal(initResp.result.serverInfo.name, 'krate');
  assert.equal(initResp.result.protocolVersion, '2024-11-05');

  // tools/list
  const listResp = await server.handleMessage(rpc('tools/list'));
  assert.ok(listResp.result, 'tools/list must return a result');
  assert.ok(Array.isArray(listResp.result.tools), 'result.tools must be an array');
  assert.equal(listResp.result.tools.length, 17, 'must list exactly 17 tools');

  // krate_snapshot
  const snapResp = await server.handleMessage(rpc('tools/call', {
    name: 'krate_snapshot',
    arguments: {},
  }));
  assert.ok(snapResp.result, 'krate_snapshot must return a result');
  assert.ok(Array.isArray(snapResp.result.content), 'result.content must be an array');
  assert.equal(snapResp.result.content[0].type, 'text', 'content type must be text');
  const snapshot = JSON.parse(snapResp.result.content[0].text);
  assert.ok(snapshot.resources, 'snapshot must have resources field');
});

// ---------------------------------------------------------------------------
// Test 2: MCP apply + list round-trip
// ---------------------------------------------------------------------------

test('CLI integration: krate_apply_resource → krate_list_resources round-trip', async () => {
  const server = createMcpServer({ controller: createMockController() });

  // Apply a resource
  const applyResp = await server.handleMessage(rpc('tools/call', {
    name: 'krate_apply_resource',
    arguments: {
      resource: {
        kind: 'Repository',
        metadata: { name: 'integration-test-repo', namespace: 'krate-org-default' },
        spec: { organizationRef: 'default', visibility: 'internal' },
      },
    },
  }));
  assert.ok(applyResp.result, 'krate_apply_resource must return a result');
  assert.ok(Array.isArray(applyResp.result.content), 'result.content must be an array');

  // Parse the apply response
  const applyData = JSON.parse(applyResp.result.content[0].text);
  assert.ok(applyData.operation === 'apply' || applyData.resource, 'apply response must indicate an apply operation');

  // List resources of that kind
  const listResp = await server.handleMessage(rpc('tools/call', {
    name: 'krate_list_resources',
    arguments: { kind: 'Repository' },
  }));
  assert.ok(listResp.result, 'krate_list_resources must return a result');
  const listData = JSON.parse(listResp.result.content[0].text);
  assert.ok(Array.isArray(listData.items), 'list response must have items array');
  // The mock controller always returns the fixed list (web-app, api-service)
  assert.ok(listData.items.length >= 1, 'list must return at least 1 item');
});

// ---------------------------------------------------------------------------
// Test 3: All 14 tools listed in tools/list
// ---------------------------------------------------------------------------

test('CLI integration: all 17 tools listed in MCP_TOOLS and tools/list', async () => {
  // MCP_TOOLS static array
  assert.equal(MCP_TOOLS.length, 17, 'MCP_TOOLS must have exactly 17 entries');

  const expectedTools = [
    'krate_snapshot',
    'krate_list_resources',
    'krate_apply_resource',
    'krate_dispatch_agent',
    'krate_get_resource',
    'krate_delete_resource',
    'krate_list_stacks',
    'krate_search',
    'krate_list_secrets',
    'krate_create_secret',
    'krate_create_stack',
    'krate_sync_external',
    'krate_resolve_conflict',
    'krate_audit_query',
    'krate_model_catalog',
    'krate_list_model_routes',
    'krate_create_model_route',
  ];

  const toolNames = MCP_TOOLS.map((t) => t.name);
  for (const name of expectedTools) {
    assert.ok(toolNames.includes(name), `MCP_TOOLS must include ${name}`);
  }

  // Also verify via tools/list response
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/list'));
  assert.equal(resp.result.tools.length, 17, 'tools/list must return exactly 17 tools');

  const responsedNames = resp.result.tools.map((t) => t.name);
  assert.ok(responsedNames.includes('krate_snapshot'));
  assert.ok(responsedNames.includes('krate_list_resources'));
  assert.ok(responsedNames.includes('krate_apply_resource'));
  assert.ok(responsedNames.includes('krate_dispatch_agent'));
});

// ---------------------------------------------------------------------------
// Test 4: createMcpServer returns start/stop/handleMessage
// ---------------------------------------------------------------------------

test('CLI integration: createMcpServer returns object with start/stop/handleMessage', async () => {
  const server = createMcpServer({ controller: createMockController() });

  // Verify interface
  assert.equal(typeof server.handleMessage, 'function', 'server must have handleMessage function');
  assert.equal(typeof server.start, 'function', 'server must have start function');
  assert.equal(typeof server.stop, 'function', 'server must have stop function');

  // Verify handleMessage returns valid JSON-RPC 2.0 response
  const resp = await server.handleMessage(rpc('initialize'));
  assert.equal(resp.jsonrpc, '2.0', 'response must be JSON-RPC 2.0');
  assert.ok('result' in resp || 'error' in resp, 'response must have result or error');
  assert.equal(resp.id, 1, 'response id must match request id');
});
