// Agent Gateway Config Controller — Slice 1.2e
// Manages AgentGatewayConfig resources: gateway name, endpoint URL, feature flags,
// connection pool settings, and TLS configuration reference.

export const AGENT_GATEWAY_CONFIG_CONTROLLER_BOUNDARY = {
  role: 'agent-gateway-config-controller',
  scope: 'AgentGatewayConfig lifecycle: validation, endpoint resolution, feature flags, connection pool, TLS config ref',
  owns: ['gateway config validation', 'endpoint URL', 'feature flags', 'connection pool defaults', 'TLS config ref'],
  delegatesTo: ['resource-model'],
  mustNotOwn: ['secret values', 'dispatch execution', 'Agent Mux sessions', 'adapter implementation']
};

const DEFAULT_FEATURE_FLAGS = Object.freeze({
  streaming: true,
  reconnect: true,
  healthCheck: true
});

const DEFAULT_POOL_SETTINGS = Object.freeze({
  maxConnections: 10,
  timeoutMs: 30000
});

/**
 * Validate an AgentGatewayConfig resource. Returns { valid, errors }.
 * @param {object} resource
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAgentGatewayConfig(resource) {
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

  // Validate organizationRef
  if (!spec.organizationRef) {
    errors.push('spec.organizationRef is required');
  }

  // Validate endpoint URL
  if (!spec.endpointUrl) {
    errors.push('spec.endpointUrl is required; provide the Agent Mux gateway endpoint URL');
  } else {
    // Basic URL validation: must start with http:// or https:// or ws:// or wss://
    const validProtocols = ['http://', 'https://', 'ws://', 'wss://'];
    const hasValidProtocol = validProtocols.some((p) => spec.endpointUrl.startsWith(p));
    if (!hasValidProtocol) {
      errors.push(`spec.endpointUrl must start with one of: ${validProtocols.join(', ')}`);
    }
  }

  // Validate connectionPool if provided
  const pool = spec.connectionPool;
  if (pool != null) {
    if (pool.maxConnections != null && (!Number.isInteger(pool.maxConnections) || pool.maxConnections < 1)) {
      errors.push('spec.connectionPool.maxConnections must be a positive integer');
    }
    if (pool.timeoutMs != null && (!Number.isFinite(pool.timeoutMs) || pool.timeoutMs < 0)) {
      errors.push('spec.connectionPool.timeoutMs must be a non-negative number');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Factory that returns an AgentGatewayConfig controller instance.
 */
export function createAgentGatewayConfigController() {
  return {
    role: 'agent-gateway-config-controller',

    /**
     * Validate an AgentGatewayConfig resource.
     * @param {object} resource
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validate(resource) {
      return validateAgentGatewayConfig(resource);
    },

    /**
     * Return the effective endpoint URL for the gateway config.
     * @param {object} resource
     * @returns {string}
     */
    getEndpointUrl(resource) {
      if (resource == null) {
        throw new Error('resource must not be null or undefined');
      }
      return resource?.spec?.endpointUrl ?? null;
    },

    /**
     * Return the effective feature flags for a gateway config.
     * Merges spec.featureFlags with defaults; spec values take precedence.
     * @param {object} resource
     * @returns {{ streaming: boolean, reconnect: boolean, healthCheck: boolean, [key: string]: boolean }}
     */
    getFeatureFlags(resource) {
      if (resource == null) {
        throw new Error('resource must not be null or undefined');
      }
      const specFlags = resource?.spec?.featureFlags ?? {};
      return { ...DEFAULT_FEATURE_FLAGS, ...specFlags };
    },

    /**
     * Return the effective connection pool settings for a gateway config.
     * Merges spec.connectionPool with defaults; spec values take precedence.
     * @param {object} resource
     * @returns {{ maxConnections: number, timeoutMs: number }}
     */
    getConnectionPool(resource) {
      if (resource == null) {
        throw new Error('resource must not be null or undefined');
      }
      const specPool = resource?.spec?.connectionPool ?? {};
      return {
        maxConnections: specPool.maxConnections ?? DEFAULT_POOL_SETTINGS.maxConnections,
        timeoutMs: specPool.timeoutMs ?? DEFAULT_POOL_SETTINGS.timeoutMs
      };
    },

    /**
     * Return the TLS configuration reference from the spec, or null if not set.
     * @param {object} resource
     * @returns {string|null}
     */
    getTlsConfigRef(resource) {
      if (resource == null) {
        throw new Error('resource must not be null or undefined');
      }
      return resource?.spec?.tlsConfigRef ?? null;
    }
  };
}
