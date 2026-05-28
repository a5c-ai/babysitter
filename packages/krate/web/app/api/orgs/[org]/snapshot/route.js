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
    } catch {
      health.kubernetes = 'error';
    }

    try {
      const giteaUrl = process.env.KRATE_GITEA_HTTP_URL;
      if (giteaUrl) {
        const res = await fetch(`${giteaUrl}/api/v1/version`, { signal: AbortSignal.timeout(3000) });
        health.gitea = res.ok ? 'ok' : 'error';
      }
    } catch {
      if (process.env.KRATE_GITEA_HTTP_URL) health.gitea = 'error';
    }

    try {
      const muxUrl = process.env.AGENT_MUX_URL || process.env.AGENT_GATEWAY_URL;
      if (muxUrl) {
        const res = await fetch(`${muxUrl}/health`, { signal: AbortSignal.timeout(3000) });
        health.agentMux = res.ok ? 'ok' : 'error';
        health.agentGateway = health.agentMux;
      }
    } catch {
      if (process.env.AGENT_MUX_URL || process.env.AGENT_GATEWAY_URL) {
        health.agentMux = 'error';
        health.agentGateway = 'error';
      }
    }

    try {
      const providers = await controller.listResourceForOrg(org, 'ExternalBackendProvider');
      const items = providers?.items || providers || [];
      health.externalProviders = (Array.isArray(items) ? items : []).map((p) => ({
        name: p.metadata?.name,
        type: p.spec?.providerType,
        status: p.status?.phase || 'Unknown',
      }));
    } catch {}

    return Response.json({ health, org, timestamp: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
});
