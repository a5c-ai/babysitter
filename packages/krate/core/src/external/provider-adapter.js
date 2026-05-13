// External Provider Adapter — Slice 3.2
// Defines the ExternalProviderAdapter contract and ProviderRegistry.
//
// Each provider (GitHub, GitLab, Gitea, etc.) implements this interface to
// integrate with the Krate platform.

/**
 * Valid optional interface keys that a provider adapter may implement.
 */
const VALID_INTERFACES = ['issueTracking', 'cicd', 'gitForge'];

/**
 * Valid health status values returned by health().
 */
const VALID_HEALTH_STATUSES = ['healthy', 'degraded', 'unavailable'];

// ---------------------------------------------------------------------------
// Provider Registry
// ---------------------------------------------------------------------------

/**
 * Create a provider registry that stores and retrieves ExternalProviderAdapter
 * instances by provider type string.
 *
 * @returns {{ register(type: string, adapter: object): void, get(type: string): object|null, list(): string[] }}
 */
export function createProviderRegistry() {
  /** @type {Map<string, object>} */
  const adapters = new Map();

  return {
    /**
     * Register a provider adapter under the given type key.
     * Re-registering the same type replaces the existing adapter.
     * @param {string} type
     * @param {object} adapter
     */
    register(type, adapter) {
      adapters.set(type, adapter);
    },

    /**
     * Retrieve a registered adapter by provider type, or null if not found.
     * @param {string} type
     * @returns {object|null}
     */
    get(type) {
      return adapters.has(type) ? adapters.get(type) : null;
    },

    /**
     * List all registered provider type keys.
     * @returns {string[]}
     */
    list() {
      return [...adapters.keys()];
    }
  };
}

// ---------------------------------------------------------------------------
// Adapter validation
// ---------------------------------------------------------------------------

/**
 * Validate an ExternalProviderAdapter object against the contract.
 *
 * Required contract:
 *   - descriptor() → { providerType, displayName, hosting, authModes, apiCapabilities }
 *   - health()     → { status: 'healthy'|'degraded'|'unavailable', message }
 *   - at least one of: issueTracking, cicd, gitForge
 *   - normalizeWebhook(payload) → NormalizedEvent[]
 *   - verifyWebhook(request)    → { valid, reason }
 *
 * @param {object} adapter
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateProviderAdapter(adapter) {
  const errors = [];

  if (adapter == null) {
    errors.push('adapter must not be null or undefined');
    return { valid: false, errors };
  }

  // descriptor must be a function
  if (typeof adapter.descriptor !== 'function') {
    errors.push('adapter.descriptor must be a function returning { providerType, displayName, hosting, authModes }');
  }

  // health must be a function
  if (typeof adapter.health !== 'function') {
    errors.push('adapter.health must be a function returning { status, message }');
  }

  // At least one optional interface must be present
  const presentInterfaces = VALID_INTERFACES.filter((key) => adapter[key] != null);
  if (presentInterfaces.length === 0) {
    errors.push(
      `adapter must implement at least one provider interface: ${VALID_INTERFACES.join(', ')} (issueTracking, cicd, or gitForge)`
    );
  }

  // normalizeWebhook must be a function
  if (typeof adapter.normalizeWebhook !== 'function') {
    errors.push('adapter.normalizeWebhook must be a function(payload) → NormalizedEvent[]');
  }

  // verifyWebhook must be a function
  if (typeof adapter.verifyWebhook !== 'function') {
    errors.push('adapter.verifyWebhook must be a function(request) → { valid, reason }');
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Capability manifest validation
// ---------------------------------------------------------------------------

/**
 * Validate a capability manifest object.
 *
 * A capability manifest declares which provider interfaces a concrete adapter
 * supports, so the platform can route requests accordingly.
 *
 * Required shape:
 *   { providerType: string, interfaces: string[] }
 *
 * @param {object} manifest
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateCapabilityManifest(manifest) {
  const errors = [];

  if (manifest == null) {
    errors.push('manifest must not be null or undefined');
    return { valid: false, errors };
  }

  // providerType is required
  if (!manifest.providerType || typeof manifest.providerType !== 'string') {
    errors.push('manifest.providerType is required and must be a non-empty string');
  }

  // interfaces must be a non-empty array of known interface names
  if (!Array.isArray(manifest.interfaces) || manifest.interfaces.length === 0) {
    errors.push(
      `manifest.interfaces must be a non-empty array; supported interfaces are: ${VALID_INTERFACES.join(', ')}`
    );
  } else {
    const unknown = manifest.interfaces.filter((iface) => !VALID_INTERFACES.includes(iface));
    if (unknown.length > 0) {
      errors.push(
        `manifest.interfaces contains unknown or invalid interface(s): ${unknown.join(', ')}; valid interfaces are: ${VALID_INTERFACES.join(', ')}`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}
