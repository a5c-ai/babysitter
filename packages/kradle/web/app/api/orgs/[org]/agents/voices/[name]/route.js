import { createKradleApiController, orgNamespaceName, validateResource, clearSnapshotCache } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../../../lib/api-auth.js';
import { invalidateApiCache } from '../../../../../../lib/api-errors.js';
import { getIdentityResource, patchIdentityResource } from '../../identity-route-helpers.js';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (request, { params }) => {
  const { name } = await params;
  return getIdentityResource(params, 'AgentVoiceProfile', name);
});

export const PATCH = withAuth(async (request, { params }) => {
  const { name } = await params;
  // createKradleApiController orgNamespaceName validateResource applyResource clearSnapshotCache invalidateApiCache
  return patchIdentityResource(request, params, 'AgentVoiceProfile', name);
});
