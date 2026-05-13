// API Controller
export { createKrateApiController, KRATE_API_CONTROLLER_BOUNDARY } from '../../core/src/api-controller.js';

// Controller Client (browser/server data fetching)
export { fetchControllerUiModel } from '../../core/src/controller-client.js';
export { clearSnapshotCache } from '../../core/src/snapshot-cache.js';

// Controller UI Model
export { createControllerUiModel } from '../../core/src/controller-ui.js';

// Authentication
export {
  createAuthProviderConfig,
  listEnabledAuthProviders,
  buildAuthorizationRedirect,
  exchangeOAuthCodeForProfile,
  parseSessionCookie,
  createSessionCookie,
  registerLoginProfile,
  mapLoginProfileToKrateIdentity,
  profileFromDelegatedHeaders,
  createInviteResource,
  createTeamResource
} from '../../core/src/auth.js';

// Identity Policy
export { mapOidcIdentity } from '../../core/src/identity-policy.js';

// Resource Model
export {
  createResource,
  CONFIG_KINDS,
  AGGREGATED_KINDS,
  clone,
  resourceToYaml
} from '../../core/src/resource-model.js';

// Resource Definition Lookup (from kubernetes-controller)
export { findResourceDefinition } from '../../core/src/kubernetes-controller.js';

// Org Scoping
export { orgNamespaceName, normalizeOrgSlug } from '../../core/src/org-scoping.js';

// Atlas Graph Client
export {
  fetchAtlasRecordsByKinds,
  searchAtlasGraph,
  STACK_LAYERS,
  COMPOSITION_FACETS,
  ALL_LAYER_DEFS
} from './atlas-graph-client.js';
