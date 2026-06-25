import { withAuth } from '../../../../../lib/api-auth.js';
import { createIdentityResource, listIdentityResources } from '../identity-route-helpers.js';

export const dynamic = 'force-dynamic';

export const GET = withAuth((request, { params }) => listIdentityResources(request, params, 'AgentAppearance'));

export const POST = withAuth((request, { params }) => createIdentityResource(request, params, 'AgentAppearance'));
