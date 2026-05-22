// Agent Transport Binding Controller — Slice 1.2b
// Manages AgentTransportBinding resources: connection config validation,
// health status tracking, and reconnect policy enforcement.

export const AGENT_TRANSPORT_BINDING_CONTROLLER_BOUNDARY = {
  role: 'agent-transport-binding-controller',
  scope: 'AgentTransportBinding lifecycle: validation, connection status tracking, reconnect policy enforcement',
  owns: ['binding validation', 'connection status tracking', 'reconnect policy enforcement'],
  delegatesTo: ['resource-model', 'agent-adapter-controller'],
  mustNotOwn: ['secret values', 'dispatch execution', 'Agent Mux sessions', 'adapter implementation']
};

const VALID_PROTOCOLS = ['stdio', 'http', 'websocket', 'unix'];

const DEFAULT_RECONNECT_POLICY = Object.freeze({
  maxRetries: 3,
  backoffMs: 1000,
  maxBackoffMs: 30000
});

/**
 * Validate an AgentTransportBinding resource. Returns { valid, errors }.
 * @param {object} resource
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAgentTransportBinding(resource) {
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

  // Validate adapterRef
  if (!spec.adapterRef) {
    errors.push('spec.adapterRef is required');
  }

  // Validate endpoint
  if (!spec.endpoint) {
    errors.push('spec.endpoint is required');
  }

  // Validate protocol
  const protocol = spec.protocol;
  if (!protocol) {
    errors.push(`spec.protocol is required; valid protocols are: ${VALID_PROTOCOLS.join(', ')}`);
  } else if (!VALID_PROTOCOLS.includes(protocol)) {
    errors.push(`spec.protocol "${protocol}" is not supported; valid protocols are: ${VALID_PROTOCOLS.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Factory that returns an AgentTransportBinding controller instance.
 */
export function createAgentTransportBindingController() {
  return {
    role: 'agent-transport-binding-controller',

    /**
     * Validate an AgentTransportBinding resource.
     * @param {object} resource
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validate(resource) {
      return validateAgentTransportBinding(resource);
    },

    /**
     * Return the current connection status for a transport binding.
     * Reads from resource.status.connectionStatus when available,
     * otherwise returns 'unknown'.
     * @param {object} resource
     * @returns {{ bindingName: string, connectionStatus: string }}
     */
    getConnectionStatus(resource) {
      if (resource == null) {
        throw new Error('resource must not be null or undefined');
      }
      const bindingName = resource?.metadata?.name;
      const connectionStatus = resource?.status?.connectionStatus ?? 'unknown';
      return { bindingName, connectionStatus };
    },

    /**
     * Return the reconnect policy for a transport binding.
     * Merges spec.reconnectPolicy values with defaults.
     * @param {object} resource
     * @returns {{ maxRetries: number, backoffMs: number, maxBackoffMs: number }}
     */
    getReconnectPolicy(resource) {
      if (resource == null) {
        throw new Error('resource must not be null or undefined');
      }
      const specPolicy = resource?.spec?.reconnectPolicy ?? {};
      return {
        maxRetries: specPolicy.maxRetries ?? DEFAULT_RECONNECT_POLICY.maxRetries,
        backoffMs: specPolicy.backoffMs ?? DEFAULT_RECONNECT_POLICY.backoffMs,
        maxBackoffMs: specPolicy.maxBackoffMs ?? DEFAULT_RECONNECT_POLICY.maxBackoffMs
      };
    },

    /**
     * Return the list of supported protocol types.
     * @returns {string[]}
     */
    getSupportedProtocols() {
      return [...VALID_PROTOCOLS];
    }
  };
}
