import { createKrateApiController, orgNamespaceName } from '@a5c-ai/krate-sdk';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const { org } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });
  const body = await request.json();
  const result = await controller.dispatchAgent(body);
  return Response.json(result);
}
