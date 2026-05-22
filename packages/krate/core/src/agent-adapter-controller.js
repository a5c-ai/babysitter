// Agent Adapter Controller — Slice 1.2a / C4
// Manages AgentAdapter resources: validation, capabilities, transports, and health checks.

export const AGENT_ADAPTER_CONTROLLER_BOUNDARY = {
  role: 'agent-adapter-controller',
  scope: 'AgentAdapter lifecycle: validation, capabilities matrix, transport enumeration, real health checks',
  owns: ['adapter validation', 'capabilities matrix', 'transport enumeration', 'health checks'],
  delegatesTo: ['resource-model'],
  mustNotOwn: ['secret values', 'dispatch execution', 'Agent Mux sessions']
};

const HEALTH_CHECK_TIMEOUT_MS = 3000;

const VALID_TRANSPORTS = ['stdio', 'http', 'websocket', 'unix'];
const VALID_ADAPTER_TYPES = ['subprocess', 'remote', 'programmatic'];

/**
 * Validate an AgentAdapter resource. Returns { valid, errors }.
 * @param {object} resource
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAgentAdapter(resource) {
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

  // Validate adapterType
  const adapterType = spec.adapterType;
  if (!adapterType) {
    errors.push(`spec.adapterType is required; valid types are: ${VALID_ADAPTER_TYPES.join(', ')}`);
  } else if (!VALID_ADAPTER_TYPES.includes(adapterType)) {
    errors.push(`spec.adapterType "${adapterType}" is not supported; valid types are: ${VALID_ADAPTER_TYPES.join(', ')}`);
  }

  // Validate transport
  const transport = spec.transport;
  if (!transport) {
    errors.push(`spec.transport is required; valid transports are: ${VALID_TRANSPORTS.join(', ')}`);
  } else if (!VALID_TRANSPORTS.includes(transport)) {
    errors.push(`spec.transport "${transport}" is not supported; valid transports are: ${VALID_TRANSPORTS.join(', ')}`);
  }

  // Validate capabilities — must be a non-empty array
  const capabilities = spec.capabilities;
  if (!Array.isArray(capabilities) || capabilities.length === 0) {
    errors.push('spec.capabilities must be a non-empty array');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Perform an HTTP health check against the given URL.
 * Returns { status: 'healthy'|'unhealthy', latencyMs, error? }.
 * @param {string} url
 * @param {Function} fetchFn - injectable fetch (defaults to globalThis.fetch)
 * @returns {Promise<{ status: string, latencyMs: number, error?: string }>}
 */
async function performHttpHealthCheck(url, fetchFn) {
  const fn = fetchFn || globalThis.fetch;
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
    let response;
    try {
      response = await fn(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
    const latencyMs = Date.now() - start;
    if (response.ok) {
      return { status: 'healthy', latencyMs };
    }
    return { status: 'unhealthy', latencyMs, error: `HTTP ${response.status}` };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return { status: 'unhealthy', latencyMs, error: err.message || String(err) };
  }
}

/**
 * Factory that returns an AgentAdapter controller instance.
 * @param {object} [options]
 * @param {Function} [options.fetch] - injectable fetch function (for testing)
 */
export function createAgentAdapterController(options = {}) {
  const fetchFn = options.fetch || null;
  return {
    role: 'agent-adapter-controller',

    /**
     * Validate an AgentAdapter resource.
     * @param {object} resource
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validate(resource) {
      return validateAgentAdapter(resource);
    },

    /**
     * Return the capabilities matrix for an adapter.
     * @param {object} resource
     * @returns {{ adapterName: string, supported: string[] }}
     */
    getCapabilities(resource) {
      if (resource == null) {
        throw new Error('resource must not be null or undefined');
      }
      const supported = Array.isArray(resource?.spec?.capabilities)
        ? [...resource.spec.capabilities]
        : [];
      return {
        adapterName: resource?.metadata?.name,
        supported
      };
    },

    /**
     * Return the list of supported transport types.
     * @returns {string[]}
     */
    getSupportedTransports() {
      return [...VALID_TRANSPORTS];
    },

    /**
     * Return the list of supported adapter types.
     * @returns {string[]}
     */
    getSupportedAdapterTypes() {
      return [...VALID_ADAPTER_TYPES];
    },

    /**
     * Perform a health check for an AgentAdapter.
     * If no healthEndpoint is configured in spec, returns { status: 'unknown', reason: 'no-endpoint' }.
     * If a healthEndpoint is configured, performs a real HTTP GET with a 3s timeout.
     * Returns { status: 'healthy'|'unhealthy', latencyMs, error? } or { status: 'unknown', reason }.
     * @param {object} resource
     * @returns {Promise<{ adapterName: string, status: string, latencyMs?: number, reason?: string, error?: string }>}
     */
    async healthCheck(resource) {
      if (resource == null) {
        throw new Error('resource must not be null or undefined');
      }
      const adapterName = resource?.metadata?.name;
      const endpoint = resource?.spec?.healthEndpoint;

      if (!endpoint) {
        return { adapterName, status: 'unknown', reason: 'no-endpoint' };
      }

      const checkResult = await performHttpHealthCheck(endpoint, fetchFn);
      return { adapterName, ...checkResult };
    }
  };
}
