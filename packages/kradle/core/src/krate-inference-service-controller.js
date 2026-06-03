// KServe Inference Service Controller
// Manages KradleInferenceService and KradleServingRuntime resources:
// validation, KServe manifest generation, endpoint resolution,
// provider config bridge, inference calls, and health checks.

export const KSERVE_API_GROUP = 'serving.kserve.io';
export const KSERVE_API_VERSION = 'v1beta1';

export const SUPPORTED_MODEL_FORMATS = [
  'sklearn', 'xgboost', 'lightgbm', 'tensorflow', 'pytorch',
  'onnx', 'triton', 'huggingface', 'custom'
];

export const INFERENCE_PROTOCOLS = { V1: 'v1', V2: 'v2' };

export const KRADLE_INFERENCE_SERVICE_CONTROLLER_BOUNDARY = {
  role: 'kradle-inference-service-controller',
  scope: 'KradleInferenceService lifecycle: validation, KServe manifest generation, endpoint resolution, provider config bridge, inference calls',
  owns: ['inference service validation', 'KServe manifest generation', 'endpoint resolution', 'provider config bridge', 'inference protocol handling', 'health checks'],
  delegatesTo: ['resource-model', 'agent-provider-config-controller'],
  mustNotOwn: ['secret values', 'Kubernetes Job execution', 'model training', 'data pipeline orchestration']
};

/**
 * Validate a KradleInferenceService resource. Returns { valid, errors }.
 * @param {object} resource
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateKradleInferenceService(resource) {
  const errors = [];

  if (resource == null) {
    errors.push('resource must not be null or undefined');
    return { valid: false, errors };
  }

  if (!resource?.metadata?.name) {
    errors.push('metadata.name is required');
  }

  const spec = resource?.spec || {};

  if (!spec.organizationRef) {
    errors.push('spec.organizationRef is required');
  }

  // Validate modelFormat
  const modelFormat = spec.modelFormat;
  if (!modelFormat) {
    errors.push(`spec.modelFormat is required; supported formats are: ${SUPPORTED_MODEL_FORMATS.join(', ')}`);
  } else if (!SUPPORTED_MODEL_FORMATS.includes(modelFormat)) {
    errors.push(`spec.modelFormat "${modelFormat}" is not supported; supported formats are: ${SUPPORTED_MODEL_FORMATS.join(', ')}`);
  }

  // Validate storageUri
  const storageUri = spec.storageUri;
  if (!storageUri) {
    errors.push('spec.storageUri is required; use s3://, gs://, pvc://, or http(s):// URI');
  } else if (!/^(s3|gs|pvc|https?):\/\/.+/.test(storageUri)) {
    errors.push(`spec.storageUri "${storageUri}" must use s3://, gs://, pvc://, or http(s):// scheme`);
  }

  // Validate inferenceProtocol if set
  if (spec.inferenceProtocol && !['v1', 'v2'].includes(spec.inferenceProtocol)) {
    errors.push(`spec.inferenceProtocol "${spec.inferenceProtocol}" is not supported; valid values are: v1, v2`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Factory that returns a KradleInferenceService controller instance.
 */
export function createInferenceServiceController() {
  return {
    role: 'kradle-inference-service-controller',

    /**
     * Validate a KradleInferenceService resource.
     * @param {object} resource
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validate(resource) {
      return validateKradleInferenceService(resource);
    },

    /**
     * Generate the native KServe InferenceService manifest from a KradleInferenceService.
     * @param {object} kradleResource
     * @returns {object}
     */
    generateKServeManifest(kradleResource) {
      const spec = kradleResource?.spec || {};
      const metadata = kradleResource?.metadata || {};

      return {
        apiVersion: `${KSERVE_API_GROUP}/${KSERVE_API_VERSION}`,
        kind: 'InferenceService',
        metadata: {
          name: metadata.name,
          namespace: metadata.namespace,
          labels: {
            'kradle.a5c.ai/managed': 'true',
            'kradle.a5c.ai/org': spec.organizationRef
          }
        },
        spec: {
          predictor: {
            modelFormat: { name: spec.modelFormat, version: spec.modelVersion || '0' },
            storageUri: spec.storageUri,
            ...(spec.runtime ? { runtime: spec.runtime } : {}),
            resources: spec.resources || { limits: { cpu: '1', memory: '2Gi' } }
          },
          ...(spec.transformer ? { transformer: spec.transformer } : {}),
          ...(spec.explainer ? { explainer: spec.explainer } : {})
        }
      };
    },

    /**
     * Resolve the inference endpoint from an InferenceService status object.
     * Falls back to a cluster-internal URL if status URL is not available.
     * @param {object} inferenceService - KServe InferenceService object with status
     * @returns {string}
     */
    resolveEndpoint(inferenceService) {
      const url = inferenceService?.status?.url || inferenceService?.status?.address?.url;
      if (url) return url;
      const name = inferenceService?.metadata?.name;
      const ns = inferenceService?.metadata?.namespace || 'default';
      return `http://${name}.${ns}.svc.cluster.local`;
    },

    /**
     * Generate provider config that agents can use to call this inference service.
     * @param {object} kradleResource
     * @param {string} resolvedEndpoint
     * @returns {object}
     */
    toProviderConfig(kradleResource, resolvedEndpoint) {
      const spec = kradleResource?.spec || {};
      const metadata = kradleResource?.metadata || {};

      return {
        providerType: 'kserve',
        endpoint: resolvedEndpoint,
        protocol: spec.inferenceProtocol || 'v2',
        modelCatalog: spec.modelCatalog || [{ name: metadata.name, framework: spec.modelFormat }],
        featureFlags: {
          v1_protocol: spec.inferenceProtocol === 'v1',
          v2_protocol: spec.inferenceProtocol !== 'v1',
          streaming: spec.featureFlags?.streaming || false,
          batch_inference: spec.featureFlags?.batchInference || false,
          explainability: !!spec.explainer
        },
        rateLimits: spec.rateLimits || { inferenceRequestsPerMinute: 1000 }
      };
    },

    /**
     * Call the inference endpoint using V1 or V2 protocol.
     * @param {string} endpoint
     * @param {string} modelName
     * @param {Array} inputs
     * @param {object} options
     * @returns {Promise<object>}
     */
    async infer(endpoint, modelName, inputs, options = {}) {
      const protocol = options.protocol || 'v2';
      const path = protocol === 'v2'
        ? `/v2/models/${modelName}/infer`
        : `/v1/models/${modelName}:predict`;

      const body = protocol === 'v2'
        ? { inputs: inputs.map(i => ({ name: i.name, shape: i.shape, datatype: i.datatype, data: i.data })) }
        : { instances: inputs.map(i => i.data) };

      const fetchImpl = options.fetchImpl || globalThis.fetch;
      const res = await fetchImpl(`${endpoint}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options.authToken ? { Authorization: `Bearer ${options.authToken}` } : {})
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error(`Inference failed: ${res.status} ${await res.text()}`);
      return res.json();
    },

    /**
     * Check if the inference endpoint is healthy.
     * @param {string} endpoint
     * @param {object} options
     * @returns {Promise<{ healthy: boolean, status?: number, error?: string }>}
     */
    async checkHealth(endpoint, options = {}) {
      const fetchImpl = options.fetchImpl || globalThis.fetch;
      try {
        const res = await fetchImpl(`${endpoint}/v2/health/ready`, { signal: AbortSignal.timeout(3000) });
        return { healthy: res.ok, status: res.status };
      } catch (err) {
        return { healthy: false, error: err.message };
      }
    },

    /**
     * Get model metadata from the inference endpoint.
     * @param {string} endpoint
     * @param {string} modelName
     * @param {object} options
     * @returns {Promise<object|null>}
     */
    async getModelMetadata(endpoint, modelName, options = {}) {
      const fetchImpl = options.fetchImpl || globalThis.fetch;
      const res = await fetchImpl(`${endpoint}/v2/models/${modelName}`);
      if (!res.ok) return null;
      return res.json();
    },

    /**
     * List available models from the inference endpoint.
     * @param {string} endpoint
     * @param {object} options
     * @returns {Promise<string[]>}
     */
    async listModels(endpoint, options = {}) {
      const fetchImpl = options.fetchImpl || globalThis.fetch;
      try {
        const res = await fetchImpl(`${endpoint}/v2/models`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.models || [];
      } catch { return []; }
    },

    /**
     * Return the list of supported model formats.
     * @returns {string[]}
     */
    getSupportedModelFormats() {
      return [...SUPPORTED_MODEL_FORMATS];
    }
  };
}
