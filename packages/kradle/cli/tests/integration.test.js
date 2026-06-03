/**
 * CLI Integration Tests — Verify MCP server commands work together
 *
 * Tests the full MCP server protocol flow: initialize, tools/list, tools/call
 * with an apply+list round-trip and verification that all tools are present.
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
    { kind: 'Repository', metadata: { name: 'web-app', namespace: 'kradle-org-default' }, spec: { organizationRef: 'default', visibility: 'internal' } },
    { kind: 'Repository', metadata: { name: 'api-service', namespace: 'kradle-org-default' }, spec: { organizationRef: 'default', visibility: 'private' } },
  ];
  const stacks = [
    { kind: 'AgentStack', metadata: { name: 'review-bot', namespace: 'kradle-org-default' }, spec: { organizationRef: 'default', baseAgent: 'claude-code' } },
  ];

  return {
    role: 'mock-kradle-api-controller',
    namespace: 'kradle-org-default',

    async snapshot() {
      return {
        namespace: 'kradle-org-default',
        resources: {
          Repository: repositories,
          AgentStack: stacks,
        },
      };
    },

    async listResource(kind) {
      if (kind === 'Repository') return { items: repositories };
      if (kind === 'AgentStack') return { items: stacks };
      if (kind === 'KradleVirtualModel') return { items: [] };
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

test('CLI integration: initialize → tools/list → kradle_snapshot all succeed', async () => {
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
  assert.equal(initResp.result.serverInfo.name, 'kradle');
  assert.equal(initResp.result.protocolVersion, '2024-11-05');

  // tools/list
  const listResp = await server.handleMessage(rpc('tools/list'));
  assert.ok(listResp.result, 'tools/list must return a result');
  assert.ok(Array.isArray(listResp.result.tools), 'result.tools must be an array');
  assert.equal(listResp.result.tools.length, 33, 'must list exactly 33 tools');

  // kradle_snapshot
  const snapResp = await server.handleMessage(rpc('tools/call', {
    name: 'kradle_snapshot',
    arguments: {},
  }));
  assert.ok(snapResp.result, 'kradle_snapshot must return a result');
  assert.ok(Array.isArray(snapResp.result.content), 'result.content must be an array');
  assert.equal(snapResp.result.content[0].type, 'text', 'content type must be text');
  const snapshot = JSON.parse(snapResp.result.content[0].text);
  assert.ok(snapshot.resources, 'snapshot must have resources field');
});

// ---------------------------------------------------------------------------
// Test 2: MCP apply + list round-trip
// ---------------------------------------------------------------------------

test('CLI integration: kradle_apply_resource → kradle_list_resources round-trip', async () => {
  const server = createMcpServer({ controller: createMockController() });

  // Apply a resource
  const applyResp = await server.handleMessage(rpc('tools/call', {
    name: 'kradle_apply_resource',
    arguments: {
      resource: {
        kind: 'Repository',
        metadata: { name: 'integration-test-repo', namespace: 'kradle-org-default' },
        spec: { organizationRef: 'default', visibility: 'internal' },
      },
    },
  }));
  assert.ok(applyResp.result, 'kradle_apply_resource must return a result');
  assert.ok(Array.isArray(applyResp.result.content), 'result.content must be an array');

  // Parse the apply response
  const applyData = JSON.parse(applyResp.result.content[0].text);
  assert.ok(applyData.operation === 'apply' || applyData.resource, 'apply response must indicate an apply operation');

  // List resources of that kind
  const listResp = await server.handleMessage(rpc('tools/call', {
    name: 'kradle_list_resources',
    arguments: { kind: 'Repository' },
  }));
  assert.ok(listResp.result, 'kradle_list_resources must return a result');
  const listData = JSON.parse(listResp.result.content[0].text);
  assert.ok(Array.isArray(listData.items), 'list response must have items array');
  // The mock controller always returns the fixed list (web-app, api-service)
  assert.ok(listData.items.length >= 1, 'list must return at least 1 item');
});

// ---------------------------------------------------------------------------
// Test 3: All tools listed in tools/list
// ---------------------------------------------------------------------------

test('CLI integration: all 33 tools listed in MCP_TOOLS and tools/list', async () => {
  // MCP_TOOLS static array
  assert.equal(MCP_TOOLS.length, 33, 'MCP_TOOLS must have exactly 33 entries');

  const expectedTools = [
    'kradle_snapshot',
    'kradle_list_resources',
    'kradle_apply_resource',
    'kradle_dispatch_agent',
    'kradle_list_agents',
    'kradle_get_agent_profile',
    'kradle_create_agent',
    'kradle_get_resource',
    'kradle_delete_resource',
    'kradle_list_stacks',
    'kradle_search',
    'kradle_list_secrets',
    'kradle_create_secret',
    'kradle_create_stack',
    'kradle_sync_external',
    'kradle_resolve_conflict',
    'kradle_audit_query',
    'kradle_model_catalog',
    'kradle_list_model_routes',
    'kradle_create_model_route',
    'kradle_list_virtual_models',
    'kradle_create_virtual_model',
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
  ];

  const toolNames = MCP_TOOLS.map((t) => t.name);
  for (const name of expectedTools) {
    assert.ok(toolNames.includes(name), `MCP_TOOLS must include ${name}`);
  }

  // Also verify via tools/list response
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/list'));
  assert.equal(resp.result.tools.length, 33, 'tools/list must return exactly 33 tools');

  const responsedNames = resp.result.tools.map((t) => t.name);
  assert.ok(responsedNames.includes('kradle_snapshot'));
  assert.ok(responsedNames.includes('kradle_list_resources'));
  assert.ok(responsedNames.includes('kradle_apply_resource'));
  assert.ok(responsedNames.includes('kradle_dispatch_agent'));
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
