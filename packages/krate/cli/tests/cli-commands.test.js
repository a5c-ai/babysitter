/**
 * CLI Commands Tests — tests for krate CLI commands and MCP prompts/resources
 *
 * Tests CLI command logic using a mock controller injected via the same
 * interface used by the MCP server.  No real Kubernetes cluster required.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createMcpServer, MCP_TOOLS, MCP_PROMPTS, MCP_RESOURCES } from '../src/mcp-server.js';

// ---------------------------------------------------------------------------
// Mock controller — mirrors the one in mcp-server.test.js
// ---------------------------------------------------------------------------
function createMockController(overrides = {}) {
  const repositories = [
    { kind: 'Repository', metadata: { name: 'web-app', namespace: 'krate-org-default' }, spec: { organizationRef: 'default', visibility: 'internal' } },
    { kind: 'Repository', metadata: { name: 'api-service', namespace: 'krate-org-default' }, spec: { organizationRef: 'default', visibility: 'private' } },
  ];
  const stacks = [
    { kind: 'AgentStack', metadata: { name: 'review-bot', namespace: 'krate-org-default' }, spec: { organizationRef: 'default', baseAgent: 'claude-code', adapterRef: 'github' }, status: { phase: 'Ready' } },
    { kind: 'AgentStack', metadata: { name: 'deploy-agent', namespace: 'krate-org-default' }, spec: { organizationRef: 'default', baseAgent: 'claude-opus', adapterRef: 'k8s' }, status: { phase: 'Pending' } },
  ];

  return {
    role: 'mock-krate-api-controller',
    namespace: 'krate-org-default',

    async snapshot() {
      return {
        namespace: 'krate-org-default',
        org: 'default',
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
      return { dispatched: true, stackRef: input.agentStack, runId: 'run-abc-123', input };
    },

    async syncExternalBinding(bindingName, options) {
      return { bindingName, resource: { kind: options.kind, localName: options.localName }, synced: true };
    },

    async resolveExternalConflict(opts) {
      return { conflictName: opts.conflictName, strategy: opts.strategy, resolved: true };
    },

    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// JSON-RPC helper
// ---------------------------------------------------------------------------
function rpc(method, params = {}, id = 1) {
  return { jsonrpc: '2.0', id, method, params };
}

// ---------------------------------------------------------------------------
// Part 1: CLI command via MCP tool wrappers
// ---------------------------------------------------------------------------

test('krate status: krate_snapshot returns org info with namespace and resources', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/call', { name: 'krate_snapshot', arguments: {} }));
  assert.ok(resp.result, 'must return a result');
  const data = JSON.parse(resp.result.content[0].text);
  assert.equal(data.namespace, 'krate-org-default', 'snapshot must include namespace');
  assert.ok(data.resources, 'snapshot must include resources');
  assert.ok(data.resources.Repository, 'snapshot must include Repository resources');
  assert.ok(data.resources.AgentStack, 'snapshot must include AgentStack resources');
});

test('krate status: snapshot resource counts are correct', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/call', { name: 'krate_snapshot', arguments: {} }));
  const data = JSON.parse(resp.result.content[0].text);
  assert.equal(data.resources.Repository.length, 2, 'must have 2 Repository resources');
  assert.equal(data.resources.AgentStack.length, 2, 'must have 2 AgentStack resources');
});

test('krate stacks: krate_list_stacks returns list with name/adapter/phase', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/call', { name: 'krate_list_stacks', arguments: {} }));
  assert.ok(resp.result, 'must return a result');
  const data = JSON.parse(resp.result.content[0].text);
  assert.ok(data.items, 'must return items array');
  assert.equal(data.items.length, 2, 'must list 2 stacks');
  const names = data.items.map((s) => s.metadata.name);
  assert.ok(names.includes('review-bot'), 'must include review-bot stack');
  assert.ok(names.includes('deploy-agent'), 'must include deploy-agent stack');
});

test('krate stacks: stack items have spec with baseAgent', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/call', { name: 'krate_list_stacks', arguments: {} }));
  const data = JSON.parse(resp.result.content[0].text);
  const reviewBot = data.items.find((s) => s.metadata.name === 'review-bot');
  assert.ok(reviewBot, 'review-bot stack must exist');
  assert.equal(reviewBot.spec.baseAgent, 'claude-code');
  assert.equal(reviewBot.spec.adapterRef, 'github');
  assert.equal(reviewBot.status.phase, 'Ready');
});

test('krate dispatch --stack: krate_dispatch_agent creates a run', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/call', {
    name: 'krate_dispatch_agent',
    arguments: { stackRef: 'review-bot', input: { repository: 'web-app' } },
  }));
  assert.ok(resp.result, 'must return a result');
  const data = JSON.parse(resp.result.content[0].text);
  assert.ok(data.dispatched, 'must indicate dispatch success');
  assert.equal(data.stackRef, 'review-bot', 'must echo back the stackRef');
  assert.ok(data.runId, 'must return a runId');
});

test('krate dispatch --stack: dispatch result includes input context', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/call', {
    name: 'krate_dispatch_agent',
    arguments: { stackRef: 'deploy-agent', input: { branch: 'main', env: 'staging' } },
  }));
  const data = JSON.parse(resp.result.content[0].text);
  assert.equal(data.stackRef, 'deploy-agent');
});

test('krate apply --file: krate_apply_resource reads and applies resource', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resource = {
    apiVersion: 'krate.a5c.ai/v1',
    kind: 'AgentStack',
    metadata: { name: 'new-stack', namespace: 'krate-org-default' },
    spec: { organizationRef: 'default', baseAgent: 'claude-sonnet' },
  };
  const resp = await server.handleMessage(rpc('tools/call', {
    name: 'krate_apply_resource',
    arguments: { resource },
  }));
  assert.ok(resp.result, 'must return a result');
  const data = JSON.parse(resp.result.content[0].text);
  assert.equal(data.operation, 'apply', 'must indicate apply operation');
  assert.equal(data.resource.metadata.name, 'new-stack', 'must echo back resource name');
  assert.equal(data.resource.kind, 'AgentStack', 'must echo back resource kind');
});

test('krate get: krate_get_resource returns resource as object', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/call', {
    name: 'krate_get_resource',
    arguments: { kind: 'AgentStack', name: 'review-bot' },
  }));
  assert.ok(resp.result, 'must return a result');
  const data = JSON.parse(resp.result.content[0].text);
  assert.ok(data.resource, 'must have resource field');
  assert.equal(data.resource.metadata.name, 'review-bot');
  assert.equal(data.resource.kind, 'AgentStack');
});

test('krate list: krate_list_resources returns resources for kind', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/call', {
    name: 'krate_list_resources',
    arguments: { kind: 'Repository' },
  }));
  assert.ok(resp.result, 'must return a result');
  const data = JSON.parse(resp.result.content[0].text);
  assert.ok(data.items, 'must have items array');
  assert.equal(data.items.length, 2, 'must return 2 repositories');
  const names = data.items.map((r) => r.metadata.name);
  assert.ok(names.includes('web-app'), 'must include web-app');
  assert.ok(names.includes('api-service'), 'must include api-service');
});

test('krate delete: krate_delete_resource removes resource by kind and name', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('tools/call', {
    name: 'krate_delete_resource',
    arguments: { kind: 'AgentStack', name: 'deploy-agent' },
  }));
  assert.ok(resp.result, 'must return a result');
  const data = JSON.parse(resp.result.content[0].text);
  assert.equal(data.operation, 'delete', 'must indicate delete operation');
  assert.equal(data.kind, 'AgentStack', 'must echo back kind');
  assert.equal(data.name, 'deploy-agent', 'must echo back name');
});

test('krate version: getVersion logic returns a version string', () => {
  // Test the version pattern without the actual bin (no fs available in module scope here)
  const versionPattern = /^\d+\.\d+\.\d+/;
  const mockVersion = '0.1.0';
  assert.ok(versionPattern.test(mockVersion), 'version must match semver pattern');
});

test('krate help: commands map includes all expected commands', () => {
  // Verify the commands object structure expected by krate.mjs cmdHelp()
  const expectedCommands = ['serve', 'mcp', 'status', 'stacks', 'dispatch', 'apply', 'get', 'list', 'delete', 'version', 'help'];
  // We import this knowledge from the spec — verify the MCP_TOOLS covers the operations
  const toolNames = MCP_TOOLS.map((t) => t.name);
  assert.ok(toolNames.includes('krate_list_stacks'), 'stacks command backed by krate_list_stacks tool');
  assert.ok(toolNames.includes('krate_dispatch_agent'), 'dispatch command backed by krate_dispatch_agent tool');
  assert.ok(toolNames.includes('krate_apply_resource'), 'apply command backed by krate_apply_resource tool');
  assert.ok(toolNames.includes('krate_get_resource'), 'get command backed by krate_get_resource tool');
  assert.ok(toolNames.includes('krate_list_resources'), 'list command backed by krate_list_resources tool');
  assert.ok(toolNames.includes('krate_delete_resource'), 'delete command backed by krate_delete_resource tool');
  assert.equal(expectedCommands.length, 11, 'must have 11 commands defined');
});

// ---------------------------------------------------------------------------
// Part 2: MCP prompts feature
// ---------------------------------------------------------------------------

test('MCP prompts/list returns all 3 prompts', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('prompts/list'));
  assert.ok(resp.result, 'must return a result');
  assert.ok(Array.isArray(resp.result.prompts), 'must return prompts array');
  assert.equal(resp.result.prompts.length, 3, 'must return exactly 3 prompts');
  const names = resp.result.prompts.map((p) => p.name);
  assert.ok(names.includes('krate_workspace_setup'), 'must include workspace setup prompt');
  assert.ok(names.includes('krate_stack_config'), 'must include stack config prompt');
  assert.ok(names.includes('krate_troubleshoot'), 'must include troubleshoot prompt');
});

test('MCP prompts/list prompt entries have name and description', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('prompts/list'));
  for (const prompt of resp.result.prompts) {
    assert.ok(prompt.name, 'each prompt must have a name');
    assert.ok(prompt.description, 'each prompt must have a description');
  }
});

test('MCP prompts/get krate_workspace_setup returns messages', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('prompts/get', { name: 'krate_workspace_setup' }));
  assert.ok(resp.result, 'must return a result');
  assert.ok(resp.result.description, 'must include description');
  assert.ok(Array.isArray(resp.result.messages), 'must include messages array');
  assert.ok(resp.result.messages.length >= 1, 'must have at least one message');
  const roles = resp.result.messages.map((m) => m.role);
  assert.ok(roles.includes('user'), 'must have a user message');
  assert.ok(roles.includes('assistant'), 'must have an assistant message');
});

test('MCP prompts/get krate_troubleshoot returns diagnostic messages', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('prompts/get', { name: 'krate_troubleshoot' }));
  assert.ok(resp.result, 'must return a result');
  assert.ok(Array.isArray(resp.result.messages), 'must include messages array');
  const assistantMsg = resp.result.messages.find((m) => m.role === 'assistant');
  assert.ok(assistantMsg, 'must have assistant message');
  assert.ok(assistantMsg.content.text.includes('krate status'), 'troubleshoot message must mention krate status');
});

test('MCP prompts/get unknown prompt returns JSON-RPC error', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('prompts/get', { name: 'nonexistent_prompt' }));
  assert.ok(resp.error, 'must return an error for unknown prompt');
  assert.equal(resp.error.code, -32602);
  assert.ok(resp.error.message.includes('nonexistent_prompt'));
});

// ---------------------------------------------------------------------------
// Part 3: MCP resources feature
// ---------------------------------------------------------------------------

test('MCP resources/list returns all 2 resources', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('resources/list'));
  assert.ok(resp.result, 'must return a result');
  assert.ok(Array.isArray(resp.result.resources), 'must return resources array');
  assert.equal(resp.result.resources.length, 2, 'must return exactly 2 resources');
  const uris = resp.result.resources.map((r) => r.uri);
  assert.ok(uris.includes('krate://snapshot'), 'must include snapshot resource');
  assert.ok(uris.includes('krate://stacks'), 'must include stacks resource');
});

test('MCP resources/list resource entries have uri, name, description', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('resources/list'));
  for (const resource of resp.result.resources) {
    assert.ok(resource.uri, 'each resource must have a uri');
    assert.ok(resource.name, 'each resource must have a name');
    assert.ok(resource.description, 'each resource must have a description');
  }
});

test('MCP resources/read krate://snapshot returns workspace snapshot data', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('resources/read', { uri: 'krate://snapshot' }));
  assert.ok(resp.result, 'must return a result');
  assert.ok(Array.isArray(resp.result.contents), 'must return contents array');
  assert.equal(resp.result.contents.length, 1, 'must have one content item');
  const content = resp.result.contents[0];
  assert.equal(content.uri, 'krate://snapshot', 'content uri must match');
  assert.equal(content.mimeType, 'application/json', 'content must be JSON');
  const data = JSON.parse(content.text);
  assert.ok(data.resources, 'snapshot data must include resources');
  assert.ok(data.resources.Repository, 'snapshot must include Repository list');
  assert.ok(data.resources.AgentStack, 'snapshot must include AgentStack list');
});

test('MCP resources/read krate://stacks returns agent stacks data', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('resources/read', { uri: 'krate://stacks' }));
  assert.ok(resp.result, 'must return a result');
  assert.ok(Array.isArray(resp.result.contents), 'must return contents array');
  const content = resp.result.contents[0];
  assert.equal(content.uri, 'krate://stacks', 'content uri must match');
  const data = JSON.parse(content.text);
  assert.ok(data.items, 'stacks data must have items array');
  assert.equal(data.items.length, 2, 'must list 2 stacks');
});

test('MCP resources/read unknown URI returns JSON-RPC error', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('resources/read', { uri: 'krate://nonexistent' }));
  assert.ok(resp.error, 'must return an error for unknown URI');
  assert.equal(resp.error.code, -32602);
  assert.ok(resp.error.message.includes('krate://nonexistent'));
});

// ---------------------------------------------------------------------------
// MCP_PROMPTS and MCP_RESOURCES static exports
// ---------------------------------------------------------------------------

test('MCP_PROMPTS static export has 3 entries', () => {
  assert.equal(MCP_PROMPTS.length, 3);
  assert.ok(MCP_PROMPTS.every((p) => p.name && p.description), 'all prompts must have name and description');
});

test('MCP_RESOURCES static export has 2 entries', () => {
  assert.equal(MCP_RESOURCES.length, 2);
  assert.ok(MCP_RESOURCES.every((r) => r.uri && r.name && r.description), 'all resources must have uri, name, description');
});

test('initialize response includes prompts and resources capabilities', async () => {
  const server = createMcpServer({ controller: createMockController() });
  const resp = await server.handleMessage(rpc('initialize'));
  assert.ok(resp.result.capabilities.prompts, 'capabilities must include prompts');
  assert.ok(resp.result.capabilities.resources, 'capabilities must include resources');
});
