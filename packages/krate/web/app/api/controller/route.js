import { createKrateApiController, fetchControllerUiModel, orgNamespaceName, resourceToYaml } from '@a5c-ai/krate-sdk';

export const dynamic = 'force-dynamic';

const CONTROLLER_TIMEOUT_MS = Number(process.env.KRATE_CONTROLLER_REQUEST_TIMEOUT_MS || 5_000);

export async function GET(request) {
  const organization = new URL(request.url).searchParams.get('org');
  const model = await fetchControllerUiModel({
    controllerUrl: process.env.KRATE_CONTROLLER_URL,
    organization,
    requestTimeoutMs: CONTROLLER_TIMEOUT_MS,
    useCache: false
  });
  await hydrateOrgResourceSummaries(model, organization || model.org?.slug || 'default');
  return Response.json(model, {
    headers: { 'Cache-Control': 'no-store' }
  });
}


async function hydrateOrgResourceSummaries(model, org) {
  if (!org || !Array.isArray(model?.resources)) return;
  const kinds = ['Repository', 'RunnerPool', 'Pipeline', 'Job', 'KrateProject', 'Issue'];
  const summaries = new Map(model.resources.map((resource) => [resource.kind, resource]));
  const missingKinds = kinds.filter((kind) => !Number(summaries.get(kind)?.count || summaries.get(kind)?.items?.length || 0));
  if (!missingKinds.length) return;
  try {
    const controller = createKrateApiController({ namespace: orgNamespaceName(org) });
    await Promise.all(missingKinds.map(async (kind) => {
      const result = await controller.listResourceForOrg(org, kind);
      const items = Array.isArray(result?.items) ? result.items : [];
      if (!items.length) return;
      const summary = summaries.get(kind) || { kind, count: 0, names: [], items: [] };
      if (!summaries.has(kind)) {
        summaries.set(kind, summary);
        model.resources.push(summary);
      }
      summary.count = items.length;
      summary.names = items.map((item) => item.metadata?.name).filter(Boolean);
      summary.items = items;
      summary.yaml = resourceToYaml(items[0]);
    }));
    const metrics = model.metrics || {};
    model.metrics = {
      ...metrics,
      resources: model.resources.reduce((count, resource) => count + Number(resource?.count || 0), 0),
      repositories: Number(summaries.get('Repository')?.count || metrics.repositories || 0),
      pipelines: Number(summaries.get('Pipeline')?.count || metrics.pipelines || 0),
      jobs: Number(summaries.get('Job')?.count || metrics.jobs || 0),
      runnerPools: Number(summaries.get('RunnerPool')?.count || metrics.runnerPools || 0),
      projects: Number(summaries.get('KrateProject')?.count || metrics.projects || 0),
      issues: Number(summaries.get('Issue')?.count || metrics.issues || 0)
    };
    const repositories = summaries.get('Repository')?.items;
    if (repositories?.length) model.views.dashboard.repositories = repositories;
    const projects = summaries.get('KrateProject')?.items;
    if (projects?.length) {
      model.agents = {
        ...(model.agents || {}),
        projects: { ...((model.agents || {}).projects || {}), count: projects.length, items: projects }
      };
    }
  } catch {
    // Keep the remote controller model unchanged when local hydration is unavailable.
  }
}
