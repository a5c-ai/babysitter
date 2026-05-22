import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAgentProviderConfigController,
  validateAgentProviderConfig,
  createResource,
  AGENT_PROVIDER_CONFIG_CONTROLLER_BOUNDARY
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Acceptance criteria: Slice 1.2c — Agent Provider Config Controller
//
// An AgentProviderConfig defines how to connect to an LLM model provider.
// It specifies provider name/type, API endpoint, credential secret reference,
// default model, rate limit configuration, and feature flags.
//
// Supported provider types: anthropic, openai, azure-openai, google-vertex,
// foundry, custom.
// ---------------------------------------------------------------------------

const VALID_PROVIDER_TYPES = ['anthropic', 'openai', 'azure-openai', 'google-vertex', 'foundry', 'custom'];

function makeProviderConfig(name, overrides = {}) {
  return createResource('AgentProviderConfig', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    providerType: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1',
    credentialRef: 'anthropic-api-key',
    defaultModel: 'claude-opus-4-5',
    ...overrides
  });
}

// ---------------------------------------------------------------------------
// 1. Factory and shape
// ---------------------------------------------------------------------------

test('createAgentProviderConfigController returns controller with validate, resolveEndpoint, getFeatureFlags', () => {
  const controller = createAgentProviderConfigController();
  assert.ok(controller, 'controller must be truthy');
  assert.equal(typeof controller.validate, 'function', 'controller must expose validate');
  assert.equal(typeof controller.resolveEndpoint, 'function', 'controller must expose resolveEndpoint');
  assert.equal(typeof controller.getFeatureFlags, 'function', 'controller must expose getFeatureFlags');
  assert.equal(controller.role, 'agent-provider-config-controller', 'controller must declare its role');
});

// ---------------------------------------------------------------------------
// 2. validate — happy path
// ---------------------------------------------------------------------------

test('validate accepts valid config with name, providerType, endpoint, credentialRef', () => {
  const controller = createAgentProviderConfigController();
  const config = makeProviderConfig('anthropic-provider');
  const result = controller.validate(config);

  assert.equal(result.valid, true, 'valid config must pass validation');
  assert.ok(Array.isArray(result.errors), 'result must contain an errors array');
  assert.equal(result.errors.length, 0, 'errors array must be empty for a valid config');
});

// ---------------------------------------------------------------------------
// 3. validate — missing name
// ---------------------------------------------------------------------------

test('validate rejects config with missing name', () => {
  const controller = createAgentProviderConfigController();
  const config = {
    apiVersion: 'krate.a5c.ai/v1alpha1',
    kind: 'AgentProviderConfig',
    metadata: { namespace: 'krate-org-default', labels: {}, annotations: {} },
    spec: {
      providerType: 'anthropic',
      endpoint: 'https://api.anthropic.com/v1',
      credentialRef: 'anthropic-api-key'
    },
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
// 4. validate — missing providerType
// ---------------------------------------------------------------------------

test('validate rejects config with missing providerType', () => {
  const controller = createAgentProviderConfigController();
  const config = makeProviderConfig('no-type-provider');
  delete config.spec.providerType;
  const result = controller.validate(config);

  assert.equal(result.valid, false, 'config without providerType must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /providerType/i.test(e)),
    'at least one error must mention "providerType"'
  );
  assert.ok(
    result.errors.some((e) => VALID_PROVIDER_TYPES.some((t) => e.includes(t))),
    'error must enumerate valid provider types'
  );
});

// ---------------------------------------------------------------------------
// 5. validate — invalid providerType
// ---------------------------------------------------------------------------

test('validate rejects config with invalid providerType', () => {
  const controller = createAgentProviderConfigController();
  const config = makeProviderConfig('bad-type-provider', { providerType: 'cohere' });
  const result = controller.validate(config);

  assert.equal(result.valid, false, 'config with unsupported providerType must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /providerType/i.test(e)),
    'at least one error must mention "providerType"'
  );
  assert.ok(
    result.errors.some((e) => VALID_PROVIDER_TYPES.some((t) => e.includes(t))),
    'error must enumerate valid provider types'
  );
});

// ---------------------------------------------------------------------------
// 6. validate — missing credentialRef (security: always require)
// ---------------------------------------------------------------------------

test('validate rejects config with missing credentialRef', () => {
  const controller = createAgentProviderConfigController();
  const config = makeProviderConfig('no-cred-provider');
  delete config.spec.credentialRef;
  const result = controller.validate(config);

  assert.equal(result.valid, false, 'config without credentialRef must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /credentialRef/i.test(e)),
    'at least one error must mention "credentialRef"'
  );
});

// ---------------------------------------------------------------------------
// 7. resolveEndpoint — returns endpoint from spec
// ---------------------------------------------------------------------------

test('resolveEndpoint returns endpoint from spec when explicitly set', () => {
  const controller = createAgentProviderConfigController();
  const config = makeProviderConfig('explicit-endpoint-provider', {
    providerType: 'anthropic',
    endpoint: 'https://custom.anthropic.proxy/v1'
  });
  const endpoint = controller.resolveEndpoint(config);

  assert.equal(endpoint, 'https://custom.anthropic.proxy/v1', 'must return explicit spec endpoint');
});

// ---------------------------------------------------------------------------
// 8. resolveEndpoint — defaults for known providers
// ---------------------------------------------------------------------------

test('resolveEndpoint returns default endpoint for anthropic when no endpoint in spec', () => {
  const controller = createAgentProviderConfigController();
  const config = makeProviderConfig('anthropic-default-provider', { providerType: 'anthropic' });
  delete config.spec.endpoint;
  const endpoint = controller.resolveEndpoint(config);

  assert.ok(endpoint.includes('api.anthropic.com'), 'must return anthropic default endpoint');
});

test('resolveEndpoint returns default endpoint for openai when no endpoint in spec', () => {
  const controller = createAgentProviderConfigController();
  const config = makeProviderConfig('openai-default-provider', {
    providerType: 'openai',
    credentialRef: 'openai-api-key'
  });
  delete config.spec.endpoint;
  const endpoint = controller.resolveEndpoint(config);

  assert.ok(endpoint.includes('api.openai.com'), 'must return openai default endpoint');
});

// ---------------------------------------------------------------------------
// 9. getFeatureFlags — returns flags from spec with defaults
// ---------------------------------------------------------------------------

test('getFeatureFlags returns feature flags from spec with defaults applied', () => {
  const controller = createAgentProviderConfigController();
  const config = makeProviderConfig('flags-provider', {
    featureFlags: { streaming: true, vision: false }
  });
  const flags = controller.getFeatureFlags(config);

  assert.ok(flags, 'getFeatureFlags must return a value');
  assert.equal(typeof flags, 'object', 'flags must be an object');
  assert.equal(flags.streaming, true, 'streaming flag must be set from spec');
  assert.equal(flags.vision, false, 'vision flag must be set from spec');
  // tool_use should have a default
  assert.ok('tool_use' in flags, 'tool_use flag must have a default');
});

test('getFeatureFlags returns all defaults when no featureFlags in spec', () => {
  const controller = createAgentProviderConfigController();
  const config = makeProviderConfig('no-flags-provider');
  const flags = controller.getFeatureFlags(config);

  assert.ok(flags, 'getFeatureFlags must return a value even with no spec flags');
  assert.ok('streaming' in flags, 'streaming must have a default');
  assert.ok('tool_use' in flags, 'tool_use must have a default');
  assert.ok('vision' in flags, 'vision must have a default');
});

// ---------------------------------------------------------------------------
// 10. getRateLimits — returns rate limit config with defaults
// ---------------------------------------------------------------------------

test('getRateLimits returns rate limit config with defaults', () => {
  const controller = createAgentProviderConfigController();
  const config = makeProviderConfig('rate-limit-provider', {
    rateLimits: { requestsPerMinute: 60 }
  });
  const limits = controller.getRateLimits(config);

  assert.ok(limits, 'getRateLimits must return a value');
  assert.equal(limits.requestsPerMinute, 60, 'must use spec requestsPerMinute');
  assert.ok(Number.isFinite(limits.tokensPerMinute), 'tokensPerMinute must have a numeric default');
});

test('getRateLimits returns all defaults when no rateLimits in spec', () => {
  const controller = createAgentProviderConfigController();
  const config = makeProviderConfig('no-limits-provider');
  const limits = controller.getRateLimits(config);

  assert.ok(limits, 'getRateLimits must return a value');
  assert.ok(Number.isFinite(limits.requestsPerMinute), 'requestsPerMinute must have a numeric default');
  assert.ok(Number.isFinite(limits.tokensPerMinute), 'tokensPerMinute must have a numeric default');
});

// ---------------------------------------------------------------------------
// 11. validate — rejects null resource
// ---------------------------------------------------------------------------

test('validate rejects null resource with a clear error', () => {
  const controller = createAgentProviderConfigController();
  const result = controller.validate(null);

  assert.equal(result.valid, false, 'null resource must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /null|undefined/i.test(e)),
    'error must mention null or undefined'
  );
});

// ---------------------------------------------------------------------------
// 12. BOUNDARY — exported with correct role
// ---------------------------------------------------------------------------

test('AGENT_PROVIDER_CONFIG_CONTROLLER_BOUNDARY is exported with correct role', () => {
  assert.ok(AGENT_PROVIDER_CONFIG_CONTROLLER_BOUNDARY, 'BOUNDARY must be exported');
  assert.equal(
    AGENT_PROVIDER_CONFIG_CONTROLLER_BOUNDARY.role,
    'agent-provider-config-controller',
    'BOUNDARY role must be "agent-provider-config-controller"'
  );
  assert.ok(
    Array.isArray(AGENT_PROVIDER_CONFIG_CONTROLLER_BOUNDARY.owns),
    'BOUNDARY must declare owned concerns'
  );
});

// ---------------------------------------------------------------------------
// 13. getSupportedProviderTypes — returns valid provider types array
// ---------------------------------------------------------------------------

test('getSupportedProviderTypes returns valid provider types array', () => {
  const controller = createAgentProviderConfigController();
  const types = controller.getSupportedProviderTypes();

  assert.ok(Array.isArray(types), 'getSupportedProviderTypes must return an array');
  assert.ok(types.length >= 6, 'must return at least 6 provider types');
  assert.ok(types.includes('anthropic'), 'must include anthropic');
  assert.ok(types.includes('openai'), 'must include openai');
  assert.ok(types.includes('azure-openai'), 'must include azure-openai');
  assert.ok(types.includes('google-vertex'), 'must include google-vertex');
  assert.ok(types.includes('foundry'), 'must include foundry');
  assert.ok(types.includes('custom'), 'must include custom');
});

// ---------------------------------------------------------------------------
// 14. validateAgentProviderConfig — standalone export follows existing pattern
// ---------------------------------------------------------------------------

test('validateAgentProviderConfig standalone export follows existing pattern', () => {
  assert.equal(typeof validateAgentProviderConfig, 'function', 'validateAgentProviderConfig must be a named export');

  const config = makeProviderConfig('standalone-validate-provider');
  const result = validateAgentProviderConfig(config);

  assert.ok(result, 'validateAgentProviderConfig must return a result');
  assert.ok('valid' in result, 'result must have a valid property');
  assert.ok(Array.isArray(result.errors), 'result must have an errors array');
  assert.equal(result.valid, true, 'a fully-specified config must pass standalone validation');
});

// ---------------------------------------------------------------------------
// 15. validate — all valid provider types are accepted
// ---------------------------------------------------------------------------

test('validate accepts all valid provider types', () => {
  const controller = createAgentProviderConfigController();
  for (const providerType of VALID_PROVIDER_TYPES) {
    const config = makeProviderConfig(`${providerType}-provider`, { providerType });
    const result = controller.validate(config);
    assert.equal(result.valid, true, `providerType "${providerType}" must pass validation`);
  }
});

// ---------------------------------------------------------------------------
// 16. validate — accumulates multiple errors
// ---------------------------------------------------------------------------

test('validate accumulates all errors when multiple fields are invalid', () => {
  const controller = createAgentProviderConfigController();
  const config = {
    apiVersion: 'krate.a5c.ai/v1alpha1',
    kind: 'AgentProviderConfig',
    metadata: { namespace: 'krate-org-default', labels: {}, annotations: {} },
    spec: { providerType: 'bad-provider' },
    status: {}
  };
  const result = controller.validate(config);

  assert.equal(result.valid, false, 'config with multiple invalid fields must fail');
  assert.ok(result.errors.length >= 2, 'must accumulate at least two errors');
  assert.ok(
    result.errors.some((e) => /name/i.test(e)),
    'errors must include a name error'
  );
  assert.ok(
    result.errors.some((e) => /providerType/i.test(e)),
    'errors must include a providerType error'
  );
});

// ---------------------------------------------------------------------------
// 17. resolveEndpoint — throws on null resource
// ---------------------------------------------------------------------------

test('resolveEndpoint throws on null resource', () => {
  const controller = createAgentProviderConfigController();
  assert.throws(
    () => controller.resolveEndpoint(null),
    /null|undefined/i,
    'resolveEndpoint must throw on null resource'
  );
});

// ---------------------------------------------------------------------------
// 18. getFeatureFlags — throws on null resource
// ---------------------------------------------------------------------------

test('getFeatureFlags throws on null resource', () => {
  const controller = createAgentProviderConfigController();
  assert.throws(
    () => controller.getFeatureFlags(null),
    /null|undefined/i,
    'getFeatureFlags must throw on null resource'
  );
});
