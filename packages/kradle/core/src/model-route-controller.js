// KradleModelRoute Controller
// Unified model routing through Envoy AI Gateway — validation, endpoint resolution,
// catalog generation, and Envoy manifest generation for both internal (KServe) and
// external (cloud LLM) model routes.

export const ENVOY_AI_GATEWAY_API_GROUP = 'aigateway.envoyproxy.io';
export const ENVOY_AI_GATEWAY_API_VERSION = 'v1alpha1';

export const VALID_ROUTE_TYPES = ['internal', 'external'];

export const VALID_EXTERNAL_PROTOCOLS = ['openai', 'anthropic', 'bedrock', 'vertex', 'azure-openai', 'custom'];

export const MODEL_ROUTE_CONTROLLER_BOUNDARY = {
  role: 'model-route-controller',
  scope: 'Unified model routing through Envoy AI Gateway — validation, endpoint resolution, catalog generation, Envoy manifest generation',
  owns: ['route validation', 'endpoint resolution', 'model catalog', 'envoy route manifests'],
  delegatesTo: ['resource-model', 'kradle-inference-service-controller'],
  mustNotOwn: ['secret values', 'gateway deployment', 'network policy']
};

/**
 * Validate a KradleModelRoute resource. Returns { valid, errors }.
 * @param {object} resource
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateModelRoute(resource) {
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

  if (!spec.modelName) {
    errors.push('spec.modelName is required');
  }

  if (!spec.routeType) {
    errors.push('spec.routeType is required; valid values are: internal, external');
  } else if (!VALID_ROUTE_TYPES.includes(spec.routeType)) {
    errors.push(`spec.routeType "${spec.routeType}" is not valid; valid values are: ${VALID_ROUTE_TYPES.join(', ')}`);
  }

  // Route-type-specific validation
  if (spec.routeType === 'internal') {
    if (!spec.inferenceServiceRef) {
      errors.push('spec.inferenceServiceRef is required for internal routes');
    }
  }

  if (spec.routeType === 'external') {
    if (!spec.external) {
      errors.push('spec.external is required for external routes');
    } else {
      if (!spec.external.provider) {
        errors.push('spec.external.provider is required for external routes');
      }
      if (!spec.external.endpoint) {
        errors.push('spec.external.endpoint is required for external routes');
      }
      if (spec.external.protocol && !VALID_EXTERNAL_PROTOCOLS.includes(spec.external.protocol)) {
        errors.push(`spec.external.protocol "${spec.external.protocol}" is not valid; valid values are: ${VALID_EXTERNAL_PROTOCOLS.join(', ')}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Factory that returns a KradleModelRoute controller instance.
 * @param {object} [options]
 * @returns {object}
 */
export function createModelRouteController(options = {}) {
  return {
    role: 'model-route-controller',

    /**
     * Validate a KradleModelRoute resource.
     * @param {object} resource
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validate(resource) {
      return validateModelRoute(resource);
    },

    /**
     * Resolve a route to its endpoint and connection details.
     * For internal routes, looks up the InferenceService status.url.
     * For external routes, uses spec.external fields.
     *
     * @param {object} route - KradleModelRoute resource
     * @param {object[]} [resources] - all cluster resources to look up InferenceService
     * @returns {{ endpoint: string, protocol: string, provider: string, modelId: string, authConfig: object|null }}
     */
    resolveRoute(route, resources = []) {
      const spec = route?.spec || {};

      if (spec.routeType === 'internal') {
        return resolveInternalRoute(route, resources);
      }

      if (spec.routeType === 'external') {
        return resolveExternalRoute(route);
      }

      return {
        endpoint: null,
        protocol: 'unknown',
        provider: 'unknown',
        modelId: spec.modelName || null,
        authConfig: null
      };
    },

    /**
     * Reconcile a set of routes, checking that each target is reachable.
     * Returns conditions for each route indicating readiness.
     *
     * @param {object[]} routes - array of KradleModelRoute resources
     * @param {object[]} [resources] - all cluster resources
     * @returns {{ conditions: object[], resolvedRoutes: object[] }}
     */
    reconcileRoutes(routes, resources = []) {
      const conditions = [];
      const resolvedRoutes = [];

      for (const route of routes) {
        const validation = validateModelRoute(route);
        if (!validation.valid) {
          conditions.push({
            type: 'RouteReady',
            status: 'False',
            route: route.metadata?.name,
            reason: 'ValidationFailed',
            message: validation.errors.join('; ')
          });
          continue;
        }

        const resolved = this.resolveRoute(route, resources);
        if (!resolved.endpoint) {
          conditions.push({
            type: 'RouteReady',
            status: 'False',
            route: route.metadata?.name,
            reason: 'EndpointNotFound',
            message: `Could not resolve endpoint for route "${route.metadata?.name}"`
          });
          continue;
        }

        conditions.push({
          type: 'RouteReady',
          status: 'True',
          route: route.metadata?.name,
          reason: 'EndpointResolved',
          message: `Route "${route.metadata?.name}" resolved to ${resolved.endpoint}`
        });

        resolvedRoutes.push({
          name: route.metadata?.name,
          modelName: route.spec?.modelName,
          routeType: route.spec?.routeType,
          ...resolved
        });
      }

      return { conditions, resolvedRoutes };
    },

    /**
     * Generate a unified model catalog merging internal and external routes.
     *
     * @param {object[]} routes - array of KradleModelRoute resources
     * @param {object[]} [resources] - all cluster resources
     * @returns {Array<{ name: string, provider: string, type: string, status: string, endpoint: string, protocol: string }>}
     */
    listModelCatalog(routes, resources = []) {
      const catalog = [];

      for (const route of routes) {
        const spec = route?.spec || {};
        const validation = validateModelRoute(route);
        const resolved = validation.valid ? this.resolveRoute(route, resources) : null;

        catalog.push({
          name: spec.modelName || route.metadata?.name || 'unknown',
          provider: resolved?.provider || (spec.routeType === 'internal' ? 'kserve' : spec.external?.provider || 'unknown'),
          type: spec.routeType || 'unknown',
          status: resolved?.endpoint ? 'available' : 'unavailable',
          endpoint: resolved?.endpoint || null,
          protocol: resolved?.protocol || (spec.routeType === 'internal' ? 'v2' : spec.external?.protocol || 'unknown')
        });
      }

      return catalog;
    },

    /**
     * Generate an Envoy AI Gateway route configuration for a resolved route.
     *
     * @param {object} route - KradleModelRoute resource
     * @param {{ endpoint: string, protocol: string, provider: string, modelId: string }} resolvedEndpoint
     * @returns {object} Envoy AI Gateway route config
     */
    generateEnvoyRouteManifest(route, resolvedEndpoint) {
      const spec = route?.spec || {};
      const metadata = route?.metadata || {};

      const routeConfig = {
        apiVersion: `${ENVOY_AI_GATEWAY_API_GROUP}/${ENVOY_AI_GATEWAY_API_VERSION}`,
        kind: 'AIGatewayRoute',
        metadata: {
          name: `route-${metadata.name || 'unknown'}`,
          namespace: metadata.namespace,
          labels: {
            'kradle.a5c.ai/managed': 'true',
            'kradle.a5c.ai/org': spec.organizationRef || '',
            'kradle.a5c.ai/model-route': metadata.name || ''
          }
        },
        spec: {
          modelName: spec.modelName,
          targetRef: {
            kind: spec.routeType === 'internal' ? 'Service' : 'ExternalBackend',
            name: spec.routeType === 'internal'
              ? (spec.inferenceServiceRef || metadata.name)
              : `ext-${resolvedEndpoint.provider || 'provider'}`
          },
          rules: [{
            matches: [{
              headers: [{
                name: 'x-model-name',
                value: spec.modelName
              }]
            }],
            backendRefs: [{
              name: resolvedEndpoint.endpoint,
              protocol: resolvedEndpoint.protocol,
              modelId: resolvedEndpoint.modelId || spec.modelName
            }]
          }]
        }
      };

      // Add rate limits if present
      if (spec.rateLimits) {
        routeConfig.spec.rateLimits = spec.rateLimits;
      }

      // Add timeout if present
      if (spec.timeout) {
        routeConfig.spec.timeout = spec.timeout;
      }

      return routeConfig;
    },

    /**
     * Convert a KServe InferenceService into a KradleModelRoute spec.
     * Bridge method for migrating existing services into the unified routing model.
     *
     * @param {object} inferenceService - KServe InferenceService resource
     * @param {{ endpoint: string, protocol?: string }} resolvedEndpoint
     * @returns {object} KradleModelRoute spec fields
     */
    toModelRoute(inferenceService, resolvedEndpoint) {
      const metadata = inferenceService?.metadata || {};
      const spec = inferenceService?.spec || {};
      const predictor = spec.predictor || {};
      const modelFormat = predictor.modelFormat?.name || spec.modelFormat || 'custom';

      return {
        apiVersion: 'kradle.a5c.ai/v1alpha1',
        kind: 'KradleModelRoute',
        metadata: {
          name: `route-${metadata.name || 'unknown'}`,
          namespace: metadata.namespace,
          labels: {
            'kradle.a5c.ai/managed': 'true',
            'kradle.a5c.ai/source': 'inference-service',
            ...(metadata.labels || {})
          }
        },
        spec: {
          organizationRef: metadata.labels?.['kradle.a5c.ai/org'] || spec.organizationRef || 'default',
          modelName: metadata.name || 'unknown',
          routeType: 'internal',
          inferenceServiceRef: metadata.name,
          modelFormat,
          endpoint: resolvedEndpoint.endpoint,
          protocol: resolvedEndpoint.protocol || 'v2'
        }
      };
    }
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function resolveInternalRoute(route, resources) {
  const spec = route?.spec || {};
  const inferenceServiceRef = spec.inferenceServiceRef;

  // Look up the InferenceService in the cluster resources
  let endpoint = null;
  let protocol = spec.protocol || 'v2';

  if (inferenceServiceRef && Array.isArray(resources)) {
    const isvc = resources.find(
      r => (r.kind === 'InferenceService' || r.kind === 'KradleInferenceService') &&
           r.metadata?.name === inferenceServiceRef
    );
    if (isvc) {
      endpoint = isvc.status?.url || isvc.status?.address?.url || null;
      if (!endpoint && isvc.metadata?.name) {
        const ns = isvc.metadata.namespace || 'default';
        endpoint = `http://${isvc.metadata.name}.${ns}.svc.cluster.local`;
      }
      protocol = isvc.spec?.inferenceProtocol || protocol;
    }
  }

  // Fallback: build cluster-internal URL from the reference name
  if (!endpoint && inferenceServiceRef) {
    const ns = route.metadata?.namespace || 'default';
    endpoint = `http://${inferenceServiceRef}.${ns}.svc.cluster.local`;
  }

  return {
    endpoint,
    protocol,
    provider: 'kserve',
    modelId: spec.modelName || inferenceServiceRef || null,
    authConfig: spec.authConfig || null
  };
}

function resolveExternalRoute(route) {
  const spec = route?.spec || {};
  const ext = spec.external || {};

  return {
    endpoint: ext.endpoint || null,
    protocol: ext.protocol || 'openai',
    provider: ext.provider || 'unknown',
    modelId: ext.modelId || spec.modelName || null,
    authConfig: ext.authConfig || null
  };
}
