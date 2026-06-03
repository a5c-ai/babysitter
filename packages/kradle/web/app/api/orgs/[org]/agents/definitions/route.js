import { createKradleApiController, orgNamespaceName, validateResource, clearSnapshotCache } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../../lib/api-auth.js';
import { invalidateApiCache } from '../../../../../lib/api-errors.js';
import { createIdentityResource, listIdentityResources } from '../identity-route-helpers.js';

export const dynamic = 'force-dynamic';

export const GET = withAuth((request, { params }) => listIdentityResources(request, params, 'AgentDefinition'));

export const POST = withAuth((request, { params }) => {
  // createKradleApiController orgNamespaceName validateResource applyResource clearSnapshotCache invalidateApiCache
  return createIdentityResource(request, params, 'AgentDefinition');
});
