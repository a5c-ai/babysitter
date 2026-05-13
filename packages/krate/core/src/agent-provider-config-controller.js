// Agent Provider Config Controller — Slice 1.2c
// Manages AgentProviderConfig resources: model provider config validation,
// endpoint resolution, credential ref validation, and feature flag management.

export const AGENT_PROVIDER_CONFIG_CONTROLLER_BOUNDARY = {
  role: 'agent-provider-config-controller',
  scope: 'AgentProviderConfig lifecycle: validation, endpoint resolution, credential ref validation, feature flags',
  owns: ['provider config validation', 'endpoint resolution', 'credential ref validation', 'feature flag defaults', 'rate limit defaults'],
  delegatesTo: ['resource-model'],
  mustNotOwn: ['secret values', 'dispatch execution', 'Agent Mux sessions', 'adapter implementation']
};

const VALID_PROVIDER_TYPES = ['anthropic', 'openai', 'azure-openai', 'google-vertex', 'foundry', 'custom'];

const DEFAULT_ENDPOINTS = Object.freeze({
  anthropic: 'https://api.anthropic.com/v1',
  openai: 'https://api.openai.com/v1',
  'azure-openai': null,   // requires explicit endpoint (tenant-specific)
  'google-vertex': 'https://us-central1-aiplatform.googleapis.com/v1',
  foundry: null,          // requires explicit endpoint
  custom: null            // requires explicit endpoint
});

const DEFAULT_FEATURE_FLAGS = Object.freeze({
  streaming: true,
  tool_use: true,
  vision: false
});

const DEFAULT_RATE_LIMITS = Object.freeze({
  requestsPerMinute: 60,
  tokensPerMinute: 100000
});

/**
 * Validate an AgentProviderConfig resource. Returns { valid, errors }.
 * @param {object} resource
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAgentProviderConfig(resource) {
  const errors = [];

  // Guard against null/undefined resource
  if (resource == null) {
    errors.push('resource must not be null or undefined');
    return { valid: false, errors };
  }

  // Validate metadata.name
  if (!resource?.metadata?.name) {
    errors.push('metadata.name is required');
  }

  const spec = resource?.spec || {};

  // Validate providerType
  const providerType = spec.providerType;
  if (!providerType) {
    errors.push(`spec.providerType is required; valid types are: ${VALID_PROVIDER_TYPES.join(', ')}`);
  } else if (!VALID_PROVIDER_TYPES.includes(providerType)) {
    errors.push(`spec.providerType "${providerType}" is not supported; valid types are: ${VALID_PROVIDER_TYPES.join(', ')}`);
  }

  // Validate credentialRef — always required for security
  if (!spec.credentialRef) {
    errors.push('spec.credentialRef is required; provide a Kubernetes Secret name for the API key');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Factory that returns an AgentProviderConfig controller instance.
 */
export function createAgentProviderConfigController() {
  return {
    role: 'agent-provider-config-controller',

    /**
     * Validate an AgentProviderConfig resource.
     * @param {object} resource
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validate(resource) {
      return validateAgentProviderConfig(resource);
    },

    /**
     * Resolve the effective API endpoint for a provider config.
     * Returns the explicit spec.endpoint if set, otherwise falls back to
     * the well-known default for the provider type.
     * @param {object} resource
     * @returns {string|null}
     */
    resolveEndpoint(resource) {
      if (resource == null) {
        throw new Error('resource must not be null or undefined');
      }
      const spec = resource?.spec || {};

      // If an explicit endpoint is set in spec, prefer it
      if (spec.endpoint) {
        return spec.endpoint;
      }

      // Fall back to the known default for the provider type
      const providerType = spec.providerType;
      return DEFAULT_ENDPOINTS[providerType] ?? null;
    },

    /**
     * Return the effective feature flags for a provider config.
     * Merges spec.featureFlags with defaults; spec values take precedence.
     * @param {object} resource
     * @returns {{ streaming: boolean, tool_use: boolean, vision: boolean, [key: string]: boolean }}
     */
    getFeatureFlags(resource) {
      if (resource == null) {
        throw new Error('resource must not be null or undefined');
      }
      const specFlags = resource?.spec?.featureFlags ?? {};
      return { ...DEFAULT_FEATURE_FLAGS, ...specFlags };
    },

    /**
     * Return the effective rate limit configuration for a provider config.
     * Merges spec.rateLimits with defaults; spec values take precedence.
     * @param {object} resource
     * @returns {{ requestsPerMinute: number, tokensPerMinute: number }}
     */
    getRateLimits(resource) {
      if (resource == null) {
        throw new Error('resource must not be null or undefined');
      }
      const specLimits = resource?.spec?.rateLimits ?? {};
      return {
        requestsPerMinute: specLimits.requestsPerMinute ?? DEFAULT_RATE_LIMITS.requestsPerMinute,
        tokensPerMinute: specLimits.tokensPerMinute ?? DEFAULT_RATE_LIMITS.tokensPerMinute
      };
    },

    /**
     * Return the list of supported provider types.
     * @returns {string[]}
     */
    getSupportedProviderTypes() {
      return [...VALID_PROVIDER_TYPES];
    }
  };
}
