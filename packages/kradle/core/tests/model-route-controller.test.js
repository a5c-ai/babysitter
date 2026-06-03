import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createModelRouteController,
  createKradleApiController,
  validateModelRoute,
  createResource,
  MODEL_ROUTE_CONTROLLER_BOUNDARY,
  VALID_ROUTE_TYPES,
  VALID_EXTERNAL_PROTOCOLS,
  ENVOY_AI_GATEWAY_API_GROUP,
  ENVOY_AI_GATEWAY_API_VERSION
} from '../src/index.js';

// ---------------------------------------------------------------------------
// KradleModelRoute Controller Tests
//
// A KradleModelRoute provides unified model routing through Envoy AI Gateway,
// mapping logical model names to internal KServe services or external cloud
// LLM endpoints.
// ---------------------------------------------------------------------------

function makeInternalRoute(name, overrides = {}) {
  return createResource('KradleModelRoute', { name, namespace: 'kradle-org-default' }, {
    organizationRef: 'default',
    modelName: `model-${name}`,
    routeType: 'internal',
    inferenceServiceRef: `isvc-${name}`,
    ...overrides
  });
}

function makeExternalRoute(name, overrides = {}) {
  return createResource('KradleModelRoute', { name, namespace: 'kradle-org-default' }, {
    organizationRef: 'default',
    modelName: `model-${name}`,
    routeType: 'external',
    external: {
      provider: 'openai',
      endpoint: 'https://api.openai.com/v1',
      protocol: 'openai',
      modelId: 'gpt-4o',
      authConfig: { type: 'bearer', secretRef: 'openai-api-key' }
    },
    ...overrides
  });
}

function makeInferenceService(name, statusUrl) {
  return {
    kind: 'KradleInferenceService',
    metadata: { name, namespace: 'kradle-org-default' },
    spec: { organizationRef: 'default', modelFormat: 'pytorch', storageUri: 's3://models/test', inferenceProtocol: 'v2' },
    status: statusUrl ? { url: statusUrl } : {}
  };
}

function createRecordingGateway({ failKinds = new Set(), snapshotResources = [] } = {}) {
  const applied = [];
  return {
    namespace: 'kradle-system',
    resourceDefinitions: {},
    applied,
    async snapshot() {
      return { resources: snapshotResources, namespace: 'kradle-system' };
    },
    async list() {
      return { items: [] };
    },
    async get() {
      return null;
    },
    async apply(resource) {
      if (failKinds.has(resource.kind)) {
        throw new Error(`apply failed for ${resource.kind}`);
      }
      applied.push(JSON.parse(JSON.stringify(resource)));
      return { operation: 'apply', resource };
    },
    async delete() {
      return { operation: 'delete' };
    },
    watch() {
      return { close: () => {} };
    },
  };
}

// ---------------------------------------------------------------------------
// 1. Factory and shape
// ---------------------------------------------------------------------------

test('createModelRouteController returns controller with expected methods', () => {
  const controller = createModelRouteController();
  assert.ok(controller, 'controller must be truthy');
  assert.equal(typeof controller.validate, 'function', 'must expose validate');
  assert.equal(typeof controller.resolveRoute, 'function', 'must expose resolveRoute');
  assert.equal(typeof controller.reconcileRoutes, 'function', 'must expose reconcileRoutes');
  assert.equal(typeof controller.listModelCatalog, 'function', 'must expose listModelCatalog');
  assert.equal(typeof controller.generateEnvoyRouteManifest, 'function', 'must expose generateEnvoyRouteManifest');
  assert.equal(typeof controller.toModelRoute, 'function', 'must expose toModelRoute');
  assert.equal(controller.role, 'model-route-controller', 'must declare its role');
});

// ---------------------------------------------------------------------------
// 2. validate — accepts valid internal route
// ---------------------------------------------------------------------------

test('validate accepts valid internal route', () => {
  const controller = createModelRouteController();
  const route = makeInternalRoute('sklearn-iris');
  const result = controller.validate(route);

  assert.equal(result.valid, true, 'valid internal route must pass validation');
  assert.equal(result.errors.length, 0, 'errors array must be empty');
});

// ---------------------------------------------------------------------------
// 3. validate — accepts valid external route
// ---------------------------------------------------------------------------

test('validate accepts valid external route', () => {
  const controller = createModelRouteController();
  const route = makeExternalRoute('gpt4');
  const result = controller.validate(route);

  assert.equal(result.valid, true, 'valid external route must pass validation');
  assert.equal(result.errors.length, 0, 'errors array must be empty');
});

// ---------------------------------------------------------------------------
// 4. validate — rejects missing modelName
// ---------------------------------------------------------------------------

test('validate rejects missing modelName', () => {
  const controller = createModelRouteController();
  const route = makeInternalRoute('no-model');
  delete route.spec.modelName;
  const result = controller.validate(route);

  assert.equal(result.valid, false, 'missing modelName must fail validation');
  assert.ok(result.errors.some(e => /modelName/i.test(e)), 'error must mention modelName');
});

// ---------------------------------------------------------------------------
// 5. validate — rejects missing routeType
// ---------------------------------------------------------------------------

test('validate rejects missing routeType', () => {
  const controller = createModelRouteController();
  const route = makeInternalRoute('no-type');
  delete route.spec.routeType;
  const result = controller.validate(route);

  assert.equal(result.valid, false, 'missing routeType must fail validation');
  assert.ok(result.errors.some(e => /routeType/i.test(e)), 'error must mention routeType');
});

// ---------------------------------------------------------------------------
// 6. validate — rejects invalid routeType
// ---------------------------------------------------------------------------

test('validate rejects invalid routeType (not internal/external)', () => {
  const controller = createModelRouteController();
  const route = makeInternalRoute('bad-type', { routeType: 'hybrid' });
  const result = controller.validate(route);

  assert.equal(result.valid, false, 'invalid routeType must fail validation');
  assert.ok(result.errors.some(e => /routeType/i.test(e)), 'error must mention routeType');
  assert.ok(result.errors.some(e => e.includes('hybrid')), 'error must include the invalid value');
});

// ---------------------------------------------------------------------------
// 7. validate — rejects null resource
// ---------------------------------------------------------------------------

test('validate rejects null resource', () => {
  const controller = createModelRouteController();
  const result = controller.validate(null);

  assert.equal(result.valid, false, 'null resource must fail validation');
  assert.ok(result.errors.some(e => /null|undefined/i.test(e)), 'error must mention null or undefined');
});

// ---------------------------------------------------------------------------
// 8. validate — rejects missing organizationRef
// ---------------------------------------------------------------------------

test('validate rejects missing organizationRef', () => {
  const controller = createModelRouteController();
  const route = {
    apiVersion: 'kradle.a5c.ai/v1alpha1',
    kind: 'KradleModelRoute',
    metadata: { name: 'no-org', namespace: 'default', labels: {}, annotations: {} },
    spec: { modelName: 'test-model', routeType: 'internal', inferenceServiceRef: 'isvc-test' },
    status: {}
  };
  const result = controller.validate(route);

  assert.equal(result.valid, false, 'missing organizationRef must fail');
  assert.ok(result.errors.some(e => /organizationRef/i.test(e)), 'error must mention organizationRef');
});

// ---------------------------------------------------------------------------
// 9. validate — rejects internal route without inferenceServiceRef
// ---------------------------------------------------------------------------

test('validate rejects internal route without inferenceServiceRef', () => {
  const controller = createModelRouteController();
  const route = makeInternalRoute('no-isvc');
  delete route.spec.inferenceServiceRef;
  const result = controller.validate(route);

  assert.equal(result.valid, false, 'internal without inferenceServiceRef must fail');
  assert.ok(result.errors.some(e => /inferenceServiceRef/i.test(e)), 'error must mention inferenceServiceRef');
});

// ---------------------------------------------------------------------------
// 10. validate — rejects external route without external block
// ---------------------------------------------------------------------------

test('validate rejects external route without external block', () => {
  const controller = createModelRouteController();
  const route = makeExternalRoute('no-external');
  delete route.spec.external;
  const result = controller.validate(route);

  assert.equal(result.valid, false, 'external without external block must fail');
  assert.ok(result.errors.some(e => /external/i.test(e)), 'error must mention external');
});

// ---------------------------------------------------------------------------
// 11. validate — rejects external route with missing provider
// ---------------------------------------------------------------------------

test('validate rejects external route with missing provider', () => {
  const controller = createModelRouteController();
  const route = makeExternalRoute('no-provider', {
    external: { endpoint: 'https://api.example.com/v1' }
  });
  const result = controller.validate(route);

  assert.equal(result.valid, false, 'external without provider must fail');
  assert.ok(result.errors.some(e => /provider/i.test(e)), 'error must mention provider');
});

// ---------------------------------------------------------------------------
// 12. validate — rejects external route with invalid protocol
// ---------------------------------------------------------------------------

test('validate rejects external route with invalid protocol', () => {
  const controller = createModelRouteController();
  const route = makeExternalRoute('bad-proto', {
    external: { provider: 'openai', endpoint: 'https://api.example.com/v1', protocol: 'grpc-unsupported' }
  });
  const result = controller.validate(route);

  assert.equal(result.valid, false, 'invalid protocol must fail');
  assert.ok(result.errors.some(e => /protocol/i.test(e)), 'error must mention protocol');
});

// ---------------------------------------------------------------------------
// 13. resolveRoute — resolves internal from InferenceService status.url
// ---------------------------------------------------------------------------

test('resolveRoute resolves internal from InferenceService status.url', () => {
  const controller = createModelRouteController();
  const route = makeInternalRoute('iris', { inferenceServiceRef: 'sklearn-iris' });
  const isvc = makeInferenceService('sklearn-iris', 'https://sklearn-iris.inference.example.com');
  const resolved = controller.resolveRoute(route, [isvc]);

  assert.equal(resolved.endpoint, 'https://sklearn-iris.inference.example.com', 'must resolve status URL');
  assert.equal(resolved.provider, 'kserve', 'provider must be kserve');
  assert.equal(resolved.protocol, 'v2', 'protocol must come from InferenceService');
});

// ---------------------------------------------------------------------------
// 14. resolveRoute — resolves internal with cluster-internal fallback
// ---------------------------------------------------------------------------

test('resolveRoute resolves internal with cluster-internal fallback when no status URL', () => {
  const controller = createModelRouteController();
  const route = makeInternalRoute('fallback', { inferenceServiceRef: 'my-model' });
  const isvc = makeInferenceService('my-model', null);
  const resolved = controller.resolveRoute(route, [isvc]);

  assert.equal(resolved.endpoint, 'http://my-model.kradle-org-default.svc.cluster.local', 'must generate cluster-internal URL');
  assert.equal(resolved.provider, 'kserve', 'provider must be kserve');
});

// ---------------------------------------------------------------------------
// 15. resolveRoute — resolves internal with no matching InferenceService
// ---------------------------------------------------------------------------

test('resolveRoute resolves internal with fallback URL when no matching InferenceService found', () => {
  const controller = createModelRouteController();
  const route = makeInternalRoute('orphan', { inferenceServiceRef: 'missing-isvc' });
  const resolved = controller.resolveRoute(route, []);

  assert.ok(resolved.endpoint, 'must still produce a fallback endpoint');
  assert.ok(resolved.endpoint.includes('missing-isvc'), 'fallback must include the ref name');
  assert.equal(resolved.provider, 'kserve', 'provider must be kserve');
});

// ---------------------------------------------------------------------------
// 16. resolveRoute — resolves external from spec.external fields
// ---------------------------------------------------------------------------

test('resolveRoute resolves external from spec.external fields', () => {
  const controller = createModelRouteController();
  const route = makeExternalRoute('gpt4');
  const resolved = controller.resolveRoute(route, []);

  assert.equal(resolved.endpoint, 'https://api.openai.com/v1', 'endpoint must match external.endpoint');
  assert.equal(resolved.protocol, 'openai', 'protocol must match external.protocol');
  assert.equal(resolved.provider, 'openai', 'provider must match external.provider');
  assert.equal(resolved.modelId, 'gpt-4o', 'modelId must match external.modelId');
  assert.ok(resolved.authConfig, 'authConfig must be present');
  assert.equal(resolved.authConfig.type, 'bearer', 'authConfig.type must be bearer');
});

// ---------------------------------------------------------------------------
// 17. resolveRoute — returns null endpoint for unknown routeType
// ---------------------------------------------------------------------------

test('resolveRoute returns null endpoint for unknown routeType', () => {
  const controller = createModelRouteController();
  const route = makeInternalRoute('unknown');
  route.spec.routeType = 'unknown-type';
  const resolved = controller.resolveRoute(route, []);

  assert.equal(resolved.endpoint, null, 'endpoint must be null for unknown routeType');
  assert.equal(resolved.provider, 'unknown', 'provider must be unknown');
});

// ---------------------------------------------------------------------------
// 18. reconcileRoutes — marks valid routes as RouteReady True
// ---------------------------------------------------------------------------

test('reconcileRoutes marks valid routes as RouteReady True', () => {
  const controller = createModelRouteController();
  const route = makeExternalRoute('ready-route');
  const { conditions, resolvedRoutes } = controller.reconcileRoutes([route], []);

  assert.equal(conditions.length, 1, 'must have one condition');
  assert.equal(conditions[0].type, 'RouteReady', 'condition type must be RouteReady');
  assert.equal(conditions[0].status, 'True', 'status must be True');
  assert.equal(resolvedRoutes.length, 1, 'must have one resolved route');
  assert.equal(resolvedRoutes[0].modelName, route.spec.modelName, 'resolved route must have correct modelName');
});

// ---------------------------------------------------------------------------
// 19. reconcileRoutes — marks invalid routes as RouteReady False
// ---------------------------------------------------------------------------

test('reconcileRoutes marks invalid routes as RouteReady False with ValidationFailed', () => {
  const controller = createModelRouteController();
  const route = makeInternalRoute('bad-route');
  delete route.spec.modelName;
  const { conditions, resolvedRoutes } = controller.reconcileRoutes([route], []);

  assert.equal(conditions.length, 1, 'must have one condition');
  assert.equal(conditions[0].status, 'False', 'status must be False');
  assert.equal(conditions[0].reason, 'ValidationFailed', 'reason must be ValidationFailed');
  assert.equal(resolvedRoutes.length, 0, 'must have no resolved routes');
});

// ---------------------------------------------------------------------------
// 20. listModelCatalog — merges internal and external routes
// ---------------------------------------------------------------------------

test('listModelCatalog merges both internal and external routes', () => {
  const controller = createModelRouteController();
  const internalRoute = makeInternalRoute('sklearn-iris', { inferenceServiceRef: 'sklearn-iris' });
  const externalRoute = makeExternalRoute('gpt4');
  const isvc = makeInferenceService('sklearn-iris', 'https://sklearn-iris.svc.cluster.local');
  const catalog = controller.listModelCatalog([internalRoute, externalRoute], [isvc]);

  assert.equal(catalog.length, 2, 'catalog must contain both routes');

  const internal = catalog.find(m => m.type === 'internal');
  assert.ok(internal, 'must have internal entry');
  assert.equal(internal.provider, 'kserve', 'internal provider must be kserve');
  assert.equal(internal.status, 'available', 'internal status must be available');
  assert.equal(internal.protocol, 'v2', 'internal protocol must be v2');

  const external = catalog.find(m => m.type === 'external');
  assert.ok(external, 'must have external entry');
  assert.equal(external.provider, 'openai', 'external provider must be openai');
  assert.equal(external.status, 'available', 'external status must be available');
  assert.equal(external.protocol, 'openai', 'external protocol must be openai');
});

// ---------------------------------------------------------------------------
// 21. listModelCatalog — marks unreachable routes as unavailable
// ---------------------------------------------------------------------------

test('listModelCatalog marks invalid routes as unavailable', () => {
  const controller = createModelRouteController();
  const route = makeInternalRoute('broken');
  delete route.spec.modelName;
  const catalog = controller.listModelCatalog([route], []);

  assert.equal(catalog.length, 1, 'catalog must contain the route');
  assert.equal(catalog[0].status, 'unavailable', 'broken route must be unavailable');
});

// ---------------------------------------------------------------------------
// 22. generateEnvoyRouteManifest — produces valid Envoy AI Gateway config
// ---------------------------------------------------------------------------

test('generateEnvoyRouteManifest produces valid Envoy AI Gateway route config', () => {
  const controller = createModelRouteController();
  const route = makeExternalRoute('gpt4');
  const resolvedEndpoint = { endpoint: 'https://api.openai.com/v1', protocol: 'openai', provider: 'openai', modelId: 'gpt-4o' };
  const manifest = controller.generateEnvoyRouteManifest(route, resolvedEndpoint);

  assert.equal(manifest.apiVersion, `${ENVOY_AI_GATEWAY_API_GROUP}/${ENVOY_AI_GATEWAY_API_VERSION}`, 'apiVersion must match');
  assert.equal(manifest.kind, 'AIGatewayRoute', 'kind must be AIGatewayRoute');
  assert.ok(manifest.metadata.name, 'manifest must have a name');
  assert.equal(manifest.metadata.labels['kradle.a5c.ai/managed'], 'true', 'managed label must be set');
  assert.equal(manifest.spec.modelName, route.spec.modelName, 'modelName must match');
  assert.ok(manifest.spec.rules, 'rules must be present');
  assert.ok(manifest.spec.rules.length > 0, 'must have at least one rule');
});

test('api-controller applyModelRoute applies KradleModelRoute and generated AIGatewayRoute', async () => {
  const route = makeExternalRoute('gpt4');
  const gateway = createRecordingGateway();
  const controller = createKradleApiController({ resourceGateway: gateway });

  assert.equal(typeof controller.applyModelRoute, 'function', 'controller must expose applyModelRoute');
  const result = await controller.applyModelRoute(route);

  const appliedKinds = gateway.applied.map((resource) => resource.kind);
  assert.deepEqual(appliedKinds, ['KradleModelRoute', 'AIGatewayRoute']);
  const appliedGatewayRoute = gateway.applied.find((resource) => resource.kind === 'AIGatewayRoute');
  assert.equal(appliedGatewayRoute.metadata.namespace, route.metadata.namespace);
  assert.equal(appliedGatewayRoute.metadata.labels['kradle.a5c.ai/model-route'], route.metadata.name);
  assert.equal(result.routeResult.resource.kind, 'KradleModelRoute');
  assert.equal(result.gatewayRouteResult.resource.kind, 'AIGatewayRoute');
});

test('api-controller applyModelRoute propagates generated AIGatewayRoute apply failure', async () => {
  const route = makeExternalRoute('gpt4-fail');
  const gateway = createRecordingGateway({ failKinds: new Set(['AIGatewayRoute']) });
  const controller = createKradleApiController({ resourceGateway: gateway });

  await assert.rejects(
    () => controller.applyModelRoute(route),
    /apply failed for AIGatewayRoute/
  );
});

// ---------------------------------------------------------------------------
// 23. generateEnvoyRouteManifest — includes rate limits when specified
// ---------------------------------------------------------------------------

test('generateEnvoyRouteManifest includes rate limits when specified', () => {
  const controller = createModelRouteController();
  const route = makeExternalRoute('gpt4-limited', { rateLimits: { requestsPerMinute: 60 } });
  const resolvedEndpoint = { endpoint: 'https://api.openai.com/v1', protocol: 'openai', provider: 'openai', modelId: 'gpt-4o' };
  const manifest = controller.generateEnvoyRouteManifest(route, resolvedEndpoint);

  assert.deepEqual(manifest.spec.rateLimits, { requestsPerMinute: 60 }, 'rateLimits must be included');
});

// ---------------------------------------------------------------------------
// 24. toModelRoute — converts InferenceService to KradleModelRoute spec
// ---------------------------------------------------------------------------

test('toModelRoute converts InferenceService to KradleModelRoute spec', () => {
  const controller = createModelRouteController();
  const isvc = {
    metadata: { name: 'sklearn-iris', namespace: 'kradle-org-default', labels: { 'kradle.a5c.ai/org': 'default' } },
    spec: { predictor: { modelFormat: { name: 'sklearn' }, storageUri: 's3://models/iris' } },
    status: { url: 'https://sklearn-iris.inference.example.com' }
  };
  const resolvedEndpoint = { endpoint: 'https://sklearn-iris.inference.example.com', protocol: 'v2' };
  const modelRoute = controller.toModelRoute(isvc, resolvedEndpoint);

  assert.equal(modelRoute.kind, 'KradleModelRoute', 'kind must be KradleModelRoute');
  assert.equal(modelRoute.apiVersion, 'kradle.a5c.ai/v1alpha1', 'apiVersion must match');
  assert.equal(modelRoute.spec.routeType, 'internal', 'routeType must be internal');
  assert.equal(modelRoute.spec.inferenceServiceRef, 'sklearn-iris', 'inferenceServiceRef must match');
  assert.equal(modelRoute.spec.modelName, 'sklearn-iris', 'modelName must match InferenceService name');
  assert.equal(modelRoute.spec.modelFormat, 'sklearn', 'modelFormat must match predictor');
  assert.equal(modelRoute.spec.endpoint, 'https://sklearn-iris.inference.example.com', 'endpoint must match resolved');
  assert.equal(modelRoute.spec.protocol, 'v2', 'protocol must match');
  assert.equal(modelRoute.spec.organizationRef, 'default', 'organizationRef must come from labels');
});

// ---------------------------------------------------------------------------
// 25. toModelRoute — uses organizationRef from spec when labels absent
// ---------------------------------------------------------------------------

test('toModelRoute uses spec.organizationRef when labels are absent', () => {
  const controller = createModelRouteController();
  const isvc = {
    metadata: { name: 'bert', namespace: 'inference' },
    spec: { organizationRef: 'acme', predictor: { modelFormat: { name: 'huggingface' } } },
    status: {}
  };
  const modelRoute = controller.toModelRoute(isvc, { endpoint: 'http://bert.inference.svc.cluster.local' });

  assert.equal(modelRoute.spec.organizationRef, 'acme', 'must use spec.organizationRef');
  assert.equal(modelRoute.spec.modelFormat, 'huggingface', 'modelFormat must come from predictor');
});

// ---------------------------------------------------------------------------
// 26. toModelRoute — defaults to "custom" modelFormat when not available
// ---------------------------------------------------------------------------

test('toModelRoute defaults modelFormat to custom when predictor has no modelFormat', () => {
  const controller = createModelRouteController();
  const isvc = {
    metadata: { name: 'unknown-format', namespace: 'default' },
    spec: { predictor: {} },
    status: {}
  };
  const modelRoute = controller.toModelRoute(isvc, { endpoint: 'http://unknown.default.svc.cluster.local' });

  assert.equal(modelRoute.spec.modelFormat, 'custom', 'must default to custom');
});

// ---------------------------------------------------------------------------
// 27. MODEL_ROUTE_CONTROLLER_BOUNDARY exported with correct role
// ---------------------------------------------------------------------------

test('MODEL_ROUTE_CONTROLLER_BOUNDARY is exported with correct role', () => {
  assert.ok(MODEL_ROUTE_CONTROLLER_BOUNDARY, 'BOUNDARY must be exported');
  assert.equal(MODEL_ROUTE_CONTROLLER_BOUNDARY.role, 'model-route-controller', 'role must match');
  assert.ok(Array.isArray(MODEL_ROUTE_CONTROLLER_BOUNDARY.owns), 'must declare owned concerns');
  assert.ok(MODEL_ROUTE_CONTROLLER_BOUNDARY.owns.includes('route validation'), 'must own route validation');
  assert.ok(MODEL_ROUTE_CONTROLLER_BOUNDARY.owns.includes('envoy route manifests'), 'must own envoy route manifests');
  assert.ok(Array.isArray(MODEL_ROUTE_CONTROLLER_BOUNDARY.mustNotOwn), 'must declare mustNotOwn');
  assert.ok(MODEL_ROUTE_CONTROLLER_BOUNDARY.mustNotOwn.includes('secret values'), 'must not own secret values');
});

// ---------------------------------------------------------------------------
// 28. VALID_ROUTE_TYPES and VALID_EXTERNAL_PROTOCOLS exports
// ---------------------------------------------------------------------------

test('VALID_ROUTE_TYPES and VALID_EXTERNAL_PROTOCOLS are exported correctly', () => {
  assert.ok(Array.isArray(VALID_ROUTE_TYPES), 'VALID_ROUTE_TYPES must be an array');
  assert.ok(VALID_ROUTE_TYPES.includes('internal'), 'must include internal');
  assert.ok(VALID_ROUTE_TYPES.includes('external'), 'must include external');
  assert.equal(VALID_ROUTE_TYPES.length, 2, 'must have exactly 2 route types');

  assert.ok(Array.isArray(VALID_EXTERNAL_PROTOCOLS), 'VALID_EXTERNAL_PROTOCOLS must be an array');
  assert.ok(VALID_EXTERNAL_PROTOCOLS.includes('openai'), 'must include openai');
  assert.ok(VALID_EXTERNAL_PROTOCOLS.includes('anthropic'), 'must include anthropic');
  assert.ok(VALID_EXTERNAL_PROTOCOLS.includes('bedrock'), 'must include bedrock');
});

// ---------------------------------------------------------------------------
// 29. ENVOY_AI_GATEWAY constants
// ---------------------------------------------------------------------------

test('ENVOY_AI_GATEWAY_API_GROUP and ENVOY_AI_GATEWAY_API_VERSION are exported', () => {
  assert.equal(ENVOY_AI_GATEWAY_API_GROUP, 'aigateway.envoyproxy.io', 'API group must be aigateway.envoyproxy.io');
  assert.equal(ENVOY_AI_GATEWAY_API_VERSION, 'v1alpha1', 'API version must be v1alpha1');
});

// ---------------------------------------------------------------------------
// 30. validateModelRoute standalone export
// ---------------------------------------------------------------------------

test('validateModelRoute standalone export works', () => {
  assert.equal(typeof validateModelRoute, 'function', 'must be a named export');
  const route = makeExternalRoute('standalone');
  const result = validateModelRoute(route);
  assert.equal(result.valid, true, 'valid route must pass standalone validation');
});

// ---------------------------------------------------------------------------
// 31. KradleModelRoute resource creation via createResource
// ---------------------------------------------------------------------------

test('KradleModelRoute can be created via createResource', () => {
  const resource = createResource('KradleModelRoute', { name: 'test-route', namespace: 'kradle-org-default' }, {
    organizationRef: 'default',
    modelName: 'gpt-4o',
    routeType: 'external'
  });

  assert.equal(resource.kind, 'KradleModelRoute', 'kind must match');
  assert.equal(resource.apiVersion, 'kradle.a5c.ai/v1alpha1', 'apiVersion must match');
  assert.equal(resource.spec.modelName, 'gpt-4o', 'modelName must be set');
  assert.equal(resource.spec.routeType, 'external', 'routeType must be set');
});

// ---------------------------------------------------------------------------
// 32. reconcileRoutes — handles mix of valid and invalid routes
// ---------------------------------------------------------------------------

test('reconcileRoutes handles mix of valid and invalid routes', () => {
  const controller = createModelRouteController();
  const validRoute = makeExternalRoute('valid');
  const invalidRoute = makeInternalRoute('invalid');
  delete invalidRoute.spec.routeType;

  const { conditions, resolvedRoutes } = controller.reconcileRoutes([validRoute, invalidRoute], []);

  assert.equal(conditions.length, 2, 'must have two conditions');
  assert.equal(conditions[0].status, 'True', 'first condition must be True');
  assert.equal(conditions[1].status, 'False', 'second condition must be False');
  assert.equal(resolvedRoutes.length, 1, 'must resolve only the valid route');
});

// ---------------------------------------------------------------------------
// 33. generateEnvoyRouteManifest — internal route uses Service targetRef
// ---------------------------------------------------------------------------

test('generateEnvoyRouteManifest for internal route uses Service targetRef', () => {
  const controller = createModelRouteController();
  const route = makeInternalRoute('sklearn-iris');
  const resolvedEndpoint = { endpoint: 'http://sklearn-iris.default.svc.cluster.local', protocol: 'v2', provider: 'kserve', modelId: 'sklearn-iris' };
  const manifest = controller.generateEnvoyRouteManifest(route, resolvedEndpoint);

  assert.equal(manifest.spec.targetRef.kind, 'Service', 'internal route must target a Service');
  assert.equal(manifest.spec.targetRef.name, 'isvc-sklearn-iris', 'targetRef name must match inferenceServiceRef');
});

// ---------------------------------------------------------------------------
// 34. generateEnvoyRouteManifest — external route uses ExternalBackend targetRef
// ---------------------------------------------------------------------------

test('generateEnvoyRouteManifest for external route uses ExternalBackend targetRef', () => {
  const controller = createModelRouteController();
  const route = makeExternalRoute('claude');
  const resolvedEndpoint = { endpoint: 'https://api.anthropic.com/v1', protocol: 'anthropic', provider: 'anthropic', modelId: 'claude-3-opus' };
  const manifest = controller.generateEnvoyRouteManifest(route, resolvedEndpoint);

  assert.equal(manifest.spec.targetRef.kind, 'ExternalBackend', 'external route must target an ExternalBackend');
  assert.ok(manifest.spec.targetRef.name.includes('anthropic'), 'targetRef name must include the provider');
});

// ---------------------------------------------------------------------------
// 35. resolveRoute — resolves internal from InferenceService status.address.url
// ---------------------------------------------------------------------------

test('resolveRoute resolves internal from InferenceService status.address.url', () => {
  const controller = createModelRouteController();
  const route = makeInternalRoute('addr', { inferenceServiceRef: 'my-svc' });
  const isvc = {
    kind: 'KradleInferenceService',
    metadata: { name: 'my-svc', namespace: 'inference' },
    spec: {},
    status: { address: { url: 'http://my-svc.inference.svc.cluster.local' } }
  };
  const resolved = controller.resolveRoute(route, [isvc]);

  assert.equal(resolved.endpoint, 'http://my-svc.inference.svc.cluster.local', 'must resolve from status.address.url');
});

// ---------------------------------------------------------------------------
// 36. validate — accumulates multiple errors
// ---------------------------------------------------------------------------

test('validate accumulates multiple errors at once', () => {
  const controller = createModelRouteController();
  const route = {
    apiVersion: 'kradle.a5c.ai/v1alpha1',
    kind: 'KradleModelRoute',
    metadata: { name: 'multi-error', namespace: 'default', labels: {}, annotations: {} },
    spec: {},
    status: {}
  };
  const result = controller.validate(route);

  assert.equal(result.valid, false, 'must fail validation');
  assert.ok(result.errors.length >= 3, 'must have at least 3 errors (orgRef, modelName, routeType)');
  assert.ok(result.errors.some(e => /organizationRef/i.test(e)), 'must mention organizationRef');
  assert.ok(result.errors.some(e => /modelName/i.test(e)), 'must mention modelName');
  assert.ok(result.errors.some(e => /routeType/i.test(e)), 'must mention routeType');
});

// ---------------------------------------------------------------------------
// 37. toModelRoute — sets source label to inference-service
// ---------------------------------------------------------------------------

test('toModelRoute sets source label to inference-service', () => {
  const controller = createModelRouteController();
  const isvc = {
    metadata: { name: 'test-svc', namespace: 'default', labels: {} },
    spec: { predictor: { modelFormat: { name: 'onnx' } } },
    status: {}
  };
  const modelRoute = controller.toModelRoute(isvc, { endpoint: 'http://test-svc.default.svc.cluster.local' });

  assert.equal(modelRoute.metadata.labels['kradle.a5c.ai/source'], 'inference-service', 'source label must be inference-service');
  assert.equal(modelRoute.metadata.labels['kradle.a5c.ai/managed'], 'true', 'managed label must be true');
});

// ---------------------------------------------------------------------------
// 38. listModelCatalog — empty routes returns empty catalog
// ---------------------------------------------------------------------------

test('listModelCatalog returns empty array for no routes', () => {
  const controller = createModelRouteController();
  const catalog = controller.listModelCatalog([], []);

  assert.ok(Array.isArray(catalog), 'must return an array');
  assert.equal(catalog.length, 0, 'must be empty for no routes');
});

// ---------------------------------------------------------------------------
// 39. resolveRoute — external route with missing external block returns null endpoint
// ---------------------------------------------------------------------------

test('resolveRoute for external route with empty external block returns null endpoint', () => {
  const controller = createModelRouteController();
  const route = makeExternalRoute('empty-ext');
  route.spec.external = {};
  const resolved = controller.resolveRoute(route, []);

  assert.equal(resolved.endpoint, null, 'endpoint must be null when external.endpoint is missing');
  assert.equal(resolved.provider, 'unknown', 'provider must be unknown when external.provider is missing');
});

// ---------------------------------------------------------------------------
// 40. generateEnvoyRouteManifest — includes timeout when specified
// ---------------------------------------------------------------------------

test('generateEnvoyRouteManifest includes timeout when specified', () => {
  const controller = createModelRouteController();
  const route = makeExternalRoute('gpt4-timeout', { timeout: '30s' });
  const resolvedEndpoint = { endpoint: 'https://api.openai.com/v1', protocol: 'openai', provider: 'openai', modelId: 'gpt-4o' };
  const manifest = controller.generateEnvoyRouteManifest(route, resolvedEndpoint);

  assert.equal(manifest.spec.timeout, '30s', 'timeout must be included');
});
