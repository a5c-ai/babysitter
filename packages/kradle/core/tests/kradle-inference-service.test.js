import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createInferenceServiceController,
  validateKradleInferenceService,
  createResource,
  KRADLE_INFERENCE_SERVICE_CONTROLLER_BOUNDARY,
  KSERVE_API_GROUP,
  KSERVE_API_VERSION,
  SUPPORTED_MODEL_FORMATS,
  INFERENCE_PROTOCOLS
} from '../src/index.js';

// ---------------------------------------------------------------------------
// KServe Inference Service Controller Tests
//
// A KradleInferenceService wraps KServe InferenceService resources for model
// inference with endpoint discovery, V1/V2 protocol support, provider config
// bridge, health checks, and model metadata.
// ---------------------------------------------------------------------------

function makeInferenceService(name, overrides = {}) {
  return createResource('KradleInferenceService', { name, namespace: 'kradle-org-default' }, {
    organizationRef: 'default',
    modelFormat: 'sklearn',
    storageUri: 's3://models/sklearn/iris',
    ...overrides
  });
}

// ---------------------------------------------------------------------------
// 1. Factory and shape
// ---------------------------------------------------------------------------

test('createInferenceServiceController returns controller with expected methods', () => {
  const controller = createInferenceServiceController();
  assert.ok(controller, 'controller must be truthy');
  assert.equal(typeof controller.validate, 'function', 'controller must expose validate');
  assert.equal(typeof controller.generateKServeManifest, 'function', 'controller must expose generateKServeManifest');
  assert.equal(typeof controller.resolveEndpoint, 'function', 'controller must expose resolveEndpoint');
  assert.equal(typeof controller.toProviderConfig, 'function', 'controller must expose toProviderConfig');
  assert.equal(typeof controller.infer, 'function', 'controller must expose infer');
  assert.equal(typeof controller.checkHealth, 'function', 'controller must expose checkHealth');
  assert.equal(typeof controller.getModelMetadata, 'function', 'controller must expose getModelMetadata');
  assert.equal(typeof controller.listModels, 'function', 'controller must expose listModels');
  assert.equal(controller.role, 'kradle-inference-service-controller', 'controller must declare its role');
});

// ---------------------------------------------------------------------------
// 2. validate — accepts valid sklearn InferenceService
// ---------------------------------------------------------------------------

test('validate accepts valid sklearn InferenceService', () => {
  const controller = createInferenceServiceController();
  const resource = makeInferenceService('sklearn-iris');
  const result = controller.validate(resource);

  assert.equal(result.valid, true, 'valid sklearn resource must pass validation');
  assert.equal(result.errors.length, 0, 'errors array must be empty');
});

// ---------------------------------------------------------------------------
// 3. validate — accepts valid pytorch with GPU resources
// ---------------------------------------------------------------------------

test('validate accepts valid pytorch with GPU resources', () => {
  const controller = createInferenceServiceController();
  const resource = makeInferenceService('pytorch-resnet', {
    modelFormat: 'pytorch',
    storageUri: 's3://models/pytorch/resnet50',
    resources: { limits: { cpu: '4', memory: '16Gi', 'nvidia.com/gpu': '1' } }
  });
  const result = controller.validate(resource);

  assert.equal(result.valid, true, 'pytorch resource with GPU must pass validation');
  assert.equal(result.errors.length, 0, 'errors array must be empty');
});

// ---------------------------------------------------------------------------
// 4. validate — rejects unknown model format
// ---------------------------------------------------------------------------

test('validate rejects unknown model format', () => {
  const controller = createInferenceServiceController();
  const resource = makeInferenceService('bad-format', { modelFormat: 'caffe' });
  const result = controller.validate(resource);

  assert.equal(result.valid, false, 'unknown model format must fail validation');
  assert.ok(result.errors.length > 0, 'errors must not be empty');
  assert.ok(result.errors.some(e => /modelFormat/i.test(e)), 'error must mention modelFormat');
  assert.ok(result.errors.some(e => SUPPORTED_MODEL_FORMATS.some(f => e.includes(f))), 'error must enumerate valid formats');
});

// ---------------------------------------------------------------------------
// 5. validate — rejects missing storageUri
// ---------------------------------------------------------------------------

test('validate rejects missing storageUri', () => {
  const controller = createInferenceServiceController();
  const resource = makeInferenceService('no-storage');
  delete resource.spec.storageUri;
  const result = controller.validate(resource);

  assert.equal(result.valid, false, 'missing storageUri must fail validation');
  assert.ok(result.errors.some(e => /storageUri/i.test(e)), 'error must mention storageUri');
});

// ---------------------------------------------------------------------------
// 6. validate — rejects invalid storageUri scheme
// ---------------------------------------------------------------------------

test('validate rejects invalid storageUri scheme', () => {
  const controller = createInferenceServiceController();
  const resource = makeInferenceService('bad-uri', { storageUri: 'ftp://models/bad' });
  const result = controller.validate(resource);

  assert.equal(result.valid, false, 'invalid storageUri scheme must fail validation');
  assert.ok(result.errors.some(e => /storageUri/i.test(e)), 'error must mention storageUri');
});

// ---------------------------------------------------------------------------
// 7. validate — rejects null resource
// ---------------------------------------------------------------------------

test('validate rejects null resource', () => {
  const controller = createInferenceServiceController();
  const result = controller.validate(null);

  assert.equal(result.valid, false, 'null resource must fail validation');
  assert.ok(result.errors.some(e => /null|undefined/i.test(e)), 'error must mention null or undefined');
});

// ---------------------------------------------------------------------------
// 8. generateKServeManifest — produces valid KServe spec
// ---------------------------------------------------------------------------

test('generateKServeManifest produces valid KServe spec', () => {
  const controller = createInferenceServiceController();
  const resource = makeInferenceService('sklearn-iris', {
    modelFormat: 'sklearn',
    storageUri: 's3://models/sklearn/iris'
  });
  const manifest = controller.generateKServeManifest(resource);

  assert.equal(manifest.apiVersion, 'serving.kserve.io/v1beta1', 'apiVersion must be serving.kserve.io/v1beta1');
  assert.equal(manifest.kind, 'InferenceService', 'kind must be InferenceService');
  assert.equal(manifest.metadata.name, 'sklearn-iris', 'name must match');
  assert.equal(manifest.metadata.labels['kradle.a5c.ai/managed'], 'true', 'managed label must be set');
  assert.equal(manifest.metadata.labels['kradle.a5c.ai/org'], 'default', 'org label must be set');
  assert.equal(manifest.spec.predictor.modelFormat.name, 'sklearn', 'model format name must match');
  assert.equal(manifest.spec.predictor.storageUri, 's3://models/sklearn/iris', 'storageUri must match');
  assert.ok(manifest.spec.predictor.resources, 'resources must be present (defaults)');
});

// ---------------------------------------------------------------------------
// 9. generateKServeManifest — includes transformer when specified
// ---------------------------------------------------------------------------

test('generateKServeManifest includes transformer when specified', () => {
  const controller = createInferenceServiceController();
  const resource = makeInferenceService('with-transformer', {
    transformer: { containers: [{ image: 'custom-transformer:latest' }] }
  });
  const manifest = controller.generateKServeManifest(resource);

  assert.ok(manifest.spec.transformer, 'transformer must be present in manifest');
  assert.deepEqual(manifest.spec.transformer, resource.spec.transformer, 'transformer must match spec');
});

// ---------------------------------------------------------------------------
// 10. generateKServeManifest — includes explainer when specified
// ---------------------------------------------------------------------------

test('generateKServeManifest includes explainer when specified', () => {
  const controller = createInferenceServiceController();
  const resource = makeInferenceService('with-explainer', {
    explainer: { containers: [{ image: 'alibi-explainer:latest' }] }
  });
  const manifest = controller.generateKServeManifest(resource);

  assert.ok(manifest.spec.explainer, 'explainer must be present in manifest');
  assert.deepEqual(manifest.spec.explainer, resource.spec.explainer, 'explainer must match spec');
});

// ---------------------------------------------------------------------------
// 11. generateKServeManifest — omits transformer and explainer when not specified
// ---------------------------------------------------------------------------

test('generateKServeManifest omits transformer and explainer when not specified', () => {
  const controller = createInferenceServiceController();
  const resource = makeInferenceService('plain-predictor');
  const manifest = controller.generateKServeManifest(resource);

  assert.equal(manifest.spec.transformer, undefined, 'transformer must not be present');
  assert.equal(manifest.spec.explainer, undefined, 'explainer must not be present');
});

// ---------------------------------------------------------------------------
// 12. resolveEndpoint — extracts URL from status
// ---------------------------------------------------------------------------

test('resolveEndpoint extracts URL from status', () => {
  const controller = createInferenceServiceController();
  const isvc = {
    metadata: { name: 'my-model', namespace: 'inference' },
    status: { url: 'https://my-model.inference.example.com' }
  };
  const endpoint = controller.resolveEndpoint(isvc);

  assert.equal(endpoint, 'https://my-model.inference.example.com', 'must return status URL');
});

// ---------------------------------------------------------------------------
// 13. resolveEndpoint — extracts URL from status.address.url
// ---------------------------------------------------------------------------

test('resolveEndpoint extracts URL from status.address.url', () => {
  const controller = createInferenceServiceController();
  const isvc = {
    metadata: { name: 'my-model', namespace: 'inference' },
    status: { address: { url: 'http://my-model.inference.svc.cluster.local' } }
  };
  const endpoint = controller.resolveEndpoint(isvc);

  assert.equal(endpoint, 'http://my-model.inference.svc.cluster.local', 'must return address URL');
});

// ---------------------------------------------------------------------------
// 14. resolveEndpoint — generates cluster-internal URL as fallback
// ---------------------------------------------------------------------------

test('resolveEndpoint generates cluster-internal URL as fallback', () => {
  const controller = createInferenceServiceController();
  const isvc = {
    metadata: { name: 'my-model', namespace: 'inference' },
    status: {}
  };
  const endpoint = controller.resolveEndpoint(isvc);

  assert.equal(endpoint, 'http://my-model.inference.svc.cluster.local', 'must generate cluster-internal URL');
});

// ---------------------------------------------------------------------------
// 15. toProviderConfig — creates valid provider with kserve type
// ---------------------------------------------------------------------------

test('toProviderConfig creates valid provider config with kserve type', () => {
  const controller = createInferenceServiceController();
  const resource = makeInferenceService('sklearn-iris');
  const config = controller.toProviderConfig(resource, 'http://sklearn-iris.default.svc.cluster.local');

  assert.equal(config.providerType, 'kserve', 'providerType must be kserve');
  assert.equal(config.endpoint, 'http://sklearn-iris.default.svc.cluster.local', 'endpoint must match');
  assert.ok(config.modelCatalog, 'modelCatalog must be present');
  assert.ok(Array.isArray(config.modelCatalog), 'modelCatalog must be an array');
  assert.ok(config.rateLimits, 'rateLimits must be present');
});

// ---------------------------------------------------------------------------
// 16. toProviderConfig — includes v2 protocol by default
// ---------------------------------------------------------------------------

test('toProviderConfig includes v2 protocol by default', () => {
  const controller = createInferenceServiceController();
  const resource = makeInferenceService('default-protocol');
  const config = controller.toProviderConfig(resource, 'http://localhost:8080');

  assert.equal(config.protocol, 'v2', 'default protocol must be v2');
  assert.equal(config.featureFlags.v2_protocol, true, 'v2_protocol flag must be true');
  assert.equal(config.featureFlags.v1_protocol, false, 'v1_protocol flag must be false');
});

// ---------------------------------------------------------------------------
// 17. toProviderConfig — includes explainability flag when explainer present
// ---------------------------------------------------------------------------

test('toProviderConfig includes explainability flag when explainer present', () => {
  const controller = createInferenceServiceController();
  const resource = makeInferenceService('with-explainer', {
    explainer: { containers: [{ image: 'alibi:latest' }] }
  });
  const config = controller.toProviderConfig(resource, 'http://localhost:8080');

  assert.equal(config.featureFlags.explainability, true, 'explainability flag must be true when explainer present');
});

// ---------------------------------------------------------------------------
// 18. infer — sends V2 protocol request
// ---------------------------------------------------------------------------

test('infer sends V2 protocol request', async () => {
  const controller = createInferenceServiceController();
  let capturedUrl, capturedBody;
  const mockFetch = async (url, opts) => {
    capturedUrl = url;
    capturedBody = JSON.parse(opts.body);
    return { ok: true, json: async () => ({ outputs: [{ data: [1] }] }) };
  };

  const inputs = [{ name: 'input', shape: [1, 4], datatype: 'FP32', data: [5.1, 3.5, 1.4, 0.2] }];
  const result = await controller.infer('http://localhost:8080', 'iris-model', inputs, { fetchImpl: mockFetch });

  assert.ok(capturedUrl.includes('/v2/models/iris-model/infer'), 'must use V2 infer path');
  assert.ok(capturedBody.inputs, 'V2 body must contain inputs array');
  assert.equal(capturedBody.inputs[0].name, 'input', 'input name must match');
  assert.ok(result.outputs, 'result must contain outputs');
});

// ---------------------------------------------------------------------------
// 19. infer — sends V1 protocol request when specified
// ---------------------------------------------------------------------------

test('infer sends V1 protocol request when specified', async () => {
  const controller = createInferenceServiceController();
  let capturedUrl, capturedBody;
  const mockFetch = async (url, opts) => {
    capturedUrl = url;
    capturedBody = JSON.parse(opts.body);
    return { ok: true, json: async () => ({ predictions: [[1]] }) };
  };

  const inputs = [{ name: 'input', data: [5.1, 3.5, 1.4, 0.2] }];
  const result = await controller.infer('http://localhost:8080', 'iris-model', inputs, { protocol: 'v1', fetchImpl: mockFetch });

  assert.ok(capturedUrl.includes('/v1/models/iris-model:predict'), 'must use V1 predict path');
  assert.ok(capturedBody.instances, 'V1 body must contain instances array');
  assert.ok(result.predictions, 'result must contain predictions');
});

// ---------------------------------------------------------------------------
// 20. infer — includes auth token when provided
// ---------------------------------------------------------------------------

test('infer includes auth token when provided', async () => {
  const controller = createInferenceServiceController();
  let capturedHeaders;
  const mockFetch = async (url, opts) => {
    capturedHeaders = opts.headers;
    return { ok: true, json: async () => ({ outputs: [] }) };
  };

  await controller.infer('http://localhost:8080', 'model', [{ name: 'x', shape: [1], datatype: 'FP32', data: [1] }], {
    authToken: 'test-token-123',
    fetchImpl: mockFetch
  });

  assert.equal(capturedHeaders.Authorization, 'Bearer test-token-123', 'must include Authorization header');
});

// ---------------------------------------------------------------------------
// 21. infer — throws on non-ok response
// ---------------------------------------------------------------------------

test('infer throws on non-ok response', async () => {
  const controller = createInferenceServiceController();
  const mockFetch = async () => ({
    ok: false,
    status: 500,
    text: async () => 'Internal Server Error'
  });

  await assert.rejects(
    () => controller.infer('http://localhost:8080', 'model', [{ name: 'x', shape: [1], datatype: 'FP32', data: [1] }], { fetchImpl: mockFetch }),
    /Inference failed: 500/,
    'must throw on non-ok response'
  );
});

// ---------------------------------------------------------------------------
// 22. checkHealth — returns healthy for 200
// ---------------------------------------------------------------------------

test('checkHealth returns healthy for 200', async () => {
  const controller = createInferenceServiceController();
  const mockFetch = async () => ({ ok: true, status: 200 });
  const health = await controller.checkHealth('http://localhost:8080', { fetchImpl: mockFetch });

  assert.equal(health.healthy, true, 'must be healthy');
  assert.equal(health.status, 200, 'status must be 200');
});

// ---------------------------------------------------------------------------
// 23. checkHealth — returns unhealthy for timeout
// ---------------------------------------------------------------------------

test('checkHealth returns unhealthy for timeout', async () => {
  const controller = createInferenceServiceController();
  const mockFetch = async () => { throw new Error('timeout exceeded'); };
  const health = await controller.checkHealth('http://localhost:8080', { fetchImpl: mockFetch });

  assert.equal(health.healthy, false, 'must be unhealthy');
  assert.ok(health.error, 'error must be present');
  assert.ok(health.error.includes('timeout'), 'error must mention timeout');
});

// ---------------------------------------------------------------------------
// 24. getModelMetadata — returns model schema
// ---------------------------------------------------------------------------

test('getModelMetadata returns model schema', async () => {
  const controller = createInferenceServiceController();
  const mockMetadata = { name: 'iris', versions: ['1'], platform: 'sklearn', inputs: [], outputs: [] };
  const mockFetch = async () => ({ ok: true, json: async () => mockMetadata });
  const metadata = await controller.getModelMetadata('http://localhost:8080', 'iris', { fetchImpl: mockFetch });

  assert.deepEqual(metadata, mockMetadata, 'must return model metadata');
});

// ---------------------------------------------------------------------------
// 25. getModelMetadata — returns null for not found
// ---------------------------------------------------------------------------

test('getModelMetadata returns null for not found', async () => {
  const controller = createInferenceServiceController();
  const mockFetch = async () => ({ ok: false, status: 404 });
  const metadata = await controller.getModelMetadata('http://localhost:8080', 'missing', { fetchImpl: mockFetch });

  assert.equal(metadata, null, 'must return null for missing model');
});

// ---------------------------------------------------------------------------
// 26. listModels — returns available models
// ---------------------------------------------------------------------------

test('listModels returns available models', async () => {
  const controller = createInferenceServiceController();
  const mockFetch = async () => ({ ok: true, json: async () => ({ models: ['iris', 'resnet'] }) });
  const models = await controller.listModels('http://localhost:8080', { fetchImpl: mockFetch });

  assert.deepEqual(models, ['iris', 'resnet'], 'must return model list');
});

// ---------------------------------------------------------------------------
// 27. listModels — returns empty array on error
// ---------------------------------------------------------------------------

test('listModels returns empty array on error', async () => {
  const controller = createInferenceServiceController();
  const mockFetch = async () => { throw new Error('connection refused'); };
  const models = await controller.listModels('http://localhost:8080', { fetchImpl: mockFetch });

  assert.deepEqual(models, [], 'must return empty array on error');
});

// ---------------------------------------------------------------------------
// 28. SUPPORTED_MODEL_FORMATS includes all expected formats
// ---------------------------------------------------------------------------

test('SUPPORTED_MODEL_FORMATS includes all expected formats', () => {
  const expected = ['sklearn', 'xgboost', 'lightgbm', 'tensorflow', 'pytorch', 'onnx', 'triton', 'huggingface', 'custom'];
  for (const format of expected) {
    assert.ok(SUPPORTED_MODEL_FORMATS.includes(format), `must include "${format}"`);
  }
  assert.equal(SUPPORTED_MODEL_FORMATS.length, expected.length, 'must have exactly the expected number of formats');
});

// ---------------------------------------------------------------------------
// 29. KRADLE_INFERENCE_SERVICE_CONTROLLER_BOUNDARY exported with correct role
// ---------------------------------------------------------------------------

test('KRADLE_INFERENCE_SERVICE_CONTROLLER_BOUNDARY is exported with correct role', () => {
  assert.ok(KRADLE_INFERENCE_SERVICE_CONTROLLER_BOUNDARY, 'BOUNDARY must be exported');
  assert.equal(KRADLE_INFERENCE_SERVICE_CONTROLLER_BOUNDARY.role, 'kradle-inference-service-controller', 'role must match');
  assert.ok(Array.isArray(KRADLE_INFERENCE_SERVICE_CONTROLLER_BOUNDARY.owns), 'must declare owned concerns');
});

// ---------------------------------------------------------------------------
// 30. KSERVE_API_GROUP and KSERVE_API_VERSION exports
// ---------------------------------------------------------------------------

test('KSERVE_API_GROUP and KSERVE_API_VERSION are exported correctly', () => {
  assert.equal(KSERVE_API_GROUP, 'serving.kserve.io', 'KSERVE_API_GROUP must be serving.kserve.io');
  assert.equal(KSERVE_API_VERSION, 'v1beta1', 'KSERVE_API_VERSION must be v1beta1');
});

// ---------------------------------------------------------------------------
// 31. INFERENCE_PROTOCOLS exports
// ---------------------------------------------------------------------------

test('INFERENCE_PROTOCOLS exports V1 and V2', () => {
  assert.equal(INFERENCE_PROTOCOLS.V1, 'v1', 'V1 must be v1');
  assert.equal(INFERENCE_PROTOCOLS.V2, 'v2', 'V2 must be v2');
});

// ---------------------------------------------------------------------------
// 32. validateKradleInferenceService standalone export
// ---------------------------------------------------------------------------

test('validateKradleInferenceService standalone export works', () => {
  assert.equal(typeof validateKradleInferenceService, 'function', 'must be a named export');
  const resource = makeInferenceService('standalone-test');
  const result = validateKradleInferenceService(resource);
  assert.equal(result.valid, true, 'valid resource must pass standalone validation');
});

// ---------------------------------------------------------------------------
// 33. validate — accepts all supported model formats
// ---------------------------------------------------------------------------

test('validate accepts all supported model formats', () => {
  const controller = createInferenceServiceController();
  for (const format of SUPPORTED_MODEL_FORMATS) {
    const resource = makeInferenceService(`${format}-service`, { modelFormat: format });
    const result = controller.validate(resource);
    assert.equal(result.valid, true, `modelFormat "${format}" must pass validation`);
  }
});

// ---------------------------------------------------------------------------
// 34. toProviderConfig — v1 protocol flags
// ---------------------------------------------------------------------------

test('toProviderConfig respects v1 protocol setting', () => {
  const controller = createInferenceServiceController();
  const resource = makeInferenceService('v1-model', { inferenceProtocol: 'v1' });
  const config = controller.toProviderConfig(resource, 'http://localhost:8080');

  assert.equal(config.protocol, 'v1', 'protocol must be v1');
  assert.equal(config.featureFlags.v1_protocol, true, 'v1_protocol flag must be true');
  assert.equal(config.featureFlags.v2_protocol, false, 'v2_protocol flag must be false');
});

// ---------------------------------------------------------------------------
// 35. generateKServeManifest — includes runtime when specified
// ---------------------------------------------------------------------------

test('generateKServeManifest includes runtime when specified', () => {
  const controller = createInferenceServiceController();
  const resource = makeInferenceService('with-runtime', { runtime: 'kserve-tritonserver' });
  const manifest = controller.generateKServeManifest(resource);

  assert.equal(manifest.spec.predictor.runtime, 'kserve-tritonserver', 'runtime must be set in predictor');
});

// ---------------------------------------------------------------------------
// 36. generateKServeManifest — omits runtime when not specified
// ---------------------------------------------------------------------------

test('generateKServeManifest omits runtime when not specified', () => {
  const controller = createInferenceServiceController();
  const resource = makeInferenceService('no-runtime');
  const manifest = controller.generateKServeManifest(resource);

  assert.equal(manifest.spec.predictor.runtime, undefined, 'runtime must not be present');
});

// ---------------------------------------------------------------------------
// 37. getSupportedModelFormats — returns copy of formats
// ---------------------------------------------------------------------------

test('getSupportedModelFormats returns supported model formats', () => {
  const controller = createInferenceServiceController();
  const formats = controller.getSupportedModelFormats();

  assert.ok(Array.isArray(formats), 'must return an array');
  assert.equal(formats.length, SUPPORTED_MODEL_FORMATS.length, 'must contain all formats');
  assert.ok(formats.includes('sklearn'), 'must include sklearn');
  assert.ok(formats.includes('pytorch'), 'must include pytorch');
  // Verify it returns a copy, not the original
  formats.push('extra');
  assert.equal(SUPPORTED_MODEL_FORMATS.length, 9, 'must not modify original array');
});

// ---------------------------------------------------------------------------
// 38. validate — rejects missing organizationRef
// ---------------------------------------------------------------------------

test('validate rejects missing organizationRef', () => {
  const controller = createInferenceServiceController();
  const resource = {
    apiVersion: 'kradle.a5c.ai/v1alpha1',
    kind: 'KradleInferenceService',
    metadata: { name: 'no-org', namespace: 'default', labels: {}, annotations: {} },
    spec: { modelFormat: 'sklearn', storageUri: 's3://models/test' },
    status: {}
  };
  const result = controller.validate(resource);

  assert.equal(result.valid, false, 'missing organizationRef must fail');
  assert.ok(result.errors.some(e => /organizationRef/i.test(e)), 'error must mention organizationRef');
});

// ---------------------------------------------------------------------------
// 39. validate — accepts pvc:// storageUri
// ---------------------------------------------------------------------------

test('validate accepts pvc:// storageUri', () => {
  const controller = createInferenceServiceController();
  const resource = makeInferenceService('pvc-model', { storageUri: 'pvc://model-volume/path' });
  const result = controller.validate(resource);
  assert.equal(result.valid, true, 'pvc:// URI must be valid');
});

// ---------------------------------------------------------------------------
// 40. validate — accepts https:// storageUri
// ---------------------------------------------------------------------------

test('validate accepts https:// storageUri', () => {
  const controller = createInferenceServiceController();
  const resource = makeInferenceService('https-model', { storageUri: 'https://huggingface.co/models/bert' });
  const result = controller.validate(resource);
  assert.equal(result.valid, true, 'https:// URI must be valid');
});

// ---------------------------------------------------------------------------
// 41. validate — accepts gs:// storageUri
// ---------------------------------------------------------------------------

test('validate accepts gs:// storageUri', () => {
  const controller = createInferenceServiceController();
  const resource = makeInferenceService('gcs-model', { storageUri: 'gs://bucket/models/sklearn/iris' });
  const result = controller.validate(resource);
  assert.equal(result.valid, true, 'gs:// URI must be valid');
});

// ---------------------------------------------------------------------------
// 42. resolveEndpoint — uses default namespace when not specified
// ---------------------------------------------------------------------------

test('resolveEndpoint uses default namespace when not specified', () => {
  const controller = createInferenceServiceController();
  const isvc = {
    metadata: { name: 'my-model' },
    status: {}
  };
  const endpoint = controller.resolveEndpoint(isvc);
  assert.equal(endpoint, 'http://my-model.default.svc.cluster.local', 'must use default namespace');
});

// ---------------------------------------------------------------------------
// 43. toProviderConfig — includes streaming feature flag from spec
// ---------------------------------------------------------------------------

test('toProviderConfig includes streaming feature flag from spec', () => {
  const controller = createInferenceServiceController();
  const resource = makeInferenceService('streaming-model', {
    featureFlags: { streaming: true, batchInference: true }
  });
  const config = controller.toProviderConfig(resource, 'http://localhost:8080');

  assert.equal(config.featureFlags.streaming, true, 'streaming must be true');
  assert.equal(config.featureFlags.batch_inference, true, 'batch_inference must be true');
});

// ---------------------------------------------------------------------------
// 44. toProviderConfig — uses custom model catalog when provided
// ---------------------------------------------------------------------------

test('toProviderConfig uses custom model catalog when provided', () => {
  const controller = createInferenceServiceController();
  const customCatalog = [{ name: 'v1', framework: 'sklearn' }, { name: 'v2', framework: 'xgboost' }];
  const resource = makeInferenceService('multi-model', { modelCatalog: customCatalog });
  const config = controller.toProviderConfig(resource, 'http://localhost:8080');

  assert.deepEqual(config.modelCatalog, customCatalog, 'must use custom model catalog');
});

// ---------------------------------------------------------------------------
// 45. KradleInferenceService resource creation via createResource
// ---------------------------------------------------------------------------

test('KradleInferenceService can be created via createResource', () => {
  const resource = createResource('KradleInferenceService', { name: 'test-isvc', namespace: 'kradle-org-default' }, {
    organizationRef: 'default',
    modelFormat: 'tensorflow',
    storageUri: 's3://models/tf/bert'
  });

  assert.equal(resource.kind, 'KradleInferenceService', 'kind must match');
  assert.equal(resource.apiVersion, 'kradle.a5c.ai/v1alpha1', 'apiVersion must match');
  assert.equal(resource.spec.modelFormat, 'tensorflow', 'modelFormat must be set');
});

// ---------------------------------------------------------------------------
// 46. KradleServingRuntime resource creation via createResource
// ---------------------------------------------------------------------------

test('KradleServingRuntime can be created via createResource', () => {
  const resource = createResource('KradleServingRuntime', { name: 'triton-rt', namespace: 'kradle-org-default' }, {
    organizationRef: 'default',
    supportedModelFormats: [{ name: 'onnx', version: '1' }],
    containers: [{ name: 'triton', image: 'nvcr.io/nvidia/tritonserver:latest' }]
  });

  assert.equal(resource.kind, 'KradleServingRuntime', 'kind must match');
  assert.equal(resource.apiVersion, 'kradle.a5c.ai/v1alpha1', 'apiVersion must match');
  assert.ok(Array.isArray(resource.spec.supportedModelFormats), 'supportedModelFormats must be array');
  assert.ok(Array.isArray(resource.spec.containers), 'containers must be array');
});
