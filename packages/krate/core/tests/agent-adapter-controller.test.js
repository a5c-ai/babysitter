import assert from 'node:assert/strict';
import test from 'node:test';
import { createAgentAdapterController, validateAgentAdapter, createResource, AGENT_ADAPTER_CONTROLLER_BOUNDARY } from '../src/index.js';

// ---------------------------------------------------------------------------
// Acceptance criteria: Slice 1.2a — Agent Adapter Controller
//
// An AgentAdapter defines how an agent connects to a model provider.
// It specifies adapter name/type, supported transport protocols
// (stdio, http, websocket), a capabilities matrix, and a health check
// endpoint/method.
//
// All tests in this file are expected to FAIL until the controller is
// implemented and exported from src/index.js.
// ---------------------------------------------------------------------------

const VALID_TRANSPORTS = ['stdio', 'http', 'websocket', 'unix'];
const VALID_ADAPTER_TYPES = ['subprocess', 'remote', 'programmatic'];

function makeAdapter(name, overrides = {}) {
  return createResource('AgentAdapter', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    adapterType: 'subprocess',
    transport: 'stdio',
    capabilities: ['tool-use', 'streaming'],
    ...overrides
  });
}

// ---------------------------------------------------------------------------
// 1. Factory and shape
// ---------------------------------------------------------------------------

test('createAgentAdapterController returns a controller with validate method', () => {
  const controller = createAgentAdapterController();
  assert.ok(controller, 'controller must be truthy');
  assert.equal(typeof controller.validate, 'function', 'controller must expose a validate method');
  assert.equal(controller.role, 'agent-adapter-controller', 'controller must declare its role');
});

// ---------------------------------------------------------------------------
// 2. validate — happy path
// ---------------------------------------------------------------------------

test('validate accepts a valid adapter with name, type, and transport', () => {
  const controller = createAgentAdapterController();
  const adapter = makeAdapter('claude-code-adapter');
  const result = controller.validate(adapter);

  assert.equal(result.valid, true, 'valid adapter must pass validation');
  assert.ok(Array.isArray(result.errors), 'result must contain an errors array');
  assert.equal(result.errors.length, 0, 'errors array must be empty for a valid adapter');
});

// ---------------------------------------------------------------------------
// 3. validate — missing name
// ---------------------------------------------------------------------------

test('validate rejects adapter with missing name', () => {
  const controller = createAgentAdapterController();
  // Build a raw object without metadata.name to bypass createResource guard
  const adapter = {
    apiVersion: 'krate.a5c.ai/v1alpha1',
    kind: 'AgentAdapter',
    metadata: { namespace: 'krate-org-default', labels: {}, annotations: {} },
    spec: { organizationRef: 'default', adapterType: 'subprocess', transport: 'stdio', capabilities: ['tool-use'] },
    status: {}
  };
  const result = controller.validate(adapter);

  assert.equal(result.valid, false, 'adapter without a name must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /name/i.test(e)),
    'at least one error must mention "name"'
  );
});

// ---------------------------------------------------------------------------
// 4. validate — invalid transport type
// ---------------------------------------------------------------------------

test('validate rejects adapter with invalid transport type', () => {
  const controller = createAgentAdapterController();
  const adapter = makeAdapter('bad-transport-adapter', { transport: 'grpc' });
  const result = controller.validate(adapter);

  assert.equal(result.valid, false, 'adapter with unsupported transport must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /transport/i.test(e)),
    'at least one error must mention "transport"'
  );
  // Confirm that valid transports are enumerated in the error message
  assert.ok(
    result.errors.some((e) => VALID_TRANSPORTS.some((t) => e.includes(t))),
    'error must enumerate valid transport types'
  );
});

// ---------------------------------------------------------------------------
// 5. validate — empty capabilities array
// ---------------------------------------------------------------------------

test('validate rejects adapter with empty capabilities array', () => {
  const controller = createAgentAdapterController();
  const adapter = makeAdapter('no-caps-adapter', { capabilities: [] });
  const result = controller.validate(adapter);

  assert.equal(result.valid, false, 'adapter with empty capabilities must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /capabilities/i.test(e)),
    'at least one error must mention "capabilities"'
  );
});

// ---------------------------------------------------------------------------
// 6. getCapabilities — capabilities matrix
// ---------------------------------------------------------------------------

test('getCapabilities returns the capabilities matrix for an adapter', () => {
  const controller = createAgentAdapterController();
  const adapter = makeAdapter('full-adapter', {
    capabilities: ['tool-use', 'streaming', 'file-access']
  });
  const matrix = controller.getCapabilities(adapter);

  assert.ok(matrix, 'getCapabilities must return a value');
  assert.ok(Array.isArray(matrix.supported), 'matrix must have a supported array');
  assert.ok(matrix.supported.includes('tool-use'), 'supported must include tool-use');
  assert.ok(matrix.supported.includes('streaming'), 'supported must include streaming');
  assert.ok(matrix.supported.includes('file-access'), 'supported must include file-access');
  assert.equal(matrix.adapterName, adapter.metadata.name, 'matrix must carry the adapter name');
});

// ---------------------------------------------------------------------------
// 7. getSupportedTransports — transport enumeration
// ---------------------------------------------------------------------------

test('getSupportedTransports returns the transport types', () => {
  const controller = createAgentAdapterController();
  const transports = controller.getSupportedTransports();

  assert.ok(Array.isArray(transports), 'getSupportedTransports must return an array');
  assert.equal(transports.length, 4, 'exactly four transport types must be supported');
  assert.ok(transports.includes('stdio'), 'transports must include stdio');
  assert.ok(transports.includes('http'), 'transports must include http');
  assert.ok(transports.includes('websocket'), 'transports must include websocket');
  assert.ok(transports.includes('unix'), 'transports must include unix');
});

// ---------------------------------------------------------------------------
// 8. healthCheck — stub result when no endpoint configured
// ---------------------------------------------------------------------------

test('healthCheck returns a result with status "unknown" when no endpoint configured', async () => {
  const controller = createAgentAdapterController();
  const adapter = makeAdapter('no-endpoint-adapter');
  // Adapter has no healthEndpoint in spec
  const result = await controller.healthCheck(adapter);

  assert.ok(result, 'healthCheck must return a result');
  assert.equal(result.status, 'unknown', 'status must be "unknown" when no endpoint is configured');
  assert.equal(result.adapterName, adapter.metadata.name, 'result must carry the adapter name');
  assert.equal(result.reason, 'no-endpoint', 'reason must be "no-endpoint"');
});

// ---------------------------------------------------------------------------
// 9. validateAgentAdapter — standalone export follows existing pattern
// ---------------------------------------------------------------------------

test('validateAgentAdapter exported from controller follows existing pattern', () => {
  assert.equal(typeof validateAgentAdapter, 'function', 'validateAgentAdapter must be a named export');

  const adapter = makeAdapter('standalone-validate-adapter');
  const result = validateAgentAdapter(adapter);

  assert.ok(result, 'validateAgentAdapter must return a result');
  assert.ok('valid' in result, 'result must have a valid property');
  assert.ok(Array.isArray(result.errors), 'result must have an errors array');
  assert.equal(result.valid, true, 'a fully-specified adapter must pass standalone validation');
});

// ---------------------------------------------------------------------------
// 10. validate — missing adapterType
// ---------------------------------------------------------------------------

test('validate rejects adapter with missing adapterType', () => {
  const controller = createAgentAdapterController();
  const adapter = makeAdapter('no-type-adapter', { adapterType: undefined });
  // Remove adapterType from spec entirely
  delete adapter.spec.adapterType;
  const result = controller.validate(adapter);

  assert.equal(result.valid, false, 'adapter without adapterType must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /adapterType/i.test(e)),
    'at least one error must mention "adapterType"'
  );
});

// ---------------------------------------------------------------------------
// 11. validate — invalid adapterType ('garbage')
// ---------------------------------------------------------------------------

test('validate rejects adapter with invalid adapterType', () => {
  const controller = createAgentAdapterController();
  const adapter = makeAdapter('bad-type-adapter', { adapterType: 'garbage' });
  const result = controller.validate(adapter);

  assert.equal(result.valid, false, 'adapter with unsupported adapterType must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /adapterType/i.test(e)),
    'at least one error must mention "adapterType"'
  );
  assert.ok(
    result.errors.some((e) => VALID_ADAPTER_TYPES.some((t) => e.includes(t))),
    'error must enumerate valid adapter types'
  );
});

// ---------------------------------------------------------------------------
// 12. validate — unix transport is valid
// ---------------------------------------------------------------------------

test('validate accepts adapter with unix transport', () => {
  const controller = createAgentAdapterController();
  const adapter = makeAdapter('unix-transport-adapter', { transport: 'unix' });
  const result = controller.validate(adapter);

  assert.equal(result.valid, true, 'adapter with unix transport must pass validation');
  assert.equal(result.errors.length, 0, 'errors array must be empty');
});

// ---------------------------------------------------------------------------
// 13. healthCheck returns 'not-implemented' when healthEndpoint IS configured
// ---------------------------------------------------------------------------

test('healthCheck performs real HTTP check when healthEndpoint is configured', async () => {
  // Use a mock fetch to avoid real network calls in unit tests
  const mockFetch = async () => ({ ok: true, status: 200 });
  const controller = createAgentAdapterController({ fetch: mockFetch });
  const adapter = makeAdapter('endpoint-adapter', { healthEndpoint: 'http://localhost:9090/health' });
  const result = await controller.healthCheck(adapter);

  assert.ok(result, 'healthCheck must return a result');
  assert.equal(result.status, 'healthy', 'status must be "healthy" when endpoint fetch succeeds');
  assert.equal(result.adapterName, adapter.metadata.name, 'result must carry the adapter name');
  assert.ok(typeof result.latencyMs === 'number', 'result must include latencyMs');
});

// ---------------------------------------------------------------------------
// 14. validate / getCapabilities / healthCheck reject null resource
// ---------------------------------------------------------------------------

test('validate rejects null resource with a clear error', () => {
  const controller = createAgentAdapterController();
  const result = controller.validate(null);

  assert.equal(result.valid, false, 'null resource must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /null|undefined/i.test(e)),
    'error must mention null or undefined'
  );
});

test('getCapabilities throws on null resource', () => {
  const controller = createAgentAdapterController();
  assert.throws(
    () => controller.getCapabilities(null),
    /null|undefined/i,
    'getCapabilities must throw on null resource'
  );
});

test('healthCheck rejects on null resource', async () => {
  const controller = createAgentAdapterController();
  await assert.rejects(
    () => controller.healthCheck(null),
    /null|undefined/i,
    'healthCheck must reject on null resource'
  );
});

// ---------------------------------------------------------------------------
// 15. getSupportedAdapterTypes — adapter type enumeration
// ---------------------------------------------------------------------------

test('getSupportedAdapterTypes returns the valid adapter types array', () => {
  const controller = createAgentAdapterController();
  const types = controller.getSupportedAdapterTypes();

  assert.ok(Array.isArray(types), 'getSupportedAdapterTypes must return an array');
  assert.equal(types.length, VALID_ADAPTER_TYPES.length, 'must return all valid adapter types');
  assert.ok(types.includes('subprocess'), 'adapter types must include subprocess');
  assert.ok(types.includes('remote'), 'adapter types must include remote');
  assert.ok(types.includes('programmatic'), 'adapter types must include programmatic');
});

// ---------------------------------------------------------------------------
// 16. getCapabilities with undefined spec (resource with no spec key)
// ---------------------------------------------------------------------------

test('getCapabilities handles resource with no spec key gracefully', () => {
  const controller = createAgentAdapterController();
  const resource = {
    apiVersion: 'krate.a5c.ai/v1alpha1',
    kind: 'AgentAdapter',
    metadata: { name: 'spec-less-adapter', namespace: 'krate-org-default', labels: {}, annotations: {} },
    status: {}
    // no spec key at all
  };
  const matrix = controller.getCapabilities(resource);

  assert.ok(matrix, 'getCapabilities must return a value even with no spec');
  assert.ok(Array.isArray(matrix.supported), 'supported must be an array');
  assert.equal(matrix.supported.length, 0, 'supported must be empty when spec is absent');
  assert.equal(matrix.adapterName, 'spec-less-adapter', 'adapterName must still be populated');
});

// ---------------------------------------------------------------------------
// 17. validate — simultaneous adapterType AND transport errors accumulate
// ---------------------------------------------------------------------------

test('validate accumulates all errors when both adapterType and transport are invalid', () => {
  const controller = createAgentAdapterController();
  const adapter = makeAdapter('double-bad-adapter', { adapterType: 'bad-type', transport: 'grpc' });
  const result = controller.validate(adapter);

  assert.equal(result.valid, false, 'adapter with multiple invalid fields must fail validation');
  assert.ok(
    result.errors.some((e) => /adapterType/i.test(e)),
    'errors must include an adapterType error'
  );
  assert.ok(
    result.errors.some((e) => /transport/i.test(e)),
    'errors must include a transport error'
  );
  assert.ok(result.errors.length >= 2, 'must accumulate at least two errors');
});

// ---------------------------------------------------------------------------
// 18. BOUNDARY object export
// ---------------------------------------------------------------------------

test('AGENT_ADAPTER_CONTROLLER_BOUNDARY is exported and has correct role', () => {
  assert.ok(AGENT_ADAPTER_CONTROLLER_BOUNDARY, 'BOUNDARY must be exported');
  assert.equal(
    AGENT_ADAPTER_CONTROLLER_BOUNDARY.role,
    'agent-adapter-controller',
    'BOUNDARY role must be "agent-adapter-controller"'
  );
  assert.ok(
    Array.isArray(AGENT_ADAPTER_CONTROLLER_BOUNDARY.owns),
    'BOUNDARY must declare owned concerns'
  );
});
