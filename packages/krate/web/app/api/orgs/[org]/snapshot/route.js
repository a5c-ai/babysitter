import { collectKrateHealthProbes, createKrateApiController, healthStatusValue, orgNamespaceName } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../lib/api-auth.js';
import { errorResponse } from '../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_request, { params }) => {
  const { org } = await params;
  const controller = createKrateApiController({ namespace: orgNamespaceName(org) });
  try {
    const probeDetails = await collectKrateHealthProbes({ timeoutMs: 3000 });
    const health = {
      kubernetes: healthStatusValue(probeDetails.kubernetes),
      gitea: healthStatusValue(probeDetails.gitea),
      agentMux: healthStatusValue(probeDetails.agentMux),
      agentGateway: healthStatusValue(probeDetails.agentGateway),
      controller: healthStatusValue(probeDetails.controller),
      assistant: healthStatusValue(probeDetails.assistant),
      details: probeDetails,
      externalProviders: [],
    };

    try {
      const typedKinds = ['GitProvider', 'CiProvider', 'IssueTrackerProvider', 'AppHostingProvider', 'ArtifactRegistryProvider'];
      const results = await Promise.all(
        typedKinds.map((kind) => controller.listResourceForOrg(org, kind).catch(() => []))
      );
      health.externalProviders = results.flatMap((providers, i) => {
        const items = providers?.items || providers || [];
        return (Array.isArray(items) ? items : []).map((p) => ({
          name: p.metadata?.name,
          kind: typedKinds[i],
          type: p.spec?.platform,
          status: p.status?.phase || 'Unknown',
        }));
      });
    } catch (err) {
      console.warn('[snapshot] Failed to list external providers:', err?.message || err);
    }

    return Response.json({ health, org, timestamp: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
});
