import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAgentTransportBindingController,
  validateAgentTransportBinding,
  createResource,
  AGENT_TRANSPORT_BINDING_CONTROLLER_BOUNDARY
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Acceptance criteria: Slice 1.2b — Agent Transport Binding Controller
//
// An AgentTransportBinding connects an adapter to a specific endpoint.
// It specifies binding name, adapterRef, connection endpoint, protocol,
// health status tracking, and a reconnect policy.
//
// All tests in this file are expected to FAIL until the controller is
// implemented and exported from src/index.js.
// ---------------------------------------------------------------------------

const VALID_PROTOCOLS = ['stdio', 'http', 'websocket', 'unix'];

function makeBinding(name, overrides = {}) {
  return createResource('AgentTransportBinding', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    adapterRef: 'claude-code-adapter',
    endpoint: 'http://localhost:8080',
    protocol: 'http',
    ...overrides
  });
}

// ---------------------------------------------------------------------------
// 1. Factory and shape
// ---------------------------------------------------------------------------

test('createAgentTransportBindingController returns a controller with validate method', () => {
  const controller = createAgentTransportBindingController();
  assert.ok(controller, 'controller must be truthy');
  assert.equal(typeof controller.validate, 'function', 'controller must expose a validate method');
  assert.equal(controller.role, 'agent-transport-binding-controller', 'controller must declare its role');
});

// ---------------------------------------------------------------------------
// 2. validate — happy path
// ---------------------------------------------------------------------------

test('validate accepts valid binding with name, adapterRef, endpoint, protocol', () => {
  const controller = createAgentTransportBindingController();
  const binding = makeBinding('my-transport-binding');
  const result = controller.validate(binding);

  assert.equal(result.valid, true, 'valid binding must pass validation');
  assert.ok(Array.isArray(result.errors), 'result must contain an errors array');
  assert.equal(result.errors.length, 0, 'errors array must be empty for a valid binding');
});

// ---------------------------------------------------------------------------
// 3. validate — missing name
// ---------------------------------------------------------------------------

test('validate rejects missing name', () => {
  const controller = createAgentTransportBindingController();
  const binding = {
    apiVersion: 'krate.a5c.ai/v1alpha1',
    kind: 'AgentTransportBinding',
    metadata: { namespace: 'krate-org-default', labels: {}, annotations: {} },
    spec: {
      organizationRef: 'default',
      adapterRef: 'claude-code-adapter',
      endpoint: 'http://localhost:8080',
      protocol: 'http'
    },
    status: {}
  };
  const result = controller.validate(binding);

  assert.equal(result.valid, false, 'binding without name must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /name/i.test(e)),
    'at least one error must mention "name"'
  );
});

// ---------------------------------------------------------------------------
// 4. validate — missing adapterRef
// ---------------------------------------------------------------------------

test('validate rejects missing adapterRef', () => {
  const controller = createAgentTransportBindingController();
  const binding = makeBinding('no-adapter-binding');
  delete binding.spec.adapterRef;
  const result = controller.validate(binding);

  assert.equal(result.valid, false, 'binding without adapterRef must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /adapterRef/i.test(e)),
    'at least one error must mention "adapterRef"'
  );
});

// ---------------------------------------------------------------------------
// 5. validate — missing endpoint
// ---------------------------------------------------------------------------

test('validate rejects missing endpoint', () => {
  const controller = createAgentTransportBindingController();
  const binding = makeBinding('no-endpoint-binding');
  delete binding.spec.endpoint;
  const result = controller.validate(binding);

  assert.equal(result.valid, false, 'binding without endpoint must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /endpoint/i.test(e)),
    'at least one error must mention "endpoint"'
  );
});

// ---------------------------------------------------------------------------
// 6. validate — invalid protocol
// ---------------------------------------------------------------------------

test('validate rejects invalid protocol (not in stdio/http/websocket/unix)', () => {
  const controller = createAgentTransportBindingController();
  const binding = makeBinding('bad-protocol-binding', { protocol: 'grpc' });
  const result = controller.validate(binding);

  assert.equal(result.valid, false, 'binding with unsupported protocol must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /protocol/i.test(e)),
    'at least one error must mention "protocol"'
  );
  assert.ok(
    result.errors.some((e) => VALID_PROTOCOLS.some((p) => e.includes(p))),
    'error must enumerate valid protocols'
  );
});

// ---------------------------------------------------------------------------
// 7. getConnectionStatus — default 'unknown' for new binding
// ---------------------------------------------------------------------------

test('getConnectionStatus returns default "unknown" for new binding', () => {
  const controller = createAgentTransportBindingController();
  const binding = makeBinding('new-binding');
  const status = controller.getConnectionStatus(binding);

  assert.ok(status, 'getConnectionStatus must return a value');
  assert.equal(status.connectionStatus, 'unknown', 'default connection status must be "unknown"');
  assert.equal(status.bindingName, binding.metadata.name, 'result must carry the binding name');
});

// ---------------------------------------------------------------------------
// 8. getReconnectPolicy — returns policy from spec with defaults
// ---------------------------------------------------------------------------

test('getReconnectPolicy returns policy from spec with defaults', () => {
  const controller = createAgentTransportBindingController();
  const binding = makeBinding('policy-binding', {
    reconnectPolicy: {
      maxRetries: 5,
      backoffMs: 500,
      maxBackoffMs: 30000
    }
  });
  const policy = controller.getReconnectPolicy(binding);

  assert.ok(policy, 'getReconnectPolicy must return a value');
  assert.equal(policy.maxRetries, 5, 'maxRetries must match spec');
  assert.equal(policy.backoffMs, 500, 'backoffMs must match spec');
  assert.equal(policy.maxBackoffMs, 30000, 'maxBackoffMs must match spec');
});

// ---------------------------------------------------------------------------
// 9. getReconnectPolicy — returns defaults when no policy in spec
// ---------------------------------------------------------------------------

test('getReconnectPolicy returns defaults when no policy in spec', () => {
  const controller = createAgentTransportBindingController();
  const binding = makeBinding('no-policy-binding');
  // no reconnectPolicy in spec
  const policy = controller.getReconnectPolicy(binding);

  assert.ok(policy, 'getReconnectPolicy must return a value');
  assert.ok(typeof policy.maxRetries === 'number', 'maxRetries must default to a number');
  assert.ok(typeof policy.backoffMs === 'number', 'backoffMs must default to a number');
  assert.ok(typeof policy.maxBackoffMs === 'number', 'maxBackoffMs must default to a number');
  assert.ok(policy.maxRetries >= 0, 'maxRetries default must be non-negative');
  assert.ok(policy.backoffMs >= 0, 'backoffMs default must be non-negative');
  assert.ok(policy.maxBackoffMs >= policy.backoffMs, 'maxBackoffMs must be >= backoffMs');
});

// ---------------------------------------------------------------------------
// 10. validate — rejects null resource
// ---------------------------------------------------------------------------

test('validate rejects null resource', () => {
  const controller = createAgentTransportBindingController();
  const result = controller.validate(null);

  assert.equal(result.valid, false, 'null resource must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /null|undefined/i.test(e)),
    'error must mention null or undefined'
  );
});

// ---------------------------------------------------------------------------
// 11. BOUNDARY object exported with correct role
// ---------------------------------------------------------------------------

test('AGENT_TRANSPORT_BINDING_CONTROLLER_BOUNDARY is exported and has correct role', () => {
  assert.ok(AGENT_TRANSPORT_BINDING_CONTROLLER_BOUNDARY, 'BOUNDARY must be exported');
  assert.equal(
    AGENT_TRANSPORT_BINDING_CONTROLLER_BOUNDARY.role,
    'agent-transport-binding-controller',
    'BOUNDARY role must be "agent-transport-binding-controller"'
  );
  assert.ok(
    Array.isArray(AGENT_TRANSPORT_BINDING_CONTROLLER_BOUNDARY.owns),
    'BOUNDARY must declare owned concerns'
  );
});

// ---------------------------------------------------------------------------
// 12. validate — all valid protocols are accepted
// ---------------------------------------------------------------------------

test('validate accepts each valid protocol (stdio, http, websocket, unix)', () => {
  const controller = createAgentTransportBindingController();
  for (const protocol of VALID_PROTOCOLS) {
    const binding = makeBinding(`binding-${protocol}`, { protocol });
    const result = controller.validate(binding);
    assert.equal(result.valid, true, `protocol "${protocol}" must be accepted`);
    assert.equal(result.errors.length, 0, `no errors expected for protocol "${protocol}"`);
  }
});

// ---------------------------------------------------------------------------
// 13. getConnectionStatus — reads from status.connectionStatus when present
// ---------------------------------------------------------------------------

test('getConnectionStatus reads connectionStatus from resource status field when present', () => {
  const controller = createAgentTransportBindingController();
  const binding = makeBinding('connected-binding');
  binding.status = { connectionStatus: 'connected' };
  const status = controller.getConnectionStatus(binding);

  assert.equal(status.connectionStatus, 'connected', 'must reflect status from resource status field');
});

// ---------------------------------------------------------------------------
// 14. validate accumulates errors for multiple missing fields
// ---------------------------------------------------------------------------

test('validate accumulates errors when both adapterRef and endpoint are missing', () => {
  const controller = createAgentTransportBindingController();
  const binding = makeBinding('double-missing-binding');
  delete binding.spec.adapterRef;
  delete binding.spec.endpoint;
  const result = controller.validate(binding);

  assert.equal(result.valid, false, 'binding with multiple missing fields must fail validation');
  assert.ok(
    result.errors.some((e) => /adapterRef/i.test(e)),
    'errors must include adapterRef error'
  );
  assert.ok(
    result.errors.some((e) => /endpoint/i.test(e)),
    'errors must include endpoint error'
  );
  assert.ok(result.errors.length >= 2, 'must accumulate at least two errors');
});

// ---------------------------------------------------------------------------
// 15. validateAgentTransportBinding standalone export
// ---------------------------------------------------------------------------

test('validateAgentTransportBinding is exported and validates correctly', () => {
  assert.equal(typeof validateAgentTransportBinding, 'function', 'validateAgentTransportBinding must be a named export');

  const binding = makeBinding('standalone-validate-binding');
  const result = validateAgentTransportBinding(binding);

  assert.ok(result, 'validateAgentTransportBinding must return a result');
  assert.ok('valid' in result, 'result must have a valid property');
  assert.ok(Array.isArray(result.errors), 'result must have an errors array');
  assert.equal(result.valid, true, 'a fully-specified binding must pass standalone validation');
});
