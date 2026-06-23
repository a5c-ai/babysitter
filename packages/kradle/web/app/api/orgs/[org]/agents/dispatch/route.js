import { createKradleApiController, orgNamespaceName, clearSnapshotCache, globalEventBus } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../../lib/api-auth.js';
import { errorResponse, invalidateApiCache } from '../../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (request, { params }) => {
  const { org } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKradleApiController({ namespace });
  try {
    const body = await request.json();
    // Accept agentDefinition for persona identity and stackRef/agentStack for legacy AgentStack fallback.
    const agentDefinition = body.agentDefinition || body.definitionRef;
    const agentStack = body.agentStack || body.stackRef;
    if (!agentDefinition && !agentStack) {
      return errorResponse('agentDefinition, stackRef, or agentStack is required', 400);
    }
    // Load ONLY the resources the dispatch path needs (the AgentStack, plus the
    // identity kinds for the persona path), org-scoped. This avoids the full
    // ~96-kind cluster snapshot inside dispatchAgent (which blocks the event loop
    // for tens of seconds over a remote kubeconfig); the scoped reads below are a
    // few fast list calls. `dispatchAgent` skips its snapshot when `resources` is
    // supplied.
    const resources = agentDefinition
      ? await loadIdentityResources(controller, org)
      : await loadStackResources(controller, org);
    // The per-dispatch task is the actual work the agent should do (a board card's
    // objective/title/description). Without it the agent pod gets no AGENT_TASK and
    // exits immediately. Accept the common field aliases the board/commander send.
    const task = body.task || body.objective || body.prompt || body.description || undefined;
    const result = await controller.dispatchAgent({
      ...(agentDefinition ? { agentDefinition } : { agentStack }),
      repository: body.repository || 'default',
      ref: body.ref || 'main',
      task,
      meetingRef: body.meetingRef || undefined,
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
  return loadResourcesByKind(controller, org, kinds);
}

// The legacy AgentStack dispatch path (Commander's default). The dispatch
// controller resolves the target from the AgentStack and runs a deterministic
// permission review that consults the stack's runtime identity + grant/role/
// policy resources (agent-permission-review.js Steps 5-9). Load exactly those
// org-scoped kinds — still a handful of fast list calls, NOT the full ~96-kind
// snapshot — so the review sees the real cluster grants.
async function loadStackResources(controller, org) {
  return loadResourcesByKind(controller, org, [
    'AgentStack',
    'AgentServiceAccount',
    'AgentRoleBinding',
    'AgentSecretGrant',
    'AgentConfigGrant',
    'KradleWorkspacePolicy',
    'KradleWorkspace',
  ]);
}

async function loadResourcesByKind(controller, org, kinds) {
  const entries = await Promise.all(kinds.map(async (kind) => {
    const result = await controller.listResourceForOrg(org, kind).catch(() => ({ items: [] }));
    return [kind, result?.items || []];
  }));
  return Object.fromEntries(entries);
}
