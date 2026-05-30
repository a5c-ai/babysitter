import { createKrateApiController, orgNamespaceName, validateResource, clearSnapshotCache } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../../../lib/api-auth.js';
import { invalidateApiCache } from '../../../../../../lib/api-errors.js';
import { deleteIdentityResource, getIdentityResource, patchIdentityResource } from '../../identity-route-helpers.js';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (request, { params }) => {
  const { name } = await params;
  return getIdentityResource(params, 'AgentPersona', name);
});

export const PATCH = withAuth(async (request, { params }) => {
  const { name } = await params;
  // createKrateApiController orgNamespaceName validateResource applyResource clearSnapshotCache invalidateApiCache
  return patchIdentityResource(request, params, 'AgentPersona', name);
});

export const DELETE = withAuth(async (request, { params }) => {
  const { name } = await params;
  return deleteIdentityResource(params, 'AgentPersona', name);
});
