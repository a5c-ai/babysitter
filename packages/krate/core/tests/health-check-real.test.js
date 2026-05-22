import assert from 'node:assert/strict';
import test from 'node:test';
import { createResource } from '../src/index.js';
import { createAgentAdapterController } from '../src/agent-adapter-controller.js';
import { createAgentStackController } from '../src/agent-stack-controller.js';

// ---------------------------------------------------------------------------
// Slice C4 — Real health checks for adapters + MCP
//
// healthCheck() must perform a real HTTP fetch when spec.healthEndpoint is set.
// These tests use a mock fetch via dependency injection.
// ---------------------------------------------------------------------------

function makeAdapter(name, overrides = {}) {
  return createResource('AgentAdapter', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    adapterType: 'subprocess',
    transport: 'http',
    capabilities: ['tool-use'],
    ...overrides
  });
}

function makeMcpServer(name, overrides = {}) {
  return createResource('AgentMcpServer', { name, namespace: 'krate-org-default' }, {
    endpoint: 'http://localhost:9090/mcp',
    ...overrides
  });
}

// ---------------------------------------------------------------------------
// C4.1: healthCheck with endpoint returns healthy when fetch succeeds
// ---------------------------------------------------------------------------

test('healthCheck with endpoint returns healthy when fetch succeeds', async () => {
  const mockFetch = async (url, options) => {
    return { ok: true, status: 200 };
  };

  const controller = createAgentAdapterController({ fetch: mockFetch });
  const adapter = makeAdapter('healthy-adapter', { healthEndpoint: 'http://localhost:9090/health' });

  const result = await controller.healthCheck(adapter);

  assert.ok(result, 'healthCheck must return a result');
  assert.equal(result.status, 'healthy', 'status must be "healthy" when fetch succeeds');
  assert.equal(result.adapterName, adapter.metadata.name, 'result must carry the adapter name');
  assert.ok(typeof result.latencyMs === 'number', 'result must include latencyMs');
  assert.ok(result.latencyMs >= 0, 'latencyMs must be non-negative');
  assert.ok(!result.error, 'result must not have an error when healthy');
});

// ---------------------------------------------------------------------------
// C4.2: healthCheck with endpoint returns unhealthy when fetch fails (non-ok)
// ---------------------------------------------------------------------------

test('healthCheck with endpoint returns unhealthy when fetch returns non-ok status', async () => {
  const mockFetch = async (url, options) => {
    return { ok: false, status: 503 };
  };

  const controller = createAgentAdapterController({ fetch: mockFetch });
  const adapter = makeAdapter('unhealthy-adapter', { healthEndpoint: 'http://localhost:9090/health' });

  const result = await controller.healthCheck(adapter);

  assert.ok(result, 'healthCheck must return a result');
  assert.equal(result.status, 'unhealthy', 'status must be "unhealthy" when fetch returns non-ok');
  assert.equal(result.adapterName, adapter.metadata.name, 'result must carry the adapter name');
  assert.ok(typeof result.latencyMs === 'number', 'result must include latencyMs');
  assert.ok(result.error, 'result must include an error message when unhealthy');
});

// ---------------------------------------------------------------------------
// C4.3: healthCheck with endpoint returns unhealthy on network error / timeout
// ---------------------------------------------------------------------------

test('healthCheck with endpoint returns unhealthy when fetch throws (timeout/network)', async () => {
  const mockFetch = async (url, options) => {
    throw new Error('AbortError: The operation was aborted');
  };

  const controller = createAgentAdapterController({ fetch: mockFetch });
  const adapter = makeAdapter('timeout-adapter', { healthEndpoint: 'http://localhost:9090/health' });

  const result = await controller.healthCheck(adapter);

  assert.ok(result, 'healthCheck must return a result');
  assert.equal(result.status, 'unhealthy', 'status must be "unhealthy" when fetch throws');
  assert.equal(result.adapterName, adapter.metadata.name, 'result must carry the adapter name');
  assert.ok(typeof result.latencyMs === 'number', 'result must include latencyMs');
  assert.ok(result.error, 'result must include an error message when fetch throws');
  assert.ok(result.error.includes('AbortError') || result.error.includes('aborted') || result.error.length > 0, 'error message must be non-empty');
});

// ---------------------------------------------------------------------------
// C4.4: healthCheck without endpoint returns unknown (existing behaviour preserved)
// ---------------------------------------------------------------------------

test('healthCheck without endpoint returns unknown with reason no-endpoint', async () => {
  const controller = createAgentAdapterController();
  const adapter = makeAdapter('no-endpoint-adapter');
  // no healthEndpoint in spec

  const result = await controller.healthCheck(adapter);

  assert.ok(result, 'healthCheck must return a result');
  assert.equal(result.status, 'unknown', 'status must be "unknown" when no endpoint configured');
  assert.equal(result.reason, 'no-endpoint', 'reason must be "no-endpoint"');
  assert.equal(result.adapterName, adapter.metadata.name, 'result must carry the adapter name');
});

// ---------------------------------------------------------------------------
// C4.5: MCP server health check — healthy when endpoint fetch succeeds
// ---------------------------------------------------------------------------

test('AgentStackController MCP health check returns healthy when server endpoint responds', async () => {
  const mockFetch = async (url, options) => {
    return { ok: true, status: 200 };
  };

  const controller = createAgentStackController({ fetch: mockFetch });

  const mcpServer = makeMcpServer('test-mcp', { endpoint: 'http://localhost:9090/mcp' });
  const result = await controller.checkMcpHealth(mcpServer);

  assert.ok(result, 'checkMcpHealth must return a result');
  assert.equal(result.status, 'healthy', 'status must be "healthy" when fetch succeeds');
  assert.ok(typeof result.latencyMs === 'number', 'result must include latencyMs');
});

// ---------------------------------------------------------------------------
// C4.6: MCP server health check — unhealthy when fetch fails
// ---------------------------------------------------------------------------

test('AgentStackController MCP health check returns unhealthy when server fetch fails', async () => {
  const mockFetch = async (url, options) => {
    throw new Error('Connection refused');
  };

  const controller = createAgentStackController({ fetch: mockFetch });

  const mcpServer = makeMcpServer('unreachable-mcp', { endpoint: 'http://localhost:9999/mcp' });
  const result = await controller.checkMcpHealth(mcpServer);

  assert.ok(result, 'checkMcpHealth must return a result');
  assert.equal(result.status, 'unhealthy', 'status must be "unhealthy" when fetch throws');
  assert.ok(result.error, 'result must include an error message');
});

// ---------------------------------------------------------------------------
// C4.7: MCP server health check — unknown when no endpoint configured
// ---------------------------------------------------------------------------

test('AgentStackController MCP health check returns unknown when no endpoint configured', async () => {
  const controller = createAgentStackController();

  const mcpServer = makeMcpServer('no-endpoint-mcp', { endpoint: undefined });
  delete mcpServer.spec.endpoint;
  const result = await controller.checkMcpHealth(mcpServer);

  assert.ok(result, 'checkMcpHealth must return a result');
  assert.equal(result.status, 'unknown', 'status must be "unknown" when no endpoint configured');
  assert.equal(result.reason, 'no-endpoint', 'reason must be "no-endpoint"');
});
