import { createKrateApiController, orgNamespaceName } from '@a5c-ai/krate-sdk';

export const dynamic = 'force-dynamic';


export async function GET(request, { params }) {
  const { org } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });
  const kind = new URL(request.url).searchParams.get('kind') || 'Repository';
  return Response.json(await controller.listResource(kind), { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request, { params }) {
  const { org } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });
  try {
    const resource = await request.json();
    const scoped = {
      ...resource,
      metadata: { ...(resource.metadata || {}), namespace: namespace, labels: { ...(resource.metadata?.labels || {}), 'krate.a5c.ai/org': org, 'krate.a5c.ai/namespace': namespace } },
      spec: { ...(resource.spec || {}), organizationRef: org }
    };
    const result = await controller.applyResource(scoped);
    return Response.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: 'apply_failed', message: error.message }, { status: 400 });
  }
}
