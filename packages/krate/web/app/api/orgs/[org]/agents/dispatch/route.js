import { createKrateApiController, orgNamespaceName, clearSnapshotCache, globalEventBus } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../../lib/api-auth.js';
import { errorResponse, invalidateApiCache } from '../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (request, { params }) => {
  const { org } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });
  try {
    const body = await request.json();
    // Accept agentDefinition for persona identity and stackRef/agentStack for legacy AgentStack fallback.
    const agentDefinition = body.agentDefinition || body.definitionRef;
    const agentStack = body.agentStack || body.stackRef;
    if (!agentDefinition && !agentStack) {
      return errorResponse('agentDefinition, stackRef, or agentStack is required', 400);
    }
    const resources = agentDefinition ? await loadIdentityResources(controller, org) : {};
    const result = await controller.dispatchAgent({
      ...(agentDefinition ? { agentDefinition } : { agentStack }),
      repository: body.repository || 'default',
      ref: body.ref || 'main',
      taskKind: body.taskKind || 'diagnostic',
      actor: body.actor || 'owner',
      namespace,
      organizationRef: org,
      resources,
    });
    if (result.error) {
      return errorResponse(result.message || 'Dispatch failed', 400);
    }
    clearSnapshotCache();
    invalidateApiCache();
    globalEventBus.emit({ type: 'agent-dispatched', run: result.run || result, timestamp: new Date().toISOString() });
    return Response.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err.message || 'Dispatch failed', 500);
  }
});

async function loadIdentityResources(controller, org) {
  const kinds = ['AgentDefinition', 'AgentPersona', 'AgentSoul', 'AgentAppearance', 'AgentVoiceProfile', 'AgentStack'];
  const entries = await Promise.all(kinds.map(async (kind) => {
    const result = await controller.listResourceForOrg(org, kind).catch(() => ({ items: [] }));
    return [kind, result?.items || []];
  }));
  return Object.fromEntries(entries);
}
