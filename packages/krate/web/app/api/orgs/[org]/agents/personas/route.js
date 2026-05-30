import { createKrateApiController, orgNamespaceName, validateResource, clearSnapshotCache } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../../lib/api-auth.js';
import { invalidateApiCache } from '../../../../../lib/api-errors.js';
import { createIdentityResource, listIdentityResources } from '../identity-route-helpers.js';

export const dynamic = 'force-dynamic';

export const GET = withAuth((request, { params }) => listIdentityResources(request, params, 'AgentPersona'));

export const POST = withAuth((request, { params }) => {
  // createKrateApiController orgNamespaceName validateResource applyResource clearSnapshotCache invalidateApiCache
  return createIdentityResource(request, params, 'AgentPersona');
});
