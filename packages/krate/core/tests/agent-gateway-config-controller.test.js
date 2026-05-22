import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAgentGatewayConfigController,
  validateAgentGatewayConfig,
  createResource,
  AGENT_GATEWAY_CONFIG_CONTROLLER_BOUNDARY
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Acceptance criteria: Slice 1.2e — Agent Gateway Config Controller
//
// An AgentGatewayConfig defines runtime gateway settings and feature flags
// for connecting to the Agent Mux gateway. It specifies the gateway name,
// org reference, endpoint URL, feature flags, connection pool settings,
// and TLS configuration reference.
// ---------------------------------------------------------------------------

function makeGatewayConfig(name, overrides = {}) {
  return createResource('AgentGatewayConfig', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    endpointUrl: 'https://agent-mux.example.com/v1',
    ...overrides
  });
}

// ---------------------------------------------------------------------------
// 1. Factory and shape
// ---------------------------------------------------------------------------

test('createAgentGatewayConfigController returns a controller with expected methods', () => {
  const controller = createAgentGatewayConfigController();
  assert.ok(controller, 'controller must be truthy');
  assert.equal(typeof controller.validate, 'function', 'controller must expose validate');
  assert.equal(typeof controller.getEndpointUrl, 'function', 'controller must expose getEndpointUrl');
  assert.equal(typeof controller.getFeatureFlags, 'function', 'controller must expose getFeatureFlags');
  assert.equal(typeof controller.getConnectionPool, 'function', 'controller must expose getConnectionPool');
  assert.equal(typeof controller.getTlsConfigRef, 'function', 'controller must expose getTlsConfigRef');
  assert.equal(controller.role, 'agent-gateway-config-controller', 'controller must declare its role');
});

// ---------------------------------------------------------------------------
// 2. validate — happy path
// ---------------------------------------------------------------------------

test('validate accepts a valid gateway config with name, organizationRef, and endpointUrl', () => {
  const controller = createAgentGatewayConfigController();
  const config = makeGatewayConfig('prod-gateway');
  const result = controller.validate(config);

  assert.equal(result.valid, true, 'valid config must pass validation');
  assert.ok(Array.isArray(result.errors), 'result must contain an errors array');
  assert.equal(result.errors.length, 0, 'errors array must be empty for a valid config');
});

// ---------------------------------------------------------------------------
// 3. validate — missing name
// ---------------------------------------------------------------------------

test('validate rejects config with missing name', () => {
  const controller = createAgentGatewayConfigController();
  const config = {
    apiVersion: 'krate.a5c.ai/v1alpha1',
    kind: 'AgentGatewayConfig',
    metadata: { namespace: 'krate-org-default', labels: {}, annotations: {} },
    spec: { organizationRef: 'default', endpointUrl: 'https://agent-mux.example.com/v1' },
    status: {}
  };
  const result = controller.validate(config);

  assert.equal(result.valid, false, 'config without a name must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /name/i.test(e)),
    'at least one error must mention "name"'
  );
});

// ---------------------------------------------------------------------------
// 4. validate — missing endpointUrl
// ---------------------------------------------------------------------------

test('validate rejects config with missing endpointUrl', () => {
  const controller = createAgentGatewayConfigController();
  const config = makeGatewayConfig('no-url-gateway');
  delete config.spec.endpointUrl;
  const result = controller.validate(config);

  assert.equal(result.valid, false, 'config without endpointUrl must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /endpointUrl/i.test(e)),
    'at least one error must mention "endpointUrl"'
  );
});

// ---------------------------------------------------------------------------
// 5. validate — invalid endpointUrl protocol
// ---------------------------------------------------------------------------

test('validate rejects config with invalid endpointUrl protocol', () => {
  const controller = createAgentGatewayConfigController();
  const config = makeGatewayConfig('bad-url-gateway', { endpointUrl: 'ftp://agent-mux.example.com' });
  const result = controller.validate(config);

  assert.equal(result.valid, false, 'config with unsupported URL protocol must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /endpointUrl/i.test(e)),
    'at least one error must mention "endpointUrl"'
  );
});

// ---------------------------------------------------------------------------
// 6. validate — websocket URL is valid
// ---------------------------------------------------------------------------

test('validate accepts config with wss:// endpoint URL', () => {
  const controller = createAgentGatewayConfigController();
  const config = makeGatewayConfig('ws-gateway', { endpointUrl: 'wss://agent-mux.example.com/connect' });
  const result = controller.validate(config);

  assert.equal(result.valid, true, 'config with wss:// endpoint must pass validation');
  assert.equal(result.errors.length, 0, 'errors array must be empty');
});

// ---------------------------------------------------------------------------
// 7. validate — invalid connection pool maxConnections
// ---------------------------------------------------------------------------

test('validate rejects config with non-positive maxConnections', () => {
  const controller = createAgentGatewayConfigController();
  const config = makeGatewayConfig('bad-pool-gateway', { connectionPool: { maxConnections: 0 } });
  const result = controller.validate(config);

  assert.equal(result.valid, false, 'config with maxConnections=0 must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /maxConnections/i.test(e)),
    'at least one error must mention "maxConnections"'
  );
});

// ---------------------------------------------------------------------------
// 8. validate — invalid timeoutMs
// ---------------------------------------------------------------------------

test('validate rejects config with negative timeoutMs', () => {
  const controller = createAgentGatewayConfigController();
  const config = makeGatewayConfig('bad-timeout-gateway', { connectionPool: { timeoutMs: -1 } });
  const result = controller.validate(config);

  assert.equal(result.valid, false, 'config with negative timeoutMs must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /timeoutMs/i.test(e)),
    'at least one error must mention "timeoutMs"'
  );
});

// ---------------------------------------------------------------------------
// 9. getEndpointUrl — returns endpoint from spec
// ---------------------------------------------------------------------------

test('getEndpointUrl returns the endpointUrl from spec', () => {
  const controller = createAgentGatewayConfigController();
  const config = makeGatewayConfig('url-gateway', { endpointUrl: 'https://my-gateway.internal/v2' });
  const url = controller.getEndpointUrl(config);

  assert.equal(url, 'https://my-gateway.internal/v2', 'must return spec endpointUrl');
});

// ---------------------------------------------------------------------------
// 10. getFeatureFlags — returns flags with defaults
// ---------------------------------------------------------------------------

test('getFeatureFlags returns feature flags merged with defaults', () => {
  const controller = createAgentGatewayConfigController();
  const config = makeGatewayConfig('flags-gateway', {
    featureFlags: { streaming: false, customFlag: true }
  });
  const flags = controller.getFeatureFlags(config);

  assert.ok(flags, 'getFeatureFlags must return a value');
  assert.equal(flags.streaming, false, 'streaming flag must be overridden from spec');
  assert.equal(flags.customFlag, true, 'custom flag must be present from spec');
  assert.ok('reconnect' in flags, 'reconnect must have a default');
  assert.ok('healthCheck' in flags, 'healthCheck must have a default');
});

test('getFeatureFlags returns all defaults when no featureFlags in spec', () => {
  const controller = createAgentGatewayConfigController();
  const config = makeGatewayConfig('no-flags-gateway');
  const flags = controller.getFeatureFlags(config);

  assert.ok(flags, 'getFeatureFlags must return a value');
  assert.ok('streaming' in flags, 'streaming must have a default');
  assert.ok('reconnect' in flags, 'reconnect must have a default');
  assert.ok('healthCheck' in flags, 'healthCheck must have a default');
});

// ---------------------------------------------------------------------------
// 11. getConnectionPool — returns pool with defaults
// ---------------------------------------------------------------------------

test('getConnectionPool returns connection pool settings merged with defaults', () => {
  const controller = createAgentGatewayConfigController();
  const config = makeGatewayConfig('pool-gateway', { connectionPool: { maxConnections: 50 } });
  const pool = controller.getConnectionPool(config);

  assert.ok(pool, 'getConnectionPool must return a value');
  assert.equal(pool.maxConnections, 50, 'must use spec maxConnections');
  assert.ok(Number.isFinite(pool.timeoutMs), 'timeoutMs must have a numeric default');
});

test('getConnectionPool returns all defaults when no connectionPool in spec', () => {
  const controller = createAgentGatewayConfigController();
  const config = makeGatewayConfig('no-pool-gateway');
  const pool = controller.getConnectionPool(config);

  assert.ok(pool, 'getConnectionPool must return a value');
  assert.ok(Number.isFinite(pool.maxConnections), 'maxConnections must have a numeric default');
  assert.ok(Number.isFinite(pool.timeoutMs), 'timeoutMs must have a numeric default');
  assert.ok(pool.maxConnections > 0, 'default maxConnections must be positive');
  assert.ok(pool.timeoutMs >= 0, 'default timeoutMs must be non-negative');
});

// ---------------------------------------------------------------------------
// 12. getTlsConfigRef — returns ref or null
// ---------------------------------------------------------------------------

test('getTlsConfigRef returns null when no TLS config is set', () => {
  const controller = createAgentGatewayConfigController();
  const config = makeGatewayConfig('no-tls-gateway');
  const ref = controller.getTlsConfigRef(config);

  assert.equal(ref, null, 'getTlsConfigRef must return null when not set');
});

test('getTlsConfigRef returns the TLS config reference from spec', () => {
  const controller = createAgentGatewayConfigController();
  const config = makeGatewayConfig('tls-gateway', { tlsConfigRef: 'prod-tls-secret' });
  const ref = controller.getTlsConfigRef(config);

  assert.equal(ref, 'prod-tls-secret', 'getTlsConfigRef must return the spec tlsConfigRef');
});

// ---------------------------------------------------------------------------
// 13. validate — accumulates multiple errors
// ---------------------------------------------------------------------------

test('validate accumulates all errors when multiple fields are invalid', () => {
  const controller = createAgentGatewayConfigController();
  const config = {
    apiVersion: 'krate.a5c.ai/v1alpha1',
    kind: 'AgentGatewayConfig',
    metadata: { namespace: 'krate-org-default', labels: {}, annotations: {} },
    spec: {},
    status: {}
  };
  const result = controller.validate(config);

  assert.equal(result.valid, false, 'config with multiple missing fields must fail');
  assert.ok(result.errors.length >= 2, 'must accumulate at least two errors');
  assert.ok(
    result.errors.some((e) => /name/i.test(e)),
    'errors must include a name error'
  );
  assert.ok(
    result.errors.some((e) => /endpointUrl/i.test(e)),
    'errors must include an endpointUrl error'
  );
});

// ---------------------------------------------------------------------------
// 14. validate / getEndpointUrl / getFeatureFlags — reject null resource
// ---------------------------------------------------------------------------

test('validate rejects null resource with a clear error', () => {
  const controller = createAgentGatewayConfigController();
  const result = controller.validate(null);

  assert.equal(result.valid, false, 'null resource must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /null|undefined/i.test(e)),
    'error must mention null or undefined'
  );
});

test('getEndpointUrl throws on null resource', () => {
  const controller = createAgentGatewayConfigController();
  assert.throws(
    () => controller.getEndpointUrl(null),
    /null|undefined/i,
    'getEndpointUrl must throw on null resource'
  );
});

test('getFeatureFlags throws on null resource', () => {
  const controller = createAgentGatewayConfigController();
  assert.throws(
    () => controller.getFeatureFlags(null),
    /null|undefined/i,
    'getFeatureFlags must throw on null resource'
  );
});

test('getConnectionPool throws on null resource', () => {
  const controller = createAgentGatewayConfigController();
  assert.throws(
    () => controller.getConnectionPool(null),
    /null|undefined/i,
    'getConnectionPool must throw on null resource'
  );
});

test('getTlsConfigRef throws on null resource', () => {
  const controller = createAgentGatewayConfigController();
  assert.throws(
    () => controller.getTlsConfigRef(null),
    /null|undefined/i,
    'getTlsConfigRef must throw on null resource'
  );
});

// ---------------------------------------------------------------------------
// 15. validateAgentGatewayConfig — standalone export follows existing pattern
// ---------------------------------------------------------------------------

test('validateAgentGatewayConfig standalone export follows existing pattern', () => {
  assert.equal(typeof validateAgentGatewayConfig, 'function', 'validateAgentGatewayConfig must be a named export');

  const config = makeGatewayConfig('standalone-validate-gateway');
  const result = validateAgentGatewayConfig(config);

  assert.ok(result, 'validateAgentGatewayConfig must return a result');
  assert.ok('valid' in result, 'result must have a valid property');
  assert.ok(Array.isArray(result.errors), 'result must have an errors array');
  assert.equal(result.valid, true, 'a fully-specified config must pass standalone validation');
});

// ---------------------------------------------------------------------------
// 16. BOUNDARY — exported with correct role
// ---------------------------------------------------------------------------

test('AGENT_GATEWAY_CONFIG_CONTROLLER_BOUNDARY is exported with correct role', () => {
  assert.ok(AGENT_GATEWAY_CONFIG_CONTROLLER_BOUNDARY, 'BOUNDARY must be exported');
  assert.equal(
    AGENT_GATEWAY_CONFIG_CONTROLLER_BOUNDARY.role,
    'agent-gateway-config-controller',
    'BOUNDARY role must be "agent-gateway-config-controller"'
  );
  assert.ok(
    Array.isArray(AGENT_GATEWAY_CONFIG_CONTROLLER_BOUNDARY.owns),
    'BOUNDARY must declare owned concerns'
  );
});

// ---------------------------------------------------------------------------
// 17. validate — valid connection pool with explicit timeoutMs=0 is accepted
// ---------------------------------------------------------------------------

test('validate accepts config with timeoutMs=0 (no timeout)', () => {
  const controller = createAgentGatewayConfigController();
  const config = makeGatewayConfig('zero-timeout-gateway', { connectionPool: { maxConnections: 5, timeoutMs: 0 } });
  const result = controller.validate(config);

  assert.equal(result.valid, true, 'config with timeoutMs=0 must pass validation');
  assert.equal(result.errors.length, 0, 'errors array must be empty');
});

// ---------------------------------------------------------------------------
// 18. getConnectionPool — both spec values returned when both are set
// ---------------------------------------------------------------------------

test('getConnectionPool returns both spec values when both maxConnections and timeoutMs are set', () => {
  const controller = createAgentGatewayConfigController();
  const config = makeGatewayConfig('full-pool-gateway', {
    connectionPool: { maxConnections: 25, timeoutMs: 5000 }
  });
  const pool = controller.getConnectionPool(config);

  assert.equal(pool.maxConnections, 25, 'must return spec maxConnections');
  assert.equal(pool.timeoutMs, 5000, 'must return spec timeoutMs');
});
