import { createKrateApiController, orgNamespaceName } from '@a5c-ai/krate-sdk';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const { org } = await params;
  try {
    const controller = createKrateApiController({ namespace: orgNamespaceName(org) });
    const body = await request.json();
    const result = await controller.queryAgentMemory(body);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: 'operation_failed', message: error.message }, { status: 500 });
  }
}
