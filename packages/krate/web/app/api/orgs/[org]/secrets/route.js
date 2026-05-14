import { createKrateApiController, orgNamespaceName } from '@a5c-ai/krate-sdk';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { org } = await params;
  try {
    const controller = createKrateApiController({ namespace: orgNamespaceName(org) });
    const result = await controller.listResource('AgentSecretGrant');
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: 'operation_failed', message: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { org } = await params;
  try {
    const controller = createKrateApiController({ namespace: orgNamespaceName(org) });
    const body = await request.json();
    const result = await controller.applyResource({
      ...body,
      metadata: { ...body.metadata, namespace: orgNamespaceName(org) },
      spec: { ...body.spec, organizationRef: org },
    });
    return Response.json(result, { status: 201 });
  } catch (error) {
    return Response.json({ error: 'operation_failed', message: error.message }, { status: 400 });
  }
}
