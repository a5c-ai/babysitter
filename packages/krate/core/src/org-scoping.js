// Dedicated org-scoping module — re-exports the org namespace derivation
// function so callers can depend on it without pulling in the full
// kubernetes-controller surface.

export { orgNamespaceName, normalizeOrgSlug, resolveResourceOrg, withOrgScope } from './kubernetes-controller.js';
