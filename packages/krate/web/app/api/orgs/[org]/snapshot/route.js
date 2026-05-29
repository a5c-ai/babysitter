import { createKrateApiController, orgNamespaceName } from '@a5c-ai/krate-sdk';
import { withAuth } from '../../../../lib/api-auth.js';
import { errorResponse } from '../../../../lib/api-errors.js';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_request, { params }) => {
  const { org } = await params;
  const controller = createKrateApiController({ namespace: orgNamespaceName(org) });
  try {
    const health = { kubernetes: 'unknown', gitea: false, agentMux: false, agentGateway: false, externalProviders: [] };

    try {
      await controller.listResourceForOrg(org, 'Organization');
      health.kubernetes = 'ok';
    } catch (err) {
      console.warn('[snapshot] Kubernetes health check failed:', err?.message || err);
      health.kubernetes = 'error';
    }

    try {
      const giteaUrl = process.env.KRATE_GITEA_HTTP_URL;
      if (giteaUrl) {
        const res = await fetch(`${giteaUrl}/api/v1/version`, { signal: AbortSignal.timeout(3000) });
        health.gitea = res.ok ? 'ok' : 'error';
      }
    } catch (err) {
      console.warn('[snapshot] Gitea health check failed:', err?.message || err);
      if (process.env.KRATE_GITEA_HTTP_URL) health.gitea = 'error';
    }

    try {
      const muxUrl = process.env.AGENT_MUX_URL || process.env.AGENT_GATEWAY_URL;
      if (muxUrl) {
        const res = await fetch(`${muxUrl}/health`, { signal: AbortSignal.timeout(3000) });
        health.agentMux = res.ok ? 'ok' : 'error';
        health.agentGateway = health.agentMux;
      }
    } catch (err) {
      console.warn('[snapshot] Agent mux/gateway health check failed:', err?.message || err);
      if (process.env.AGENT_MUX_URL || process.env.AGENT_GATEWAY_URL) {
        health.agentMux = 'error';
        health.agentGateway = 'error';
      }
    }

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
